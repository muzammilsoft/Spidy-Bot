/**
 * @name زراعة
 * @version 2.0.0
 * @author Manus AI
 * @description نظام زراعة متقدم: فصول، أدوات، مواشي، وسوق متغير.
 */

const deco = require("../../utils/decorations");

module.exports.config = {
    name: "زراعة",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "نظام زراعة متكامل (فصول، أدوات، مواشي)",
    commandCategory: "الــعــاب",
    usages: "زراعة [زرع/حصاد/مزرعتي/متجر/مواشي/أدوات]",
    cooldowns: 5
};

const CROPS = {
    "قمح": { price: 50, growTime: 3600000, seedPrice: 100, season: "الربيع" },
    "ذرة": { price: 80, growTime: 7200000, seedPrice: 150, season: "الصيف" },
    "طماطم": { price: 120, growTime: 10800000, seedPrice: 200, season: "الصيف" },
    "بطاطس": { price: 150, growTime: 14400000, seedPrice: 250, season: "الشتاء" },
    "عنب": { price: 300, growTime: 21600000, seedPrice: 500, season: "الخريف" }
};

const ANIMALS = {
    "دجاجة": { price: 1000, product: "بيض", productPrice: 50, cooldown: 3600000 },
    "بقرة": { price: 5000, product: "حليب", productPrice: 200, cooldown: 10800000 },
    "خروف": { price: 3000, product: "صوف", productPrice: 150, cooldown: 7200000 }
};

const TOOLS = {
    "مرشة": { price: 2000, boost: 0.2, desc: "تسرع النمو بنسبة 20%" },
    "سماد": { price: 1000, boost: 0.5, desc: "تزيد المحصول بنسبة 50%" },
    "محراث": { price: 5000, boost: 0.1, desc: "تفتح حقولاً إضافية" }
};

const SEASONS = ["الربيع", "الصيف", "الخريف", "الشتاء"];

