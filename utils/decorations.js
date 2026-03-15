/**
 * ملف أدوات الزخرفة النصية ونظام التقدم المحسّن
 * يوفر مجموعة شاملة من الزخارف الفخمة والاحترافية
 */

module.exports = {
    // ==================== العناوين الفخمة ====================
    
    title: (text) => `╮─────── ◈ ───────╭\n   ${text}\n╯─────── ◈ ───────╰`,
    titleB: (text) => `[ ◢◤ \n${text}\n ◢◤ ]`,
    
    titleLuxury: (text) => `╮─┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈─╭\n  ${text.padEnd(35)}  \n╯─┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈─╰`,
    
    titlePremium: (text) => `╮─◦─◦─◦─◦─◦─◦─◦─◦─◦─◦─◦─╭\n  ${text.padEnd(35)}  \n╯─◦─◦─◦─◦─◦─◦─◦─◦─◦─◦─◦─╰`,
    
    titleGolden: (text) => ` ${text} `,
    
    // ==================== النصوص والأسطر ====================
    
    line: (text) => `◈ ¦ ${text}`,
    
    lineBox: (text) => `✿ ¦ ${text}`,
    
    lineArrow: (text) => `○ ¦ ${text}`,
    
    lineStar: (text) => `● ¦ ${text}`,
    
    lineDiamond: (text) => `◆ ¦ ${text}`,
    
    // ==================== شريط التقدم ====================
    
    progressBar: (percent) => {
        const total = 10;
        const filled = Math.floor(percent / 10);
        const empty = total - filled;
        
        let bar = "";
        if (percent === 0) bar = "○○○○○○○○○○";
        else if (percent <= 10) bar = "●○○○○○○○○○";
        else if (percent <= 20) bar = "●●○○○○○○○○";
        else if (percent <= 30) bar = "●●●○○○○○○○";
        else if (percent <= 40) bar = "●●●●○○○○○○";
        else if (percent <= 50) bar = "●●●●●○○○○○";
        else if (percent <= 60) bar = "●●●●●●○○○○";
        else if (percent <= 70) bar = "●●●●●●●○○○";
        else if (percent <= 80) bar = "●●●●●●●●○○";
        else if (percent <= 90) bar = "●●●●●●●●●○";
        else bar = "●●●●●●●●●●";
        
        return `· ${percent}%   : ${bar}`;
    },
    
    progressBarLuxury: (percent) => {
        const total = 20;
        const filled = Math.floor((percent / 100) * total);
        const empty = total - filled;
        
        let bar = "█".repeat(filled) + "░".repeat(empty);
        return `[${bar}] ${percent}%`;
    },
    
    progressBarGradient: (percent) => {
        const levels = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
        const index = Math.floor((percent / 100) * (levels.length - 1));
        const bar = levels[index].repeat(10);
        return `${bar} ${percent}%`;
    },
    
    // ==================== القوائم والعناصر ====================
    
    listItem: (text) => ` ✦ ${text}`,
    
    listItemBox: (text) => `┣ ${text}`,
    
    listItemEnd: (text) => `┗ ${text}`,
    
    listItemArrow: (text) => `▶ ${text}`,
    
    listItemStar: (text) => `⭐ ${text}`,
    
    // ==================== الفواصل والخطوط ====================
    
    separator: "━━━━━━━━━━━━━━━",
    
    separatorLuxury: "━━━━━ ⸙ ━━━━━",
    
    separatorGolden: "┈┈┈┈┈┈┈┈┈┈┈┈",
    
    separatorDots: "• • • • • • • • • • • • • • • • • • • • • • • • •",
    
    // ==================== الصناديق والإطارات ====================
 

    box: (text) => {
        const lines = text.split('\n');
        const maxLen = Math.max(...lines.map(l => l.length));
        const top = "╮─────────" + "".repeat(maxLen + 2) + "────────╭";
        const bottom = "╯────────" + "".repeat(maxLen + 2) + "────────╰";
        const content = lines.map(l => " " + l.padEnd(maxLen) + " ").join('\n');
        return `${top}\n${content}\n${bottom}`;
    },
    
    boxSimple: (text) => {
        const lines = text.split('\n');
        const maxLen = Math.max(...lines.map(l => l.length));
        const top = "┌" + "─".repeat(maxLen + 2) + "┐";
        const bottom = "└" + "─".repeat(maxLen + 2) + "┘";
        const content = lines.map(l => "│ " + l.padEnd(maxLen) + " │").join('\n');
        return `${top}\n${content}\n${bottom}`;
    },
    
    // ==================== الرسائل الخاصة ====================
    
    success: (text) => `✅ ${text}`,
    
    error: (text) => `❌ ${text}`,
    
    warning: (text) => `⚠️ ${text}`,
    
    info: (text) => `ℹ️ ${text}`,
    
    // ==================== الرموز والأيقونات ====================
    
    icons: {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
        star: "⭐",
        diamond: "💎",
        gold: "💰",
        heart: "❤️",
        fire: "🔥",
        ice: "❄️",
        thunder: "⚡",
        sword: "⚔️",
        shield: "🛡️",
        crown: "👑",
        skull: "💀",
        ghost: "👻",
        dragon: "🐉",
        angel: "😇",
        demon: "😈",
    },
    
    // ==================== دوال مساعدة ====================
    
    center: (text, width = 40) => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return " ".repeat(padding) + text;
    },
    
    repeat: (char, count) => char.repeat(count),
    
    table: (headers, rows) => {
        const colWidths = headers.map((h, i) => 
            Math.max(h.length, ...rows.map(r => String(r[i]).length))
        );
        
        const separator = "+" + colWidths.map(w => "─".repeat(w + 2)).join("+") + "+";
        const headerRow = "|" + headers.map((h, i) => " " + h.padEnd(colWidths[i]) + " ").join("|") + "|";
        const dataRows = rows.map(row => 
            "|" + row.map((cell, i) => " " + String(cell).padEnd(colWidths[i]) + " ").join("|") + "|"
        ).join('\n');
        
        return `${separator}\n${headerRow}\n${separator}\n${dataRows}\n${separator}`;
    },
    
    // ==================== رسائل ترحيب وتوديع ====================
    
    welcome: (name) => `🎉 أهلاً وسهلاً بك يا ${name}! 🎉\nمرحباً بك في عالم ميرور بوت المذهل!`,
    
    goodbye: (name) => `👋 وداعاً يا ${name}!\nشكراً لاستخدامك ميرور بوت!`,
    
    // ==================== رسائل الخطأ ====================
    
    errorMessage: (errorType, details = "") => {
        const messages = {
            "permission": "🚫 ليس لديك الصلاحية الكافية لاستخدام هذا الأمر.",
            "cooldown": "⏳ يرجى الانتظار قليلاً قبل استخدام هذا الأمر مرة أخرى.",
            "notRegistered": "📝 يجب عليك التسجيل أولاً لاستخدام هذا الأمر.",
            "invalidArgs": "❌ الوسائط المدخلة غير صحيحة. تحقق من الاستخدام الصحيح.",
            "userNotFound": "👤 لم يتم العثور على المستخدم المطلوب.",
            "insufficientResources": "💰 ليس لديك موارد كافية لإجراء هذه العملية.",
        };
        return messages[errorType] || `❌ حدث خطأ: ${details}`;
    },
};
