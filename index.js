const login = require('ws3-fca');
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
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
                <title>Mirror Bot Status</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; margin: 0; }
                    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                    .status { color: #4caf50; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Mirror Bot [ ${global.client.config.BOTNAME} ]</h1>
                    <p>Status: <span class="status">Online</span></p>
                    <p>Uptime monitoring ready for Uptime Robot.</p>
                </div>
            </body>
        </html>
    `);
});

app.listen(port, () => {
    logger.info(`السيرفر يعمل على المنفذ: ${port}`);
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
 * الدالة الرئيسية لتشغيل محرك ميرور
 */
async function startMirror() {
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
            logger.hakim("نظام المراقبة مفعل. الاستماع للأوامر بدأ...");

            api.listenMqtt(async (err, event) => {
                if (err) {
                    logger.error("خطأ في الاستماع (Listen Error). جاري إعادة التشغيل...", err);
                    return restartBot();
                }

                try {
                    // تمرير الحدث والـ api للمعالج الرئيسي
                    await minHandle({ event, api });
                } catch (handleErr) {
                    logger.error("خطأ في معالجة الحدث داخل minHandle:", handleErr);
                }
            });
        });

    } catch (error) {
        logger.error("خطأ فادح أثناء تشغيل المحرك:", error);
        setTimeout(restartBot, 5000);
    }
}

function restartBot() {
    logger.warn("جاري إعادة تشغيل النظام الآن...");
    process.exit(2); // رمز خروج مخصص لنظام start.js لإعادة التشغيل الفوري
}

process.on('unhandledRejection', (err) => {
    logger.error("خطأ غير معالج (Unhandled Rejection):", err);
});

process.on('uncaughtException', (err) => {
    logger.error("خطأ غير متوقع (Uncaught Exception):", err);
});

startMirror();
