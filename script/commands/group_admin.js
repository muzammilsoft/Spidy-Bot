const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const deco = require("../../utils/decorations");

module.exports.config = {
    name: "مجموعتي",
    version: "1.0.0",
    hasPermssion: 1, // Only group admins can use this command
    credits: "Hakim Tracks",
    description: "أوامر إدارية للمجموعات (للمشرفين فقط)",
    commandCategory: "الادمــــن",
    usages: "ادارة_مجموعة [طرد|اضافة|تصفيه|كنية|اسم|صورة]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // Check if the sender is a group admin or bot admin
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID) || config.ADMINBOT.includes(senderID);

    if (!isAdmin) {
        return api.sendMessage(deco.error("🚫 هذا الأمر متاح فقط لمشرفي المجموعة أو مطوري البوت."), threadID, messageID);
    }

    switch (subCommand) {
        case "طرد":
        case "kick":
            let kickUserID;
            if (event.messageReply) {
                kickUserID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                kickUserID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                kickUserID = args[1];
            } else {
                return api.sendMessage(deco.error("الاستخدام: ادارة_مجموعة طرد [منشن/رد/آيدي]"), threadID, messageID);
            }

            if (kickUserID === api.getCurrentUserID()) {
                return api.sendMessage(deco.error("لا يمكنني طرد نفسي!"), threadID, messageID);
            }
            if (config.ADMINBOT.includes(kickUserID)) {
                return api.sendMessage(deco.error("لا يمكنني طرد مطور البوت!"), threadID, messageID);
            }

            try {
                await api.removeUserFromGroup(kickUserID, threadID);
                return api.sendMessage(deco.success(`✅ تم طرد المستخدم (ID: ${kickUserID}) بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error kicking user:", error);
                return api.sendMessage(deco.error(`❌ فشل طرد المستخدم (ID: ${kickUserID}).`), threadID, messageID);
            }

        case "اضافة":
        case "add":
            let addUserID;
            if (Object.keys(event.mentions).length > 0) {
                addUserID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                addUserID = args[1];
            } else {
                return api.sendMessage(deco.error("الاستخدام: ادارة_مجموعة اضافة [آيدي المستخدم]"), threadID, messageID);
            }

            try {
                await api.addUserToGroup(addUserID, threadID);
                return api.sendMessage(deco.success(`✅ تم إضافة المستخدم (ID: ${addUserID}) بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error adding user:", error);
                return api.sendMessage(deco.error(`❌ فشل إضافة المستخدم (ID: ${addUserID}). قد يكون المستخدم محظوراً أو حدث خطأ آخر.`), threadID, messageID);
            }

        case "تصفيه":
        case "cleanup":
            try {
                const participants = threadInfo.participantIDs;
                let removedCount = 0;
                let msg = deco.title("🧹 جاري تصفية المجموعة من الحسابات المعطلة/المحذوفة...") + "\n\n";
                await api.sendMessage(msg, threadID, messageID);

                for (const pID of participants) {
                    if (pID === api.getCurrentUserID()) continue; // Don't try to remove self
                    if (config.ADMINBOT.includes(pID)) continue; // Don't remove bot admins

                    try {
                        const userInfo = await api.getUserInfo(pID);
                        if (!userInfo[pID] || userInfo[pID].isFriend === false && userInfo[pID].isGroup === false) { // Check if user is not friend and not group (often indicates deleted/deactivated)
                            await api.removeUserFromGroup(pID, threadID);
                            removedCount++;
                            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
                        }
                    } catch (e) {
                        // If getUserInfo fails, it might be a deleted account
                        await api.removeUserFromGroup(pID, threadID);
                        removedCount++;
                        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
                    }
                }
                return api.sendMessage(deco.success(`✅ تم تصفية المجموعة. تم طرد ${removedCount} حساب معطل/محذوف.`), threadID, messageID);
            } catch (error) {
                console.error("Error during cleanup:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أثناء تصفية المجموعة."), threadID, messageID);
            }

        case "كنية":
        case "nickname":
            let nicknameUserID;
            let newNickname;

            if (event.messageReply) {
                nicknameUserID = event.messageReply.senderID;
                newNickname = args.slice(1).join(" ");
            } else if (Object.keys(event.mentions).length > 0) {
                nicknameUserID = Object.keys(event.mentions)[0];
                newNickname = args.slice(1).join(" ").replace(event.mentions[nicknameUserID], "").trim();
            } else if (args[1] && !isNaN(args[1])) {
                nicknameUserID = args[1];
                newNickname = args.slice(2).join(" ");
            } else {
                return api.sendMessage(deco.error("الاستخدام: ادارة_مجموعة كنية [منشن/رد/آيدي] [الكنية الجديدة]"), threadID, messageID);
            }

            if (!newNickname) {
                return api.sendMessage(deco.error("يرجى تحديد الكنية الجديدة."), threadID, messageID);
            }

            try {
                await api.changeNickname(newNickname, threadID, nicknameUserID);
                return api.sendMessage(deco.success(`✅ تم تغيير كنية المستخدم (ID: ${nicknameUserID}) إلى: ${newNickname}`), threadID, messageID);
            } catch (error) {
                console.error("Error changing nickname:", error);
                return api.sendMessage(deco.error(`❌ فشل تغيير كنية المستخدم (ID: ${nicknameUserID}).`), threadID, messageID);
            }

        case "اسم":
        case "setname":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة_مجموعة اسم [الاسم الجديد للمجموعة]"), threadID, messageID);
            }
            const newGroupName = args.slice(1).join(" ");
            try {
                await api.setTitle(newGroupName, threadID);
                return api.sendMessage(deco.success(`✅ تم تغيير اسم المجموعة إلى: ${newGroupName}`), threadID, messageID);
            } catch (error) {
                console.error("Error changing group name:", error);
                return api.sendMessage(deco.error("❌ فشل تغيير اسم المجموعة."), threadID, messageID);
            }

        case "صورة":
        case "setimage":
            let groupImageUrl;
            if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0 && event.messageReply.attachments[0].type === "Photo") {
                groupImageUrl = event.messageReply.attachments[0].url;
            } else if (args[1] && (args[1].startsWith("http") || args[1].startsWith("https"))) {
                groupImageUrl = args[1];
            } else {
                return api.sendMessage(deco.error("الاستخدام: ادارة_مجموعة صورة [رابط الصورة] أو الرد على صورة."), threadID, messageID);
            }

            try {
                const imageResponse = await axios.get(groupImageUrl, { responseType: 'arraybuffer' });
                const imagePath = path.join(__dirname, 'cache', `${threadID}_group_image.jpg`);
                await fs.outputFile(imagePath, imageResponse.data);

                await api.changeGroupImage(fs.createReadStream(imagePath), threadID);
                fs.unlinkSync(imagePath); // Clean up cached image
                return api.sendMessage(deco.success("✅ تم تغيير صورة المجموعة بنجاح."), threadID, messageID);
            } catch (error) {
                console.error("Error changing group image:", error);
                return api.sendMessage(deco.error("❌ فشل تغيير صورة المجموعة. تأكد من صحة الرابط أو أن المرفق صورة."), threadID, messageID);
            }

        default:
            let helpMsg = deco.title("🛠️ أوامر إدارة المجموعة (للمشرفين)") + "\n\n";
            helpMsg += deco.line("• ادارة_مجموعة طرد [منشن/رد/آيدي] - طرد عضو من المجموعة.") + "\n";
            helpMsg += deco.line("• ادارة_مجموعة اضافة [آيدي المستخدم] - إضافة عضو للمجموعة.") + "\n";
            helpMsg += deco.line("• ادارة_مجموعة تصفيه - طرد الحسابات المعطلة/المحذوفة.") + "\n";
            helpMsg += deco.line("• ادارة_مجموعة كنية [منشن/رد/آيدي] [الكنية الجديدة] - تغيير كنية عضو.") + "\n";
            helpMsg += deco.line("• ادارة_مجموعة اسم [الاسم الجديد] - تغيير اسم المجموعة.") + "\n";
            helpMsg += deco.line("• ادارة_مجموعة صورة [رابط الصورة/رد على صورة] - تغيير صورة المجموعة.") + "\n";
            return api.sendMessage(helpMsg, threadID, messageID);
    }
};
