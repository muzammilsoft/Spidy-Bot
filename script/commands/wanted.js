const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "مطلوب",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "إنشاء بوستر مطلوب مع صورة الشخص",
    commandCategory: "الــعــاب",
    usages: "[منشن/رد]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    
    let targetID = messageReply ? messageReply.senderID : Object.keys(mentions)[0];
    if (!targetID) targetID = senderID;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const pathCache = path.join(cacheDir, `wanted_${targetID}.png`);
    
    try {
        const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const templateURL = "https://i.postimg.cc/vmFqjkw8/467471884-1091680152417037-7359182676446817237-n.jpg";

        const [avatar, template] = await Promise.all([
            loadImage(avatarURL).catch(() => null),
            loadImage(templateURL)
        ]);

        if (!avatar) return api.sendMessage("『 ❌ 』تعذر جلب صورة الحساب.", threadID, messageID);

        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

        // إحداثيات الصورة من البرومبت:
        // حجم الصورة يساوي نصف عرض القالب
        // x = (عرض القالب / 2) - (حجم الصورة / 2)
        // y = (ارتفاع القالب / 2) - (حجم الصورة / 2) - 25
        // إطار أبيض حول الصورة بسماكة 4px

        const imgSize = canvas.width / 2;
        const x = (canvas.width / 2) - (imgSize / 2);
        const y = (canvas.height / 2) - (imgSize / 2) - 25;

        // رسم الإطار الأبيض
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 4, y - 4, imgSize + 8, imgSize + 8);
        
        // رسم الصورة
        ctx.drawImage(avatar, x, y, imgSize, imgSize);

        const buffer = canvas.toBuffer();
        fs.writeFileSync(pathCache, buffer);

        return api.sendMessage({
            body: "🏴‍☠️ مطلوب حياً أو ميتاً!",
            attachment: fs.createReadStream(pathCache)
        }, threadID, () => fs.unlinkSync(pathCache), messageID);

    } catch (error) {
        console.error(error);
        api.sendMessage("حدث خطأ أثناء إنشاء الصورة.", threadID, messageID);
    }
};
