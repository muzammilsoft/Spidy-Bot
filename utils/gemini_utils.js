/**
 * أدوات مساعدة متقدمة لـ Gemini AI
 * توفر وظائف مساعدة لمعالجة الطلبات والردود
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || require('../config.json').GEMINI_KEY);

/**
 * مخزن مؤقت للمحادثات (للحفاظ على السياق)
 */
const conversationHistory = new Map();

/**
 * الحصول على سياق المحادثة
 */
function getConversationContext(userID) {
    if (!conversationHistory.has(userID)) {
        conversationHistory.set(userID, []);
    }
    return conversationHistory.get(userID);
}

/**
 * إضافة رسالة إلى السياق
 */
function addToContext(userID, role, content) {
    const context = getConversationContext(userID);
    context.push({ role, content });
    
    // الحفاظ على آخر 10 رسائل فقط لتوفير الموارد
    if (context.length > 10) {
        context.shift();
    }
}

/**
 * مسح السياق
 */
function clearContext(userID) {
    conversationHistory.delete(userID);
}

/**
 * دالة الدردشة مع السياق
 */
async function chatWithContext(userID, userMessage) {
    try {
        const context = getConversationContext(userID);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // بناء الرسالة مع السياق
        let fullPrompt = userMessage;
        if (context.length > 0) {
            fullPrompt = `السياق السابق:\n`;
            context.forEach(msg => {
                fullPrompt += `${msg.role}: ${msg.content}\n`;
            });
            fullPrompt += `\nالرسالة الجديدة: ${userMessage}`;
        }
        
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();
        
        // إضافة الرسالة والرد إلى السياق
        addToContext(userID, "user", userMessage);
        addToContext(userID, "assistant", responseText);
        
        return responseText;
    } catch (error) {
        throw new Error("خطأ في الدردشة: " + error.message);
    }
}

/**
 * تحليل المشاعر في النص
 */
async function analyzeSentiment(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `حلل المشاعر في النص التالي وحدد ما إذا كان إيجابياً أم سلبياً أم محايداً:
"${text}"

أجب بصيغة: المشاعر: [إيجابي/سلبي/محايد]، الثقة: [نسبة مئوية]`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في تحليل المشاعر: " + error.message);
    }
}

/**
 * توليد أسئلة متعددة الخيارات
 */
async function generateQuiz(topic, count = 5) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أنشئ ${count} أسئلة متعددة الخيارات عن "${topic}" بالعربية.
الصيغة:
السؤال 1: [السؤال]
أ) [الخيار 1]
ب) [الخيار 2]
ج) [الخيار 3]
د) [الخيار 4]
الإجابة الصحيحة: [الحرف]`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد الأسئلة: " + error.message);
    }
}

/**
 * توليد نصائح وحقائق عشوائية
 */
async function generateFact(category) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أعطني حقيقة مثيرة وغير معروفة عن "${category}" بالعربية. يجب أن تكون الحقيقة قصيرة (جملة واحدة أو اثنتين) وموثوقة.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد الحقيقة: " + error.message);
    }
}

/**
 * توليد نكات
 */
async function generateJoke() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أعطني نكتة مضحكة وخفيفة بالعربية. يجب أن تكون النكتة قصيرة وملائمة للجميع.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد النكتة: " + error.message);
    }
}

/**
 * توليد نصائح شخصية
 */
async function generateAdvice(situation) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أعطني نصيحة عملية ومفيدة بخصوص: "${situation}"
يجب أن تكون النصيحة قصيرة (2-3 جمل) وقابلة للتطبيق بسهولة.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد النصيحة: " + error.message);
    }
}

/**
 * تحليل النص واستخراج الكلمات المفتاحية
 */
async function extractKeywords(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `استخرج أهم 5 كلمات مفتاحية من النص التالي:
"${text}"

أجب بصيغة: الكلمات المفتاحية: [الكلمة 1]، [الكلمة 2]، ...`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في استخراج الكلمات المفتاحية: " + error.message);
    }
}

/**
 * توليد أسماء مستخدمين فريدة
 */
async function generateUsername(style = "عام") {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أنشئ لي 5 أسماء مستخدمين فريدة وجميلة بأسلوب "${style}" بالعربية.
يجب أن تكون الأسماء قصيرة (8-15 حرف) وسهلة التذكر.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد الأسماء: " + error.message);
    }
}

/**
 * توليد وصفات وصفات طعام
 */
async function generateRecipe(ingredients) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أعطني وصفة طعام بسيطة باستخدام المكونات التالية: ${ingredients}
يجب أن تكون الوصفة واضحة وسهلة التطبيق (3-5 خطوات).`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد الوصفة: " + error.message);
    }
}

/**
 * توليد خطط تدريب
 */
async function generateWorkoutPlan(goal, duration) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أنشئ خطة تدريب لمدة ${duration} أيام بهدف "${goal}".
يجب أن تكون الخطة واقعية وسهلة التطبيق في المنزل.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد خطة التدريب: " + error.message);
    }
}

/**
 * توليد محتوى تسويقي
 */
async function generateMarketingContent(product, audience) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `أكتب نصاً تسويقياً جذاباً للمنتج "${product}" موجهاً إلى "${audience}".
يجب أن يكون النص قصيراً (3-4 جمل) وملهماً.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        throw new Error("خطأ في توليد المحتوى التسويقي: " + error.message);
    }
}

module.exports = {
    chatWithContext,
    getConversationContext,
    addToContext,
    clearContext,
    analyzeSentiment,
    generateQuiz,
    generateFact,
    generateJoke,
    generateAdvice,
    extractKeywords,
    generateUsername,
    generateRecipe,
    generateWorkoutPlan,
    generateMarketingContent
};
