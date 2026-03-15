const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const deco = require("../../utils/decorations");

module.exports.config = {
    name: "مجموعة",
    version: "1.1.0", // Updated version
    hasPermssion: 0, // All users can use this command
    credits: "Hakim Tracks",
    description: "يعرض معلومات المجموعة الحالية وصورتها، رمزها وسمتها",
    commandCategory: "عـــامـة",
    usages: "مجموعة",
    cooldowns: 5
};

module.exports.run = async ({ api, event, userData }) => {
    const { threadID, messageID } = event;

    try {
        const threadInfo = await api.getThreadInfo(threadID);

        let msg = deco.title(`ℹ️ معلومات المجموعة: ${threadInfo.threadName}`) + "\n\n";
        msg += deco.line(`الآيدي: ${threadInfo.threadID}`) + "\n";
        msg += deco.line(`عدد الأعضاء: ${threadInfo.participantIDs.length}`) + "\n";

        // Add Emoji and Theme
        msg += deco.line(`رمز المجموعة: ${threadInfo.emoji || "لا يوجد"}`) + "\n";
        msg += deco.line(`سمة الألوان: ${threadInfo.color || "افتراضي"}`) + "\n";

        // List group admins
        if (threadInfo.adminIDs && threadInfo.adminIDs.length > 0) {
            let adminNames = [];
            for (const admin of threadInfo.adminIDs) {
                const userInfo = await api.getUserInfo(admin.id);
                adminNames.push(userInfo[admin.id]?.name || `غير معروف (ID: ${admin.id})`);
            }
            msg += deco.line(`المشرفون: ${adminNames.join(", ")}`) + "\n";
        } else {
            msg += deco.line(`المشرفون: لا يوجد`) + "\n";
        }

        msg += deco.line(`تاريخ الإنشاء: ${new Date(threadInfo.createdAt).toLocaleDateString()}`) + "\n";
        msg += deco.line(`نوع المجموعة: ${threadInfo.isGroup ? "مجموعة" : "محادثة فردية"}`) + "\n";

        // Check for group image
        if (threadInfo.imageSrc) {
            const imageResponse = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
            const imagePath = path.join(__dirname, 'cache', `${threadID}_group_image.jpg`);
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
        console.error("Error in group_info command:", error);
        return api.sendMessage(
            deco.error("حدث خطأ أثناء جلب معلومات المجموعة. يرجى التأكد من أن البوت عضو في هذه المجموعة."),
            threadID,
            messageID
        );
    }
};
