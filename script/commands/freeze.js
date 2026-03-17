const deco = require("../../utils/decorations");

if (!global.frozenThreads) global.frozenThreads = new Set();

module.exports.config = {
    name: "تجميد",
    version: "1.0.0",
    hasPermssion: 1, // Admins only
    credits: "KG",
    description: "تجميد البوت في المجموعة (لا يستجيب إلا للأدمنز)",
    commandCategory: "إدارة المجموعة",
    usages: "تجميد [تشغيل/إيقاف]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const action = args[0];

    if (action === "تشغيل") {
        global.frozenThreads.add(threadID);
        return api.sendMessage(deco.title("❄️ تم تجميد البوت في هذه المجموعة") + "\n\nلن يستجيب البوت إلا لطلبات المشرفين الآن 💮", threadID, messageID);
    } else if (action === "إيقاف") {
        global.frozenThreads.delete(threadID);
        return api.sendMessage(deco.success("🔥 تم إلغاء تجميد البوت.. عاد للعمل للجميع! 🕸️"), threadID, messageID);
    } else {
        return api.sendMessage("يرجى استخدام: تجميد تشغيل أو تجميد إيقاف 💮", threadID, messageID);
    }
};
