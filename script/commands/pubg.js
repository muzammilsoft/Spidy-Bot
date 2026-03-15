/**
 * @name نظام ببجي (PUBG Mobile)
 * @version 2.0.0
 * @author Manus AI (100% Power Mode)
 * @description نظام باتل رويال متكامل: خرائط، أسلحة، دروع، رتب، قتالات، وعشاء الدجاج.
 */

const deco = require('../../utils/decorations');

module.exports.config = {
    name: "ببجي",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام ببجي المتكامل (Battle Royale System)",
    commandCategory: "الــعــاب",
    cooldowns: 5
};

const PUBG_ASSETS = {
    MAPS: ["إرنغل", "ميرامار", "سانهوك", "فيكندي", "ليفيك", "كاراكين"],
    WEAPONS: {
        "M416": { damage: 41, ammo: "5.56mm", type: "AR" },
        "AKM": { damage: 47, ammo: "7.62mm", type: "AR" },
        "AWM": { damage: 120, ammo: ".300 Magnum", type: "Sniper" },
        "M24": { damage: 79, ammo: "7.62mm", type: "Sniper" },
        "UZI": { damage: 26, ammo: "9mm", type: "SMG" },
        "Groza": { damage: 47, ammo: "7.62mm", type: "AR (Airdrop)" }
    },
    ARMOR: ["بدون درع", "خوذة لفل 1", "خوذة لفل 2", "خوذة لفل 3", "درع لفل 1", "درع لفل 2", "درع لفل 3"],
    RANKS: ["برونز", "سيلفر", "جولد", "بلاتينيوم", "ماسة", "تاج", "ورقة رابحة", "غازي"]
};

