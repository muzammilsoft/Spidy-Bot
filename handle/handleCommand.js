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
    const { body, senderID, threadID, messageID, mentions } = event;
    if (!body) return;

    // تعليم الرسالة كمقروءة فور استلامها لتقليل الشبهات
    try { api.markAsRead(threadID); } catch (e) {}

    const { config, commands } = global.client;
    const prefix = config.PREFIX || ".";

    const isGroup = event.participantIDs && event.participantIDs.length > 1;
    const botID = api.getCurrentUserID();

    // --- منطق التفاعل التلقائي (Autoreact) ---
    if (isGroup && global.autoReactEnabled) {
        for (const entry of emotionMap) {
            if (entry.keywords.some(key => body.toLowerCase().includes(key))) {
                api.setMessageReaction(entry.reaction, messageID, () => {}, true);
                break;
            }
        }
    }

    const isMentioned = mentions && Object.keys(mentions).includes(botID);
    const isReplyToBot = event.messageReply && event.messageReply.senderID === botID;
    const triggerKeywords = ["بوت", "سبايدي", "يا بوت", "يا سبايدي", "prefix", "البادئة"];
    const isTriggerKeyword = triggerKeywords.some(key => body.toLowerCase().includes(key));
    const isPrefixCommand = body.startsWith(prefix);

    // في المجموعات: يستجيب فقط إذا تم المنشن، الرد على رسالته، البادئة، أو وجود كلمة مفتاحية
    if (isGroup && !isMentioned && !isReplyToBot && !isPrefixCommand && !isTriggerKeyword) return;

    if (!agent) {
        agent = new PollinationsAgent(config.POLLINATIONS_API_KEY, config.BOTNAME);
    }

    // --- الأوامر الإلزامية بالبادئة للمطور ---
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
    }

    if (global.frozenThreads && global.frozenThreads.has(threadID)) {
        let isAdminInGroup = false;
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            isAdminInGroup = threadInfo.adminIDs.some(admin => admin.id === senderID);
        } catch (e) {}
        if (!isAdminInGroup && !config.DEVELOPER.includes(senderID)) return;
    }

    if (!global.isBotActive && !config.DEVELOPER.includes(senderID)) return;

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
        if (body.toLowerCase().startsWith("تسجيل")) {
            const args = body.trim().split(/ +/);
            args.shift();
            const registerCmd = commands.get("تسجيل");
            if (registerCmd) return registerCmd.run({ api, event, args, permission: 0, userData, user, commands, config });
        }
        const deco = require('../utils/decorations');
        return api.sendMessage(deco.title("🚫 أنت غير مسجل 🚫") + "\n\nاكتب: تسجيل [لقبك]", threadID, messageID);
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

    // --- منطق الأوضاع (Mode Logic) ---

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
        }
    }

    if (global.botMode === 'hybrid' || global.botMode === 'agent') {
        // إظهار مؤشر الكتابة عند بدء معالجة الذكاء الاصطناعي
        let stopTyping;
        try { stopTyping = api.sendTypingIndicator(threadID); } catch (e) {}

        try {
            const response = await agent.chat(senderID, user.name, user, body, api, event, userRole);
            if (stopTyping) stopTyping(); // إيقاف المؤشر بعد الانتهاء
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
            logger.error("خطأ في معالجة الوكيل الذكي:", error);
            api.sendMessage("❌ حصل خطأ يا حبيبنا، جرب تاني بعد شوية.", threadID, messageID);
        }
    }
};
