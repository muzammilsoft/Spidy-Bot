/**
 * @name نظام مغارة الظلال (Solo Leveling)
 * @version 2.1.0
 * @author Hakim Tracks (100% Power Mode) 
 * @description نظام RPG متكامل: بوابات، وحوش، مخزن، أسلحة، دروع، جرعات، مهارات، قتالات فردية وجماعية، رتب، وجوائز.
 */

const deco = require("../../utils/decorations");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "مغارة",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام مغارة الظلال المتكامل (RPG System)",
    commandCategory: "الــعــاب",
    cooldowns: 5
};

// --- قاعدة بيانات اللعبة الداخلية (البيانات الثابتة) ---
const GAME_ASSETS = {
    GATES: {
        "E": { name: "بوابة الرتبة E", minLevel: 1, monsters: ["غول ضعيف", "ذئب بري", "هيكل عظمي", "عنكبوت صغير"], rewardRange: [100, 500], expRange: [50, 150], materials: { "خام حديد": 1, "جلد": 1 } },
        "D": { name: "بوابة الرتبة D", minLevel: 10, monsters: ["زعيم الغيلان", "عنكبوت عملاق", "فارس ميت", "غريفون"], rewardRange: [500, 1500], expRange: [150, 400], materials: { "خام حديد": 2, "جلد": 2, "حجر سحري": 1 } },
        "C": { name: "بوابة الرتبة C", minLevel: 25, monsters: ["تنين صغير", "ساحر الظلام", "وحش الصخر", "مستذئب"], rewardRange: [1500, 5000], expRange: [400, 1000], materials: { "خام حديد": 3, "حجر سحري": 2, "جوهر الظلام": 1 } },
        "B": { name: "بوابة الرتبة B", minLevel: 50, monsters: ["ملك الشياطين", "الظل الأسود", "حارس البوابة", "عملاق الصقيع"], rewardRange: [5000, 15000], expRange: [1000, 3000], materials: { "حجر سحري": 3, "جوهر الظلام": 2, "بلورة نادرة": 1 } },
        "A": { name: "بوابة الرتبة A", minLevel: 80, monsters: ["كاميش", "إيغريس", "بيرو", "ملك العفاريت"], rewardRange: [15000, 50000], expRange: [3000, 10000], materials: { "جوهر الظلام": 3, "بلورة نادرة": 2, "قلب التنين": 1 } },
        "S": { name: "بوابة الرتبة S", minLevel: 150, monsters: ["ملك العمالقة", "ملك الصقيع", "ملك الدمار", "أراخني"], rewardRange: [50000, 200000], expRange: [10000, 50000], materials: { "بلورة نادرة": 3, "قلب التنين": 2, "روح ملك الظلال": 1 } }
    },
    WEAPONS: {
        "خنجر صدئ": { price: 0, power: 10, speed: 1.2, rank: "E" },
        "سيف الفارس": { price: 5000, power: 50, speed: 1.0, rank: "D", materials: { "خام حديد": 5 } },
        "خنجر القاتل": { price: 20000, power: 120, speed: 1.8, rank: "C", materials: { "خام حديد": 10, "حجر سحري": 2 } },
        "نصل الرعد": { price: 100000, power: 350, speed: 1.5, rank: "B", materials: { "حجر سحري": 5, "جوهر الظلام": 1 } },
        "سيف كاميش": { price: 500000, power: 1200, speed: 2.0, rank: "A", materials: { "جوهر الظلام": 5, "بلورة نادرة": 2 } },
        "نصل ملك الظلال": { price: 2000000, power: 5000, speed: 3.0, rank: "S", materials: { "بلورة نادرة": 5, "قلب التنين": 2, "روح ملك الظلال": 1 } }
    },
    ARMOR: {
        "درع جلدي": { price: 0, defense: 5, rank: "E" },
        "درع حديدي": { price: 3000, defense: 20, rank: "D", materials: { "خام حديد": 10 } },
        "درع سحري": { price: 15000, defense: 50, rank: "C", materials: { "خام حديد": 15, "حجر سحري": 5 } },
        "درع الظلام": { price: 80000, defense: 150, rank: "B", materials: { "حجر سحري": 10, "جوهر الظلام": 3 } },
        "درع التنين": { price: 400000, defense: 500, rank: "A", materials: { "جوهر الظلام": 10, "بلورة نادرة": 5 } },
        "درع ملك الظلال": { price: 1500000, defense: 2000, rank: "S", materials: { "بلورة نادرة": 10, "قلب التنين": 5, "روح ملك الظلال": 2 } }
    },
    POTIONS: {
        "جرعة صحة صغيرة": { price: 100, heal: 50, type: "health" },
        "جرعة صحة متوسطة": { price: 300, heal: 200, type: "health" },
        "جرعة صحة كبيرة": { price: 800, heal: 500, type: "health" },
        "جرعة مانا صغيرة": { price: 150, mana: 50, type: "mana" },
        "جرعة مانا متوسطة": { price: 400, mana: 200, type: "mana" },
        "جرعة مانا كبيرة": { price: 1000, mana: 500, type: "mana" }
    },
    SKILLS: {
        "ضربة حرجة": { mana: 20, multiplier: 2.5, description: "هجوم قوي يضاعف الضرر" },
        "استدعاء الظلال": { mana: 50, multiplier: 4.0, description: "استدعاء جيش من الظلال للمساعدة" },
        "تجدد سريع": { mana: 30, heal: 50, description: "استعادة جزء من نقاط الحياة" },
        "غضب الملك": { mana: 100, multiplier: 10.0, description: "هجوم نهائي يدمر كل شيء" },
        "درع الظل": { mana: 40, defenseBoost: 0.5, description: "يزيد الدفاع مؤقتاً" },
        "انفجار المانا": { mana: 60, damage: 300, description: "يطلق انفجاراً سحرياً" }
    },
    MATERIALS: {
        "خام حديد": { price: 20 },
        "جلد": { price: 15 },
        "حجر سحري": { price: 70 },
        "جوهر الظلام": { price: 200 },
        "بلورة نادرة": { price: 800 },
        "قلب التنين": { price: 3000 },
        "روح ملك الظلال": { price: 10000 }
    }
};

