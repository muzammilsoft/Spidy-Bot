const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const deco = require("../../utils/decorations");

// نظام الحظر المركزي (للحفاظ على الوظائف الموجودة)
if (!global.bannedUsers) global.bannedUsers = new Set();
if (!global.bannedGroups) global.bannedGroups = new Set();

module.exports.config = {
    name: "ادارة",
    version: "3.0.0",
    hasPermssion: 2, // Only bot admins can use this command
    credits: "KG",
    description: "أوامر إدارية متقدمة للتحكم بالبوت والمجموعات",
    commandCategory: "الــمـطـور",
    usages: "ادارة [مجموعات|مغادرة|اسم_مجموعة|صورة_مجموعة|اذاعة|اذاعة_صورة|صورة_بوت|بايو_بوت|طلبات_صداقة|قبول_صداقة|رفض_صداقة|طلبات_مجموعات|قبول_مجموعة|رفض_مجموعة|حظر|إلغاء_حظر|حظر_جروب|إلغاء_حظر_جروب|تشغيل|ايقاف|إحصائيات]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args, config }) => {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();

    // Check if the user is a bot admin
    if (!config.ADMINBOT.includes(senderID)) {
        return api.sendMessage(deco.error("🚫 ليس لديك الصلاحية لاستخدام هذا الأمر."), threadID, messageID);
    }

    switch (subCommand) {
        // --- أوامر التحكم بالبوت (موجودة سابقاً وتم دمجها) ---
        case "ايقاف":
        case "stop":
            global.isBotActive = false;
            return api.sendMessage(
                deco.titlePremium("🛑 تم إيقاف البوت") + "\n\n" +
                deco.lineStar("البوت الآن في وضع السكون") + "\n" +
                deco.lineStar("لتشغيله مجدداً: ادارة تشغيل"),
                threadID,
                messageID
            );

        case "تشغيل":
        case "start":
            global.isBotActive = true;
            return api.sendMessage(
                deco.titlePremium("✅ تم تشغيل البوت") + "\n\n" +
                deco.lineStar("البوت الآن نشط وجاهز للعمل") + "\n" +
                deco.lineStar("استعد للارتقاء لمستوى الـ Monarch! 👑"),
                threadID,
                messageID
            );

        case "إحصائيات":
        case "stats":
            const uptime = Date.now() - global.client.startTime;
            const uptimeHours = Math.floor(uptime / 3600000);
            const uptimeMinutes = Math.floor((uptime % 3600000) / 60000);
            
            let stats = deco.titlePremium("📊 إحصائيات البوت") + "\n\n";
            stats += deco.lineStar(`عدد الأوامر: ${global.client.commands.size}`) + "\n";
            stats += deco.lineStar(`عدد الأحداث: ${global.client.events.size}`) + "\n";
            stats += deco.lineStar(`وقت التشغيل: ${uptimeHours}س ${uptimeMinutes}د`) + "\n";
            stats += deco.lineStar(`المستخدمون المحظورون: ${global.bannedUsers.size}`) + "\n";
            stats += deco.lineStar(`المجموعات المحظورة: ${global.bannedGroups.size}`) + "\n";
            stats += deco.lineStar(`حالة البوت: ${global.isBotActive ? "🟢 نشط" : "🔴 معطل"}`) + "\n";
            
            return api.sendMessage(stats, threadID, messageID);

        // --- أوامر حظر/إلغاء حظر المستخدمين والمجموعات (موجودة سابقاً وتم دمجها) ---
        case "حظر":
        case "ban":
            const targetBanID = args[1];
            if (!targetBanID) {
                return api.sendMessage(deco.error("يرجى تحديد معرف المستخدم: ادارة حظر [معرف]"), threadID, messageID);
            }
            global.bannedUsers.add(targetBanID);
            return api.sendMessage(deco.success(`🚫 تم حظر المستخدم: ${targetBanID}`), threadID, messageID);

        case "إلغاء_حظر":
        case "unban":
            const targetUnbanID = args[1];
            if (!targetUnbanID) {
                return api.sendMessage(deco.error("يرجى تحديد معرف المستخدم: ادارة إلغاء_حظر [معرف]"), threadID, messageID);
            }
            global.bannedUsers.delete(targetUnbanID);
            return api.sendMessage(deco.success(`✅ تم إلغاء حظر المستخدم: ${targetUnbanID}`), threadID, messageID);

        case "حظر_جروب":
        case "ban_group":
            const targetBanGroupID = args[1];
            if (!targetBanGroupID) {
                return api.sendMessage(deco.error("يرجى تحديد معرف المجموعة: ادارة حظر_جروب [معرف]"), threadID, messageID);
            }
            global.bannedGroups.add(targetBanGroupID);
            return api.sendMessage(deco.success(`🚫 تم حظر المجموعة: ${targetBanGroupID}`), threadID, messageID);

        case "إلغاء_حظر_جروب":
        case "unban_group":
            const targetUnbanGroupID = args[1];
            if (!targetUnbanGroupID) {
                return api.sendMessage(deco.error("يرجى تحديد معرف المجموعة: ادارة إلغاء_حظر_جروب [معرف]"), threadID, messageID);
            }
            global.bannedGroups.delete(targetUnbanGroupID);
            return api.sendMessage(deco.success(`✅ تم إلغاء حظر المجموعة: ${targetUnbanGroupID}`), threadID, messageID);

        // --- أوامر إدارة المجموعات ---
        case "مجموعات":
        case "groups":
            try {
                const threadList = await api.getThreadList(200, null, ["INBOX"]);
                let msg = deco.title("📋 قائمة المجموعات التي يتواجد بها البوت") + "\n\n";
                let count = 0;
                for (const thread of threadList) {
                    if (thread.isGroup) { 
                        msg += deco.line(`- ${thread.name} (ID: ${thread.threadID})`) + "\n";
                        count++;
                    }
                }
                if (count === 0) {
                    msg += deco.line("لا يتواجد البوت في أي مجموعات.");
                }
                return api.sendMessage(msg, threadID, messageID);
            } catch (error) {
                console.error("Error getting thread list:", error);
                return api.sendMessage(deco.error("حدث خطأ أثناء جلب قائمة المجموعات."), threadID, messageID);
            }

        case "مغادرة":
        case "leave":
            const leaveThreadID = args[1] || threadID;
            try {
                return api.sendMessage("👋 مع السلامة يا شباب، طالع من هنا..", leaveThreadID, () => {
                    api.removeUserFromGroup(api.getCurrentUserID(), leaveThreadID, (err) => {
                        if (err) return api.sendMessage(`❌ فشل المغادرة: ${err.message || err}`, threadID, messageID);
                    });
                });
            } catch (error) {
                console.error("Error leaving group:", error);
                return api.sendMessage(deco.error(`❌ فشل مغادرة المجموعة: ${leaveThreadID}.`), threadID, messageID);
            }

        case "اسم_مجموعة":
        case "setname":
            if (args.length < 3) {
                return api.sendMessage(deco.error("الاستخدام: ادارة اسم_مجموعة [threadID] [الاسم الجديد]"), threadID, messageID);
            }
            const setNameThreadID = args[1];
            const newThreadName = args.slice(2).join(" ");
            try {
                await api.setTitle(newThreadName, setNameThreadID);
                return api.sendMessage(deco.success(`✅ تم تغيير اسم المجموعة ${setNameThreadID} إلى: ${newThreadName}`), threadID, messageID);
            } catch (error) {
                console.error("Error changing group name:", error);
                return api.sendMessage(deco.error(`❌ فشل تغيير اسم المجموعة ${setNameThreadID}.`), threadID, messageID);
            }

        case "صورة_مجموعة":
        case "setimage":
            if (args.length < 3) {
                return api.sendMessage(deco.error("الاستخدام: ادارة صورة_مجموعة [threadID] [رابط الصورة]"), threadID, messageID);
            }
            const setImageThreadID = args[1];
            const imageUrl = args[2];
            try {
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imagePath = path.join(__dirname, 'cache', `${setImageThreadID}_group_image.jpg`);
                await fs.outputFile(imagePath, imageResponse.data);

                await api.changeGroupImage(fs.createReadStream(imagePath), setImageThreadID);
                fs.unlinkSync(imagePath); // Clean up cached image
                return api.sendMessage(deco.success(`✅ تم تغيير صورة المجموعة ${setImageThreadID} بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error changing group image:", error);
                return api.sendMessage(deco.error(`❌ فشل تغيير صورة المجموعة ${setImageThreadID}. تأكد من صحة الرابط.`), threadID, messageID);
            }

        // --- أوامر الإذاعة العامة ---
        case "اذاعة":
        case "broadcast":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة اذاعة [رسالة]"), threadID, messageID);
            }
            const broadcastMessage = args.slice(1).join(" ");
            try {
                const threadList = await api.getThreadList(400, null, ["INBOX", "PENDING", "OTHER"]);
                let sentCount = 0;
                for (const thread of threadList) {
                    if (thread.threadID !== threadID) {
                        await new Promise(resolve => {
                            api.sendMessage(broadcastMessage, thread.threadID, (err) => {
                                if (!err) sentCount++;
                                resolve();
                            });
                        });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                return api.sendMessage(deco.success(`✅ تم إرسال الإذاعة إلى ${sentCount} محادثة بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error broadcasting message:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أثناء إرسال الإذاعة."), threadID, messageID);
            }

        case "اذاعة_صورة":
        case "broadcast_image":
            if (args.length < 3) {
                return api.sendMessage(deco.error("الاستخدام: ادارة اذاعة_صورة [رابط الصورة] [رسالة]"), threadID, messageID);
            }
            const broadcastImageUrl = args[1];
            const broadcastImageMessage = args.slice(2).join(" ");
            try {
                const imageResponse = await axios.get(broadcastImageUrl, { responseType: 'arraybuffer' });
                const imagePath = path.join(__dirname, 'cache', `broadcast_image.jpg`);
                await fs.outputFile(imagePath, imageResponse.data);

                const threadList = await api.getThreadList(200, null, ["INBOX"]);
                let sentCount = 0;
                for (const thread of threadList) {
                    if (thread.isGroup && thread.threadID !== threadID) { // Exclude current thread
                        await api.sendMessage(
                            {
                                body: broadcastImageMessage,
                                attachment: fs.createReadStream(imagePath)
                            },
                            thread.threadID
                        );
                        sentCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay
                    }
                }
                fs.unlinkSync(imagePath); // Clean up cached image
                return api.sendMessage(deco.success(`✅ تم إرسال الإذاعة بالصورة إلى ${sentCount} مجموعة بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error broadcasting image:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أثناء إرسال الإذاعة بالصورة. تأكد من صحة الرابط."), threadID, messageID);
            }

        // --- أوامر التحكم بحساب البوت ---
        case "صورة_بوت":
        case "setavatar":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة صورة_بوت [رابط الصورة]"), threadID, messageID);
            }
            const botAvatarUrl = args[1];
            try {
                const imageResponse = await axios.get(botAvatarUrl, { responseType: 'arraybuffer' });
                const imagePath = path.join(__dirname, 'cache', `bot_avatar.jpg`);
                await fs.outputFile(imagePath, imageResponse.data);

                await api.changeAvatar(fs.createReadStream(imagePath));
                fs.unlinkSync(imagePath); // Clean up cached image
                return api.sendMessage(deco.success("✅ تم تغيير صورة البوت الشخصية بنجاح."), threadID, messageID);
            } catch (error) {
                console.error("Error changing bot avatar:", error);
                return api.sendMessage(deco.error("❌ فشل تغيير صورة البوت الشخصية. تأكد من صحة الرابط."), threadID, messageID);
            }

        case "بايو_بوت":
        case "setbio":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة بايو_بوت [البايو الجديد]"), threadID, messageID);
            }
            const newBotBio = args.slice(1).join(" ");
            try {
                await api.changeBio(newBotBio);
                return api.sendMessage(deco.success("✅ تم تغيير بايو البوت بنجاح."), threadID, messageID);
            } catch (error) {
                console.error("Error changing bot bio:", error);
                return api.sendMessage(deco.error("❌ فشل تغيير بايو البوت."), threadID, messageID);
            }

        // --- أوامر إدارة طلبات الصداقة والمجموعات ---
        case "طلبات":
        case "requests":
        case "طلبات_مجموعات":
        case "group_invites":
            try {
                let msg = deco.title("✉️ طلبات معلقة") + "\n\n";

                // طلبات الصداقة
                try {
                    const friendRequests = await api.getFriendRequests();
                    msg += "👥 **طلبات الصداقة:**\n";
                    if (!friendRequests || friendRequests.length === 0) {
                        msg += "لا توجد طلبات معلقة.\n";
                    } else {
                        for (const req of friendRequests) {
                            const userInfo = await api.getUserInfo(req.userID);
                            const userName = userInfo[req.userID]?.name || "غير معروف";
                            msg += `- ${userName} (ID: ${req.userID})\n`;
                        }
                    }
                } catch (e) { msg += "⚠️ لا يمكن جلب طلبات الصداقة حالياً.\n"; }

                msg += "\n" + deco.separatorDots + "\n\n";

                // طلبات المجموعات (PENDING threads are where invites usually are)
                try {
                    const threadList = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
                    msg += "✉️ **دعوات المجموعات / الرسائل:**\n";
                    let count = 0;
                    for (const thread of threadList) {
                        msg += `- ${thread.name || "مجموعة غير معروفة"} (ID: ${thread.threadID})\n`;
                        count++;
                    }
                    if (count === 0) msg += "لا توجد دعوات معلقة.\n";
                } catch (e) { msg += "⚠️ لا يمكن جلب دعوات المجموعات حالياً.\n"; }

                msg += "\n💡 استخدم: ادارة قبول_صداقة [ID] أو قبول_مجموعة [ID]";
                return api.sendMessage(msg, threadID, messageID);
            } catch (error) {
                console.error("Error getting requests:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أثناء جلب الطلبات."), threadID, messageID);
            }

        case "طلبات_صداقة":
        case "friend_requests":
            try {
                const friendRequests = await api.getFriendRequests();
                if (!friendRequests || friendRequests.length === 0) {
                    return api.sendMessage(deco.info("لا توجد طلبات صداقة معلقة."), threadID, messageID);
                }
                let msg = deco.title("👥 طلبات الصداقة المعلقة") + "\n\n";
                for (const req of friendRequests) {
                    const userInfo = await api.getUserInfo(req.userID);
                    const userName = userInfo[req.userID]?.name || "غير معروف";
                    msg += deco.line(`- ${userName} (ID: ${req.userID})`) + "\n";
                }
                msg += deco.line("\nاستخدم: ادارة قبول_صداقة [userID] أو ادارة رفض_صداقة [userID]");
                return api.sendMessage(msg, threadID, messageID);
            } catch (error) {
                console.error("Error getting friend requests:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أو الوظيفة غير مدعومة حالياً."), threadID, messageID);
            }

        case "قبول_صداقة":
        case "accept_friend":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة قبول_صداقة [userID]"), threadID, messageID);
            }
            const acceptFriendID = args[1];
            try {
                await api.handleFriendRequest(acceptFriendID, true);
                return api.sendMessage(deco.success(`✅ تم قبول طلب الصداقة من ${acceptFriendID} بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error accepting friend request:", error);
                return api.sendMessage(deco.error(`❌ فشل قبول طلب الصداقة من ${acceptFriendID}.`), threadID, messageID);
            }

        case "رفض_صداقة":
        case "decline_friend":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة رفض_صداقة [userID]"), threadID, messageID);
            }
            const declineFriendID = args[1];
            try {
                await api.handleFriendRequest(declineFriendID, false);
                return api.sendMessage(deco.success(`✅ تم رفض طلب الصداقة من ${declineFriendID} بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error declining friend request:", error);
                return api.sendMessage(deco.error(`❌ فشل رفض طلب الصداقة من ${declineFriendID}.`), threadID, messageID);
            }

        case "طلبات_مجموعات":
        case "group_invites":
            try {
                const groupRequests = await api.getGroupRequests();
                if (!groupRequests || groupRequests.length === 0) {
                    return api.sendMessage(deco.info("لا توجد دعوات مجموعات معلقة."), threadID, messageID);
                }
                let msg = deco.title("✉️ دعوات المجموعات المعلقة") + "\n\n";
                for (const req of groupRequests) {
                    const threadInfo = await api.getThreadInfo(req.threadID);
                    const threadName = threadInfo.threadName || "غير معروف";
                    msg += deco.line(`- ${threadName} (ID: ${req.threadID})`) + "\n";
                }
                msg += deco.line("\nاستخدم: ادارة قبول_مجموعة [threadID] أو ادارة رفض_مجموعة [threadID]");
                return api.sendMessage(msg, threadID, messageID);
            } catch (error) {
                console.error("Error getting group requests:", error);
                return api.sendMessage(deco.error("❌ حدث خطأ أو الوظيفة غير مدعومة حالياً."), threadID, messageID);
            }

        case "قبول_مجموعة":
        case "accept_group":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة قبول_مجموعة [threadID]"), threadID, messageID);
            }
            const acceptGroupID = args[1];
            try {
                // handleMessageRequest is often what works for pending threads
                api.handleMessageRequest(acceptGroupID, true, (err) => {
                    if (err) return api.sendMessage(`❌ فشل القبول: ${err.message || err}`, threadID, messageID);
                    return api.sendMessage(deco.success(`✅ تم قبول دعوة المجموعة ${acceptGroupID} بنجاح.`), threadID, messageID);
                });
            } catch (error) {
                console.error("Error accepting group invite:", error);
                return api.sendMessage(deco.error(`❌ فشل قبول دعوة المجموعة ${acceptGroupID}.`), threadID, messageID);
            }

        case "رفض_مجموعة":
        case "decline_group":
            if (args.length < 2) {
                return api.sendMessage(deco.error("الاستخدام: ادارة رفض_مجموعة [threadID]"), threadID, messageID);
            }
            const declineGroupID = args[1];
            try {
                await api.handleGroupRequest(declineGroupID, false);
                return api.sendMessage(deco.success(`✅ تم رفض دعوة المجموعة ${declineGroupID} بنجاح.`), threadID, messageID);
            } catch (error) {
                console.error("Error declining group invite:", error);
                return api.sendMessage(deco.error(`❌ فشل رفض دعوة المجموعة ${declineGroupID}.`), threadID, messageID);
            }

        default:
            let helpMsg = deco.title("🛠️ أوامر الإدارة المتاحة") + "\n\n";
            helpMsg += deco.line("• ادارة تشغيل/ايقاف - تشغيل أو إيقاف البوت.") + "\n";
            helpMsg += deco.line("• ادارة إحصائيات - عرض إحصائيات البوت.") + "\n";
            helpMsg += deco.line("• ادارة حظر [userID] - حظر مستخدم.") + "\n";
            helpMsg += deco.line("• ادارة إلغاء_حظر [userID] - إلغاء حظر مستخدم.") + "\n";
            helpMsg += deco.line("• ادارة حظر_جروب [threadID] - حظر مجموعة.") + "\n";
            helpMsg += deco.line("• ادارة إلغاء_حظر_جروب [threadID] - إلغاء حظر مجموعة.") + "\n";
            helpMsg += deco.line("• ادارة مجموعات - عرض قائمة المجموعات التي يتواجد بها البوت.") + "\n";
            helpMsg += deco.line("• ادارة مغادرة [threadID] - مغادرة مجموعة محددة.") + "\n";
            helpMsg += deco.line("• ادارة اسم_مجموعة [threadID] [الاسم الجديد] - تغيير اسم مجموعة.") + "\n";
            helpMsg += deco.line("• ادارة صورة_مجموعة [threadID] [رابط الصورة] - تغيير صورة مجموعة.") + "\n";
            helpMsg += deco.line("• ادارة اذاعة [رسالة] - إرسال رسالة لجميع المجموعات.") + "\n";
            helpMsg += deco.line("• ادارة اذاعة_صورة [رابط الصورة] [رسالة] - إرسال رسالة وصورة لجميع المجموعات.") + "\n";
            helpMsg += deco.line("• ادارة صورة_بوت [رابط الصورة] - تغيير صورة البوت الشخصية.") + "\n";
            helpMsg += deco.line("• ادارة بايو_بوت [البايو الجديد] - تغيير بايو البوت.") + "\n";
            helpMsg += deco.line("• ادارة طلبات_صداقة - عرض طلبات الصداقة المعلقة.") + "\n";
            helpMsg += deco.line("• ادارة قبول_صداقة [userID] - قبول طلب صداقة.") + "\n";
            helpMsg += deco.line("• ادارة رفض_صداقة [userID] - رفض طلب صداقة.") + "\n";
            helpMsg += deco.line("• ادارة طلبات_مجموعات - عرض دعوات المجموعات المعلقة.") + "\n";
            helpMsg += deco.line("• ادارة قبول_مجموعة [threadID] - قبول دعوة مجموعة.") + "\n";
            helpMsg += deco.line("• ادارة رفض_مجموعة [threadID] - رفض دعوة مجموعة.") + "\n";
            return api.sendMessage(helpMsg, threadID, messageID);
    }
};

// دالة للتحقق من الحظر (للحفاظ على الوظائف الموجودة)
module.exports.handleEvent = async ({ api, event, userData }) => {
    const { senderID, threadID } = event;

    if (global.bannedUsers.has(senderID)) {
        // لا تفعل شيئاً - المستخدم محظور
        return;
    }

    if (global.bannedGroups.has(threadID)) {
        // لا تفعل شيئاً - المجموعة محظورة
        return;
    }
};