module.exports.run = async ({ api, event, args, userData, user }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();
    const now = Date.now();

    if (!user || !user.isRegistered) {
        return api.sendMessage(deco.error("يجب عليك التسجيل أولاً!"), threadID, messageID);
    }

    // تهيئة بيانات المزرعة
    if (!user.farm) {
        user.farm = {
            crops: [],
            animals: [],
            tools: [],
            farmSize: 2,
            lastHarvest: 0,
            seasonIndex: 0,
            lastSeasonUpdate: now
        };
        await userData.set(senderID, { farm: user.farm });
    }

    const farm = user.farm;

    // تحديث الفصل (كل 24 ساعة يتغير الفصل)
    if (now - farm.lastSeasonUpdate > 86400000) {
        farm.seasonIndex = (farm.seasonIndex + 1) % 4;
        farm.lastSeasonUpdate = now;
        api.sendMessage(deco.info(`🌤️ لقد تغير الفصل! نحن الآن في فصل ${SEASONS[farm.seasonIndex]}`), threadID);
    }

    const currentSeason = SEASONS[farm.seasonIndex];

    // --- 1. زرع محصول ---
    if (subCommand === "زرع") {
        const cropType = args[1];
        const cropInfo = CROPS[cropType];

        if (!cropInfo) {
            let msg = deco.titlePremium("🌱 بذور المزرعة") + "\n\n";
            for (const [name, info] of Object.entries(CROPS)) {
                msg += deco.listItem(`${name}: ${info.seedPrice}$ | فصل: ${info.season}`) + "\n";
            }
            return api.sendMessage(msg, threadID, messageID);
        }

        if (farm.crops.length >= farm.farmSize) return api.sendMessage(deco.error("مزرعتك ممتلئة!"), threadID, messageID);
        if (user.money < cropInfo.seedPrice) return api.sendMessage(deco.error("مال غير كافٍ!"), threadID, messageID);

        // مكافأة الفصل
        let growTime = cropInfo.growTime;
        if (cropInfo.season === currentSeason) {
            growTime *= 0.8; // نمو أسرع 20% في فصله
        }

        user.money -= cropInfo.seedPrice;
        farm.crops.push({ type: cropType, plantTime: now, growTime: growTime });
        await userData.set(senderID, { money: user.money, farm: farm });

        return api.sendMessage(deco.success(`✅ تم زرع ${cropType}! سيجهز بعد ${Math.ceil(growTime / 3600000)} ساعة.`), threadID, messageID);
    }

    // --- 2. حصاد ---
    if (subCommand === "حصاد") {
        const readyCrops = farm.crops.filter(c => now - c.plantTime >= c.growTime);
        if (readyCrops.length === 0) return api.sendMessage(deco.warning("لا يوجد شيء جاهز للحصاد."), threadID, messageID);

        let total = 0;
        readyCrops.forEach(c => total += CROPS[c.type].price);
        
        farm.crops = farm.crops.filter(c => now - c.plantTime < c.growTime);
        user.money += total;
        await userData.set(senderID, { money: user.money, farm: farm });

        return api.sendMessage(deco.success(`🎉 حصدت محاصيلك وبعتها بمبلغ 💵 ${total}$`), threadID, messageID);
    }

    // --- 3. مواشي ---
    if (subCommand === "مواشي") {
        const action = args[1];
        if (action === "شراء") {
            const animalType = args[2];
            const animalInfo = ANIMALS[animalType];
            if (!animalInfo) return api.sendMessage(deco.error("نوع حيوان غير معروف."), threadID, messageID);
            if (user.money < animalInfo.price) return api.sendMessage(deco.error("مال غير كافٍ!"), threadID, messageID);

            user.money -= animalInfo.price;
            farm.animals.push({ type: animalType, lastProduct: now });
            await userData.set(senderID, { money: user.money, farm: farm });
            return api.sendMessage(deco.success(`🐄 اشتريت ${animalType} بنجاح!`), threadID, messageID);
        }

        if (action === "جمع") {
            let total = 0;
            farm.animals.forEach(a => {
                const info = ANIMALS[a.type];
                if (now - a.lastProduct >= info.cooldown) {
                    total += info.productPrice;
                    a.lastProduct = now;
                }
            });

            if (total === 0) return api.sendMessage(deco.warning("لا توجد منتجات حيوانية جاهزة للجمع."), threadID, messageID);
            user.money += total;
            await userData.set(senderID, { money: user.money, farm: farm });
            return api.sendMessage(deco.success(`🥚 جمعت منتجات وبعتها بمبلغ 💵 ${total}$`), threadID, messageID);
        }

        let msg = deco.titlePremium("🐄 حظيرة المواشي") + "\n\n";
        msg += deco.titleGolden("المتوفر للشراء:") + "\n";
        for (const [name, info] of Object.entries(ANIMALS)) {
            msg += deco.listItem(`${name}: ${info.price}$ | ينتج: ${info.product}`) + "\n";
        }
        msg += "\n" + deco.titleGolden("مواشيك:") + "\n";
        farm.animals.forEach((a, i) => msg += `${i+1}. ${a.type}\n`);
        msg += "\n" + deco.line("زراعة مواشي شراء [النوع] | زراعة مواشي جمع");
        return api.sendMessage(msg, threadID, messageID);
    }

    // --- 4. أدوات ---
    if (subCommand === "أدوات") {
        const toolName = args[1];
        if (toolName === "شراء") {
            const type = args[2];
            const toolInfo = TOOLS[type];
            if (!toolInfo) return api.sendMessage(deco.error("أداة غير معروفة."), threadID, messageID);
            if (user.money < toolInfo.price) return api.sendMessage(deco.error("مال غير كافٍ!"), threadID, messageID);

            user.money -= toolInfo.price;
            if (type === "محراث") farm.farmSize += 1;
            else farm.tools.push(type);
            
            await userData.set(senderID, { money: user.money, farm: farm });
            return api.sendMessage(deco.success(`🛠️ اشتريت ${type} بنجاح!`), threadID, messageID);
        }

        let msg = deco.titlePremium("🛠️ متجر الأدوات") + "\n\n";
        for (const [name, info] of Object.entries(TOOLS)) {
            msg += deco.listItem(`${name}: ${info.price}$ | ${info.desc}`) + "\n";
        }
        return api.sendMessage(msg, threadID, messageID);
    }

    // --- 5. مزرعتي ---
    if (!subCommand || subCommand === "مزرعتي") {
        let msg = deco.titlePremium(`🧑‍🌾 مزرعة ${user.name}`) + "\n\n";
        msg += deco.lineStar(`الفصل الحالي: ${currentSeason}`) + "\n";
        msg += deco.lineStar(`المساحة: ${farm.crops.length}/${farm.farmSize}`) + "\n";
        msg += deco.lineStar(`المواشي: ${farm.animals.length}`) + "\n";
        msg += deco.lineStar(`المال: 💵 ${user.money}$`) + "\n\n";
        
        if (farm.crops.length > 0) {
            msg += deco.titleGolden("المحاصيل:") + "\n";
            farm.crops.forEach(c => {
                const left = Math.max(0, Math.ceil((c.plantTime + c.growTime - now) / 60000));
                msg += deco.listItem(`${c.type} (${left === 0 ? "جاهز ✅" : left + " دقيقة"})`) + "\n";
            });
        }
        
        msg += "\n" + deco.line("زراعة [زرع/حصاد/مواشي/أدوات]");
        return api.sendMessage(msg, threadID, messageID);
    }
};
