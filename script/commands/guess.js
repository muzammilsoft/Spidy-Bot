const axios = require("axios");

module.exports.config = {
    name: "شخصيات",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hakim Tracks",
    description: "لعبة تخمين شخصيات الأنمي من خلال الصور",
    commandCategory: "الــعــاب",
    usages: ".شخصيات",
    cooldowns: 5,
    aliases: ["guessanime"]
};

const questions = [
    { image: "https://i.imgur.com/yrEx6fs.jpg", answer: "كورومي" },
    { image: "https://i.pinimg.com/236x/63/c7/47/63c7474adaab4e36525611da528a20bd.jpg", answer: "فوليت" },
    { image: "https://i.pinimg.com/236x/b3/cd/6a/b3cd6a25d9e3451d68628b75da6b2d9e.jpg", answer: "ليفاي" },
    { image: "https://i.imgur.com/Lda2oA0.jpg", answer: "غوجو" },
    { image: "https://i.imgur.com/5B033fl.jpg", answer: "ناروتو" },
    { image: "https://i.imgur.com/1b42r3S.jpg", answer: "لوفي" }
    // يمكن إضافة المزيد من الشخصيات هنا
];

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { body, threadID, messageID, senderID } = event;
    if (handleReply.author !== senderID) return;

    if (body.toLowerCase() === handleReply.answer.toLowerCase()) {
        api.unsendMessage(handleReply.messageID);
        api.sendMessage(`✅ إجابة صحيحة! الشخصية هي: ${handleReply.answer}`, threadID, messageID);
    } else {
        api.sendMessage(`❌ إجابة خاطئة، حاول مرة أخرى!`, threadID, messageID);
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const question = questions[Math.floor(Math.random() * questions.length)];

    const msg = {
        body: "❓ من هي هذه الشخصية؟\nلديك 30 ثانية للإجابة!",
        attachment: await axios.get(question.image, { responseType: "stream" }).then(res => res.data)
    };

    api.sendMessage(msg, threadID, (err, info) => {
        if (err) return console.error(err);
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            answer: question.answer
        });
    }, messageID);
};
