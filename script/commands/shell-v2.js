const fs = require("fs");
const path = require("path");
const axios = require("axios");
let currentDir = __dirname;

module.exports.config = {
  name: "شل",
  version: "2.0",
  hasPermssion: 2,
  credits: "Hakim Tracks",
  description: "أداة إدارية للتحكم في ملفات البوت",
  commandCategory: "الــمـطـور",
  usages: ".شيل [أمر] [معطيات]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args}) {
  const { senderID, threadID, messageID} = event;
  if (senderID!== "100003922506337") return api.sendMessage("❌ المطور فقط يقدر يستخدم الأمر", threadID, messageID);

  const cmd = args[0];
  const log = msg => api.sendMessage(msg, threadID, messageID);
  const file = name => path.join(currentDir, name);

  if (!cmd) return log(
    `🛠️ أوامر شيل:\n` +
    `• ls — عرض الملفات\n• get — عرض أو إرسال ملف\n• del — حذف\n• mkdir — إنشاء مجلد\n• rename — إعادة تسمية\n` +
    `• write — كتابة\n• cr — إنشاء ملف\n• cd — تغيير مجلد\n• info — تفاصيل ملف\n• search — بحث داخل ملف\n` +
    `• recent — أحدث الملفات\n• tree — عرض هيكل\n• edit — تعديل سطر\n• run — تنفيذ ملف\n• fetch — تحميل من رابط\n\n📁 ${currentDir}`
);

  try {
    switch (cmd) {
      case "ls": return log(fs.readdirSync(currentDir).join("\n"));

      case "get": {
        const f = file(args[1]);
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        return /\.(jpg|png|gif)$/.test(f)? api.sendMessage({ attachment: fs.createReadStream(f)}, threadID):
          log(fs.readFileSync(f, "utf8"));
}

      case "del": {
        const f = file(args[1]);
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        fs.unlinkSync(f); return log("🗑️ تم الحذف");
}

      case "mkdir": {
        const d = file(args[1]);
        if (fs.existsSync(d)) return log("⚠️ موجود مسبقًا");
        fs.mkdirSync(d); return log("📁 تم الإنشاء");
}

      case "rename": {
        const old = file(args[1]), neo = file(args[2]);
        if (!fs.existsSync(old)) return log("❌ الملف غير موجود");
        fs.renameSync(old, neo); return log("✏️ تم التسمية");
}

      case "write":
      case "cr": {
        const f = file(args[1]), content = args.slice(2).join(" ");
        fs.writeFileSync(f, content); return log(`📄 تم ${cmd === "cr"? "الإنشاء": "الكتابة"}`);
}

      case "cd": {
        const d = args[1];
        if (d === "..") currentDir = path.dirname(currentDir);
        else {
          const newDir = path.join(currentDir, d);
          if (!fs.existsSync(newDir) ||!fs.lstatSync(newDir).isDirectory()) return log("❌ المجلد غير موجود");
          currentDir = newDir;
}
        return log(`📁 المجلد الحالي:\n${currentDir}`);
}

      case "info": {
        const f = file(args[1]);
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        const s = fs.statSync(f);
        return log(`📄 ${args[1]}\n📦 الحجم: ${(s.size / 1024).toFixed(2)} KB\n🕒 تعديل: ${s.mtime.toLocaleString()}`);
}

      case "search": {
        const f = file(args[1]), keyword = args[2];
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        const lines = fs.readFileSync(f, "utf8").split("\n");
        const found = lines.filter(l => l.includes(keyword));
        return log(found.length? found.join("\n"): "❌ لا توجد نتائج");
}

      case "recent": {
        const start = parseInt(args[1]) || 0, end = parseInt(args[2]) || 10;
        const files = fs.readdirSync(currentDir).filter(f => f.endsWith(".js"));
        const stats = files.map(f => ({ name: f, time: fs.statSync(file(f)).mtime}))
.sort((a, b) => b.time - a.time)
.slice(start, end).map((f, i) => `${start + i + 1}. ${f.name} — ${f.time.toLocaleString()}`);
        return log(stats.join("\n"));
}

      case "tree": {
        const walk = dir => {
          const items = fs.readdirSync(dir);
          return items.map(i => {
            const full = path.join(dir, i);
            return fs.lstatSync(full).isDirectory()
? `📁 ${i}\n${walk(full).map(s => "  └─ " + s).join("\n")}`
: `📄 ${i}`;
}).join("\n");
};
        return log(walk(currentDir));
}

      case "edit": {
        const f = file(args[1]), line = parseInt(args[2]), text = args.slice(3).join(" ");
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        const lines = fs.readFileSync(f, "utf8").split("\n");
        if (line < 1 || line> lines.length) return log("❌ رقم السطر غير صالح");
        lines[line - 1] = text;
        fs.writeFileSync(f, lines.join("\n"));
        return log("✅ تم التعديل");
}

      case "run": {
        const f = file(args[1]);
        if (!fs.existsSync(f)) return log("❌ الملف غير موجود");
        require(f); return log("✅ تم تنفيذ الملف");
}

      case "fetch": {
        const url = args[1], name = args[2];
        const res = await axios.get(url, { responseType: "arraybuffer"});
        fs.writeFileSync(file(name), res.data);
        return log(`✅ تم تحميل الملف ${name}`);
}

      default: return log("❌ الأمر غير مدعوم");
}
} catch (err) {
    return log(`⚠️ خطأ:\n${err.message}`);
}
};