module.exports.run = async ({ api, event, args, userData, user, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // تهيئة بيانات ببجي
    let pubg = user.pubg || {
        rank: "برونز",
        kills: 0,
        wins: 0,
        matches: 0,
        weapon: "M416",
        armor: "بدون درع",
        level: 1,
        exp: 0,
        lastMatch: 0,
        bp: 1000,
        inventory: ["M416", "بدون درع"]
    };

    // استثناء المطور
    if (config.ADMINBOT.includes(senderID)) {
        pubg.rank = "غازي (المطور)";
        pubg.weapon = "AWM";
        pubg.armor = "خوذة لفل 3 + درع لفل 3";
        pubg.level = 999;
        pubg.kills = 999999;
        pubg.wins = 999999;
    }

    // 1. عرض الملف الشخصي لببجي
    if (!subCommand || subCommand === "حالي" || subCommand === "بروفايل") {
        let msg = deco.title(`🔫 ملف اللاعب: ${user.nickname}`) + "\n\n";
        msg += deco.line(`الرتبة: [ ${pubg.rank} ]`) + "\n";
        msg += deco.line(`السلاح الأساسي: ⚔️ ${pubg.weapon}`) + "\n";
        msg += deco.line(`المعدات: 🛡️ ${pubg.armor}`) + "\n";
        msg += deco.line(`المستوى: ${pubg.level} (XP: ${pubg.exp}/${pubg.level * 1500})`) + "\n";
        msg += deco.line(`الانتصارات: 🍗 ${pubg.wins} | القتلى: 💀 ${pubg.kills}`) + "\n";
        msg += deco.line(`عملات BP: 💰 ${pubg.bp}`) + "\n\n";
        msg += deco.progressBar(Math.floor((pubg.exp / (pubg.level * 1500)) * 100));
        return api.sendMessage(msg, threadID, messageID);
    }

    // 2. بدء مباراة
    if (subCommand === "مباراة" || subCommand === "لعب") {
        const now = Date.now();
        if (now - pubg.lastMatch < 30000 && !config.ADMINBOT.includes(senderID)) {
            return api.sendMessage(deco.title("⏳ في ساحة التدريب") + "\n\n" + deco.line(`انتظر ${Math.ceil((30000 - (now - pubg.lastMatch)) / 1000)} ثانية قبل المباراة القادمة`), threadID, messageID);
        }

        const map = PUBG_ASSETS.MAPS[Math.floor(Math.random() * PUBG_ASSETS.MAPS.length)];
        
        let matchLog = deco.title("✈️ الهبوط في " + map + " ✈️") + "\n\n";
        matchLog += deco.line(`سلاحك: ${pubg.weapon}`) + "\n";
        matchLog += deco.line(`معداتك: ${pubg.armor}`) + "\n\n";
        matchLog += deco.progressBar(20);

        api.sendMessage(matchLog, threadID, async (err, info) => {
            setTimeout(async () => {
                const kills = Math.floor(Math.random() * 12);
                const win = Math.random() < (0.2 + (pubg.level * 0.005)) || config.ADMINBOT.includes(senderID);

                pubg.kills += kills;
                pubg.matches += 1;
                pubg.lastMatch = Date.now();

                if (win) {
                    pubg.wins += 1;
                    const bpGain = 500 + (kills * 50);
                    const expGain = 300 + (kills * 20);
                    pubg.bp += bpGain;
                    pubg.exp += expGain;

                    if (pubg.exp >= pubg.level * 1500) {
                        pubg.level += 1;
                        pubg.exp = 0;
                    }

                    // ترقية الرتبة
                    const currentRankIndex = PUBG_ASSETS.RANKS.indexOf(pubg.rank);
                    if (pubg.wins % 5 === 0 && currentRankIndex < PUBG_ASSETS.RANKS.length - 1) {
                        pubg.rank = PUBG_ASSETS.RANKS[currentRankIndex + 1];
                    }

                    let winMsg = deco.title("🍗 Winner Winner 🍗") + "\n\n";
                    winMsg += deco.line(`عشاء الدجاج في ${map}!`) + "\n";
                    winMsg += deco.line(`عدد القتلى: ${kills}`) + "\n";
                    winMsg += deco.line(`عملات BP: +${bpGain} 💰`) + "\n";
                    winMsg += deco.line(`الخبرة: +${expGain} XP`) + "\n\n";
                    winMsg += deco.progressBar(100);
                    
                    await userData.set(senderID, { pubg: pubg });
                    api.sendMessage(winMsg, threadID, info.messageID);
                } else {
                    const bpGain = 100 + (kills * 20);
                    const expGain = 50 + (kills * 10);
                    pubg.bp += bpGain;
                    pubg.exp += expGain;

                    let loseMsg = deco.title("💀 قُتلت في الميدان 💀") + "\n\n";
                    loseMsg += deco.line(`المركز: #${Math.floor(Math.random() * 90) + 10}`) + "\n";
                    loseMsg += deco.line(`عدد القتلى: ${kills}`) + "\n";
                    loseMsg += deco.line(`حصلت على: ${bpGain} BP`) + "\n\n";
                    loseMsg += deco.progressBar(100);
                    
                    await userData.set(senderID, { pubg: pubg });
                    api.sendMessage(loseMsg, threadID, info.messageID);
                }
            }, 4000);
        });
        return;
    }

    // 3. المتجر (شراء سكنات ومعدات)
    if (subCommand === "متجر" || subCommand === "سوق") {
        let shopMsg = deco.title("🛒 متجر ببجي 🛒") + "\n\n";
        shopMsg += deco.listItem("خوذة لفل 3 : 5000 BP") + "\n";
        shopMsg += deco.listItem("درع لفل 3 : 5000 BP") + "\n";
        shopMsg += deco.listItem("AWM : 10000 BP") + "\n";
        shopMsg += deco.listItem("Groza : 8000 BP") + "\n\n";
        shopMsg += deco.line("للشراء: ببجي شراء [الاسم]");
        return api.sendMessage(shopMsg, threadID, messageID);
    }

    // 4. شراء من المتجر
    if (subCommand === "شراء") {
        const item = args.slice(1).join(" ");
        let price = 0;
        if (item === "خوذة لفل 3") price = 5000;
        else if (item === "درع لفل 3") price = 5000;
        else if (item === "AWM") price = 10000;
        else if (item === "Groza") price = 8000;
        else return api.sendMessage("❌ هذا المنتج غير متاح في المتجر!", threadID, messageID);

        if (pubg.bp < price) return api.sendMessage("❌ لا تملك BP كافي!", threadID, messageID);

        pubg.bp -= price;
        if (item.includes("خوذة") || item.includes("درع")) pubg.armor = item;
        else pubg.weapon = item;
        
        await userData.set(senderID, { pubg: pubg });
        return api.sendMessage(deco.title("📦 صندوق إمدادات 📦") + "\n\n" + deco.line(`مبروك! حصلت على ${item}`), threadID, messageID);
    }

    // 5. قائمة المساعدة
    let helpMsg = deco.title("📜 دليل ساحات المعركة 📜") + "\n\n";
    helpMsg += deco.listItem("ببجي حالي : عرض بروفايلك") + "\n";
    helpMsg += deco.listItem("ببجي مباراة : الهبوط في خريطة") + "\n";
    helpMsg += deco.listItem("ببجي متجر : شراء معدات وأسلحة") + "\n";
    helpMsg += deco.listItem("ببجي شراء : شراء منتج من المتجر") + "\n\n";
    helpMsg += deco.separator + "\n";
    helpMsg += "استعد للهبوط والقتال!";
    
    return api.sendMessage(helpMsg, threadID, messageID);
};
