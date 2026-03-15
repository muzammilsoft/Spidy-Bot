/**
 * نظام السجلات والإشعارات المتقدم
 * يوفر تسجيل شامل للأوامر والأخطاء والأحداث الأمنية
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// أنواع السجلات
const LOG_TYPES = {
    COMMAND: 'COMMAND',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO',
    SECURITY: 'SECURITY',
    PERFORMANCE: 'PERFORMANCE',
    PAYMENT: 'PAYMENT'
};

/**
 * دالة الكتابة إلى ملف السجل
 */
function writeLog(type, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        message,
        data,
        pid: process.pid
    };

    const logFile = path.join(logsDir, `${type.toLowerCase()}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFile, logLine);

    // حفظ في ملف السجل العام أيضاً
    const generalLogFile = path.join(logsDir, 'general.log');
    fs.appendFileSync(generalLogFile, logLine);
}

/**
 * دالة تسجيل الأوامر
 */
function logCommand(userID, userName, commandName, args, threadID, success = true) {
    const message = `${success ? '✅' : '❌'} الأمر: ${commandName}`;
    writeLog(LOG_TYPES.COMMAND, message, {
        userID,
        userName,
        commandName,
        args,
        threadID,
        success
    });

    console.log(
        chalk.cyan(`[COMMAND] ${userName} استخدم: ${commandName}`)
    );
}

/**
 * دالة تسجيل الأخطاء
 */
function logError(error, context = {}) {
    const message = `❌ خطأ: ${error.message}`;
    writeLog(LOG_TYPES.ERROR, message, {
        errorMessage: error.message,
        errorStack: error.stack,
        context
    });

    console.error(
        chalk.red(`[ERROR] ${error.message}`)
    );
}

/**
 * دالة تسجيل التحذيرات
 */
function logWarning(message, data = {}) {
    writeLog(LOG_TYPES.WARNING, `⚠️ ${message}`, data);

    console.warn(
        chalk.yellow(`[WARNING] ${message}`)
    );
}

/**
 * دالة تسجيل المعلومات
 */
function logInfo(message, data = {}) {
    writeLog(LOG_TYPES.INFO, `ℹ️ ${message}`, data);

    console.log(
        chalk.blue(`[INFO] ${message}`)
    );
}

/**
 * دالة تسجيل الأحداث الأمنية
 */
function logSecurity(eventType, userID, details = {}) {
    const message = `🔒 حدث أمني: ${eventType}`;
    writeLog(LOG_TYPES.SECURITY, message, {
        eventType,
        userID,
        ...details
    });

    console.log(
        chalk.magenta(`[SECURITY] ${eventType} - المستخدم: ${userID}`)
    );
}

/**
 * دالة تسجيل أحداث الأداء
 */
function logPerformance(commandName, executionTime, memoryUsed = 0) {
    const message = `⚡ أداء: ${commandName} - ${executionTime}ms`;
    writeLog(LOG_TYPES.PERFORMANCE, message, {
        commandName,
        executionTime,
        memoryUsed
    });

    if (executionTime > 1000) {
        console.warn(
            chalk.yellow(`[PERFORMANCE] ${commandName} استغرق وقتاً طويلاً: ${executionTime}ms`)
        );
    }
}

/**
 * دالة تسجيل العمليات المالية
 */
function logPayment(userID, userName, amount, type, description = '') {
    const message = `💰 عملية مالية: ${type}`;
    writeLog(LOG_TYPES.PAYMENT, message, {
        userID,
        userName,
        amount,
        type,
        description
    });

    console.log(
        chalk.green(`[PAYMENT] ${userName} - ${type}: ${amount}$`)
    );
}

/**
 * دالة الحصول على السجلات
 */
function getLogs(type, limit = 100) {
    const logFile = path.join(logsDir, `${type.toLowerCase()}.log`);
    
    if (!fs.existsSync(logFile)) {
        return [];
    }

    const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(l => l);
    return lines.slice(-limit).map(line => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(l => l);
}

/**
 * دالة مسح السجلات القديمة
 */
function cleanOldLogs(daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    const files = fs.readdirSync(logsDir);
    files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
            console.log(chalk.yellow(`تم حذف السجل القديم: ${file}`));
        }
    });
}

/**
 * دالة إنشاء تقرير السجلات
 */
function generateReport(type, startDate, endDate) {
    const logs = getLogs(type, 10000);
    const filtered = logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= startDate && logTime <= endDate;
    });

    return {
        type,
        period: { startDate, endDate },
        totalEntries: filtered.length,
        entries: filtered
    };
}

/**
 * دالة تحليل السلوك المريب
 */
function analyzeSuspiciousBehavior(userID, commandName, frequency) {
    const logs = getLogs(LOG_TYPES.COMMAND, 1000);
    const userCommands = logs.filter(log => log.data.userID === userID);
    
    // فحص التكرار السريع
    if (userCommands.length > 20) {
        const recentCommands = userCommands.slice(-20);
        const timeDiff = new Date(recentCommands[19].timestamp) - new Date(recentCommands[0].timestamp);
        
        if (timeDiff < 60000) { // 20 أوامر في أقل من دقيقة
            return {
                suspicious: true,
                reason: 'SPAM_DETECTED',
                severity: 'HIGH'
            };
        }
    }

    // فحص الأوامر المتكررة
    const commandCounts = {};
    userCommands.forEach(log => {
        commandCounts[log.data.commandName] = (commandCounts[log.data.commandName] || 0) + 1;
    });

    for (const [cmd, count] of Object.entries(commandCounts)) {
        if (count > 50) {
            return {
                suspicious: true,
                reason: 'REPEATED_COMMAND',
                command: cmd,
                count,
                severity: 'MEDIUM'
            };
        }
    }

    return { suspicious: false };
}

module.exports = {
    LOG_TYPES,
    logCommand,
    logError,
    logWarning,
    logInfo,
    logSecurity,
    logPerformance,
    logPayment,
    getLogs,
    cleanOldLogs,
    generateReport,
    analyzeSuspiciousBehavior,
    writeLog
};
