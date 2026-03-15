const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "اوامر",
  version: "1.0.2",
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
  // لو الصورة موجودة في img نستخدمها
  if (fs.existsSync(LOCAL_IMG_PATH)) {
    return fs.createReadStream(LOCAL_IMG_PATH);
}

  // لو ما موجودة نستخدم الصورة الاحتياطية
  fs.ensureDirSync(path.dirname(FALLBACK_IMG_PATH));
  if (!fs.existsSync(FALLBACK_IMG_PATH)) {
    const res = await axios.get(IMAGE_URL, { responseType: "arraybuffer"});
    fs.writeFileSync(FALLBACK_IMG_PATH, res.data);
}

  return fs.createReadStream(FALLBACK_IMG_PATH);
}

// ... (كل الكود قبل دالة run يبقى كما هو) ...

module.exports.run = async function({ api, event, args }) {
  const { threadID } = event;
  const commandsMap = global.client.commands;

  const uniqueCommands = new Map();
  for (const [alias, cmd] of commandsMap.entries()) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd);
    }
  }

  if (args.length === 0) {
    // --- عرض قائمة الأوامر بنفس الهيكل مع زخارف محسنة ---
    const grouped = {};
    for (const [name, cmd] of uniqueCommands.entries()) {
      const cat = cmd.config.commandCategory || "بدون فئة";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(name);
    }

    // --- زخارف جديدة وأنيقة ---
    let msg = ``;
    msg += `╮───────∙⋆⋅ ※ ⋅⋆∙───────╭\n`; 
    msg += `    قـــائــمــة الاوامـــــر\n`; 
    msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────╰\n\n`; 
    for (const [category, list] of Object.entries(grouped)) {
      // --- بداية زخرفة الفئة ---
      msg += `╮──────∙⋆⋅「 ${category} 」\n`;
      
      let commandLines = [];
      for (let i = 0; i < list.length; i += 3) {
        const chunk = list.slice(i, i + 3);
        // استخدام رمز "›" أنيق ومسافات للمحاذاة
        commandLines.push("│ › " + chunk.join('  ›  '));
      }
      msg += commandLines.join('\n') + '\n';
      
      // --- نهاية زخرفة الفئة ---
      msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────◈\n\n`;
    }

    // --- قسم المعلومات السفلية ---
    msg += `╮───────∙⋆⋅ ※ ⋅⋆∙───────◈\n`;
    msg += `│ الاوامــر : ${uniqueCommands.size}\n`;
    msg += `│ اســم الــبــوت : ${BOT_NAME}\n`;
    msg += `│ الــمــالــلك : ${DEVELOPER_NAME}\n`;
    msg += `│ اسـتـخــدم : اوامر [اسم الامر] `; 
    msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────◈\n`;

    const imageStream = await getImageStream();
    return api.sendMessage({ body: msg, attachment: imageStream }, threadID);
  }

  // --- عرض تفاصيل أمر معين (بزخرفة متناسقة) ---
  const commandName = args.join(" ").trim().toLowerCase();
  const command = uniqueCommands.get(commandName) || Array.from(uniqueCommands.values()).find(c => c.config.aliases && c.config.aliases.includes(commandName));

  if (!command) {
    return api.sendMessage(`❌ الأمر "${commandName}" غير موجود.`, threadID);
  }

  const permMap = { 0: "عضو", 1: "أدمن المجموعة", 2: "مطور البوت" };
  const { name, hasPermission, commandCategory, description, usages, cooldowns, credits } = command.config;

  const details = `╮─────∙⋆⋅「 تفاصيل الأمر 」⋅⋆∙─────╭
│
│  ◈ الاســم : ${name}
│  ◈ الصلاحية : ${permMap[hasPermission] || "غير محددة"}
│  ◈ الفئــة : ${commandCategory || "غير محددة"}
│
│  ◈ الوصــف : ${description || "لا يوجد وصف"}
│  ◈ الاستخدام : ${usages || name}
│
│  ◈ الـمـدة : ${cooldowns || 5} ثوانٍ
│  ◈ المطــور : ${DEVELOPER_NAME}
│
╯───────∙⋆⋅ ※ ⋅⋆∙───────╰`;

  const imageStream = await getImageStream();
  return api.sendMessage({ body: details, attachment: imageStream }, threadID);
};

