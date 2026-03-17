const axios = require("axios");
const fs = require("fs-extra");

// متغيرات لتتبع حالة الأمر (المهلة والتزامن)
const cooldowns = new Map();

module.exports.config = {
  name: "تخيلي",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Hakim Tracks", 
  description: "رسم صورة من نص باستخدام الذكاء الاصطناعي باستخدام نماذج متعددة.",
  commandCategory: "زكـــــــاء",
  usages: "تخيل [النص] | [رقم الموديل (1-3)]\nمثال: تخيل قط يرتدي قبعة ساحر | 1", 
  cooldowns: 30, 
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // التحقق من المهلة لكل مستخدم
  const now = Date.now();
  const userCooldown = cooldowns.get(senderID) || 0;
  const COOLDOWN_TIME = 30 * 1000; // 30 ثانية

  if (now < userCooldown) {
    const remainingTime = Math.ceil((userCooldown - now) / 1000);
    return api.sendMessage(
      `⏳ يرجى الانتظار ${remainingTime} ثانية قبل استخدام الأمر مرة أخرى.`, 
      threadID,
      messageID
    );
  }

  const fullPrompt = args.join(" ");
  const parts = fullPrompt.split("|").map(s => s.trim());

  let textPrompt = parts[0];
  let modelNumber = 1; // الموديل الافتراضي

  if (parts.length > 1) {
    const parsedModelNumber = parseInt(parts[1]);
    if (!isNaN(parsedModelNumber) && parsedModelNumber >= 1 && parsedModelNumber <= 3) {
      modelNumber = parsedModelNumber;
    } else {
      return api.sendMessage(
        "❌ رقم الموديل غير صالح. يرجى استخدام 1 أو 2 أو 3.\nمثال: تخيل قط يرتدي قبعة ساحر | 1",
        threadID,
        messageID
      );
    }
  }

  if (!textPrompt) {
    return api.sendMessage(
      "❌ يرجى كتابة وصف للصورة التي تريد إنشائها وتحديد رقم الموديل.\nمثال: تخيل قط يرتدي قبعة ساحر | 1",
      threadID,
      messageID
    );
  }

  // تحديد الموديل بناءً على الرقم
  let modelName;
  switch (modelNumber) {
    case 1:
      modelName = "flux-2-dev";
      break;
    case 2:
      modelName = "zimage";
      break;
    case 3:
      modelName = "gptimage";
      break;
    default:
      modelName = "flux-2-dev"; // افتراضي في حال وجود خطأ غير متوقع
  }

  // إرسال رسالة انتظار
  const waitMessage = await api.sendMessage("⏳ جارٍ إنشاء صورتك باستخدام الموديل " + modelName + "، يرجى الانتظار...", threadID);

  try {
    // ترجمة النص إلى الإنجليزية لضمان أفضل النتائج
    const translationResponse = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textPrompt)}`
    );
    const translatedPrompt = translationResponse.data[0][0][0];

    // إنشاء مجلد cache إذا لم يكن موجودًا
    const cachePath = __dirname + "/cache";
    fs.ensureDirSync(cachePath);
    const imagePath = cachePath + `/magic_image_${senderID}_${Date.now()}.png`;

    // بناء رابط الـ API
    const apiUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(translatedPrompt)}?model=${modelName}&key=${global.client.config.POLLINATIONS_API_KEY}`;
    
    // طلب الصورة من الـ API
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // حفظ الصورة المستلمة
    fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

    // إرسال الصورة للمستخدم
    api.sendMessage(
      {
        body: `✨ تفضل، هذه هي الصورة التي تخيلتها باستخدام الموديل **${modelName}**:\n\n- الوصف: "${textPrompt}"`, 
        attachment: fs.createReadStream(imagePath),
      },
      threadID,
      () => {
        // حذف الصورة من الخادم بعد إرسالها
        fs.unlinkSync(imagePath);
        // حذف رسالة الانتظار
        api.unsendMessage(waitMessage.messageID);
        // تحديث المهلة للمستخدم
        cooldowns.set(senderID, now + COOLDOWN_TIME);
      },
      messageID
    );
  } catch (error) {
    console.error("خطأ في أمر تخيل:", error);
    // حذف رسالة الانتظار في حال حدوث خطأ
    api.unsendMessage(waitMessage.messageID);
    api.sendMessage("❌ حدث خطأ أثناء إنشاء الصورة. قد يكون هناك ضغط على الخادم، حاول مرة أخرى بعد قليل.", threadID, messageID);
    // إنهاء العملية وتحديث المهلة حتى في حالة الخطأ لمنع الإغراق
    cooldowns.set(senderID, now + COOLDOWN_TIME);
  }
};
