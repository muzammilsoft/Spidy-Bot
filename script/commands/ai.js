const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * هذا الملف الآن يعمل كمعالج للردود (handleReply) فقط
 * لأن المنطق الرئيسي انتقل إلى handleCommand و gemini_agent
 */

module.exports.handleReply = async function({ api, event, handleReply, userData }) {
    const { threadID, messageID, senderID, body } = event;

    // التأكد من أن المستخدم هو نفسه الذي بدأ المحادثة
    if (senderID !== handleReply.author) return;

    api.setMessageReaction("⏳", messageID, () => {}, true);

    const user = await userData.get(senderID);
    
    // استخدام الوكيل العالمي إذا كان متاحاً، أو إنشاء واحد مؤقت
    const GeminiAgent = require('../../utils/gemini_agent');
    const agent = new PollinationsAgent(global.client.config.POLLINATIONS_API_KEY, global.client.config.BOTNAME);
    
    const response = await agent.chat(senderID, user.name, user, body, api, event);

    if (response) {
        return api.sendMessage(response, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);
    }
};

module.exports.run = async ({ api, event, args, user, userData }) => {
    // في نظام الوكيل الجديد، يتم استدعاء الوكيل مباشرة من handleCommand
    // هذا الأمر يبقى للتوافق أو للاستدعاء اليدوي إذا لزم الأمر
    const { threadID, messageID, senderID } = event;
    const PollinationsAgent = require("../../utils/pollinations_agent");
    const agent = new PollinationsAgent(global.client.config.POLLINATIONS_API_KEY, global.client.config.BOTNAME);
    
    const userMessage = args.join(" ");
    if (!userMessage) return api.sendMessage("أهلاً بك! أنا وكيلتك الذكية ✨.. كيف يمكنني مساعدتك؟ 🌸", threadID, messageID);

    const response = await agent.chat(senderID, user.name, user, userMessage, api, event);

    if (response) {
        return api.sendMessage(response, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);
    }
};

module.exports.config = {
    name: "ميرور",
    version: "5.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "تحدث مع الوكيلة الذكية (ذكاء اصطناعي)",
    commandCategory: "زكـــــــاء",
    usages: "[رسالتك]",
    cooldowns: 2
};
