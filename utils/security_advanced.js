/**
 * نظام الحماية والأمان المتقدم
 * يوفر حماية من السبام، الكلمات المسيئة، والسلوك المريب
 */

const fs = require('fs-extra');
const path = require('path');

// قائمة الكلمات المسيئة (يمكن توسيعها)
const BANNED_WORDS = [
    'شرموطة', 'قحاب', 'لوطي انكمك', 'كسمك', 'كسم'
];

// نظام التحذيرات
if (!global.userWarnings) global.userWarnings = new Map();
if (!global.userSpamCount) global.userSpamCount = new Map();

/**
 * فحص الكلمات المسيئة
 */
function checkBannedWords(text) {
    const lowerText = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lowerText.includes(word.toLowerCase())) {
            return {
                found: true,
                word,
                severity: 'HIGH'
            };
        }
    }
    return { found: false };
}

/**
 * فحص السبام
 */
function checkSpam(userID, threshold = 5, timeWindow = 60000) {
    const now = Date.now();
    
    if (!global.userSpamCount.has(userID)) {
        global.userSpamCount.set(userID, []);
    }

    const userSpam = global.userSpamCount.get(userID);
    
    // إزالة الرسائل القديمة
    const recentMessages = userSpam.filter(timestamp => now - timestamp < timeWindow);
    global.userSpamCount.set(userID, recentMessages);

    recentMessages.push(now);

    if (recentMessages.length > threshold) {
        return {
            isSpam: true,
            messageCount: recentMessages.length,
            threshold,
            severity: 'MEDIUM'
        };
    }

    return { isSpam: false };
}

/**
 * إضافة تحذير للمستخدم
 */
function addWarning(userID, reason, severity = 'LOW') {
    if (!global.userWarnings.has(userID)) {
        global.userWarnings.set(userID, []);
    }

    const warnings = global.userWarnings.get(userID);
    warnings.push({
        timestamp: Date.now(),
        reason,
        severity
    });

    return warnings.length;
}

/**
 * الحصول على عدد التحذيرات
 */
function getWarnings(userID) {
    return global.userWarnings.get(userID) || [];
}

/**
 * مسح التحذيرات
 */
function clearWarnings(userID) {
    global.userWarnings.delete(userID);
}

/**
 * فحص ما إذا كان المستخدم يجب حظره
 */
function shouldBanUser(userID) {
    const warnings = getWarnings(userID);
    
    // حظر بعد 3 تحذيرات
    if (warnings.length >= 3) {
        return {
            shouldBan: true,
            reason: 'MULTIPLE_WARNINGS',
            warningCount: warnings.length
        };
    }

    // فحص التحذيرات الشديدة
    const severeWarnings = warnings.filter(w => w.severity === 'HIGH');
    if (severeWarnings.length >= 2) {
        return {
            shouldBan: true,
            reason: 'SEVERE_VIOLATIONS',
            violationCount: severeWarnings.length
        };
    }

    return { shouldBan: false };
}

/**
 * فحص شامل للأمان
 */
function performSecurityCheck(userID, text, commandName = '') {
    const results = {
        safe: true,
        issues: [],
        recommendations: []
    };

    // فحص الكلمات المسيئة
    const bannedWordsCheck = checkBannedWords(text);
    if (bannedWordsCheck.found) {
        results.safe = false;
        results.issues.push({
            type: 'BANNED_WORD',
            word: bannedWordsCheck.word,
            severity: bannedWordsCheck.severity
        });
        results.recommendations.push('تجنب استخدام الكلمات المسيئة');
        addWarning(userID, `استخدام كلمة مسيئة: ${bannedWordsCheck.word}`, 'HIGH');
    }

    // فحص السبام
    const spamCheck = checkSpam(userID);
    if (spamCheck.isSpam) {
        results.safe = false;
        results.issues.push({
            type: 'SPAM_DETECTED',
            messageCount: spamCheck.messageCount,
            severity: spamCheck.severity
        });
        results.recommendations.push('قلل من سرعة الرسائل');
        addWarning(userID, 'سبام مكتشف', 'MEDIUM');
    }

    // فحص طول الرسالة
    if (text.length > 10000) {
        results.issues.push({
            type: 'MESSAGE_TOO_LONG',
            length: text.length,
            severity: 'LOW'
        });
        results.recommendations.push('قلل من طول الرسالة');
    }

    // فحص ما إذا كان يجب حظر المستخدم
    const banCheck = shouldBanUser(userID);
    if (banCheck.shouldBan) {
        results.safe = false;
        results.shouldBan = true;
        results.banReason = banCheck.reason;
    }

    return results;
}

/**
 * فحص الأوامر المريبة
 */
function checkSuspiciousCommand(commandName, args) {
    const suspiciousPatterns = {
        'حذف': ['قاعدة بيانات', 'ملفات', 'جميع'],
        'إدارة': ['حظر الجميع', 'مسح'],
        'exec': ['rm', 'del', 'format']
    };

    for (const [cmd, patterns] of Object.entries(suspiciousPatterns)) {
        if (commandName.includes(cmd)) {
            for (const pattern of patterns) {
                if (args.join(' ').includes(pattern)) {
                    return {
                        suspicious: true,
                        command: cmd,
                        pattern,
                        severity: 'HIGH'
                    };
                }
            }
        }
    }

    return { suspicious: false };
}

/**
 * إنشاء تقرير أمني
 */
function generateSecurityReport() {
    const report = {
        timestamp: new Date().toISOString(),
        totalUsers: global.userWarnings.size,
        usersWithWarnings: [],
        suspiciousUsers: [],
        totalWarnings: 0
    };

    for (const [userID, warnings] of global.userWarnings.entries()) {
        report.totalWarnings += warnings.length;
        
        if (warnings.length > 0) {
            report.usersWithWarnings.push({
                userID,
                warningCount: warnings.length,
                lastWarning: warnings[warnings.length - 1]
            });
        }

        if (warnings.length >= 3) {
            report.suspiciousUsers.push({
                userID,
                warningCount: warnings.length,
                severity: 'HIGH'
            });
        }
    }

    return report;
}

/**
 * تنظيف البيانات القديمة
 */
function cleanupOldData(daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    for (const [userID, warnings] of global.userWarnings.entries()) {
        const recentWarnings = warnings.filter(w => w.timestamp > cutoffTime);
        
        if (recentWarnings.length === 0) {
            global.userWarnings.delete(userID);
        } else {
            global.userWarnings.set(userID, recentWarnings);
        }
    }

    for (const [userID, timestamps] of global.userSpamCount.entries()) {
        const recentTimestamps = timestamps.filter(t => t > cutoffTime);
        
        if (recentTimestamps.length === 0) {
            global.userSpamCount.delete(userID);
        } else {
            global.userSpamCount.set(userID, recentTimestamps);
        }
    }
}

module.exports = {
    checkBannedWords,
    checkSpam,
    addWarning,
    getWarnings,
    clearWarnings,
    shouldBanUser,
    performSecurityCheck,
    checkSuspiciousCommand,
    generateSecurityReport,
    cleanupOldData
};
