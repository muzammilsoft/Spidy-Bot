/**
 * @name غارة
 * @version 1.0.0
 * @author Manus AI
 * @description نظام غارات جماعية: تعاون مع أصدقائك لهزيمة الزعماء العمالقة.
 */

const deco = require("../../utils/decorations");

module.exports.config = {
    name: "غارة",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام غارات جماعية لهزيمة الزعماء العمالقة.",
    commandCategory: "الــعــاب",
    usages: "غارة [انضمام/هجوم/حالي]",
    cooldowns: 5
};

// كائن لتخزين الغارات النشطة
if (!global.client.activeRaids) global.client.activeRaids = new Map();

const BOSSES = [
    { name: "التنين الأحمر", health: 50000, reward: 100000, exp: 5000, minLevel: 20 },
    { name: "العملاق الجليدي", health: 100000, reward: 250000, exp: 12000, minLevel: 50 },
    { name: "ملك الشياطين", health: 500000, reward: 1000000, exp: 50000, minLevel: 100 }
];

module.exports.run = async ({ api, event, args, userData, user }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    if (!user || !user.isRegistered) {
        return api.sendMessage(deco.error("يجب عليك التسجيل أولاً!"), threadID, messageID);
    }

    const dungeon = user.dungeon || { level: 1 };

    // --- 1. بدء غارة جديدة ---
    if (subCommand === "بدء") {
        if (global.client.activeRaids.has(threadID)) return api.sendMessage(deco.warning("هناك غارة نشطة بالفعل في هذا الجروب!"), threadID, messageID);

        const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
        if (dungeon.level < boss.minLevel) return api.sendMessage(deco.error(`تحتاج لمستوى ${boss.minLevel} لبدء هذه الغارة!`), threadID, messageID);

        global.client.activeRaids.set(threadID, {
            boss: { ...boss },
            participants: new Map(),
            startTime: Date.now()
        });

        let msg = deco.titlePremium("🔥 غارة جماعية بدأت! 🔥") + "\n\n";
        msg += deco.lineStar(`الزعيم: ${boss.name}`) + "\n";
        msg += deco.lineStar(`الصحة: ❤️ ${boss.health}`) + "\n";
        msg += deco.lineStar(`الجائزة: 💰 ${boss.reward}$`) + "\n\n";
        msg += deco.line("اكتب 'غارة انضمام' للمشاركة في القتال!");

        return api.sendMessage(msg, threadID, messageID);
    }

    // --- 2. انضمام للغارة ---
    if (subCommand === "انضمام") {
        if (!global.client.activeRaids.has(threadID)) return api.sendMessage(deco.warning("لا توجد غارة نشطة حالياً."), threadID, messageID);
        const raid = global.client.activeRaids.get(threadID);
        if (raid.participants.has(senderID)) return api.sendMessage(deco.warning("لقد انضممت بالفعل!"), threadID, messageID);

        raid.participants.set(senderID, { damage: 0, name: user.name });
        return api.sendMessage(deco.success(`✅ انضم ${user.name} للغارة!`), threadID, messageID);
    }

    // --- 3. هجوم على الزعيم ---
    if (subCommand === "هجوم") {
        if (!global.client.activeRaids.has(threadID)) return api.sendMessage(deco.warning("لا توجد غارة نشطة حالياً."), threadID, messageID);
        const raid = global.client.activeRaids.get(threadID);
        if (!raid.participants.has(senderID)) return api.sendMessage(deco.warning("يجب عليك الانضمام أولاً!"), threadID, messageID);

        const weaponPower = 100; // يمكن تطويره لجلب قوة السلاح من dungeon
        const damage = Math.floor(Math.random() * (weaponPower * 2)) + 50;
        
        raid.boss.health -= damage;
        const p = raid.participants.get(senderID);
        p.damage += damage;

        if (raid.boss.health <= 0) {
            let winMsg = deco.titlePremium(`🏆 تم هزيمة ${raid.boss.name}! 🏆`) + "\n\n";
            winMsg += deco.titleGolden("أعلى المهاجمين:") + "\n";
            
            const sorted = Array.from(raid.participants.entries()).sort((a, b) => b[1].damage - a[1].damage);
            
            for (const [id, data] of sorted) {
                const share = Math.floor((data.damage / raid.boss.reward) * raid.boss.reward); // توزيع الجائزة حسب الضرر
                const u = await userData.get(id);
                if (u) {
                    u.money += share;
                    await userData.set(id, { money: u.money });
                }
                winMsg += deco.listItem(`${data.name}: ${data.damage} ضرر | 💰 ${share}$`) + "\n";
            }

            global.client.activeRaids.delete(threadID);
            return api.sendMessage(winMsg, threadID, messageID);
        }

        return api.sendMessage(deco.info(`⚔️ ${user.name} هاجم الزعيم وألحق ${damage} ضرر!\n❤️ صحة الزعيم المتبقية: ${raid.boss.health}`), threadID, messageID);
    }

    // --- 4. حالة الغارة ---
    if (!subCommand || subCommand === "حالي") {
        if (!global.client.activeRaids.has(threadID)) return api.sendMessage(deco.warning("لا توجد غارة نشطة حالياً. اكتب 'غارة بدء'."), threadID, messageID);
        const raid = global.client.activeRaids.get(threadID);

        let msg = deco.titlePremium(`📊 حالة الغارة: ${raid.boss.name}`) + "\n\n";
        msg += deco.lineStar(`الصحة: ❤️ ${raid.boss.health}`) + "\n";
        msg += deco.lineStar(`المشاركون: ${raid.participants.size}`) + "\n\n";
        msg += deco.line("اكتب 'غارة هجوم' لإلحاق الضرر!");

        return api.sendMessage(msg, threadID, messageID);
    }
};
