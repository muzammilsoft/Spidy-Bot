const axios = require('axios');
const fs = require('fs');
const path = require('path');

// قاموس لترجمة المصطلحات إلى العربية
const translations = {
    season: {
        "WINTER": "شتاء",
        "SPRING": "ربيع",
        "SUMMER": "صيف",
        "FALL": "خريف"
    },
    genre: {
        "Comedy": "كوميدي", "Romance": "رومانسي", "Action": "أكشن",
        "Adventure": "مغامرات", "Drama": "دراما", "Fantasy": "فانتازيا",
        "Sci-Fi": "خيال علمي", "Horror": "رعب", "Mystery": "غموض",
        "Slice of Life": "شريحة من الحياة", "Supernatural": "خارق للطبيعة",
        "Sports": "رياضة", "Magic": "سحر", "Military": "عسكري",
        "School": "مدرسي", "Game": "ألعاب", "Historical": "تاريخي"
    },
    status: {
        "FINISHED": "مكتمل",
        "RELEASING": "قيد العرض",
        "NOT_YET_RELEASED": "لم يُعرض بعد",
        "CANCELLED": "ملغي",
        "HIATUS": "متوقف مؤقتًا"
    }
};

// دالة لتنظيف الوصف من أكواد HTML
function cleanDescription(description) {
    if (!description) return "غير متوفر";
    let text = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 500) text = text.substring(0, 500) + "...";
    return text || "غير متوفر";
}

// دالة لترجمة النص إلى العربية
async function translateToArabic(text) {
    if (!text) return "غير متوفر";
    try {
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
            params: { client: 'gtx', sl: 'en', tl: 'ar', dt: 't', q: text }
        });
        return res.data?.[0]?.[0]?.[0] || text;
    } catch {
        return text; // في حال فشل الترجمة، يتم إرجاع النص الأصلي
    }
}

module.exports.config = {
    name: "صوص",
    version: "2.1",
    hasPermission: 0,
    credits: "Hakim Tracks", 
    description: "تحديد اسم الأنمي من صورة",
    prefix: true, // تم تعديل الخاصية لتتوافق مع نظامك
    commandCategory: "عـــامـة", // فئة الأمر
    usages: ".صوص (بالرد على صورة أو إرفاق رابط)",
    cooldowns: 15
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;

    try {
        let imageUrl;

        // التحقق من وجود صورة في الرد
        if (type === "message_reply" && messageReply.attachments?.[0]?.type === "photo") {
            imageUrl = messageReply.attachments[0].url;
        } 
        // التحقق من وجود رابط في الوسائط
        else if (args[0] && (args[0].startsWith("http://") || args[0].startsWith("https://"))) {
            imageUrl = args[0];
        } else {
            return api.sendMessage("⚠️ يرجى الرد على صورة أو إرسال رابط صورة صالح.", threadID, messageID);
        }

        const waitMessage = await api.sendMessage("🔍 جاري البحث عن الأنمي، يرجى الانتظار...", threadID);

        // إرسال الصورة إلى trace.moe API
        const traceRes = await axios.get(`https://api.trace.moe/search?url=${encodeURIComponent(imageUrl)}&anilistInfo`);

        const result = traceRes.data.result?.[0];
        if (!result) {
            api.unsendMessage(waitMessage.messageID);
            return api.sendMessage("❌ لم يتم العثور على نتائج مطابقة لهذه الصورة.", threadID, messageID);
        }

        // استخراج بيانات الأنمي من anilist
        const anime = result.anilist;
        const desc = await translateToArabic(cleanDescription(anime.description));
        const season = anime.season ? (translations.season[anime.season] || anime.season) : "غير معروف";
        const status = anime.status ? (translations.status[anime.status] || anime.status) : "غير معروف";
        const genres = anime.genres?.map(g => translations.genre[g] || g).join("، ") || "غير معروف";

        const info = 
`🎬 **العنوان:** ${anime.title.romaji || "غير معروف"}
🇯🇵 **الاسم الأصلي:** ${anime.title.native || "غير معروف"}
📅 **الموسم:** ${season} ${anime.seasonYear || ""}
📺 **الحالة:** ${status}
⭐ **التقييم:** ${anime.averageScore ? anime.averageScore + "/100" : "غير معروف"}
🎞️ **الحلقات:** ${anime.episodes || "غير معروف"}
🏷️ **الأنواع:** ${genres}

📝 **الوصف:**
${desc}`;

        // تحميل صورة غلاف الأنمي
        const coverImagePath = path.join(__dirname, 'cache', `anime_${Date.now()}.jpg`);
        const imageResponse = await axios.get(result.image, { responseType: "arraybuffer" });
        fs.writeFileSync(coverImagePath, Buffer.from(imageResponse.data, "binary"));

        // إرسال النتيجة النهائية وحذف رسالة الانتظار
        api.unsendMessage(waitMessage.messageID);
        api.sendMessage({
            body: info,
            attachment: fs.createReadStream(coverImagePath)
        }, threadID, () => fs.unlinkSync(coverImagePath), messageID);

    } catch (err) {
        console.error("خطأ في أمر صوص:", err);
        return api.sendMessage("❌ حدث خطأ غير متوقع أثناء معالجة طلبك.", threadID, messageID);
    }
};
