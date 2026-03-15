/**
 * @name نظام ياكوزا (Yakuza)
 * @version 2.0.0
 * @author Manus AI (100% Power Mode)
 * @description نظام عصابات متكامل: سيطرة على مناطق، تجارة غير مشروعة، أسلحة، قتالات عصابات، وترقيات.
 */

const deco = require('../../utils/decorations');

module.exports.config = {
    name: "ياكوزا",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام ياكوزا المتكامل (Gang System)",
    commandCategory: "عـــامـة",
    cooldowns: 5
};

const YAKUZA_ASSETS = {
    RANKS: ["عضو جديد", "مقاتل شوارع", "جابي ديون", "ملازم عصابة", "كابتن", "أوياي-بون (الزعيم)"],
    TERRITORIES: ["شينجوكو", "شيبويا", "روبونجي", "أكيهابارا", "غينزا", "يوكوهاما"],
    WEAPONS: {
        "مضرب بيسبول": { price: 1000, power: 10, rank: "عضو جديد" },
        "سكين تانتو": { price: 5000, power: 30, rank: "مقاتل شوارع" },
        "مسدس جلوك": { price: 20000, power: 80, rank: "جابي ديون" },
        "كاتانا": { price: 100000, power: 250, rank: "ملازم عصابة" },
        "رشاش AK-47": { price: 500000, power: 700, rank: "كابتن" },
        "نصل التنين الذهبي": { price: 2000000, power: 2000, rank: "أوياي-بون" }
    },
    JOBS: [
        { name: "جمع الإتاوات", reward: [500, 2000], risk: 0.1, exp: 50 },
        { name: "حماية ملهى ليلي", reward: [2000, 5000], risk: 0.2, exp: 120 },
        { name: "تهريب بضائع", reward: [10000, 30000], risk: 0.4, exp: 350 },
        { name: "اغتيال هدف", reward: [50000, 150000], risk: 0.6, exp: 800 }
    ]
};

