/**
 * @name نظام ديماس (Black Clover)
 * @version 2.0.1
 * @author Hakim Tracks (100% Power Mode)
 * @description نظام سحر متكامل: كتب سحر (غريموار)، فرق سحرية، مهارات، قتالات، وترقيات.
 */

// ==================== تعريف الديكور المدمج (بدون الحاجة لملف خارجي) ====================
const deco = {
    title: (text) => `【${text}】`,
    line: (text) => `➤ ${text}`,
    listItem: (text) => `• ${text}`,
    progressBar: (percent) => {
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
    },
    separator: '──────────────'
};

// ==================== إعدادات الأمر ====================
module.exports.config = {
    name: "ديماس",
    version: "2.0.1",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام ديماس المتكامل (Magic System)",
    commandCategory: "الــعــاب",
    cooldowns: 5
};

// ==================== بيانات العالم السحري ====================
const MAGIC_ASSETS = {
    GRIMOIRES: {
        "ثلاثي الأوراق": { chance: 0.7, multiplier: 1.5, description: "كتاب سحر عادي يحمل الأمل" },
        "رباعي الأوراق": { chance: 0.25, multiplier: 3.0, description: "كتاب سحر نادر يحمل الحظ" },
        "خماسي الأوراق": { chance: 0.05, multiplier: 6.0, description: "كتاب سحر يسكنه الشيطان" }
    },
    TYPES: ["النار", "الماء", "الرياح", "الأرض", "البرق", "الظلام", "النور", "مضاد السحر", "الزمن", "الدم"],
    SQUADS: ["الفجر الذهبي", "الثيران السوداء", "الأسود القرمزية", "النسور الفضية", "السرطانات الوردية", "الغزلان المائية"],
    RANKS: ["فارس سحر مبتدئ", "فارس سحر متوسط", "فارس سحر رفيع", "نائب قائد", "قائد فرقة", "إمبراطور السحر"]
};

