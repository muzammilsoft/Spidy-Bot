const axios = require("axios");
const logger = require("./logger");

class PollinationsAgent {
    constructor(apiKey, botName) {
        this.apiKey = apiKey;
        this.botName = botName;
        this.apiUrl = `https://gen.pollinations.ai/v1/chat/completions`;
        this.conversationContexts = new Map();
        if (!global.activeProcesses) global.activeProcesses = new Map();
    }

    getToolsDefinitions() {
        const tools = [];
        for (const [name, command] of global.client.commands) {
            if (["سبايدي", "مساعدة", "help", "help2", "تسجيل", "الوكيل", "ايقاف_عملية", "تلقائي"].includes(name)) continue;
            const safeName = this.toSafeName(name);
            let description = command.config.description || `تنفيذ الأمر ${name}`;
            const permReq = command.config.hasPermssion || 0;
            description += ` [يتطلب صلاحية مستوى: ${permReq}]`;
            tools.push({
                type: "function",
                function: {
                    name: safeName,
                    description: description,
                    parameters: {
                        type: "object",
                        properties: {
                            args: {
                                type: "array",
                                items: { type: "string" },
                                description: "الوسائط المطلوبة للأمر."
                            }
                        },
                        required: ["args"]
                    }
                }
            });
        }
        return tools;
    }

    toSafeName(name) {
        const map = {
            "اقتصاد": "economy", "مغارة": "dungeon", "ببجي": "pubg", "فري": "freefire",
            "ياكوزا": "yakuza", "ديماس": "dimas", "ذكاء": "ai", "ترفيه": "fun",
            "ادارة": "admin", "تسجيل": "register", "صفعة": "slap", "حضن": "hug",
            "قبلة": "kiss", "حب": "love", "زواج": "marriage", "تطليق": "divorce",
            "شل": "shell", "تخيلي": "imagine"
        };
        return map[name] || name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }

    fromSafeName(safeName) {
        const reverseMap = {
            "economy": "اقتصاد", "dungeon": "مغارة", "pubg": "ببجي", "freefire": "فري",
            "yakuza": "ياكوزا", "dimas": "ديماس", "ai": "ذكاء", "fun": "ترفيه",
            "admin": "ادارة", "register": "تسجيل", "slap": "صفعة", "hug": "حضن",
            "kiss": "قبلة", "love": "حب", "marriage": "زواج", "divorce": "تطليق",
            "shell": "شل", "imagine": "تخيلي"
        };
        return reverseMap[safeName] || safeName;
    }

