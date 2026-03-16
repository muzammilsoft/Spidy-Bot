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
            if (["سبايدي", "مساعدة", "help", "help2", "تسجيل", "الوكيل", "ايقاف_عملية"].includes(name)) continue;
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

        try {
            const systemPrompt = `
أنتِ "${this.botName}"، مساعد لـ "فيالق انمي السودان" في إصدار تجريبي.
تتحدث بالعامية السودانية بأسلوب مرح وشعبي 🇸🇩.

بيانات المستخدم:
- الاسم: ${userName}
- الرصيد: ${userStats.economy?.money || 0}$
- مستوى الصلاحية: ${userRole} (0: مستخدم، 1: أدمن مجموعة، 2: مطور)

القواعد:
1. تأكد من صلاحية المستخدم قبل تنفيذ الأدوات.
2. عند استدعاء أداة (خاصة الصور)، انتظر تنفيذها بالكامل واطلع على النتيجة ثم اشرحها للمستخدم بلهجة سودانية ظريفة.
3. لا تخبر المستخدم باسم الأداة التقني.
4. تحدث دائماً بالعامية السودانية.
5. كن مختصراً جداً في ردودك، قلل الكلام قدر الإمكان ولا تطل الشرح إلا إذا طلب منك المستخدم ذلك صراحة.`;

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

                let commandResult = "";
                if (command) {
                    const permReq = command.config.hasPermssion || 0;
                    if (userRole < permReq) {
                        commandResult = "خطأ: ليس لديك الصلاحية لاستخدام هذه الأداة.";
                    } else {
                        try {
                            let capturedMessages = [];

                            // بدلاً من استبدال الدالة عالمياً، نقوم بإنشاء كائن API محلي لهذا الطلب فقط
                            const localApi = {
                                ...api,
                                sendMessage: (msg, tID, mID) => {
                                    if (tID === event.threadID) {
                                        capturedMessages.push(typeof msg === 'string' ? msg : msg.body);
                                    }
                                    return api.sendMessage(msg, tID, mID);
                                }
                            };

                            await command.run({
                                api: localApi, event, args: parsedArgs.args || [],
                                user: userStats, userData: require("../database/userData"),
                                commands: global.client.commands, config: global.client.config
                            });

                            commandResult = capturedMessages.join("\n") || "تم التنفيذ بنجاح.";
                        } catch (err) { commandResult = "فشل تنفيذ الأداة: " + err.message; }
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
                return finalResponse;
            }

            const aiResponse = message.content;
            this.updateContext(userID, userMessage, aiResponse);
            global.activeProcesses.delete(processKey);
            return aiResponse;

        } catch (error) {
            global.activeProcesses.delete(processKey);
            logger.error("خطأ في Spidy Agent:", error.message);
            return "حصلت مشكلة في الوكيل، جرب تاني يا حبيب 🇸🇩";
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
