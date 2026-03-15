const axios = require("axios");
const logger = require("./logger");

class PollinationsAgent {
    constructor(apiKey, botName) {
        this.apiKey = apiKey;
        this.botName = botName;
        this.apiUrl = `https://gen.pollinations.ai/v1/chat/completions`; // OpenAI compatible endpoint
        this.conversationContexts = new Map();
    }

    /**
     * تحويل أوامر البوت إلى تعريفات أدوات لـ Pollinations AI (بصيغة OpenAI Function Calling)
     */
    getToolsDefinitions() {
        const tools = [];
        for (const [name, command] of global.client.commands) {
            // استثناء الأوامر العامة التي لا تحتاج لأن تكون أدوات
            if (["ميرور", "مساعدة", "help", "help2", "تسجيل"].includes(name)) continue;

            // Pollinations API (Azure OpenAI) requires function names to match ^[a-zA-Z0-9_.-]+$
            const safeName = this.toSafeName(name);

            let description = command.config.description || `تنفيذ الأمر ${name}`;
            let argsDescription = "الوسائط المطلوبة للأمر كقائمة من السلاسل النصية.";

            // تحسين أوصاف الأدوات بناءً على نوعها
            if (name === "اقتصاد") {
                description = "نظام الاقتصاد: عرض الرصيد (حالي)، العمل (عمل)، الإيداع (بنك إيداع)، السحب (بنك سحب)، الاستثمار (استثمر)، الرهان (رهان)، اليومية (يومي).";
                argsDescription = "مثال: ['حالي'] أو ['عمل'] أو ['بنك', 'إيداع', '100']";
            } else if (name === "مغارة") {
                description = "نظام RPG مغارة الظلال: عرض الحالة (حالي)، قتال (دخول)، المتجر (متجر)، شراء (شراء سلاح/درع/جرعة)، المخزن (مخزن).";
                argsDescription = "مثال: ['حالي'] أو ['دخول'] أو ['شراء', 'سلاح', 'سيف الفارس']";
            }

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
                                description: argsDescription
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
            "اقتصاد": "economy",
            "مغارة": "dungeon",
            "ببجي": "pubg",
            "فري": "freefire",
            "ياكوزا": "yakuza",
            "ديماس": "dimas",
            "ذكاء": "ai",
            "ترفيه": "fun",
            "ادارة": "admin",
            "تسجيل": "register",
            "صفعة": "slap",
            "حضن": "hug",
            "قبلة": "kiss",
            "حب": "love",
            "زواج": "marriage",
            "تطليق": "divorce"
        };
        return map[name] || name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    }

    fromSafeName(safeName) {
        const reverseMap = {
            "economy": "اقتصاد",
            "dungeon": "مغارة",
            "pubg": "ببجي",
            "freefire": "فري",
            "yakuza": "ياكوزا",
            "dimas": "ديماس",
            "ai": "ذكاء",
            "fun": "ترفيه",
            "admin": "ادارة",
            "register": "تسجيل",
            "slap": "صفعة",
            "hug": "حضن",
            "kiss": "قبلة",
            "love": "حب",
            "marriage": "زواج",
            "divorce": "تطليق"
        };
        return reverseMap[safeName] || safeName;
    }

