const deco = require("../../utils/decorations");

if (!global.activeProcesses) global.activeProcesses = new Map();

module.exports.config = {
    name: "ايقاف_عملية",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "KG",
    description: "إلغاء العملية الحالية (للذكاء الاصطناعي أو الأوامر الطويلة)",
    commandCategory: "نظام",
    usages: "ايقاف_عملية",
    cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;

    // التحقق من وجود عملية نشطة لهذا المستخدم في هذه المجموعة
    const processKey = `${threadID}_${senderID}`;
    if (global.activeProcesses && global.activeProcesses.has(processKey)) {
        global.activeProcesses.delete(processKey);
        return api.sendMessage(deco.success("🛑 تم إلغاء العملية الجارية بنجاح!"), threadID, messageID);
    } else {
        return api.sendMessage(deco.info("ℹ️ لا توجد عمليات جارية لإلغائها حالياً."), threadID, messageID);
    }
};