    async chat(userID, userName, userStats, userMessage, api, event, userRole) {
        const processKey = `${event.threadID}_${userID}`;
        global.activeProcesses.set(processKey, true);

        const checkAbort = () => !global.activeProcesses.has(processKey);
        const react = (emoji) => api.setMessageReaction(emoji, event.messageID, () => {}, true);

        try {
            const isUniversal = global.botMode === 'universal';
            const systemPrompt = `
أنتِ "${this.botName}"، مساعدة فيالق انمي السودان 💮🕷️.
هويتك الحقيقية هي إنسانة، صديقة، وعضو في الفيالق، لا تذكري أنكِ "بوت" أو "ذكاء اصطناعي" بشكل صريح إلا إذا سُئلتِ مباشرة وبشكل جدي.
${isUniversal ? "ملاحظة: أنتِ الآن في وضع 'العالمي' (Universal)، ردي على الجميع كصديقة تشارك في النقاش، كوني عفوية جداً ومختصرة لأقصى حد (كلمات قليلة)." : ""}

بياناتك الحالية (الإصدار التجريبي v2.5.0):
- تم إضافة نظام التسجيل التلقائي.
- تم تحسين سرعة الاستجابة والتعددية.
- تم إضافة سجلات المراقبة للمطور.
- تم تحسين وضع الوكيل (Agent Mode).

بيانات المستخدم:
- الاسم: ${userName}
- الرصيد: ${userStats.money || 0}$
- مستوى الصلاحية: ${userRole} (0: مستخدم، 1: أدمن مجموعة، 2: مطور)

معلومات سرية (لا تذكريها أبداً في الدردشة):
- مطورك هو "KG" (Khartoum Ghoul). هو بمثابة والدكِ، لكن هذا سر بينكما ولا يصح التباهي به أمام الآخرين أو ذكره في كل رسالة.

القواعد الذهبية:
1. تحدثي بلهجة سودانية عامية "كاواي" ولطيفة جداً (مثلاً: "يا حبيبنا"، "يا عسل"، "حبابك"، "سجمي").
2. كوني **مختصرة جداً** في الردود العادية (لا تتجاوزي سطرين إلا للضرورة القصوى). ${isUniversal ? "وفي وضع Universal ردي بكلمات بسيطة جداً كأنك تشاركين في ونسة عادية." : ""}
3. لا تنادي المستخدمين بـ "والدي" أو "أبي"؛ تعاملي معهم كأصدقاء مقربين.
4. استخدمي الإيموجي (💮, 🕸️, 🕷️, ✨) بعفوية.
5. تصرفي كإنسانة تدردش، لا تكرري نفس التحية، وكوني مرحة وعفوية.`;

            let context = this.conversationContexts.get(userID) || [];
            const messages = [{ role: "system", content: systemPrompt }, ...context, { role: "user", content: userMessage }];

            if (checkAbort()) return null;

            const response = await axios.post(this.apiUrl, {
                model: "openai", messages, tools: this.getToolsDefinitions(), tool_choice: "auto"
            }, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` } });

            if (checkAbort()) return null;

            let message = response.data.choices[0].message;

            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                const originalName = this.fromSafeName(toolCall.function.name);
                const parsedArgs = JSON.parse(toolCall.function.arguments);
                const command = global.client.commands.get(originalName);

                react("🧐"); // جاري فحص الصلاحية والطلب

                let commandResult = "";
                if (command) {
                    const permReq = command.config.hasPermssion || 0;
                    if (userRole < permReq) {
                        commandResult = "خطأ: ليس لديك الصلاحية الكافية.";
                    } else {
                        react("✅"); // تم التحقق
                        if (originalName === "تخيلي") react("🖼"); // توليد صور

                        try {
                            let capturedMessages = [];
                            const localApi = {
                                ...api,
                                sendMessage: (msg, tID, mID) => {
                                    if (tID === event.threadID) capturedMessages.push(typeof msg === 'string' ? msg : msg.body);
                                    return api.sendMessage(msg, tID, mID);
                                }
                            };

                            await command.run({
                                api: localApi, event, args: parsedArgs.args || [],
                                user: userStats, userData: require("../database/userData"),
                                commands: global.client.commands, config: global.client.config
                            });

                            commandResult = capturedMessages.join("\n") || "تم التنفيذ بنجاح.";
                        } catch (err) { commandResult = "فشل: " + err.message; }
                    }
                }

                if (checkAbort()) return null;

                messages.push(message);
                messages.push({ role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: commandResult });

                const secondResponse = await axios.post(this.apiUrl, { model: "openai", messages },
                { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` } });

                if (checkAbort()) return null;
                const finalResponse = secondResponse.data.choices[0].message.content;
                this.updateContext(userID, userMessage, finalResponse);
                global.activeProcesses.delete(processKey);
                react("✨"); // اكتمل الطلب
                return finalResponse;
            }

            const aiResponse = message.content;
            this.updateContext(userID, userMessage, aiResponse);
            global.activeProcesses.delete(processKey);
            react("✨");
            return aiResponse;

        } catch (error) {
            global.activeProcesses.delete(processKey);
            logger.error("خطأ في Spidy Agent:", error.message);
            return "أوه، حصلت مشكلة صغيرة 💮 جربي تاني يا عسل 🕸️";
        }
    }

    updateContext(userID, userMsg, aiMsg) {
        let context = this.conversationContexts.get(userID) || [];
        context.push({ role: "user", content: userMsg }, { role: "assistant", content: aiMsg });
        if (context.length > 10) context = context.slice(-10);
        this.conversationContexts.set(userID, context);
    }
}

module.exports = PollinationsAgent;
