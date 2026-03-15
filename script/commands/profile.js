const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const deco = require("../../utils/decorations"); // Assuming decorations.js is in utils
const userData = require("../../database/userData"); // Assuming userData.js is in database

module.exports.config = {
    name: "بروفايل",
    version: "1.0.0",
    hasPermssion: 0, // 0 for all users, 1 for group admins, 2 for bot admins
    credits: "Hakim Tracks",
    description: "يعرض بيانات المستخدم وصورته الشخصية",
    commandCategory: "عـــامـة",
    usages: "بروفايل [منشن/رد/آيدي]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args, userData }) => {
    const { threadID, messageID, senderID } = event;

    let targetUserID = senderID; // Default to the command issuer

    // Check for reply
    if (event.messageReply) {
        targetUserID = event.messageReply.senderID;
    }
    // Check for mention or ID in arguments
    else if (args.length > 0) {
        // Check for mention
        if (Object.keys(event.mentions).length > 0) {
            targetUserID = Object.keys(event.mentions)[0];
        }
        // Check for ID
        else if (!isNaN(args[0])) {
            targetUserID = args[0];
        }
    }

    try {
        // Get user data from the bot's database
        const userDB = await userData.get(targetUserID);

        if (!userDB || !userDB.isRegistered) {
            return api.sendMessage(
                deco.error("المستخدم غير مسجل في البوت."),
                threadID,
                messageID
            );
        }

        // Get user info from Facebook API (for name and profile picture)
        const userInfo = await api.getUserInfo(targetUserID);
        const userName = userInfo[targetUserID]?.name || "غير معروف";
        const profilePicUrl = userInfo[targetUserID]?.profileUrl || null;
        const profilePic = userInfo[targetUserID]?.thumbSrc || null; // Smaller profile picture

        let msg = deco.title(`👤 بروفايل: ${userName}`) + "\n\n";
        msg += deco.line(`الآيدي: ${targetUserID}`) + "\n";
        msg += deco.line(`اللقب: ${userDB.nickname || "لا يوجد"}`) + "\n";
        msg += deco.line(`تاريخ التسجيل: ${new Date(userDB.registeredAt).toLocaleDateString()}`) + "\n";
        msg += deco.line(`الحالة: ${userDB.status || "عادي"}`) + "\n";

        // Display Dungeon RPG stats if available
        if (userDB.dungeon) {
            const dungeon = userDB.dungeon;
            msg += deco.line(`\n--- إحصائيات المغارة ---`) + "\n";
            msg += deco.line(`الرتبة: [ ${dungeon.rank || "مبتدئ"} ]`) + "\n";
            msg += deco.line(`المستوى: ${dungeon.level || 1} (XP: ${dungeon.exp || 0}/${(dungeon.level || 1) * 500})`) + "\n";
            msg += deco.line(`الصحة: ❤️ ${dungeon.health || 0}/${dungeon.maxHealth || 0}`) + "\n";
            msg += deco.line(`المانا: 💧 ${dungeon.mana || 0}/${dungeon.maxMana || 0}`) + "\n";
            msg += deco.line(`القوة: 💪 ${dungeon.stats?.strength || 0} | الدفاع: 🛡️ ${dungeon.stats?.defense || 0}`) + "\n";
            msg += deco.line(`الذهب: 💰 ${dungeon.money || 0} | الجواهر: 💎 ${dungeon.crystals || 0}`) + "\n";
        }

        // Display Economy stats if available
        if (userDB.economy) {
            const economy = userDB.economy;
            msg += deco.line(`\n--- إحصائيات الاقتصاد ---`) + "\n";
            msg += deco.line(`المستوى الاقتصادي: ${economy.level || 1}`) + "\n";
            msg += deco.line(`الرصيد: ${economy.money || 0}$`) + "\n";
        }

        // Send message with profile picture if available
        if (profilePic) {
            const imageResponse = await axios.get(profilePic, { responseType: 'arraybuffer' });
            const imagePath = path.join(__dirname, 'cache', `${targetUserID}_profile.jpg`);
            await fs.outputFile(imagePath, imageResponse.data);

            return api.sendMessage(
                {
                    body: msg,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                messageID,
                () => fs.unlinkSync(imagePath) // Delete the cached image after sending
            );
        } else {
            return api.sendMessage(msg, threadID, messageID);
        }

    } catch (error) {
        console.error("Error in profile command:", error);
        return api.sendMessage(
            deco.error("حدث خطأ أثناء جلب بيانات البروفايل. يرجى المحاولة لاحقًا."),
            threadID,
            messageID
        );
    }
};
