const login = require('ws3-fca');
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const axios = require('axios');
const logger = require('./utils/logger');
const config = require('./config.json');
const minHandle = require('./handle/minHandle');

const app = express();
const port = process.env.PORT || 3000;

// إعداد السيرفر البسيط للبقاء أونلاين
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>${global.client.config.BOTNAME} Status</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #0e1117; color: white; margin: 0; }
                    .card { background: #161b22; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; border: 1px solid #30363d; }
                    .status { color: #238636; font-weight: bold; }
                    h1 { color: #58a6ff; margin-bottom: 0.5rem; }
                    p { color: #8b949e; }
                    .uptime { font-family: monospace; color: #d29922; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>${global.client.config.BOTNAME} [ v${require('./package.json').version} ]</h1>
                    <p>Status: <span class="status">Online & Ready</span></p>
                    <p>Uptime monitoring active for <span class="uptime">Uptime Robot</span></p>
                    <hr style="border: 0; border-top: 1px solid #30363d; margin: 1.5rem 0;">
                    <p style="font-size: 0.8rem;">Developed by <span style="color: #f85149;">KG / Khartoum Ghoul</span></p>
                </div>
            </body>
        </html>
    `);
});

app.listen(port, "0.0.0.0", () => {
    logger.info(`السيرفر يعمل على المنفذ: ${port}`);
});

app.get('/logs.txt', (req, res) => {
    const { token } = req.query;
    if (token !== 'jules') {
        return res.status(403).send('Unauthorized access');
    }
    const logFilePath = path.join(__dirname, 'logs.txt');
    if (fs.existsSync(logFilePath)) {
        res.sendFile(logFilePath);
    } else {
        res.status(404).send('Log file not found');
    }
});

// تعريف الكائن العالمي للبوت (المحرك الأساسي)
global.client = {
    commands: new Map(),
    events: new Map(),
    handleReply: [],
    handleReaction: [],
    cooldowns: new Map(),
    config: config,
    api: null,
    startTime: Date.now()
};

// تهيئة المتغيرات العالمية الأخرى
if (global.frozenThreads === undefined) global.frozenThreads = new Set();
if (global.isBotActive === undefined) global.isBotActive = true;
if (global.botMode === undefined) global.botMode = 'hybrid';
if (global.activeProcesses === undefined) global.activeProcesses = new Map();

/**
 * دالة تحميل الأوامر والأحداث من المجلدات
 */
function loadScripts() {
    const commandPath = path.join(__dirname, 'script', 'commands');
    if (!fs.existsSync(commandPath)) fs.mkdirpSync(commandPath);
    
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandPath, file));
            if (command.config && command.config.name) {
                global.client.commands.set(command.config.name, command);
                logger.loader(`تم تحميل الأمر: ${command.config.name}`, 'cmd');
            }
        } catch (e) {
            logger.error(`فشل تحميل الأمر من الملف ${file}`, e);
        }
    }

    const eventPath = path.join(__dirname, 'script', 'events');
    if (!fs.existsSync(eventPath)) fs.mkdirpSync(eventPath);

    const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        try {
            const eventFunc = require(path.join(eventPath, file));
            global.client.events.set(file.replace('.js', ''), eventFunc);
            logger.loader(`تم تحميل الحدث: ${file}`, 'event');
        } catch (e) {
            logger.error(`فشل تحميل الحدث من الملف ${file}`, e);
        }
    }
}

/**
 * الدالة الرئيسية لتشغيل محرك سبايدي
 */
async function startSpidy() {
    logger.info("جاري فحص ملف الجلسة (appstate.json)...");

    try {
        const appStatePath = path.join(__dirname, 'appstate.json');
        if (!fs.existsSync(appStatePath)) {
            throw new Error("ملف appstate.json غير موجود! يرجى وضعه في المجلد الرئيسي.");
        }

        const appState = await fs.readJSON(appStatePath);
        loadScripts(); 

        login({ appState }, (err, api) => {
            if (err) {
                logger.error("فشل تسجيل الدخول. جاري محاولة إعادة التشغيل...", err);
                return restartBot();
            }

            api.setOptions(config.fcaOptions);
            global.client.api = api;
            
            // عرض اللوغو ومعلومات البوت بعد نجاح تسجيل الدخول
            logger.banner();
            logger.success(`بوت [ ${config.BOTNAME} ] متصل الآن بنجاح!`);
            logger.kg("نظام المراقبة مفعل. الاستماع للأوامر بدأ...");

            // آلية الـ Keep-Alive للبقاء أونلاين على الاستضافات المجانية
            setInterval(() => {
                const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
                axios.get(url).catch(() => {});
            }, 5 * 60 * 1000); // كل 5 دقائق

            api.listenMqtt((err, event) => {
                if (err) {
                    logger.error("خطأ في الاستماع (Listen Error). جاري إعادة التشغيل...", err);
                    return restartBot();
                }

                // معالجة الأحداث بشكل غير متزامن للسماح بالتعددية (Concurrency)
                setImmediate(async () => {
                    try {
                        await minHandle({ event, api });
                    } catch (handleErr) {
                        logger.error("خطأ في معالجة الحدث داخل minHandle:", handleErr);
                    }
                });
            });
        });

    } catch (error) {
        logger.error("خطأ فادح أثناء تشغيل المحرك:", error);
        setTimeout(restartBot, 5000);
    }
}

function restartBot() {
    logger.warn("جاري إعادة تشغيل النظام الآن...");
    process.exit(2);
}

process.on('unhandledRejection', (err) => {
    logger.error("خطأ غير معالج (Unhandled Rejection):", err);
});

process.on('uncaughtException', (err) => {
    logger.error("خطأ غير متوقع (Uncaught Exception):", err);
});

startSpidy();
