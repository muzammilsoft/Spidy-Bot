/**
 * @name نظام فري فاير (Free Fire)
 * @version 2.0.0
 * @author Hakim Tracks (100% Power Mode)
 * @description نظام باتل رويال متكامل: شخصيات بمهارات، حيوانات أليفة، رتب، وقراند ماستر.
 */

const deco = require('../../utils/decorations');

module.exports.config = {
    name: "فري",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام فري فاير المتكامل (Free Fire System)",
    commandCategory: "الــعــاب",
    cooldowns: 5
};

const FF_ASSETS = {
    CHARACTERS: {
        "ألوك": { skill: "نبضة الحياة", effect: "استعادة الصحة بسرعة", price: 10000 },
        "كرونو": { skill: "المجال الزمني", effect: "حماية من الضرر", price: 10000 },
        "كيلي": { skill: "الركض السريع", effect: "زيادة سرعة الحركة", price: 5000 },
        "موكو": { skill: "عين الهكر", effect: "تحديد مكان الخصم", price: 5000 },
        "وكونج": { skill: "التمويه", effect: "تحول لشجيرة", price: 8000 }
    },
    PETS: ["باندا", "فالكو", "روكي", "مستر واغور"],
    WEAPONS: ["MP40", "M1887", "SCAR", "AK", "Groza", "AWM"],
    RANKS: ["برونز", "فضة", "ذهب", "بلاتين", "ماسي", "بطولي", "قراند ماستر"]
};

