const logger = require('../utils/logger.js');
const loggerAdvanced = require('../utils/logger_advanced.js');
const securityAdvanced = require('../utils/security_advanced.js');
const userData = require('../database/userData');
const PollinationsAgent = require("../utils/pollinations_agent");

// حالة البوت (تشغيل/إيقاف)
if (global.isBotActive === undefined) global.isBotActive = true;
const botOwnerID = "100036535161872";

// تهيئة الوكيل الذكي
let agent;

module.exports = async function({ event, api, userData }) {
    const { body, senderID, threadID, messageID, mentions } = event;

    if (!body) return;

    // --- نظام الرد الذكي (خاص/مجموعات) ---
    const isGroup = event.participantIDs && event.participantIDs.length > 1;
    const botID = api.getCurrentUserID();
    
    // التحقق مما إذا كان البوت قد تم ذكره (Mention)
    const isMentioned = mentions && Object.keys(mentions).includes(botID);
    
    // التحقق مما إذا كانت الرسالة رداً على رسالة من البوت
    const isReplyToBot = event.messageReply && event.messageReply.senderID === botID;

    // في المجموعات: رد فقط إذا تم ذكر البوت أو الرد على رسالته
    if (isGroup && !isMentioned && !isReplyToBot) return;

    // في الخاص: الرد دائماً (لا حاجة لشرط إضافي لأن isGroup سيكون false)

    // تهيئة الوكيل عند أول رسالة
    if (!agent) {
        agent = new PollinationsAgent(global.client.config.POLLINATIONS_API_KEY, global.client.config.BOTNAME);
    }

    // نظام التشغيل والإيقاف (للمطور فقط)
    if (senderID === botOwnerID) {
        if (body.toLowerCase() === "ايقاف") {
            global.isBotActive = false;
            loggerAdvanced.logInfo('البوت تم إيقافه من قبل المطور');
            return api.sendMessage("واخيرا وقت الراحة ヽʕ•͡-•ʔﾉ ", threadID, messageID);
        }
        if (body.toLowerCase() === "تشغيل") {
            global.isBotActive = true;
            loggerAdvanced.logInfo('البوت تم تشغيله من قبل المطور');
            return api.sendMessage("عاد الاسد اللهم لا حسد ヽʕ•͡-•ʔﾉ ", threadID, messageID);
        }
    }

    if (!global.isBotActive && senderID !== botOwnerID) return; 

    const { config, commands, cooldowns } = global.client;

    // جلب بيانات المستخدم
    let user = await userData.get(senderID);

    // إنشاء سجل للمطور إذا لم يوجد
    if (config.ADMINBOT.includes(senderID) && !user) {
        try {
            const userInfo = await api.getUserInfo(senderID);
            const name = userInfo[senderID]?.name || "مطور";
            await userData.create(senderID, name, "مطور");
            user = await userData.get(senderID);
        } catch (e) { logger.error("فشل إنشاء سجل للمطور:", e); }
    }

    // التسجيل الإلزامي (يُستثنى منه أمر "تسجيل")
    if (!user || !user.isRegistered) {
        // إذا كانت الرسالة تبدأ بكلمة "تسجيل"
        if (body.toLowerCase().startsWith("تسجيل")) {
            const args = body.trim().split(/ +/);
            args.shift();
            const registerCmd = commands.get("تسجيل");
            if (registerCmd) {
                return registerCmd.run({ api, event, args, permission: 0, userData, user, commands, config });
            }
        }
        
        const deco = require('../utils/decorations');
        let msg = deco.title("🚫 عذراً، أنت غير مسجل 🚫") + "\n\n";
        msg += deco.line("يجب عليك التسجيل أولاً لاستخدام البوت") + "\n";
        msg += deco.line("اكتب: تسجيل [لقبك]") + "\n";
        return api.sendMessage(msg, threadID, messageID);
    }

    // --- نظام الوكيل الذكي (Agent Mode) ---
    // أي رسالة ترسل للبوت سيتم معالجتها بواسطة Pollinations AI
    // سيقوم الوكيل باختيار الأداة (الأمر) المناسبة أو الرد بشكل طبيعي
    
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
        const response = await agent.chat(senderID, user.name, user, body, api, event);
        
        if (response) {
            api.setMessageReaction("✨", messageID, () => {}, true);
            return api.sendMessage(response, threadID, (err, info) => {
                if (err) return;
                global.client.handleReply.push({
                    name: "ميرور", // نستخدم اسم أمر الـ AI للردود
                    messageID: info.messageID,
                    author: senderID
                });
            }, messageID);
        }
    } catch (error) {
        logger.error("خطأ في معالجة الوكيل الذكي:", error);
        api.sendMessage("❌ حدث خطأ في معالجة طلبك، يرجى المحاولة لاحقاً.", threadID, messageID);
    }
};
