const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const PollinationsAgent = require("../../utils/pollinations_agent");

let agent;

module.exports.config = {
    name: "احداث",
    version: "3.0.0",
    hasPermssion: 1,
    credits: "KG",
    description: "معالجة أحداث المجموعة باستخدام الذكاء الاصطناعي.",
    commandCategory: "نظام",
    usages: "",
    cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event }) {
    const { logMessageType, logMessageData, author, threadID } = event;
    const botID = api.getCurrentUserID();

    if (author === botID) return;

    if (!agent) {
        agent = new PollinationsAgent(global.client.config.POLLINATIONS_API_KEY, global.client.config.BOTNAME);
    }

    try {
        let eventDescription = "";
        let showWelcomeCard = false;
        let cardData = {};

        switch (logMessageType) {
            case "log:subscribe":
                if (logMessageData.addedParticipants.some(p => p.userFbId === botID)) {
                    await api.changeNickname(`Spidy Bot`, threadID, botID);
                    eventDescription = "لقد انضممتُ للتو إلى هذه المجموعة الجديدة. رحبي بالجميع بلهجتك السودانية اللطيفة.";
                } else {
                    const names = logMessageData.addedParticipants.map(p => p.fullName).join(", ");
                    eventDescription = `انضم أعضاء جدد للمجموعة وهم: ${names}. رحبي بهم بحرارة بالعامية السودانية وبطريقتك الكاواي.`;
                    showWelcomeCard = true;
                    cardData = logMessageData.addedParticipants[0]; // نأخذ أول واحد للبطاقة
                }
                break;

            case "log:unsubscribe":
                const leftID = logMessageData.leftParticipantFbId;
                const userInfo = await api.getUserInfo(leftID);
                const userName = userInfo[leftID]?.name || "عضو";
                eventDescription = `غادر العضو ${userName} المجموعة. ودعيه بلهجة سودانية حزينة ولطيفة.`;
                break;

            case "log:thread-admins":
                const targetID = logMessageData.TARGET_ID;
                const adminAction = logMessageData.ADMIN_EVENT;
                const targetInfo = await api.getUserInfo(targetID);
                const targetName = targetInfo[targetID]?.name || "عضو";
                if (adminAction === "add_admin") {
                    eventDescription = `تمت ترقية ${targetName} ليصبح أدمن. باركي له بلهجة سودانية فخورة.`;
                } else {
                    eventDescription = `تمت إزالة ${targetName} من الإشراف. علقي على الأمر بلطف.`;
                }
                break;
        }

        if (eventDescription) {
            // طلب الرد من الذكاء الاصطناعي
            const aiResponse = await agent.chat(botID, "سبايدي", {}, eventDescription, api, event, 2);

            if (showWelcomeCard) {
                const threadInfo = await api.getThreadInfo(threadID);
                const backgrounds = ["https://i.imgur.com/dDSh0wc.jpeg", "https://i.imgur.com/UucSRWJ.jpeg", "https://i.imgur.com/OYzHKNE.jpeg"];
                const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
                const avatar = `https://graph.facebook.com/${cardData.userFbId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const apiUrl = `https://kaiz-apis.gleeze.com/api/welcomecard?background=${encodeURIComponent(background)}&text1=${encodeURIComponent(cardData.fullName)}&text2=${encodeURIComponent('نورت فيالق انمي السودان')}&text3=${encodeURIComponent(`العضو رقم ${threadInfo.participantIDs.length}`)}&avatar=${encodeURIComponent(avatar)}`;

                const imagePath = path.join(__dirname, 'cache', `welcome-${cardData.userFbId}.png`);
                if (!fs.existsSync(path.dirname(imagePath))) fs.mkdirpSync(path.dirname(imagePath));

                const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(imagePath, response.data);

                api.sendMessage({ body: aiResponse, attachment: fs.createReadStream(imagePath) }, threadID, () => {
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                });
            } else {
                api.sendMessage(aiResponse, threadID);
            }
        }
    } catch (error) {
        console.error("حدث خطأ في معالجة الحدث بالذكاء الاصطناعي:", error);
    }
};

module.exports.run = async function({ api, event }) {
    api.sendMessage("الذكاء الاصطناعي يتولى الترحيب في فيالق انمي السودان 🇸🇩💮", event.threadID, event.messageID);
};
