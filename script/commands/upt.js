const moment = require('moment-timezone');
const os = require('os');

module.exports = {
    config: {
        name: "ابتايم",
        credit: "Hakim Tracks",
        description: "عرض معلومات تفصيلية عن وقت التشغيل والاستضافة",
        commandCategory: "عـــامـة",
        cooldowns: 5
    },
    run: async ({ api, event }) => {
        // قياس وقت بدء الاستجابة (ping)
        const startTime = Date.now();

        // ---- معلومات وقت تشغيل البوت ----
        const uptimeSeconds = process.uptime();
        const uptimeHours = Math.floor(uptimeSeconds / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeSecs = Math.floor(uptimeSeconds % 60);
        const uptimeString = `${uptimeHours.toString().padStart(2, '0')}:${uptimeMinutes.toString().padStart(2, '0')}:${uptimeSecs.toString().padStart(2, '0')}`;

        // ---- معلومات النظام (الاستضافة) ----
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        const cpus = os.cpus();
        const cpuModel = cpus.length > 0 ? cpus[0].model : 'غير معروف';
        const cpuCores = cpus.length;
        const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(2); // GB
        const freeMem = (os.freemem() / (1024 ** 3)).toFixed(2); // GB
        const usedMem = (totalMem - freeMem).toFixed(2);
        const osUptime = os.uptime(); // ثوانٍ
        const osUptimeHours = Math.floor(osUptime / 3600);
        const osUptimeMinutes = Math.floor((osUptime % 3600) / 60);
        const osUptimeDays = Math.floor(osUptimeHours / 24);
        const osUptimeHoursLeft = osUptimeHours % 24;
        const osUptimeString = osUptimeDays > 0 
            ? `${osUptimeDays} يوم، ${osUptimeHoursLeft} ساعة، ${osUptimeMinutes} دقيقة` 
            : `${osUptimeHours} ساعة، ${osUptimeMinutes} دقيقة`;

        // ---- معلومات عملية Node.js ----
        const nodeVersion = process.version;
        const memoryUsage = process.memoryUsage();
        const rss = (memoryUsage.rss / (1024 ** 2)).toFixed(2); // ميغابايت
        const heapTotal = (memoryUsage.heapTotal / (1024 ** 2)).toFixed(2);
        const heapUsed = (memoryUsage.heapUsed / (1024 ** 2)).toFixed(2);

        // ---- وقت بدء التشغيل (تاريخ) ----
        const startupTime = new Date(Date.now() - uptimeSeconds * 1000);
        const formattedStartup = moment(startupTime).tz('Africa/Cairo').format('YYYY-MM-DD HH:mm:ss'); // يمكن تغيير المنطقة الزمنية

        // ---- حساب وقت الاستجابة (ping) ----
        const responseTime = Date.now() - startTime;

        // ---- تجميع الرسالة بشكل مزخرف وجذاب ----
        const replyMsg = `
  ❖  معلومات البوت  ❖

📆 وقت بدء التشغيل: ${formattedStartup}
⏱️ وقت تشغيل البوت: ${uptimeString}
⚡ سرعة الاستجابة: ${responseTime}ms

   معلومات الاستضافة:
  • اسم المضيف: ${hostname}
  • النظام: ${platform} (${arch})
  • المعالج: ${cpuModel} (${cpuCores} نواة)
  • الذاكرة الكلية: ${totalMem} GB
  • الذاكرة المستخدمة: ${usedMem} GB
  • الذاكرة الحرة: ${freeMem} GB
  • وقت تشغيل النظام: ${osUptimeString}

🛠️ معلومات عملية البوت:
  • إصدار Node.js: ${nodeVersion}
  • الذاكرة المستخدمة (RSS): ${rss} MB
  • الكومة الإجمالية: ${heapTotal} MB
  • الكومة المستخدمة: ${heapUsed} MB


    • Miror Bot •`;

        api.sendMessage(replyMsg, event.threadID, event.messageID);
    }
};