module.exports.run = async ({ api, event, args, userData, user, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // تهيئة بيانات فري فاير
    let ff = user.ff || {
        rank: "برونز",
        character: "كيلي",
        pet: "بدون حيوان",
        weapon: "SCAR",
        diamonds: 100,
        gold: 1000,
        level: 1,
        exp: 0,
        wins: 0,
        kills: 0,
        lastMatch: 0,
        inventory: ["كيلي", "SCAR"]
    };

    // استثناء المطور
    if (config.ADMINBOT.includes(senderID)) {
        ff.rank = "قراند ماستر (المطور)";
        ff.character = "ألوك";
        ff.pet = "مستر واغور";
        ff.diamonds = 999999;
        ff.gold = 999999;
        ff.level = 999;
    }

    // 1. عرض البروفايل
    if (!subCommand || subCommand === "حالي" || subCommand === "بروفايل") {
        let msg = deco.title(`🔥 ملف الناجي: ${user.nickname}`) + "\n\n";
        msg += deco.line(`الرتبة: [ ${ff.rank} ]`) + "\n";
        msg += deco.line(`الشخصية: 👤 ${ff.character}`) + "\n";
        msg += deco.line(`الحيوان الأليف: 🐾 ${ff.pet}`) + "\n";
        msg += deco.line(`السلاح: 🔫 ${ff.weapon}`) + "\n";
        msg += deco.line(`المستوى: ${ff.level} (XP: ${ff.exp}/${ff.level * 1200})`) + "\n";
        msg += deco.line(`الذهب: 💰 ${ff.gold} | جواهر: 💎 ${ff.diamonds}`) + "\n";
        msg += deco.line(`بوياه: 🏆 ${ff.wins} | القتلى: 💀 ${ff.kills}`) + "\n\n";
        msg += deco.progressBar(Math.floor((ff.exp / (ff.level * 1200)) * 100));
        return api.sendMessage(msg, threadID, messageID);
    }

    // 2. دخول مباراة
    if (subCommand === "مباراة" || subCommand === "لعب") {
        const now = Date.now();
        if (now - ff.lastMatch < 30000 && !config.ADMINBOT.includes(senderID)) {
            return api.sendMessage(deco.title("⏳ في الطائرة") + "\n\n" + deco.line(`انتظر ${Math.ceil((30000 - (now - ff.lastMatch)) / 1000)} ثانية قبل القفزة القادمة`), threadID, messageID);
        }

        let matchLog = deco.title("🪂 القفز في برمودا 🪂") + "\n\n";
        matchLog += deco.line(`الشخصية: ${ff.character}`) + "\n";
        matchLog += deco.line(`المهارة: ${FF_ASSETS.CHARACTERS[ff.character]?.skill || "لا يوجد"}`) + "\n\n";
        matchLog += deco.progressBar(30);

        api.sendMessage(matchLog, threadID, async (err, info) => {
            setTimeout(async () => {
                const kills = Math.floor(Math.random() * 15);
                const isBooyah = Math.random() < (0.15 + (ff.level * 0.006)) || config.ADMINBOT.includes(senderID);

                ff.kills += kills;
                ff.lastMatch = Date.now();

                if (isBooyah) {
                    ff.wins += 1;
                    const goldGain = 400 + (kills * 40);
                    const expGain = 250 + (kills * 15);
                    ff.gold += goldGain;
                    ff.exp += expGain;

                    if (ff.exp >= ff.level * 1200) {
                        ff.level += 1;
                        ff.exp = 0;
                    }

                    // ترقية الرتبة
                    const currentRankIndex = FF_ASSETS.RANKS.indexOf(ff.rank);
                    if (ff.wins % 4 === 0 && currentRankIndex < FF_ASSETS.RANKS.length - 1) {
                        ff.rank = FF_ASSETS.RANKS[currentRankIndex + 1];
                    }

                    let winMsg = deco.title("🏆 BOOYAH! 🏆") + "\n\n";
                    winMsg += deco.line(`انتصار ساحق في برمودا!`) + "\n";
                    winMsg += deco.line(`عدد القتلى: ${kills}`) + "\n";
                    winMsg += deco.line(`الذهب: +${goldGain} 💰`) + "\n";
                    winMsg += deco.line(`الخبرة: +${expGain} XP`) + "\n\n";
                    winMsg += deco.progressBar(100);
                    
                    await userData.set(senderID, { ff: ff });
                    api.sendMessage(winMsg, threadID, info.messageID);
                } else {
                    const goldGain = 100 + (kills * 10);
                    const expGain = 50 + (kills * 5);
                    ff.gold += goldGain;
                    ff.exp += expGain;

                    let loseMsg = deco.title("💀 تم القضاء عليك 💀") + "\n\n";
                    loseMsg += deco.line(`المركز: #${Math.floor(Math.random() * 40) + 10}`) + "\n";
                    loseMsg += deco.line(`عدد القتلى: ${kills}`) + "\n";
                    loseMsg += deco.line(`حصلت على: ${goldGain} ذهب`) + "\n\n";
                    loseMsg += deco.progressBar(100);
                    
                    await userData.set(senderID, { ff: ff });
                    api.sendMessage(loseMsg, threadID, info.messageID);
                }
            }, 3000);
        });
        return;
    }

    // 3. متجر الشخصيات
    if (subCommand === "شخصيات") {
        let charMsg = deco.title("👥 متجر الشخصيات 👥") + "\n\n";
        for (const [name, info] of Object.entries(FF_ASSETS.CHARACTERS)) {
            charMsg += deco.listItem(`${name}`) + "\n";
            charMsg += `   💰 السعر: ${info.price} ذهب | ✨ ${info.skill}\n`;
        }
        charMsg += "\n" + deco.line("للشراء: فري شراء [الاسم]");
        return api.sendMessage(charMsg, threadID, messageID);
    }

    // 4. شراء شخصية
    if (subCommand === "شراء") {
        const charName = args.slice(1).join(" ");
        const char = FF_ASSETS.CHARACTERS[charName];

        if (!char) return api.sendMessage("❌ هذه الشخصية غير متوفرة حالياً!", threadID, messageID);
        if (ff.inventory.includes(charName)) return api.sendMessage("❌ تملك هذه الشخصية بالفعل!", threadID, messageID);
        if (ff.gold < char.price) return api.sendMessage("❌ لا تملك الذهب الكافي!", threadID, messageID);

        ff.gold -= char.price;
        ff.character = charName;
        ff.inventory.push(charName);
        
        await userData.set(senderID, { ff: ff });
        return api.sendMessage(deco.title("👤 شخصية جديدة 👤") + "\n\n" + deco.line(`مبروك! اشتريت الشخصية ${charName} وتم اختيارها`), threadID, messageID);
    }

    // 5. قائمة المساعدة
    let helpMsg = deco.title("📜 دليل الناجين 📜") + "\n\n";
    helpMsg += deco.listItem("فري حالي : عرض بروفايلك") + "\n";
    helpMsg += deco.listItem("فري مباراة : بدء قتال في برمودا") + "\n";
    helpMsg += deco.listItem("فري شخصيات : عرض الشخصيات المتاحة") + "\n";
    helpMsg += deco.listItem("فري شراء : شراء شخصية جديدة") + "\n\n";
    helpMsg += deco.separator + "\n";
    helpMsg += "كن الناجي الأخير واحصل على البوياه!";
    
    return api.sendMessage(helpMsg, threadID, messageID);
};