module.exports.run = async ({ api, event, args, userData, user, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // --- تهيئة بيانات المستخدم بطريقة آمنة (دمج مع إزالة undefined) ---
    const defaultDungeon = {
        level: 1,
        exp: 0,
        gate: "E",
        rank: "مبتدئ",
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        money: 1000,
        crystals: 0,
        inventory: { weapons: ["خنجر صدئ"], armor: ["درع جلدي"], potions: {}, materials: {} },
        equipped: { weapon: "خنجر صدئ", armor: "درع جلدي" },
        skills: ["ضربة حرجة"],
        stats: { strength: 10, agility: 10, intelligence: 10, defense: 5 },
        lastAction: 0,
        shadows: [],
        quests: []
    };

    let dungeon;

    if (user.dungeon) {
        let userDungeon = { ...user.dungeon };
        Object.keys(userDungeon).forEach(key => {
            if (userDungeon[key] === undefined || userDungeon[key] === null) {
                delete userDungeon[key];
            }
        });
        dungeon = { ...defaultDungeon, ...userDungeon };
        
        // معالجة الكائنات المتداخلة
        if (userDungeon.stats) {
            let userStats = { ...userDungeon.stats };
            Object.keys(userStats).forEach(key => {
                if (userStats[key] === undefined || userStats[key] === null) {
                    delete userStats[key];
                }
            });
            dungeon.stats = { ...defaultDungeon.stats, ...userStats };
        } else {
            dungeon.stats = { ...defaultDungeon.stats };
        }

        if (userDungeon.inventory) {
            let userInventory = { ...userDungeon.inventory };
            Object.keys(userInventory).forEach(key => {
                if (userInventory[key] === undefined || userInventory[key] === null) {
                    delete userInventory[key];
                }
            });
            dungeon.inventory = { ...defaultDungeon.inventory, ...userInventory };
        } else {
            dungeon.inventory = { ...defaultDungeon.inventory };
        }

        if (userDungeon.equipped) {
            let userEquipped = { ...userDungeon.equipped };
            Object.keys(userEquipped).forEach(key => {
                if (userEquipped[key] === undefined || userEquipped[key] === null) {
                    delete userEquipped[key];
                }
            });
            dungeon.equipped = { ...defaultDungeon.equipped, ...userEquipped };
        } else {
            dungeon.equipped = { ...defaultDungeon.equipped };
        }

    } else {
        dungeon = { ...defaultDungeon };
    }

    // التأكد من أن المصفوفات هي مصفوفات بالفعل
    if (!Array.isArray(dungeon.inventory.weapons)) dungeon.inventory.weapons = defaultDungeon.inventory.weapons;
    if (!Array.isArray(dungeon.inventory.armor)) dungeon.inventory.armor = defaultDungeon.inventory.armor;
    if (typeof dungeon.inventory.potions !== 'object' || dungeon.inventory.potions === null) dungeon.inventory.potions = defaultDungeon.inventory.potions;
    if (typeof dungeon.inventory.materials !== 'object' || dungeon.inventory.materials === null) dungeon.inventory.materials = defaultDungeon.inventory.materials;
    if (!Array.isArray(dungeon.skills)) dungeon.skills = defaultDungeon.skills;
    if (!Array.isArray(dungeon.shadows)) dungeon.shadows = defaultDungeon.shadows;
    if (!Array.isArray(dungeon.quests)) dungeon.quests = defaultDungeon.quests;

    // التأكد من أن السلاح والدروع المجهزة موجودة في المخزن، وإلا نختار الافتراضي
    if (!dungeon.inventory.weapons.includes(dungeon.equipped.weapon)) {
        dungeon.equipped.weapon = dungeon.inventory.weapons[0] || "خنجر صدئ";
    }
    if (!dungeon.inventory.armor.includes(dungeon.equipped.armor)) {
        dungeon.equipped.armor = dungeon.inventory.armor[0] || "درع جلدي";
    }

    // --- استثناء المطور (ملك الظلال) ---
    if (config.ADMINBOT.includes(senderID)) {
        dungeon.gate = "S";
        dungeon.rank = "ملك الظلال (المطور)";
        dungeon.level = 999;
        dungeon.stats = { strength: 9999, agility: 9999, intelligence: 9999, defense: 9999 };
        dungeon.maxHealth = 999999;
        dungeon.health = 999999;
        dungeon.mana = 99999;
        dungeon.maxMana = 99999;
        dungeon.crystals = 99999;
        dungeon.money = 999999;
        dungeon.equipped.weapon = "نصل ملك الظلال";
        dungeon.equipped.armor = "درع ملك الظلال";
        dungeon.inventory.weapons = Object.keys(GAME_ASSETS.WEAPONS);
        dungeon.inventory.armor = Object.keys(GAME_ASSETS.ARMOR);
        dungeon.inventory.potions = { "جرعة صحة كبيرة": 99, "جرعة مانا كبيرة": 99 };
        dungeon.inventory.materials = { "روح ملك الظلال": 99 };
        dungeon.skills = Object.keys(GAME_ASSETS.SKILLS);
    }

    // --- نظام الأوامر الداخلية (Sub-commands) ---
    
    // 1. عرض الحالة الشخصية
    if (!subCommand || subCommand === "حالي" || subCommand === "بروفايل") {
        let msg = deco.title(`👤 حالة المحارب: ${user.nickname || "غير معروف"}`) + "\n\n";
        msg += deco.line(`الرتبة: [ ${dungeon.rank} ]`) + "\n";
        msg += deco.line(`المستوى: ${dungeon.level} (XP: ${dungeon.exp}/${dungeon.level * 500})`) + "\n";
        msg += deco.line(`الصحة: ❤️ ${dungeon.health}/${dungeon.maxHealth}`) + "\n";
        msg += deco.line(`المانا: 💧 ${dungeon.mana}/${dungeon.maxMana}`) + "\n";
        msg += deco.line(`السلاح: ⚔️ ${dungeon.equipped.weapon}`) + "\n";
        msg += deco.line(`الدرع: 🛡️ ${dungeon.equipped.armor}`) + "\n";
        msg += deco.line(`القوة: 💪 ${dungeon.stats.strength} | السرعة: ⚡ ${dungeon.stats.agility} | الدفاع: 🛡️ ${dungeon.stats.defense}`) + "\n";
        msg += deco.line(`الجواهر: 💎 ${dungeon.crystals} | الذهب: 💰 ${dungeon.money}`) + "\n\n";
        msg += deco.progressBar(Math.floor((dungeon.exp / (dungeon.level * 500)) * 100));
        return api.sendMessage(msg, threadID, messageID);
    }

    // 2. دخول المغارة (القتال)
    if (subCommand === "دخول" || subCommand === "قتال") {
        const now = Date.now();
        if (now - dungeon.lastAction < 30000 && !config.ADMINBOT.includes(senderID)) {
            return api.sendMessage(deco.title("⏳ استراحة") + "\n\n" + deco.line(`انتظر ${Math.ceil((30000 - (now - dungeon.lastAction)) / 1000)} ثانية`), threadID, messageID);
        }

        const gateInfo = GAME_ASSETS.GATES[dungeon.gate];
        const monster = gateInfo.monsters[Math.floor(Math.random() * gateInfo.monsters.length)];
        const monsterHealth = dungeon.level * 50 + (Object.keys(GAME_ASSETS.GATES).indexOf(dungeon.gate) * 200);
        
        let battleLog = deco.title("⚔️ بدء المعركة ⚔️") + "\n\n";
        battleLog += deco.line(`البوابة: ${gateInfo.name}`) + "\n";
        battleLog += deco.line(`الوحش: ${monster}`) + "\n";
        battleLog += deco.line(`سلاحك: ${dungeon.equipped.weapon}`) + "\n";
        battleLog += deco.line(`درعك: ${dungeon.equipped.armor}`) + "\n\n";
        battleLog += deco.progressBar(30);

        api.sendMessage(battleLog, threadID, async (err, info) => {
            setTimeout(async () => {
                const weaponPower = GAME_ASSETS.WEAPONS[dungeon.equipped.weapon]?.power || 10;
                const armorDefense = GAME_ASSETS.ARMOR[dungeon.equipped.armor]?.defense || 5;
                const totalPower = weaponPower + (dungeon.stats.strength * 2);
                const totalDefense = armorDefense + (dungeon.stats.defense * 1);
                
                // حساب الضرر الذي يلحقه اللاعب بالوحش
                const playerDamage = Math.max(1, totalPower - (monsterHealth * 0.1)); // الوحش يتلقى ضرر بناءً على قوة اللاعب
                // حساب الضرر الذي يلحقه الوحش باللاعب
                const monsterDamage = Math.max(1, (monsterHealth * 0.05) - totalDefense); // اللاعب يتلقى ضرر بناءً على دفاعه

                const winChance = Math.min(0.9, (totalPower / monsterHealth) * (1 + (totalDefense / monsterHealth)));
                const isWin = Math.random() < winChance || config.ADMINBOT.includes(senderID);

                if (isWin) {
                    const goldGain = Math.floor(Math.random() * (gateInfo.rewardRange[1] - gateInfo.rewardRange[0])) + gateInfo.rewardRange[0];
                    const expGain = Math.floor(Math.random() * (gateInfo.expRange[1] - gateInfo.expRange[0])) + gateInfo.expRange[0];
                    const crystalChance = Math.random() < 0.1 ? Math.floor(Math.random() * 5) + 1 : 0;

                    dungeon.money += goldGain;
                    dungeon.exp += expGain;
                    dungeon.crystals += crystalChance;
                    dungeon.lastAction = now;

                    // إضافة مواد من الوحش
                    if (gateInfo.materials) {
                        for (const mat in gateInfo.materials) {
                            const quantity = Math.floor(Math.random() * gateInfo.materials[mat]) + 1;
                            dungeon.inventory.materials[mat] = (dungeon.inventory.materials[mat] || 0) + quantity;
                        }
                    }

                    // التحقق من ارتقاء المستوى
                    if (dungeon.exp >= dungeon.level * 500) {
                        dungeon.level += 1;
                        dungeon.exp = 0;
                        dungeon.stats.strength += 5;
                        dungeon.stats.agility += 5;
                        dungeon.stats.defense += 3;
                        dungeon.maxHealth += 100;
                        dungeon.health = dungeon.maxHealth;
                        dungeon.maxMana += 20;
                        dungeon.mana = dungeon.maxMana;
                        api.sendMessage(
                            deco.success(`🎉 تهانينا! لقد ارتفعت إلى المستوى ${dungeon.level}! لقد زادت قوتك ودفاعك وصحتك وماناك!`), 
                            threadID
                        );
                    }

                    let winMsg = deco.title("🏆 انتصار ساحق 🏆") + "\n\n";
                    winMsg += deco.line(`تمت تصفية ${monster}`) + "\n";
                    winMsg += deco.line(`الذهب: +${goldGain} 💰`) + "\n";
                    winMsg += deco.line(`الخبرة: +${expGain} XP`) + "\n";
                    if (crystalChance > 0) winMsg += deco.line(`جواهر: +${crystalChance} 💎`) + "\n";
                    if (gateInfo.materials) {
                        for (const mat in gateInfo.materials) {
                            winMsg += deco.line(`حصلت على: ${gateInfo.materials[mat]} ${mat}`) + "\n";
                        }
                    }
                    winMsg += "\n" + deco.progressBar(100);
                    
                    await userData.set(senderID, { dungeon: dungeon });
                    api.sendMessage(winMsg, threadID, info.messageID);
                } else {
                    const damageTaken = Math.floor(monsterDamage);
                    dungeon.health -= damageTaken;
                    dungeon.lastAction = now;

                    if (dungeon.health <= 0) {
                        dungeon.health = Math.floor(dungeon.maxHealth * 0.5);
                        dungeon.money = Math.floor(dungeon.money * 0.8); // خسارة 20% من المال
                        api.sendMessage(deco.title("💀 هزيمة مذلة 💀") + "\n\n" + deco.line(`لقد مت في المغارة وفقدت جزءاً من مالك! دمك الحالي: ${dungeon.health}`), threadID, info.messageID);
                    } else {
                        api.sendMessage(deco.title("❌ فشل المهمة ❌") + "\n\n" + deco.line(`أصابك الوحش بجروح! خسرت ${damageTaken} نقطة صحة. دمك الحالي: ${dungeon.health}`), threadID, info.messageID);
                    }
                    await userData.set(senderID, { dungeon: dungeon });
                }
            }, 3000);
        });
        return;
    }

    // 3. المتجر (شراء أسلحة ودروع وجرعات)
    if (subCommand === "متجر" || subCommand === "سوق") {
        const itemType = args[1]?.toLowerCase();
        let shopMsg = deco.title("🛒 متجر المغامرات 🛒") + "\n\n";

        if (!itemType || itemType === "أسلحة") {
            shopMsg += deco.titleGolden("⚔️ الأسلحة:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.WEAPONS)) {
                shopMsg += deco.listItem(`${name} [${info.rank}]`) + "\n";
                shopMsg += `   💰 السعر: ${info.price} | ⚔️ القوة: ${info.power}\n`;
            }
            shopMsg += "\n" + deco.line("للشراء اكتب: مغارة شراء سلاح [اسم السلاح]");
        }
        if (!itemType || itemType === "دروع") {
            shopMsg += deco.titleGolden("🛡️ الدروع:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.ARMOR)) {
                shopMsg += deco.listItem(`${name} [${info.rank}]`) + "\n";
                shopMsg += `   💰 السعر: ${info.price} | 🛡️ الدفاع: ${info.defense}\n`;
            }
            shopMsg += "\n" + deco.line("للشراء اكتب: مغارة شراء درع [اسم الدرع]");
        }
        if (!itemType || itemType === "جرعات") {
            shopMsg += deco.titleGolden("🧪 الجرعات:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.POTIONS)) {
                shopMsg += deco.listItem(`${name}`) + "\n";
                shopMsg += `   💰 السعر: ${info.price} | ${info.type === "health" ? "❤️ صحة" : "💧 مانا"}: ${info.heal || info.mana}\n`;
            }
            shopMsg += "\n" + deco.line("للشراء اكتب: مغارة شراء جرعة [اسم الجرعة] [الكمية]");
        }
        if (!itemType || itemType === "مواد") {
            shopMsg += deco.titleGolden("📦 المواد الخام:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.MATERIALS)) {
                shopMsg += deco.listItem(`${name}`) + "\n";
                shopMsg += `   💰 السعر: ${info.price} (للبيع)\n`;
            }
            shopMsg += "\n" + deco.line("لبيع المواد اكتب: مغارة بيع مادة [اسم المادة] [الكمية]");
        }

        shopMsg += "\n" + deco.line("يمكنك تحديد نوع المتجر: مغارة متجر [أسلحة/دروع/جرعات/مواد]");
        return api.sendMessage(shopMsg, threadID, messageID);
    }

    // 4. شراء عنصر
    if (subCommand === "شراء") {
        const itemCategory = args[1]?.toLowerCase();
        const itemName = args.slice(2, args.length - (itemCategory === "جرعة" ? 1 : 0)).join(" ");
        const quantity = itemCategory === "جرعة" ? parseInt(args[args.length - 1]) || 1 : 1;

        let itemInfo, itemTypeKey, inventoryKey;

        if (itemCategory === "سلاح") { itemInfo = GAME_ASSETS.WEAPONS[itemName]; itemTypeKey = "weapon"; inventoryKey = "weapons"; }
        else if (itemCategory === "درع") { itemInfo = GAME_ASSETS.ARMOR[itemName]; itemTypeKey = "armor"; inventoryKey = "armor"; }
        else if (itemCategory === "جرعة") { itemInfo = GAME_ASSETS.POTIONS[itemName]; itemTypeKey = "potion"; inventoryKey = "potions"; }
        else return api.sendMessage("❌ نوع العنصر غير صحيح! (سلاح/درع/جرعة)", threadID, messageID);

        if (!itemInfo) return api.sendMessage("❌ هذا العنصر غير موجود في المتجر!", threadID, messageID);
        const totalPrice = itemInfo.price * quantity;
        if (dungeon.money < totalPrice) return api.sendMessage("❌ لا تملك الذهب الكافي!", threadID, messageID);

        dungeon.money -= totalPrice;

        if (itemTypeKey === "potion") {
            dungeon.inventory.potions[itemName] = (dungeon.inventory.potions[itemName] || 0) + quantity;
            api.sendMessage(deco.title("🧪 جرعات جديدة 🧪") + "\n\n" + deco.line(`مبروك! اشتريت ${quantity} من ${itemName}`), threadID, messageID);
        } else {
            if (dungeon.inventory[inventoryKey].includes(itemName)) return api.sendMessage("❌ تملك هذا العنصر بالفعل!", threadID, messageID);
            dungeon.inventory[inventoryKey].push(itemName);
            dungeon.equipped[itemTypeKey] = itemName;
            api.sendMessage(deco.title("✨ عنصر جديد ✨") + "\n\n" + deco.line(`مبروك! اشتريت ${itemName} وتم تجهيزه تلقائياً`), threadID, messageID);
        }
        
        await userData.set(senderID, { dungeon: dungeon });
        return;
    }

    // 5. بيع مادة
    if (subCommand === "بيع" && args[1]?.toLowerCase() === "مادة") {
        const materialName = args.slice(2, args.length - 1).join(" ");
        const quantity = parseInt(args[args.length - 1]) || 1;
        const materialInfo = GAME_ASSETS.MATERIALS[materialName];

        if (!materialInfo) return api.sendMessage("❌ هذه المادة غير موجودة!", threadID, messageID);
        if ((dungeon.inventory.materials[materialName] || 0) < quantity) return api.sendMessage("❌ لا تملك هذه الكمية من المادة!", threadID, messageID);
        if (quantity <= 0) return api.sendMessage("❌ الكمية غير صحيحة!", threadID, messageID);

        const sellPrice = materialInfo.price * quantity;
        dungeon.money += sellPrice;
        dungeon.inventory.materials[materialName] -= quantity;

        await userData.set(senderID, { dungeon: dungeon });
        return api.sendMessage(deco.success(`✅ تم بيع ${quantity} من ${materialName} مقابل 💰 ${sellPrice}$`), threadID, messageID);
    }

    // 6. المخزن (Inventory)
    if (subCommand === "مخزن" || subCommand === "حقيبة") {
        let invMsg = deco.title("🎒 مخزنك الخاص 🎒") + "\n\n";
        
        invMsg += deco.titleGolden("⚔️ الأسلحة:") + "\n";
        if (dungeon.inventory.weapons.length === 0) invMsg += deco.line("لا يوجد لديك أسلحة.") + "\n";
        dungeon.inventory.weapons.forEach((item, index) => {
            invMsg += deco.listItem(`${index + 1}. ${item} ${item === dungeon.equipped.weapon ? " (مجهز ✅)" : ""}`) + "\n";
        });
        invMsg += "\n" + deco.line("لتجهيز سلاح: مغارة تجهيز سلاح [اسم السلاح]");

        invMsg += deco.titleGolden("🛡️ الدروع:") + "\n";
        if (dungeon.inventory.armor.length === 0) invMsg += deco.line("لا يوجد لديك دروع.") + "\n";
        dungeon.inventory.armor.forEach((item, index) => {
            invMsg += deco.listItem(`${index + 1}. ${item} ${item === dungeon.equipped.armor ? " (مجهز ✅)" : ""}`) + "\n";
        });
        invMsg += "\n" + deco.line("لتجهيز درع: مغارة تجهيز درع [اسم الدرع]");

        invMsg += deco.titleGolden("🧪 الجرعات:") + "\n";
        if (Object.keys(dungeon.inventory.potions).length === 0) invMsg += deco.line("لا يوجد لديك جرعات.") + "\n";
        for (const potion in dungeon.inventory.potions) {
            invMsg += deco.listItem(`${potion}: ${dungeon.inventory.potions[potion]}x`) + "\n";
        }
        invMsg += "\n" + deco.line("لاستخدام جرعة: مغارة استخدام جرعة [اسم الجرعة]");

        invMsg += deco.titleGolden("📦 المواد الخام:") + "\n";
        if (Object.keys(dungeon.inventory.materials).length === 0) invMsg += deco.line("لا يوجد لديك مواد خام.") + "\n";
        for (const material in dungeon.inventory.materials) {
            invMsg += deco.listItem(`${material}: ${dungeon.inventory.materials[material]}x`) + "\n";
        }
        invMsg += "\n" + deco.line("لبيع المواد: مغارة بيع مادة [اسم المادة] [الكمية]");

        return api.sendMessage(invMsg, threadID, messageID);
    }

    // 7. تجهيز سلاح/درع
    if (subCommand === "تجهيز") {
        const itemCategory = args[1]?.toLowerCase();
        const itemName = args.slice(2).join(" ");

        if (itemCategory === "سلاح") {
            if (!dungeon.inventory.weapons.includes(itemName)) return api.sendMessage("❌ لا تملك هذا السلاح في مخزنك!", threadID, messageID);
            dungeon.equipped.weapon = itemName;
            await userData.set(senderID, { dungeon: dungeon });
            return api.sendMessage(deco.title("✅ تم التجهيز") + "\n\n" + deco.line(`تم تجهيز ${itemName} بنجاح`), threadID, messageID);
        } else if (itemCategory === "درع") {
            if (!dungeon.inventory.armor.includes(itemName)) return api.sendMessage("❌ لا تملك هذا الدرع في مخزنك!", threadID, messageID);
            dungeon.equipped.armor = itemName;
            await userData.set(senderID, { dungeon: dungeon });
            return api.sendMessage(deco.title("✅ تم التجهيز") + "\n\n" + deco.line(`تم تجهيز ${itemName} بنجاح`), threadID, messageID);
        } else {
            return api.sendMessage("❌ نوع العنصر غير صحيح! (سلاح/درع)", threadID, messageID);
        }
    }

    // 8. استخدام جرعة
    if (subCommand === "استخدام" && args[1]?.toLowerCase() === "جرعة") {
        const potionName = args.slice(2).join(" ");
        const potionInfo = GAME_ASSETS.POTIONS[potionName];

        if (!potionInfo) return api.sendMessage("❌ هذه الجرعة غير موجودة!", threadID, messageID);
        if ((dungeon.inventory.potions[potionName] || 0) <= 0) return api.sendMessage("❌ لا تملك هذه الجرعة!", threadID, messageID);

        dungeon.inventory.potions[potionName]--;

        if (potionInfo.type === "health") {
            dungeon.health = Math.min(dungeon.maxHealth, dungeon.health + potionInfo.heal);
            api.sendMessage(deco.success(`✅ استخدمت ${potionName} واستعدت ❤️ ${potionInfo.heal} نقطة صحة. صحتك الحالية: ${dungeon.health}`), threadID, messageID);
        } else if (potionInfo.type === "mana") {
            dungeon.mana = Math.min(dungeon.maxMana, dungeon.mana + potionInfo.mana);
            api.sendMessage(deco.success(`✅ استخدمت ${potionName} واستعدت 💧 ${potionInfo.mana} نقطة مانا. المانا الحالية: ${dungeon.mana}`), threadID, messageID);
        }

        await userData.set(senderID, { dungeon: dungeon });
        return;
    }

    // 9. رفع الرتبة (Gate Rank Up)
    if (subCommand === "ترقية") {
        const currentRankIndex = Object.keys(GAME_ASSETS.GATES).indexOf(dungeon.gate);
        const nextRankKey = Object.keys(GAME_ASSETS.GATES)[currentRankIndex + 1];
        
        if (!nextRankKey) return api.sendMessage("🏆 لقد وصلت لأعلى رتبة ممكنة (S)!", threadID, messageID);
        
        const nextRank = GAME_ASSETS.GATES[nextRankKey];
        if (dungeon.level < nextRank.minLevel) {
            return api.sendMessage(`❌ تحتاج للوصول للمستوى ${nextRank.minLevel} لفتح ${nextRank.name}!`, threadID, messageID);
        }

        dungeon.gate = nextRankKey;
        dungeon.rank = `صياد الرتبة ${nextRankKey}`;
        await userData.set(senderID, { dungeon: dungeon });
        return api.sendMessage(deco.title("🔥 ارتقاء الرتبة 🔥") + "\n\n" + deco.line(`مبروك! لقد فتحت ${nextRank.name}`), threadID, messageID);
    }

    // 10. المهارات (Skills)
    if (subCommand === "مهارات") {
        let skillMsg = deco.title("🔮 كتاب المهارات 🔮") + "\n\n";
        for (const [name, info] of Object.entries(GAME_ASSETS.SKILLS)) {
            skillMsg += deco.listItem(`${name}`) + "\n";
            skillMsg += `   💧 المانا: ${info.mana} | 📝 ${info.description}\n`;
        }
        return api.sendMessage(skillMsg, threadID, messageID);
    }

    // 11. استدعاء الظلال (Shadow Extraction) - ميزة خاصة
    if (subCommand === "استدعاء") {
        if (dungeon.gate !== "S" && !config.ADMINBOT.includes(senderID)) {
            return api.sendMessage("❌ هذه المهارة متاحة فقط لرتبة S (ملك الظلال)!", threadID, messageID);
        }
        
        const shadowName = args.slice(1).join(" ") || "جندي ظل";
        if (dungeon.mana < 50) return api.sendMessage("❌ مانا غير كافية!", threadID, messageID);
        
        dungeon.mana -= 50;
        dungeon.shadows.push(shadowName);
        await userData.set(senderID, { dungeon: dungeon });
        
        return api.sendMessage(deco.title("🌑 استخراج الظل 🌑") + "\n\n" + deco.line(`"انهض..."`) + "\n" + deco.line(`تمت إضافة ${shadowName} لجيش ظلالك`), threadID, messageID);
    }

    // 12. تطوير (Crafting/Upgrade)
    if (subCommand === "تطوير" || subCommand === "صناعة") {
        const itemToCraft = args.slice(1).join(" ");
        let targetItem, materialsNeeded;

        // البحث في الأسلحة
        for (const [name, info] of Object.entries(GAME_ASSETS.WEAPONS)) {
            if (name.toLowerCase() === itemToCraft.toLowerCase() && info.materials) {
                targetItem = name;
                materialsNeeded = info.materials;
                break;
            }
        }
        // البحث في الدروع
        if (!targetItem) {
            for (const [name, info] of Object.entries(GAME_ASSETS.ARMOR)) {
                if (name.toLowerCase() === itemToCraft.toLowerCase() && info.materials) {
                    targetItem = name;
                    materialsNeeded = info.materials;
                    break;
                }
            }
        }

        if (!targetItem) {
            let craftableItems = deco.titlePremium("🛠️ عناصر قابلة للتطوير/الصناعة") + "\n\n";
            craftableItems += deco.titleGolden("⚔️ الأسلحة:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.WEAPONS)) {
                if (info.materials) {
                    craftableItems += deco.listItem(`${name}: `);
                    for (const mat in info.materials) {
                        craftableItems += `${mat} x${info.materials[mat]} `; 
                    }
                    craftableItems += "\n";
                }
            }
            craftableItems += deco.titleGolden("🛡️ الدروع:") + "\n";
            for (const [name, info] of Object.entries(GAME_ASSETS.ARMOR)) {
                if (info.materials) {
                    craftableItems += deco.listItem(`${name}: `);
                    for (const mat in info.materials) {
                        craftableItems += `${mat} x${info.materials[mat]} `; 
                    }
                    craftableItems += "\n";
                }
            }
            craftableItems += "\n" + deco.line("للصناعة اكتب: مغارة تطوير [اسم العنصر]");
            return api.sendMessage(craftableItems, threadID, messageID);
        }

        // التحقق من توفر المواد
        let hasMaterials = true;
        let missingMaterials = [];
        for (const mat in materialsNeeded) {
            if ((dungeon.inventory.materials[mat] || 0) < materialsNeeded[mat]) {
                hasMaterials = false;
                missingMaterials.push(`${mat} (${materialsNeeded[mat] - (dungeon.inventory.materials[mat] || 0)} مطلوب)`);
            }
        }

        if (!hasMaterials) {
            return api.sendMessage(deco.error(`❌ لا تملك المواد الكافية لصناعة ${targetItem}. المواد الناقصة: ${missingMaterials.join(", ")}`), threadID, messageID);
        }

        // استهلاك المواد
        for (const mat in materialsNeeded) {
            dungeon.inventory.materials[mat] -= materialsNeeded[mat];
        }

        // إضافة العنصر المصنوع
        if (GAME_ASSETS.WEAPONS[targetItem]) {
            if (!dungeon.inventory.weapons.includes(targetItem)) dungeon.inventory.weapons.push(targetItem);
            dungeon.equipped.weapon = targetItem;
        } else if (GAME_ASSETS.ARMOR[targetItem]) {
            if (!dungeon.inventory.armor.includes(targetItem)) dungeon.inventory.armor.push(targetItem);
            dungeon.equipped.armor = targetItem;
        }

        await userData.set(senderID, { dungeon: dungeon });
        return api.sendMessage(deco.success(`✅ تهانينا! لقد قمت بصناعة ${targetItem} وتم تجهيزه تلقائياً.`), threadID, messageID);
    }

    // 13. المهمات (Quests)
    if (subCommand === "مهمات" || subCommand === "مهام") {
        const questAction = args[1]?.toLowerCase();

        const availableQuests = [
            { id: "kill_5_e_monsters", name: "صيد الغيلان", description: "اقتل 5 وحوش من الرتبة E", type: "kill", target: "E", count: 5, reward: { money: 500, exp: 100 }, progress: 0 },
            { id: "collect_10_iron", name: "جمع الحديد", description: "اجمع 10 خام حديد", type: "collect", target: "خام حديد", count: 10, reward: { money: 700, exp: 150 }, progress: 0 },
            { id: "craft_d_weapon", name: "صناعة سلاح D", description: "اصنع سلاحاً من الرتبة D", type: "craft", target: "D", reward: { money: 1000, exp: 200 }, progress: 0 }
        ];

        if (questAction === "عرض") {
            let questMsg = deco.titlePremium("📜 مهماتك الحالية 📜") + "\n\n";
            if (dungeon.quests.length === 0) {
                questMsg += deco.line("لا توجد لديك مهمات نشطة حالياً. اكتب 'مغارة مهمات قبول' لقبول مهمة جديدة.") + "\n";
            } else {
                dungeon.quests.forEach(q => {
                    questMsg += deco.listItem(`${q.name}: ${q.description} (التقدم: ${q.progress}/${q.count || 1})`) + "\n";
                });
            }
            return api.sendMessage(questMsg, threadID, messageID);
        }

        if (questAction === "قبول") {
            if (dungeon.quests.length >= 3) {
                return api.sendMessage(deco.error("❌ لديك بالفعل 3 مهمات نشطة. أكملها قبل قبول المزيد."), threadID, messageID);
            }
            const newQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
            if (dungeon.quests.some(q => q.id === newQuest.id)) {
                return api.sendMessage(deco.warning("لديك بالفعل هذه المهمة. حاول مرة أخرى."), threadID, messageID);
            }
            dungeon.quests.push(newQuest);
            await userData.set(senderID, { dungeon: dungeon });
            return api.sendMessage(deco.success(`✅ تم قبول مهمة جديدة: ${newQuest.name} - ${newQuest.description}`), threadID, messageID);
        }

        if (questAction === "إنجاز") {
            let completedQuests = [];
            let rewardsMsg = deco.titlePremium("🎉 مهمات منجزة 🎉") + "\n\n";
            
            for (let i = dungeon.quests.length - 1; i >= 0; i--) {
                const q = dungeon.quests[i];
                let isCompleted = false;

                if (q.type === "kill" && q.progress >= q.count) isCompleted = true;
                if (q.type === "collect" && (dungeon.inventory.materials[q.target] || 0) >= q.count) isCompleted = true;
                if (q.type === "craft" && ((GAME_ASSETS.WEAPONS[q.target] && dungeon.inventory.weapons.includes(q.target)) || (GAME_ASSETS.ARMOR[q.target] && dungeon.inventory.armor.includes(q.target)))) isCompleted = true;

                if (isCompleted) {
                    dungeon.money += q.reward.money;
                    dungeon.exp += q.reward.exp;
                    rewardsMsg += deco.listItem(`${q.name}: 💰 ${q.reward.money}$ | ✨ ${q.reward.exp} XP`) + "\n";
                    completedQuests.push(i);
                }
            }

            if (completedQuests.length === 0) {
                return api.sendMessage(deco.warning("❌ لا توجد مهمات منجزة حالياً."), threadID, messageID);
            }

            // إزالة المهمات المنجزة
            dungeon.quests = dungeon.quests.filter((_, idx) => !completedQuests.includes(idx));
            await userData.set(senderID, { dungeon: dungeon });
            return api.sendMessage(rewardsMsg, threadID, messageID);
        }

        let questHelp = deco.titlePremium("📜 نظام المهمات 📜") + "\n\n";
        questHelp += deco.box(`
مغارة مهمات عرض  - عرض مهماتك الحالية
مغارة مهمات قبول  - قبول مهمة عشوائية جديدة
مغارة مهمات إنجاز - استلام مكافآت المهمات المنجزة
        `);
        return api.sendMessage(questHelp, threadID, messageID);
    }

    // 14. قائمة المساعدة (Help)
    let helpMsg = deco.title("📜 دليل مغارة الظلال 📜") + "\n\n";
    helpMsg += deco.listItem("مغارة حالي : عرض بروفايلك") + "\n";
    helpMsg += deco.listItem("مغارة دخول : دخول قتال في البوابة") + "\n";
    helpMsg += deco.listItem("مغارة متجر [أسلحة/دروع/جرعات/مواد] : عرض المتجر") + "\n";
    helpMsg += deco.listItem("مغارة شراء [سلاح/درع/جرعة] [اسم] [كمية] : شراء عنصر") + "\n";
    helpMsg += deco.listItem("مغارة بيع مادة [اسم المادة] [كمية] : بيع المواد الخام") + "\n";
    helpMsg += deco.listItem("مغارة مخزن : عرض مخزونك") + "\n";
    helpMsg += deco.listItem("مغارة تجهيز [سلاح/درع] [اسم] : اختيار سلاح أو درع للقتال") + "\n";
    helpMsg += deco.listItem("مغارة استخدام جرعة [اسم الجرعة] : استخدام جرعة") + "\n";
    helpMsg += deco.listItem("مغارة ترقية : فتح بوابات أعلى") + "\n";
    helpMsg += deco.listItem("مغارة مهارات : عرض مهاراتك") + "\n";
    helpMsg += deco.listItem("مغارة استدعاء [اسم الظل] : (لرتبة S) استخراج الظلال") + "\n";
    helpMsg += deco.listItem("مغارة تطوير [اسم العنصر] : صناعة أسلحة أو دروع") + "\n";
    helpMsg += deco.listItem("مغارة مهمات [عرض/قبول/إنجاز] : إدارة المهمات") + "\n\n";
    helpMsg += deco.separator + "\n";
    helpMsg += "استخدم الأوامر بحكمة لتصبح ملك الظلال القادم!";
    
    return api.sendMessage(helpMsg, threadID, messageID);
};
