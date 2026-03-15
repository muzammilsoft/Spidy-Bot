const handleCommand = require('./handleCommand.js');
const handleReply = require('./handleReply.js');
const handleReaction = require('./handleReaction.js');
const logger = require('../utils/logger.js');
const userData = require('../database/userData');

module.exports = async function({ event, api }) {
    if (!event) return;

    // تشغيل handleEvent لجميع الأوامر التي تدعمها (مثل الحماية)
    for (const [name, command] of global.client.commands) {
        if (command.handleEvent) {
            try {
                await command.handleEvent({ api, event, userData });
            } catch (e) {
                logger.error(`خطأ في handleEvent للأمر ${name}:`, e);
            }
        }
    }

    try {
        const props = { event, api, userData };
        switch (event.type) {
            case "message":
            case "message_reply":
                // التحقق إذا كانت الرسالة رداً على رسالة سابقة مخزنة في handleReply
                const isReply = event.messageReply && global.client.handleReply.some(item => item.messageID == event.messageReply.messageID);
                if (isReply) {
                    await handleReply(props);
                } else {
                    await handleCommand(props);
                }
                break;

            case "message_reaction":
                await handleReaction(props);
                break;

            case "log:subscribe":
            case "log:unsubscribe":
                for (const [name, command] of global.client.commands) {
                    if (command.config.eventType && command.config.eventType.includes(event.logMessageType)) {
                        await command.run({ ...props, args: [] });
                    }
                }
                break;
        }
    } catch (error) {
        logger.error("خطأ غير متوقع في المعالج الرئيسي (minHandle):", error);
    }
};
