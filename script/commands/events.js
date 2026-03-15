const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "احداث",
    version: "2.1.0", // تم تحديث الإصدار
    hasPermssion: 1,
    credits: "Hakim Tracks",
    description: "إرسال رسالة ترحيب مع صورة عند انضمام عضو جديد، وإشعارات للأحداث الأخرى.",
    commandCategory: "الــمـطـور",
    usages: "on/off",
    cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event }) {
    const { logMessageType, logMessageData, author, threadID } = event;
    const botID = api.getCurrentUserID();

    if (author === botID) return;

    try {
        switch (logMessageType) {
            case "log:subscribe":
                if (logMessageData.addedParticipants.some(p => p.userFbId === botID)) {
                    try {
                        await api.changeNickname(`❴ . ❵ • ℳ𝒾𝓇𝓇ℴ𝓇 ℬℴ𝓉`, threadID, botID);
                    } catch (e) {
                        console.error("فشل تغيير الكنية:", e);
                    }
                    api.sendMessage("وصلت عمتكم ميࢪوࢪ 🎉💖", threadID);
                    return;
                }

                for (const participant of logMessageData.addedParticipants) {
                    const { userFbId, fullName } = participant;
                    const threadInfo = await api.getThreadInfo(threadID);
                    
                    // --- الجزء الذي تم تصحيحه ---
                    
                    // 1. تعريف المتغيرات بشكل واضح
                   const backgrounds = [
  "https://i.imgur.com/dDSh0wc.jpeg",
  "https://i.imgur.com/UucSRWJ.jpeg",
  "https://i.imgur.com/OYzHKNE.jpeg",
  "https://i.imgur.com/V5L9dPi.jpeg",
  "https://i.imgur.com/M7HEAMA.jpeg"
];
                    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                    const text1 = fullName;
                    const text2 = 'نورت المجموعة يا أسطورة';
                    const text3 = `أنت العضو رقم ${threadInfo.participantIDs.length}`;
                    const avatar = `https://graph.facebook.com/${userFbId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

                    // 2. بناء رابط الـ API باستخدام المتغيرات
                    const apiUrl = `https://kaiz-apis.gleeze.com/api/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}&text3=${encodeURIComponent(text3)}&avatar=${encodeURIComponent(avatar)}`;
                    
                    // ------------------------------

                    const imagePath = path.join(__dirname, 'cache', `welcome-${userFbId}.png`);
                    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                    fs.writeFileSync(imagePath, response.data);

                    const msg = {
                        body: `أهلاً بك يا ${fullName} في مجموعتنا!`,
                        attachment: fs.createReadStream(imagePath)
                    };

                    api.sendMessage(msg, threadID, () => fs.unlinkSync(imagePath));
                }
                break;

            // ... باقي الكود كما هو ...
            case "log:unsubscribe":
                const leftParticipantId = logMessageData.leftParticipantFbId;
                try {
                    const userInfo = await api.getUserInfo(leftParticipantId);
                    const userName = userInfo[leftParticipantId].name;
                    api.sendMessage(`وداعًا ${userName}، لقد غادر/ت المجموعة.`, threadID);
                } catch (e) {
                    api.sendMessage("أحد الأعضاء غادر المجموعة.", threadID);
                }
                break;

            case "log:thread-admins":
                const targetID = logMessageData.TARGET_ID;
                const adminAction = logMessageData.ADMIN_EVENT;
                try {
                    const userInfo = await api.getUserInfo(targetID);
                    const userName = userInfo[targetID].name;
                    let message = "";
                    if (adminAction === "add_admin") {
                        message = `◈ ¦ إشعار: تمت ترقية ${userName} ليصبح مشرفًا.`;
                    } else if (adminAction === "remove_admin") {
                        message = `◈ ¦ إشعار: تمت إزالة ${userName} من الإشراف.`;
                    }
                    if (message) api.sendMessage(message, threadID);
                } catch (e) {
                    api.sendMessage("تم تحديث قائمة المشرفين.", threadID);
                }
                break;
        }
    } catch (error) {
        console.error("حدث خطأ في معالجة الحدث:", error);
    }
};

module.exports.run = async function({ api, event }) {
    api.sendMessage("هذا الأمر يعمل تلقائيًا مع أحداث المجموعة. لا حاجة لتفعيله يدويًا.", event.threadID, event.messageID);
};