module.exports.run = async ({ api, event, args, userData, user, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // تهيئة بيانات الياكوزا
    let yakuza = user.yakuza || {
        rank: "عضو جديد",
        respect: 0,
        territory: "بدون منطقة",
        weapon: "مضرب بيسبول",
        inventory: ["مضرب بيسبول"],
        money: 0,
        level: 1,
        exp: 0,
        lastJob: 0,
        kills: 0,
        wins: 0,
        losses: 0
    };

    // استثناء المطور
    if (config.ADMINBOT.includes(senderID)) {
        yakuza.rank = "أوياي-بون (المطور)";
        yakuza.respect = 999999;
        yakuza.weapon = "نصل التنين الذهبي";
        yakuza.level = 999;
    }

    // 1. عرض الملف الشخصي للياكوزا
    if (!subCommand || subCommand === "حالي" || subCommand === "بروفايل") {
        let msg = deco.title(`🐉 ملف الياكوزا: ${user.nickname}`) + "\n\n";
        msg += deco.line(`الرتبة: [ ${yakuza.rank} ]`) + "\n";
        msg += deco.line(`الاحترام: ⭐ ${yakuza.respect}`) + "\n";
        msg += deco.line(`المنطقة: 🏙️ ${yakuza.territory}`) + "\n";
        msg += deco.line(`السلاح: ⚔️ ${yakuza.weapon}`) + "\n";
        msg += deco.line(`المستوى: ${yakuza.level} (XP: ${yakuza.exp}/${yakuza.level * 2000})`) + "\n";
        msg += deco.line(`الانتصارات: 🏆 ${yakuza.wins} | القتلى: 💀 ${yakuza.kills}`) + "\n\n";
        msg += deco.progressBar(Math.floor((yakuza.exp / (yakuza.level * 2000)) * 100));
        return api.sendMessage(msg, threadID, messageID);
    }

    // 2. القيام بعمل (مهمة)
    if (subCommand === "عمل" || subCommand === "مهمة") {
        const now = Date.now();
        if (now - yakuza.lastJob < 30000 && !config.ADMINBOT.includes(senderID)) {
            return api.sendMessage(deco.title("⏳ مطاردة الشرطة") + "\n\n" + deco.line(`انتظر ${Math.ceil((30000 - (now - yakuza.lastJob)) / 1000)} ثانية للاختباء`), threadID, messageID);
        }

        const job = YAKUZA_ASSETS.JOBS[Math.floor(Math.random() * YAKUZA_ASSETS.JOBS.length)];
        
        let jobLog = deco.title("🔫 تنفيذ عملية 🔫") + "\n\n";
        jobLog += deco.line(`العملية: ${job.name}`) + "\n";
        jobLog += deco.line(`الخطر: ${job.risk * 100}%`) + "\n\n";
        jobLog += deco.progressBar(40);

        api.sendMessage(jobLog, threadID, async (err, info) => {
            setTimeout(async () => {
                const isSuccess = Math.random() > job.risk || config.ADMINBOT.includes(senderID);

                if (isSuccess) {
                    const moneyGain = Math.floor(Math.random() * (job.reward[1] - job.reward[0])) + job.reward[0];
                    const expGain = job.exp;
                    const respectGain = Math.floor(job.exp / 10);

                    yakuza.money += moneyGain;
                    yakuza.exp += expGain;
                    yakuza.respect += respectGain;
                    yakuza.lastJob = Date.now();
                    yakuza.wins += 1;

                    if (yakuza.exp >= yakuza.level * 2000) {
                        yakuza.level += 1;
                        yakuza.exp = 0;
                    }

                    let winMsg = deco.title("💰 نجاح العملية 💰") + "\n\n";
                    winMsg += deco.line(`تمت المهمة بنجاح`) + "\n";
                    winMsg += deco.line(`الربح: +${moneyGain} 💰`) + "\n";
                    winMsg += deco.line(`الاحترام: +${respectGain} ⭐`) + "\n";
                    winMsg += deco.line(`الخبرة: +${expGain} XP`) + "\n\n";
                    winMsg += deco.progressBar(100);
                    
                    await userData.set(senderID, { money: (user.money || 0) + moneyGain, yakuza: yakuza });
                    api.sendMessage(winMsg, threadID, info.messageID);
                } else {
                    const fine = Math.floor(yakuza.money * 0.1);
                    yakuza.money -= fine;
                    yakuza.lastJob = Date.now();
                    yakuza.losses += 1;
                    
                    await userData.set(senderID, { yakuza: yakuza });
                    api.sendMessage(deco.title("🚓 مداهمة 🚓") + "\n\n" + deco.line(`فشلت العملية وتمت مداهمتك!`) + "\n" + deco.line(`خسرت: ${fine} 💰 كغرامة`), threadID, info.messageID);
                }
            }, 3000);
        });
        return;
    }

    // 3. السيطرة على منطقة
    if (subCommand === "سيطرة") {
        const territory = args.slice(1).join(" ");
        if (!YAKUZA_ASSETS.TERRITORIES.includes(territory)) {
            let terrMsg = deco.title("🏙️ خريطة المناطق 🏙️") + "\n\n";
            YAKUZA_ASSETS.TERRITORIES.forEach(t => terrMsg += deco.listItem(t) + "\n");
            terrMsg += "\n" + deco.line("للسيطرة: ياكوزا سيطرة [اسم المنطقة]");
            return api.sendMessage(terrMsg, threadID, messageID);
        }

        if (yakuza.respect < 500) return api.sendMessage("❌ احترامك منخفض جداً للسيطرة على مناطق!", threadID, messageID);
        
        yakuza.territory = territory;
        yakuza.respect += 100;
        await userData.set(senderID, { yakuza: yakuza });
        return api.sendMessage(deco.title("🚩 منطقة جديدة 🚩") + "\n\n" + deco.line(`لقد فرضت سيطرتك على: [ ${territory} ]`), threadID, messageID);
    }

    // 4. المتجر السوداء
    if (subCommand === "سوق") {
        let shopMsg = deco.title("🔞 السوق السوداء 🔞") + "\n\n";
        for (const [name, info] of Object.entries(YAKUZA_ASSETS.WEAPONS)) {
            shopMsg += deco.listItem(`${name}`) + "\n";
            shopMsg += `   💰 السعر: ${info.price} | ⚔️ القوة: ${info.power}\n`;
        }
        shopMsg += "\n" + deco.line("للشراء: ياكوزا شراء [اسم السلاح]");
        return api.sendMessage(shopMsg, threadID, messageID);
    }

    // 5. شراء سلاح
    if (subCommand === "شراء") {
        const weaponName = args.slice(1).join(" ");
        const weapon = YAKUZA_ASSETS.WEAPONS[weaponName];

        if (!weapon) return api.sendMessage("❌ هذا السلاح غير متاح في السوق السوداء!", threadID, messageID);
        if ((user.money || 0) < weapon.price) return api.sendMessage("❌ لا تملك الذهب الكافي!", threadID, messageID);
        
        yakuza.weapon = weaponName;
        yakuza.inventory.push(weaponName);
        
        await userData.set(senderID, { money: (user.money || 0) - weapon.price, yakuza: yakuza });
        return api.sendMessage(deco.title("🔫 تسليح جديد 🔫") + "\n\n" + deco.line(`مبروك! اشتريت ${weaponName} بنجاح`), threadID, messageID);
    }

    // 6. قائمة المساعدة
    let helpMsg = deco.title("📜 قوانين الياكوزا 📜") + "\n\n";
    helpMsg += deco.listItem("ياكوزا حالي : عرض بروفايلك الإجرامي") + "\n";
    helpMsg += deco.listItem("ياكوزا عمل : تنفيذ عملية إجرامية") + "\n";
    helpMsg += deco.listItem("ياكوزا سيطرة : فرض السيطرة على منطقة") + "\n";
    helpMsg += deco.listItem("ياكوزا سوق : دخول السوق السوداء") + "\n";
    helpMsg += deco.listItem("ياكوزا شراء : شراء أسلحة متطورة") + "\n\n";
    helpMsg += deco.separator + "\n";
    helpMsg += "الولاء هو كل شيء في هذه العائلة!";
    
    return api.sendMessage(helpMsg, threadID, messageID);
};
