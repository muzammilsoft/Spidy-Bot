const logger = require('../utils/logger.js');
const loggerAdvanced = require('../utils/logger_advanced.js');
const userData = require('../database/userData');
const PollinationsAgent = require("../utils/pollinations_agent");

// الإعدادات العالمية الافتراضية
if (global.isBotActive === undefined) global.isBotActive = true;
if (global.botMode === undefined) global.botMode = 'hybrid';
if (global.autoReactEnabled === undefined) global.autoReactEnabled = true;
const botOwnerID = "100036535161872";

let agent;

const emotionMap = [
    { keywords: ["هههه", "😂", "ضحك", "لول", "😹", "🤣", "كركر"], reaction: "😹" },
    { keywords: ["حزن", "تباً", "😭", "😢", "زعلان", "💔", "وااو"], reaction: "😢" },
    { keywords: ["غضب", "حيوان", "😡", "😠", "سحقاً", "🤬"], reaction: "😡" },
    { keywords: ["حب", "احبك", "❤️", "😍", "عشق", "💮", "🕷️"], reaction: "😍" }
];

module.exports = async function({ event, api, userData }) {
    const { body, senderID, threadID, messageID, mentions, type, messageReply } = event;
    if (!body) return;

    const { config, commands } = global.client;
    const prefix = config.PREFIX || ".";
    const botID = api.getCurrentUserID();

    // تعليم الرسالة كمقروءة فور استلامها
    try { api.markAsRead(threadID); } catch (e) {}

    // تحسين كشف المجموعات والردود
    const isGroup = threadID !== senderID;
    const isMentioned = mentions && Object.keys(mentions).includes(botID);
    const isReplyToBot = (messageReply && messageReply.senderID === botID);

    // سجل تصحيح الأخطاء (Debug Log)
    console.log(`[ DEBUG ] Msg: "${body.slice(0,20)}" | Group: ${isGroup} | Mention: ${isMentioned} | ReplyBot: ${isReplyToBot} | BotID: ${botID}`);

    const isPrefixCommand = body.startsWith(prefix);
    const triggerKeywords = ["بوت", "سبايدي", "يا بوت", "يا سبايدي", "prefix", "البادئة"];
    const isTriggerKeyword = triggerKeywords.some(key => body.toLowerCase().includes(key.toLowerCase()));

    // --- نظام التحكم للمطور (يعمل دائماً) ---
    if (isPrefixCommand && (config.DEVELOPER.includes(senderID) || senderID === botOwnerID)) {
        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === "ايقاف") {
            global.isBotActive = false;
            return api.sendMessage("🛑 تم إيقاف البوت بنجاح.. أخيراً وقت الراحة ヽʕ•͡-•ʔﾉ", threadID, messageID);
        }
        if (commandName === "تشغيل") {
            global.isBotActive = true;
            return api.sendMessage("✅ تم تشغيل البوت بنجاح.. عاد الأسد للعمل ヽʕ•͡-•ʔﾉ", threadID, messageID);
        }
        if (commandName === "الوكيل") {
            const mode = args[0] || "hybrid";
            global.botMode = mode;
            return api.sendMessage(`✅ تم تغيير وضع البوت إلى: ${mode}`, threadID, messageID);
        }
        if (commandName === "مساعدة") {
            let msg = "🕸️ **أوامر المطور الإلزامية:** 🕸️\n\n";
            msg += ".تشغيل - تفعيل البوت\n";
            msg += ".ايقاف - تعطيل البوت\n";
            msg += ".الوكيل [hybrid/agent/normal] - تغيير وضع الذكاء الاصطناعي\n";
            msg += ".اعدادات - عرض إعدادات البوت الحالية\n";
            msg += ".سجلات - عرض آخر 10 سجلات\n";
            msg += ".مسح_السجلات - تفريغ ملف السجلات\n";
            return api.sendMessage(msg, threadID, messageID);
        }
        if (commandName === "اعدادات") {
            let msg = "⚙️ **إعدادات سبايدي:** ⚙️\n\n";
            msg += `🤖 الاسم: ${config.BOTNAME}\n`;
            msg += `📡 الحالة: ${global.isBotActive ? "نشط" : "متوقف"}\n`;
            msg += `🧠 الوضع: ${global.botMode}\n`;
            msg += `📝 التسجيل التلقائي: ${config.autoRegistration ? "مفعل" : "معطل"}\n`;
            msg += `😊 التفاعل التلقائي: ${global.autoReactEnabled ? "مفعل" : "معطل"}\n`;
            return api.sendMessage(msg, threadID, messageID);
        }
        if (commandName === "سجلات") {
            const fs = require('fs');
            const path = require('path');
            const logFilePath = path.join(__dirname, '../logs.txt');
            if (!fs.existsSync(logFilePath)) return api.sendMessage("❌ لا يوجد ملف سجلات حالياً.", threadID, messageID);
            const logs = fs.readFileSync(logFilePath, 'utf8').split('\n').filter(Boolean).slice(-10).join('\n');
            return api.sendMessage(`📋 **آخر 10 سجلات:**\n\n${logs}`, threadID, messageID);
        }
        if (commandName === "مسح_السجلات") {
            const fs = require('fs');
            const path = require('path');
            const logFilePath = path.join(__dirname, '../logs.txt');
            fs.writeFileSync(logFilePath, '');
            return api.sendMessage("✅ تم مسح ملف السجلات بنجاح.", threadID, messageID);
        }
    }

    if (!global.isBotActive && !config.DEVELOPER.includes(senderID)) return;

    // --- منطق التفاعل التلقائي (Autoreact) ---
    if (isGroup && global.autoReactEnabled) {
        for (const entry of emotionMap) {
            if (entry.keywords.some(key => body.toLowerCase().includes(key))) {
                api.setMessageReaction(entry.reaction, messageID, () => {}, true);
                break;
            }
        }
    }

    // --- منطق الاستجابة في المجموعات ---
    if (isGroup && !isMentioned && !isReplyToBot && !isPrefixCommand && !isTriggerKeyword) return;

    if (!agent) {
        agent = new PollinationsAgent(config.POLLINATIONS_API_KEY, config.BOTNAME);
    }

    // تجميد المجموعة
    if (global.frozenThreads && global.frozenThreads.has(threadID)) {
        let isAdminInGroup = false;
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            isAdminInGroup = threadInfo.adminIDs.some(admin => admin.id === senderID);
        } catch (e) {}
        if (!isAdminInGroup && !config.DEVELOPER.includes(senderID)) return;
    }

    let user = await userData.get(senderID);

    if (config.ADMINBOT.includes(senderID) && !user) {
        try {
            const userInfo = await api.getUserInfo(senderID);
            const name = userInfo[senderID]?.name || "مطور";
            await userData.create(senderID, name, "مطور");
            user = await userData.get(senderID);
        } catch (e) {}
    }

    if (!user || !user.isRegistered) {
        if (config.autoRegistration) {
            try {
                const userInfo = await api.getUserInfo(senderID);
                const info = userInfo[senderID];
                const name = info.firstName || info.name || "مستخدم جديد";

                if (user) {
                    await userData.set(senderID, { name: name, nickname: name, isRegistered: 1 });
                } else {
                    await userData.create(senderID, name, name, 1);
                }
                user = await userData.get(senderID);

                // إخطار المطور بالتسجيل الجديد
                const devMsg = `🔔 **تسجيل تلقائي جديد:**\n👤 الاسم: ${info.name}\n🆔 المعرف: ${senderID}\n🌐 الرابط: ${info.profileUrl || "لا يوجد"}\n💰 الرصيد: 1000$\n🎮 الألعاب: 0`;
                config.DEVELOPER.forEach(devID => {
                    api.sendMessage(devMsg, devID);
                });
            } catch (e) {
                logger.error("خطأ في التسجيل التلقائي:", e);
            }
        } else {
            if (body.toLowerCase().startsWith("تسجيل")) {
                const args = body.trim().split(/ +/);
                args.shift();
                const registerCmd = commands.get("تسجيل");
                if (registerCmd) return registerCmd.run({ api, event, args, permission: 0, userData, user, commands, config });
            }
            const deco = require('../utils/decorations');
            return api.sendMessage(deco.title("🚫 أنت غير مسجل 🚫") + "\n\nاكتب: تسجيل [لقبك]", threadID, messageID);
        }
    }

    let userRole = 0;
    if (config.DEVELOPER.includes(senderID)) {
        userRole = 2;
    } else if (isGroup) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (threadInfo.adminIDs.some(admin => admin.id === senderID)) userRole = 1;
        } catch (e) {}
    }

    // --- طبقات التنفيذ ---

    if (isPrefixCommand) {
        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (command) {
            const permReq = command.config.hasPermssion || 0;
            if (userRole >= permReq) {
                try {
                    return await command.run({ api, event, args, user, userData, commands, config });
                } catch (e) {
                    logger.error(`Error running command ${commandName}:`, e);
                }
            } else {
                return api.sendMessage(`🚫 ليس لديك الصلاحية لاستخدام الأمر ${commandName}`, threadID, messageID);
            }
        } else {
            if (global.botMode !== 'agent') return;
        }
    }

    if (global.botMode === 'hybrid' || global.botMode === 'agent') {
        let stopTyping;
        try { stopTyping = api.sendTypingIndicator(threadID, (err) => { if (err) console.error("Typing indicator error:", err); }); } catch (e) {}

        try {
            const response = await agent.chat(senderID, user.name, user, body, api, event, userRole);
            if (stopTyping) stopTyping();
            if (response) {
                return api.sendMessage(response, threadID, (err, info) => {
                    if (err) return;
                    global.client.handleReply.push({
                        name: "سبايدي",
                        messageID: info.messageID,
                        author: senderID
                    });
                }, messageID);
            }
        } catch (error) {
            if (stopTyping) stopTyping();
            logger.error("خطأ في معالجة الوكيل الذكي:", error);
            api.sendMessage("❌ حصل خطأ يا حبيبنا، جرب تاني بعد شوية.", threadID, messageID);
        }
    }
};
