const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "عناق",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "إنشاء صورة عناق بين شخصين (مع صور دائرية)",
    commandCategory: "الــعــاب",
    usages: ".عناق @منشن أو بالرد على رسالة",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    let targetID;
    if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else if (messageReply) {
        targetID = messageReply.senderID;
    } else {
        return api.sendMessage("يرجى منشن شخص أو الرد على رسالته لعمل عناق.", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    try {
        const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarURL2 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const templateURL = "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg";

        const [img1, img2, template] = await Promise.all([
            loadImage(avatarURL1).catch(() => null),
            loadImage(avatarURL2).catch(() => null),
            loadImage(templateURL)
        ]);

        if (!img1 || !img2) return api.sendMessage("تعذر جلب صور الحسابات. تأكد من أن الحسابات عامة.", threadID, messageID);

        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext("2d");

        // رسم القالب الأساسي
        ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

        // رسم الصورة الأولى (الآمر) بشكل دائري
        ctx.save(); // حفظ الحالة الحالية (بدون قص)
        ctx.beginPath();
        // تحديد دائرة بنفس مركز الصورة المربعة (x + نصف العرض, y + نصف الارتفاع)
        ctx.arc(300 + 150/2, 100 + 150/2, 150/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip(); // تطبيق القص: أي رسم لاحق سيقتصر على هذه الدائرة
        ctx.drawImage(img1, 300, 100, 150, 150); // رسم الصورة داخل الدائرة
        ctx.restore(); // استعادة الحالة السابقة (إزالة القص)

        // رسم الصورة الثانية (المستهدف) بشكل دائري
        ctx.save();
        ctx.beginPath();
        ctx.arc(250 + 130/2, 250 + 130/2, 130/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img2, 250, 250, 130, 130);
        ctx.restore();

        const imagePath = path.join(cacheDir, `hug_${senderID}_${targetID}.png`);
        const buffer = canvas.toBuffer();
        fs.writeFileSync(imagePath, buffer);

        api.sendMessage({
            body: "يا له من عناق دافئ! 🤗",
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => fs.unlinkSync(imagePath), messageID);

    } catch (error) {
        console.error(error);
        api.sendMessage("حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
    }
};