// ==================== الدالة الرئيسية ====================
module.exports.run = async ({ api, event, args, userData, user, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // تهيئة بيانات ديماس إذا لم تكن موجودة
    if (!user.dimas) {
        user.dimas = {
            rank: "فارس سحر مبتدئ",
            squad: "بدون فرقة",
            mana: 100,
            maxMana: 100,
            grimoire: "بدون كتاب",
            magicType: "غير معروف",
            wins: 0,
            losses: 0,
            level: 1,
            exp: 0,
            spells: [],
            lastFight: 0,
            items: []
        };
    }
    let dimas = user.dimas;

    // استثناء المطور (صلاحيات كاملة)
    if (config.ADMINBOT && config.ADMINBOT.includes(senderID)) {
        dimas.rank = "إمبراطور السحر (المطور)";
        dimas.squad = "الثيران السوداء";
        dimas.grimoire = "خماسي الأوراق";
        dimas.magicType = "مضاد السحر";
        dimas.mana = 999999;
        dimas.maxMana = 999999;
        dimas.level = 999;
    }

    // ==================== 1. عرض الحالة السحرية ====================
    if (!subCommand || subCommand === "حالي" || subCommand === "بروفايل") {
        let msg = deco.title(`🔮 فارس السحر: ${user.nickname || user.name || senderID}`) + "\n\n";
        msg += deco.line(`الرتبة: [ ${dimas.rank} ]`) + "\n";
        msg += deco.line(`الفرقة: ${dimas.squad}`) + "\n";
        msg += deco.line(`الكتاب: ${dimas.grimoire}`) + "\n";
        msg += deco.line(`نوع السحر: ${dimas.magicType}`) + "\n";
        msg += deco.line(`المانا: 💧 ${dimas.mana}/${dimas.maxMana}`) + "\n";
        msg += deco.line(`المستوى: ${dimas.level} (XP: ${dimas.exp}/${dimas.level * 1000})`) + "\n";
        msg += deco.line(`الانتصارات: 🏆 ${dimas.wins} | الهزائم: 💀 ${dimas.losses}`) + "\n\n";
        const percent = Math.floor((dimas.exp / (dimas.level * 1000)) * 100);
        msg += deco.progressBar(percent);
        return api.sendMessage(msg, threadID, messageID);
    }

    // ==================== 2. الحصول على الغريموار (بداية الرحلة) ====================
    if (subCommand === "بداية" || subCommand === "تسجيل") {
        if (dimas.grimoire !== "بدون كتاب") {
            return api.sendMessage("❌ تملك كتاب سحر بالفعل!", threadID, messageID);
        }
        
        const rand = Math.random();
        let grimoire = "ثلاثي الأوراق";
        if (rand < 0.05) grimoire = "خماسي الأوراق";
        else if (rand < 0.3) grimoire = "رباعي الأوراق";
        
        dimas.grimoire = grimoire;
        dimas.magicType = MAGIC_ASSETS.TYPES[Math.floor(Math.random() * MAGIC_ASSETS.TYPES.length)];
        dimas.spells.push(`هجوم ${dimas.magicType} الأساسي`);
        
        await userData.set(senderID, { dimas: dimas });
        
        let startMsg = deco.title("✨ حفل اختيار الغريموار ✨") + "\n\n";
        startMsg += deco.line(`لقد طار إليك: ${grimoire}`) + "\n";
        startMsg += deco.line(`نوع سحرك المكتشف: [ ${dimas.magicType} ]`) + "\n";
        startMsg += deco.line("رحلتك لتصبح إمبراطور السحر تبدأ الآن!") + "\n\n";
        startMsg += deco.progressBar(100);
        return api.sendMessage(startMsg, threadID, messageID);
    }

    // ==================== 3. الانضمام لفرقة ====================
    if (subCommand === "فرقة" || subCommand === "انضمام") {
        if (dimas.squad !== "بدون فرقة") {
            return api.sendMessage(`❌ أنت تنتمي بالفعل لفرقة ${dimas.squad}!`, threadID, messageID);
        }
        
        const squad = MAGIC_ASSETS.SQUADS[Math.floor(Math.random() * MAGIC_ASSETS.SQUADS.length)];
        dimas.squad = squad;
        
        await userData.set(senderID, { dimas: dimas });
        return api.sendMessage(
            deco.title("🏰 اختبار القبول 🏰") + "\n\n" +
            deco.line(`تم قبولك في فرقة: [ ${squad} ]`) + "\n" +
            deco.line("أثبت جدارتك لرفع شأن فرقتك!"),
            threadID,
            messageID
        );
    }

    // ==================== 4. قتال السحرة (PVP أو ضد وحوش) ====================
    if (subCommand === "قتال" || subCommand === "مهمة") {
        const now = Date.now();
        if (now - dimas.lastFight < 20000 && !(config.ADMINBOT && config.ADMINBOT.includes(senderID))) {
            return api.sendMessage(
                deco.title("⏳ استعادة مانا") + "\n\n" +
                deco.line(`انتظر ${Math.ceil((20000 - (now - dimas.lastFight)) / 1000)} ثانية`),
                threadID,
                messageID
            );
        }

        if (dimas.grimoire === "بدون كتاب") {
            return api.sendMessage("❌ يجب أن تحصل على كتاب سحر أولاً! (استخدم: ديماس بداية)", threadID, messageID);
        }

        const enemies = ["ساحر متمرد", "شيطان رتبة دنيا", "عضو عين الشمس", "فارس سحر خائن"]; // تم التصحيح
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        
        let fightLog = deco.title("🔮 معركة سحرية 🔮") + "\n\n";
        fightLog += deco.line(`الخصم: ${enemy}`) + "\n";
        fightLog += deco.line(`تعويذتك: ${dimas.spells[0] || "تعويذة عادية"}`) + "\n\n";
        fightLog += deco.progressBar(50);

        api.sendMessage(fightLog, threadID, async (err, info) => {
            setTimeout(async () => {
                const multiplier = MAGIC_ASSETS.GRIMOIRES[dimas.grimoire]?.multiplier || 1;
                const winChance = 0.5 + (dimas.level * 0.01) + (multiplier * 0.05);
                const isWin = Math.random() < winChance || (config.ADMINBOT && config.ADMINBOT.includes(senderID));

                if (isWin) {
                    dimas.wins += 1;
                    const expGain = 200 + (dimas.level * 50);
                    const moneyGain = 500 + (dimas.level * 100);
                    dimas.exp += expGain;
                    dimas.lastFight = Date.now();

                    // ترقية المستوى إذا تجاوز الخبرة
                    while (dimas.exp >= dimas.level * 1000) {
                        dimas.level += 1;
                        dimas.exp -= dimas.level * 1000; // يحتفظ بالباقي
                        dimas.maxMana += 50;
                        dimas.mana = dimas.maxMana;
                    }

                    let winMsg = deco.title("💥 انتصار سحري 💥") + "\n\n";
                    winMsg += deco.line(`هزمت ${enemy}`) + "\n";
                    winMsg += deco.line(`الذهب: +${moneyGain} 💰`) + "\n";
                    winMsg += deco.line(`الخبرة: +${expGain} XP`) + "\n\n";
                    winMsg += deco.progressBar(100);
                    
                    // تحديث البيانات
                    await userData.set(senderID, { 
                        money: (user.money || 0) + moneyGain, 
                        dimas: dimas 
                    });
                    api.sendMessage(winMsg, threadID, info.messageID);
                } else {
                    dimas.losses += 1;
                    dimas.lastFight = Date.now();
                    await userData.set(senderID, { dimas: dimas });
                    api.sendMessage(
                        deco.title("🌑 فشل التعويذة 🌑") + "\n\n" +
                        deco.line(`لقد سحقك ${enemy}!`),
                        threadID,
                        info.messageID
                    );
                }
            }, 3000); // محاكاة وقت المعركة
        });
        return;
    }

    // ==================== 5. ترقية الرتبة ====================
    if (subCommand === "ترقية") {
        const currentRankIndex = MAGIC_ASSETS.RANKS.indexOf(dimas.rank);
        const nextRank = MAGIC_ASSETS.RANKS[currentRankIndex + 1];
        
        if (!nextRank) {
            return api.sendMessage("🏆 لقد وصلت لقمة العالم السحري!", threadID, messageID);
        }
        
        const reqWins = (currentRankIndex + 1) * 20;
        if (dimas.wins < reqWins) {
            return api.sendMessage(`❌ تحتاج لـ ${reqWins} انتصار للترقية إلى ${nextRank}!`, threadID, messageID);
        }

        dimas.rank = nextRank;
        await userData.set(senderID, { dimas: dimas });
        return api.sendMessage(
            deco.title("⭐ ترقية ملكية ⭐") + "\n\n" +
            deco.line(`مبروك! رتبتك الجديدة: [ ${nextRank} ]`),
            threadID,
            messageID
        );
    }

    // ==================== 6. قائمة المساعدة ====================
    let helpMsg = deco.title("📜 دليل عالم السحر 📜") + "\n\n";
    helpMsg += deco.listItem("ديماس حالي : عرض ملفك السحري") + "\n";
    helpMsg += deco.listItem("ديماس بداية : الحصول على الغريموار") + "\n";
    helpMsg += deco.listItem("ديماس فرقة : الانضمام لفرقة سحرية") + "\n";
    helpMsg += deco.listItem("ديماس قتال : خوض معركة سحرية") + "\n";
    helpMsg += deco.listItem("ديماس ترقية : رفع رتبتك السحرية") + "\n\n";
    helpMsg += deco.separator + "\n";
    helpMsg += "تجاوز حدودك هنا والآن!";
    
    return api.sendMessage(helpMsg, threadID, messageID);
};