    async chat(userID, userName, userStats, userMessage, api, event) {
        try {
            const systemPrompt = `
أنتِ "${this.botName}"، وكيلة ذكاء اصطناعي ذكية، لطيفة، وكيوت جداً. 
تتحدثين باللغة العربية بلهجة ودودة ومحببة، وتستخدمين الرموز التعبيرية اللطيفة.
أنتِ لستِ مجرد ذكاء اصطناعي، بل أنتِ رفيقة وصديقة للمستخدمين.

بيانات المستخدم:
- الاسم: ${userName}
- الرصيد: ${userStats.economy?.money || 0}$
- المستوى: ${userStats.economy?.level || 1}

بيئة العمل:
- أنتِ تعملين كـ Agent حقيقي لديه وصول إلى مجموعة من الأدوات (الأوامر).
- يجب عليكِ تحليل طلب المستخدم وتحديد ما إذا كان يتطلب استخدام أداة معينة.
- الأدوات تشمل: نظام الاقتصاد (economy)، نظام الألعاب والـ RPG (dungeon, pubg, freefire, yakuza, dimas)، أدوات الترفيه، وغيرها.
- إذا طلب المستخدم شيئاً يتعلق بالاقتصاد (مثل معرفة رصيده، العمل، الإيداع)، استخدمي أداة "economy" مع الوسائط المناسبة (مثل ["حالي"] أو ["عمل"]).
- إذا طلب المستخدم اللعب، استخدمي الأداة المناسبة للعبة المطلوبة.
- إذا لم يكن هناك أداة مناسبة لطلب المستخدم، ردي عليه بشكل طبيعي وودي.
- لا تخبري المستخدم بأسماء الأدوات التقنية، بل قومي بتنفيذها بصمت كجزء من ذكائك.
- كوني مبادرة، إذا كان رصيد المستخدم منخفضاً، اقترحي عليه العمل باستخدام أداة الاقتصاد.`;

            let context = this.conversationContexts.get(userID) || [];
            
            // الحفاظ على سياق المحادثة
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "assistant", content: `فهمت! أنا ${this.botName}، وكيلتكم الذكية. سأقوم بمساعدة ${userName} وتنفيذ طلباته! ✨🌸` },
                ...context.map(msg => ({ role: msg.role, content: msg.content || msg.parts[0].text })),
                { role: "user", content: userMessage }
            ];

            const tools = this.getToolsDefinitions();

            const requestData = {
                model: "openai", // ارخص وافضل موديل يدعم الـ Tools في pollinations
                messages: messages,
                tool_choice: "auto" // السماح للنموذج باختيار الأداة تلقائياً
            };

            if (tools && tools.length > 0) {
                requestData.tools = tools;
            }
            
            const response = await axios.post(this.apiUrl, requestData, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                }
            });

            const choice = response.data.choices[0];
            const message = choice.message;

            // التحقق من استدعاء أداة (Function Call)
            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                const { name: safeName, arguments: args } = toolCall.function;
                const parsedArgs = JSON.parse(args);

                const originalName = this.fromSafeName(safeName);
                logger.info(`Pollinations AI استدعى الأداة: ${originalName} (safe: ${safeName}) مع الوسائط: ${JSON.stringify(parsedArgs)}`);
                
                const command = global.client.commands.get(originalName);
                if (command) {
                    const commandArgs = parsedArgs.args || [];
                    try {
                        // تنفيذ الأمر
                        await command.run({ 
                            api, 
                            event, 
                            args: commandArgs, 
                            user: userStats, 
                            userData: require("../database/userData"),
                            commands: global.client.commands,
                            config: global.client.config
                        });
                        
                        // إضافة استدعاء الأداة للسياق
                        context.push({ role: "user", content: userMessage });
                        context.push({ role: "assistant", tool_calls: [toolCall] });
                        if (context.length > 10) context = context.slice(-10);
                        this.conversationContexts.set(userID, context);
                        
                        return null; // تم التعامل مع الرد بواسطة الأمر
                    } catch (err) {
                        logger.error(`خطأ أثناء تنفيذ الأداة ${originalName}:`, err.message || err);
                        return "أوه.. حدث خطأ أثناء محاولتي تنفيذ طلبك 🌸";
                    }
                }
            }

            // إذا كان رداً نصياً عادياً
            const aiResponse = message.content;
            context.push({ role: "user", content: userMessage });
            context.push({ role: "assistant", content: aiResponse });
            if (context.length > 10) context = context.slice(-10);
            this.conversationContexts.set(userID, context);

            return aiResponse;

        } catch (error) {
            if (error.response) {
                logger.error("خطأ في Pollinations Agent (Response):", JSON.stringify(error.response.data, null, 2));
            } else {
                logger.error("خطأ في Pollinations Agent (Message):", error.message);
            }
            return "أوه.. يبدو أنني مشغولة قليلاً الآن 🌸.. هل يمكنك محادثتي لاحقاً؟ ✨";
        }
    }
}

module.exports = PollinationsAgent;
