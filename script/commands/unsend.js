module.exports.config = {
    name: "مسح",
    version: "1.0.1",
    hasPermssion: 1,
    credits: "Hakim Tracks",
    description: "ا",
    commandCategory: "عـــامـة",
    usages: "حذف رسائل البوت",
    cooldowns: 0
};

module.exports.languages = {
    "vi": {
        "returnCant": "Không thể gỡ tin nhắn của người khác.",
        "missingReply": "Hãy reply tin nhắn cần gỡ."
    },
    "en": {
        "returnCant": "اقول تدخل حسابه وتحذفها 🙂🗡️",
        "missingReply": "رد عا رسالتي 🙂"
    }
}

module.exports.run = function({ api, event, getText }) {
    if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    if (event.type != "message_reply") return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    return api.unsendMessage(event.messageReply.messageID);
}
