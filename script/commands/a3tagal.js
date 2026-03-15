const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "اعتقال",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "إنشاء صورة اعتقال لشخص ما",
    commandCategory: "الــعــاب",
    usages: ".اعتقال @منشن أو بالرد على رسالة",
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
        return api.sendMessage("يرجى منشن شخص أو الرد على رسالته لاعتقاله 🚓", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    try {
        const templateURL = "https://i.imgur.com/ep1gG3r.png";
        const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarURL2 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        const [template, img1, img2] = await Promise.all([
            loadImage(templateURL),
            loadImage(avatarURL1).catch(() => null),
            loadImage(avatarURL2).catch(() => null)
        ]);

        if (!img1 || !img2) return api.sendMessage("تعذر جلب صور الحسابات.", threadID, messageID);

        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext("2d");

        // رسم القالب الأساسي
        ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

        // دالة مساعدة لرسم صورة دائرية
        function drawCircularImage(img, x, y, size) {
            ctx.save(); // حفظ حالة الرسم الحالية
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2); // دائرة في منتصف المربع
            ctx.closePath();
            ctx.clip(); // قص الرسم ليقتصر على الدائرة
            ctx.drawImage(img, x, y, size, size);
            ctx.restore(); // استعادة الحالة لإزالة القص
        }

        // رسم صورة الآمر (الشرطي) بشكل دائري
        drawCircularImage(img1, 375, 9, 100);

        // رسم صورة المستهدف (المعتقل) بشكل دائري
        drawCircularImage(img2, 160, 92, 100);

        const imagePath = path.join(cacheDir, `arrest_${senderID}_${targetID}.png`);
        const buffer = canvas.toBuffer();
        fs.writeFileSync(imagePath, buffer);

        api.sendMessage({
            body: "🚓 تم اعتقال المجرم بنجاح!",
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => fs.unlinkSync(imagePath), messageID);

    } catch (error) {
        console.error(error);
        api.sendMessage("حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
    }
};