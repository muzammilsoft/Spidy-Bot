const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "احداث",
    version: "2.2.0",
    hasPermssion: 1,
    credits: "KG",
    description: "إرسال رسالة ترحيب مع صورة عند انضمام عضو جديد، وإشعارات للأحداث الأخرى.",
    commandCategory: "الادمــــن",
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
                        await api.changeNickname(`[ . ] • Spidy Bot`, threadID, botID);
                    } catch (e) {
                        console.error("فشل تغيير الكنية:", e);
                    }
                    api.sendMessage("حبابكم يا شباب! سبايدي وصل ونور القروب 🇸🇩✨", threadID);
                    return;
                }

                for (const participant of logMessageData.addedParticipants) {
                    const { userFbId, fullName } = participant;
                    const threadInfo = await api.getThreadInfo(threadID);
                    
                   const backgrounds = [
                        "https://i.imgur.com/dDSh0wc.jpeg",
                        "https://i.imgur.com/UucSRWJ.jpeg",
                        "https://i.imgur.com/OYzHKNE.jpeg",
                        "https://i.imgur.com/V5L9dPi.jpeg",
                        "https://i.imgur.com/M7HEAMA.jpeg"
                    ];
                    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                    const text1 = fullName;
                    const text2 = 'نورت فيالق انمي السودان يا بطل';
                    const text3 = `أنت العضو رقم ${threadInfo.participantIDs.length}`;
                    const avatar = `https://graph.facebook.com/${userFbId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

                    const apiUrl = `https://kaiz-apis.gleeze.com/api/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}&text3=${encodeURIComponent(text3)}&avatar=${encodeURIComponent(avatar)}`;
                    
                    const cacheDir = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                    const imagePath = path.join(cacheDir, `welcome-${userFbId}.png`);

                    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                    fs.writeFileSync(imagePath, response.data);

                    const msg = {
                        body: `حبابك يا ${fullName}! نورت دارك في فيالق انمي السودان 🇸🇩✨`,
                        attachment: fs.createReadStream(imagePath)
                    };

                    api.sendMessage(msg, threadID, () => {
                        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                    });
                }
                break;

            case "log:unsubscribe":
                const leftParticipantId = logMessageData.leftParticipantFbId;
                try {
                    const userInfo = await api.getUserInfo(leftParticipantId);
                    const userName = userInfo[leftParticipantId].name;
                    api.sendMessage(`وداعاً يا ${userName}، نتمنى نشوفك تاني في فيالق انمي السودان 🇸🇩👋`, threadID);
                } catch (e) {
                    api.sendMessage("واحد من الشباب فارقنا، بالتوفيق ليهو 🇸🇩👋", threadID);
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
                        message = `◈ ¦ أبشروا! ${userName} بقى أدمن جديد في المجموعة 🎖️`;
                    } else if (adminAction === "remove_admin") {
                        message = `◈ ¦ للأسف، ${userName} اتنحى من الإشراف 🔻`;
                    }
                    if (message) api.sendMessage(message, threadID);
                } catch (e) {
                    api.sendMessage("تم تحديث قائمة المشرفين في فيالق انمي السودان 🇸🇩", threadID);
                }
                break;
        }
    } catch (error) {
        console.error("حدث خطأ في معالجة الحدث:", error);
    }
};

module.exports.run = async function({ api, event }) {
    api.sendMessage("الأحداث شغالة تلقائياً مع فيالق انمي السودان 🇸🇩✨", event.threadID, event.messageID);
};
