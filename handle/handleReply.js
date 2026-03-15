const logger = require('../utils/logger.js');

module.exports = async function({ event, api, userData }) {
    const { handleReply } = global.client;
    const { messageReply, threadID, messageID } = event;

    // البحث عن معلومات الرد المخزنة مسبقاً في الذاكرة العالمية
    const replyIndex = handleReply.findIndex(i => i.messageID == messageReply.messageID);
    if (replyIndex === -1) return;

    const replyData = handleReply[replyIndex];
    const command = global.client.commands.get(replyData.name);

    if (!command || !command.handleReply) return;

    try {
        // جلب بيانات المستخدم الحالية لضمان الترابط مع قاعدة البيانات
        const user = await userData.get(event.senderID);
        
        await command.handleReply({ 
            api, 
            event, 
            handleReply: replyData,
            userData,
            user
        });
    } catch (e) {
        logger.error(`خطأ في handleReply للأمر ${replyData.name}:`, e);
        api.sendMessage(`❌ حدث خطأ أثناء معالجة الرد:\n${e.message}`, threadID, messageID);
    }
};
