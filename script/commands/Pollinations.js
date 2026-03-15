const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "ارسمي",
  version: "1.1.0", // تم تحديث الإصدار
  hasPermssion: 0,
  credits: "Hakim Tracks", // تمت إضافة المساهم في التعديل
  description: "رسم صورة من نص باستخدام الذكاء الاصطناعي.",
  commandCategory: "زكـــــــاء",
  usages: "تخيل [النص]", // تم تبسيط الاستخدام
  cooldowns: 10, // تم زيادة مدة الانتظار قليلاً لأن هذه العمليات تستهلك موارد
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  //const apikey = "rapi_eb61b199734442d39a7ce1c432711e65"; // مفتاح API الخاص بك

  // دمج كل الوسائط في نص واحد
  const textPrompt = args.join(" ");

  if (!textPrompt) {
    return api.sendMessage(
      "❌ يرجى كتابة وصف للصورة التي تريد إنشائها.\nمثال: .تخيل قط يرتدي قبعة ساحر",
      threadID,
      messageID
    );
  }

  // إرسال رسالة انتظار
  const waitMessage = await api.sendMessage("⏳ جارٍ إنشاء صورتك، يرجى الانتظار...", threadID);

  try {
    // لا حاجة للترجمة، الـ API الجديد قد يفهم العربية أو يترجم داخلياً
    // ولكن الترجمة للإنجليزية تضمن أفضل النتائج
    const translationResponse = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textPrompt)}`
    );
    const translatedPrompt = translationResponse.data[0][0][0];

    // إنشاء مجلد cache إذا لم يكن موجودًا
    const cachePath = __dirname + "/cache";
    fs.ensureDirSync(cachePath);
    const imagePath = cachePath + "/magic_image.png";

    // --- تم تعديل رابط الـ API هنا ---
    const apiUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(translatedPrompt)}?model=flux-2-dev&key=pk_uwZDxEZzn4IcgYWF`;
    
    // طلب الصورة من الـ API
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // حفظ الصورة المستلمة
    fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

    // إرسال الصورة للمستخدم
    api.sendMessage(
      {
        body: `✨ تفضل، هذه هي الصورة التي تخيلتها:\n\n- الوصف: "${textPrompt}"`,
        attachment: fs.createReadStream(imagePath),
      },
      threadID,
      () => {
        // حذف الصورة من الخادم بعد إرسالها
        fs.unlinkSync(imagePath);
        // حذف رسالة الانتظار
        api.unsendMessage(waitMessage.messageID);
      },
      messageID
    );
  } catch (error) {
    console.error("خطأ في أمر تخيل:", error);
    // حذف رسالة الانتظار في حال حدوث خطأ
    api.unsendMessage(waitMessage.messageID);
    api.sendMessage("❌ حدث خطأ أثناء إنشاء الصورة. قد يكون هناك ضغط على الخادم، حاول مرة أخرى بعد قليل.", threadID, messageID);
  }
};
