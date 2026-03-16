const deco = require("../../utils/decorations");

module.exports.config = {
    name: "تلقائي",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "KG",
    description: "تفعيل أو إيقاف التفاعل التلقائي مع المشاعر (Autoreact)",
    commandCategory: "الــمـطـور",
    usages: "تلقائي [تشغيل/إيقاف]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const action = args[0];

    if (action === "تشغيل" || action === "on") {
        global.autoReactEnabled = true;
        return api.sendMessage(deco.success("✅ تم تفعيل التفاعل التلقائي (Autoreact) 💮"), threadID, messageID);
    } else if (action === "إيقاف" || action === "off") {
        global.autoReactEnabled = false;
        return api.sendMessage(deco.warn("⚠️ تم إيقاف التفاعل التلقائي 🕸️"), threadID, messageID);
    } else {
        return api.sendMessage("يرجى استخدام: .تلقائي تشغيل أو .تلقائي إيقاف", threadID, messageID);
    }
};
