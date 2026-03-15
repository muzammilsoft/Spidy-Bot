const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const deco = require('../../utils/decorations');

module.exports.config = {
  name: "مساعدة",
  version: "3.0.0",
  hasPermission: 0,
  credits: "Hakim Tracks",
  description: "عرض قائمة الأوامر أو تفاصيل أمر معين",
  commandCategory: "عـــامـة",
  usages: "مساعدة [اسم الأمر]",
  cooldowns: 5
};

const IMAGE_URL = "https://i.postimg.cc/63mNPW7q/20260307-211107.jpg";
const LOCAL_IMG_PATH = path.join(__dirname, "img", "menu.png");
const FALLBACK_IMG_PATH = path.join(__dirname, "cache", "menu.jpg");
const BOT_NAME = "Mirror Bot";
const DEVELOPER_NAME = "Hakim Tracks";

async function getImageStream() {
  if (fs.existsSync(LOCAL_IMG_PATH)) {
    return fs.createReadStream(LOCAL_IMG_PATH);
  }

  fs.ensureDirSync(path.dirname(FALLBACK_IMG_PATH));
  if (!fs.existsSync(FALLBACK_IMG_PATH)) {
    try {
      const res = await axios.get(IMAGE_URL, { responseType: "arraybuffer" });
      fs.writeFileSync(FALLBACK_IMG_PATH, res.data);
    } catch (e) {
      return null;
    }
  }

  return fs.createReadStream(FALLBACK_IMG_PATH);
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const commandsMap = global.client.commands;

  const uniqueCommands = new Map();
  for (const [alias, cmd] of commandsMap.entries()) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd);
    }
  }

  if (args.length === 0) {
    // --- عرض قائمة الأوامر الرئيسية بزخارف محسّنة ---
    const grouped = {};
    for (const [name, cmd] of uniqueCommands.entries()) {
      const cat = cmd.config.commandCategory || "بدون فئة";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(name);
    }

    let msg = deco.title("قـائمـة الاوامــر") + "\n\n";
    
    msg += "✨ أنا ميرور، وكيلتك الذكية! يمكنك التحدث معي مباشرة دون أي بادئة (Prefix). ✨\n\n";

    for (const [category, list] of Object.entries(grouped)) {
      msg += deco.titleGolden(category) + "\n";
      
      let commandLines = [];
      for (let i = 0; i < list.length; i += 2) {
        const chunk = list.slice(i, i + 2);
        commandLines.push(deco.line(chunk.join("  ○  ")));
      }
      msg += commandLines.join('\n') + "\n";
      msg += deco.separatorDots + "\n\n";
    }

    msg += deco.title(`الأوامر الكلية: ${uniqueCommands.size}
اسم البوت: ${BOT_NAME}
المالك: ${DEVELOPER_NAME}
💡 للمزيد من المعلومات:
اكتب: مساعدة [اسم الأمر]`);

    try {
      const imageStream = await getImageStream();
      if (imageStream) {
        return api.sendMessage({ body: msg, attachment: imageStream }, threadID, messageID);
      }
    } catch (e) {
      // تجاهل الخطأ والمتابعة بدون صورة
    }
    
    return api.sendMessage(msg, threadID, messageID);
  }

  // --- عرض تفاصيل أمر معين ---
  const commandName = args.join(" ").trim().toLowerCase();
  const command = uniqueCommands.get(commandName) || 
    Array.from(uniqueCommands.values()).find(c => 
      c.config.aliases && c.config.aliases.includes(commandName)
    );

  if (!command) {
    return api.sendMessage(
      deco.error(`الأمر "${commandName}" غير موجود.\nاكتب: مساعدة\nللحصول على قائمة الأوامر الكاملة.`), 
      threadID, 
      messageID
    );
  }

  const permMap = { 
    0: "👥 عضو عادي", 
    1: "👮 أدمن المجموعة", 
    2: "👑 مطور البوت" 
  };
  
  const { name, hasPermission, commandCategory, description, usages, cooldowns, credits } = command.config;

  let details = deco.titleLuxury(`تفاصيل الأمر: ${name}`) + "\n\n";
  details += deco.lineStar(`الاسم: ${name}`) + "\n";
  details += deco.lineStar(`الفئة: ${commandCategory || "غير محددة"}`) + "\n";
  details += deco.lineStar(`الصلاحية: ${permMap[hasPermission] || "غير محددة"}`) + "\n";
  details += deco.lineStar(`وقت الانتظار: ${cooldowns || 5} ثوانٍ`) + "\n";
  details += deco.lineStar(`المطور: ${credits || DEVELOPER_NAME}`) + "\n\n";
  
  details += deco.titleGolden("الوصف") + "\n";
  details += deco.line(description || "لا يوجد وصف متاح") + "\n\n";
  
  details += deco.titleGolden("طريقة الاستخدام") + "\n";
  details += deco.box(usages || name) + "\n\n";
  
  details += deco.separatorLuxury + "\n";
  details += deco.center("شكراً لاستخدامك ميرور بوت! 🎉", 40);

  try {
    const imageStream = await getImageStream();
    if (imageStream) {
      return api.sendMessage({ body: details, attachment: imageStream }, threadID, messageID);
    }
  } catch (e) {
    // تجاهل الخطأ والمتابعة بدون صورة
  }
  
  return api.sendMessage(details, threadID, messageID);
};
