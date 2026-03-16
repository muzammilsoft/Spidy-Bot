const logger = require('../utils/logger.js');
const loggerAdvanced = require('../utils/logger_advanced.js');
const userData = require('../database/userData');
const PollinationsAgent = require("../utils/pollinations_agent");

// الإعدادات العالمية الافتراضية
if (global.isBotActive === undefined) global.isBotActive = true;
if (global.botMode === undefined) global.botMode = 'hybrid'; // هجين، وكيل، عادي
const botOwnerID = "100036535161872";

let agent;

module.exports = async function({ event, api, userData }) {
    const { body, senderID, threadID, messageID, mentions } = event;
    if (!body) return;

    const isGroup = event.participantIDs && event.participantIDs.length > 1;
    const botID = api.getCurrentUserID();
    const isMentioned = mentions && Object.keys(mentions).includes(botID);
    const isReplyToBot = event.messageReply && event.messageReply.senderID === botID;
    const isPrefixCommand = body.startsWith(".");

    // في المجموعات: رد فقط إذا تم ذكر البوت، الرد على رسالته، أو أمر ببادئة
    if (isGroup && !isMentioned && !isReplyToBot && !isPrefixCommand) return;

    if (!agent) {
        agent = new PollinationsAgent(global.client.config.POLLINATIONS_API_KEY, global.client.config.BOTNAME);
    }

    // --- الأوامر الإلزامية بالبادئة (.) للمطور ---
    if (isPrefixCommand && (global.client.config.DEVELOPER.includes(senderID) || senderID === botOwnerID)) {
        const args = body.slice(1).trim().split(/ +/);
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
        if (!isAdminInGroup && !global.client.config.DEVELOPER.includes(senderID)) return;
    }

    if (!global.isBotActive && !global.client.config.DEVELOPER.includes(senderID)) return;

    const { config, commands } = global.client;
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
    // محاولة تنفيذ كأمر عادي أولاً إذا لم يكن الوضع 'agent' حصراً
    if (global.botMode !== 'agent') {
        const args = body.trim().split(/ +/);
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

    // إذا لم يكن أمراً عادياً وكان وضع الوكيل/الهجين مفعلاً، يتم التحويل للـ LLM
    if (global.botMode === 'hybrid' || global.botMode === 'agent') {
        api.setMessageReaction("⏳", messageID, () => {}, true);
        try {
            const response = await agent.chat(senderID, user.name, user, body, api, event, userRole);
            if (response) {
                api.setMessageReaction("✨", messageID, () => {}, true);
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
