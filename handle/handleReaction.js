const logger = require('../utils/logger.js');

module.exports = async function({ event, api, userData }) {
    const { handleReaction } = global.client;
    const { messageID, userID, reaction, threadID } = event;

    // البحث عن التفاعل المرتبط بالرسالة في الذاكرة العالمية
    const reactionData = handleReaction.find(i => i.messageID == messageID);
    if (!reactionData) return;

    // التأكد أن الشخص الذي تفاعل هو صاحب الطلب الأصلي (اختياري لضمان الأمان)
    if (reactionData.author && reactionData.author !== userID) return;

    const command = global.client.commands.get(reactionData.name);
    if (!command || !command.handleReaction) return;

    try {
        // جلب بيانات المستخدم الحالية لضمان الترابط مع قاعدة البيانات
        const user = await userData.get(userID);
        
        await command.handleReaction({ 
            api, 
            event, 
            handleReaction: reactionData,
            userData,
            user
        });
    } catch (e) {
        logger.error(`خطأ في handleReaction للأمر ${reactionData.name}:`, e);
        api.sendMessage(`❌ حدث خطأ أثناء معالجة التفاعل:\n${e.message}`, threadID, messageID);
    }
};
