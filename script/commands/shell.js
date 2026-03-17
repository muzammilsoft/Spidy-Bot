const { exec } = require("child_process");
const deco = require("../../utils/decorations");

module.exports.config = {
    name: "شل",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "KG",
    description: "تنفيذ أوامر النظام (شل) للمطور فقط",
    commandCategory: "الــمـطـور",
    usages: "شل [الأمر]",
    cooldowns: 0
};

module.exports.run = async ({ api, event, args, config }) => {
    const { threadID, messageID, senderID } = event;
    const command = args.join(" ");

    // التحقق المزدوج من المطور
    if (!config.DEVELOPER.includes(senderID)) {
        return api.sendMessage("🚫 المطور فقط يقدر يستخدم الشل.", threadID, messageID);
    }

    if (!command) {
        return api.sendMessage("🚫 يرجى إدخال الأمر المراد تنفيذه.", threadID, messageID);
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return api.sendMessage(deco.error(`❌ خطأ في التنفيذ:\n${error.message}`), threadID, messageID);
        }
        if (stderr) {
            return api.sendMessage(deco.warn(`⚠️ تنبيه:\n${stderr}`), threadID, messageID);
        }
        api.sendMessage(deco.success(`✅ نتيجة التنفيذ:\n${stdout}`), threadID, messageID);
    });
};
