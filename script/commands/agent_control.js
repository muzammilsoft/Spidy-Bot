const deco = require("../../utils/decorations");

module.exports.config = {
    name: "الوكيل",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "KG",
    description: "التحكم في وضع الوكيل (الذكاء الاصطناعي)",
    commandCategory: "الــمـطـور",
    usages: "الوكيل [تشغيل/إيقاف]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const action = args[0];

    if (action === "تشغيل") {
        global.botMode = 'hybrid';
        return api.sendMessage(deco.success("✅ تم تفعيل الوضع الهجين (الوكيل + الأوامر العادية)"), threadID, messageID);
    } else if (action === "إيقاف") {
        global.botMode = 'normal';
        return api.sendMessage(deco.warn("⚠️ تم إيقاف وضع الوكيل. البوت سيعمل الآن بالأوامر العادية فقط."), threadID, messageID);
    } else {
        return api.sendMessage("يرجى استخدام: الوكيل تشغيل أو الوكيل إيقاف", threadID, messageID);
    }
};
