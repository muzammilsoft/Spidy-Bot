const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

function startBot() {
    console.log(chalk.cyan(' [ SYSTEM ] ') + chalk.white('جاري تشغيل البوت...'));
    
    const child = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    child.on('close', (code) => {
        if (code === 2) {
            console.log(chalk.yellow(' [ SYSTEM ] ') + chalk.white('تم طلب إعادة التشغيل اليدوي. جاري البدء...'));
            startBot();
        } else if (code !== 0) {
            console.log(chalk.red(' [ SYSTEM ] ') + chalk.white(`توقف البوت برمز الخطأ (${code}). إعادة التشغيل بعد 5 ثوانٍ...`));
            setTimeout(startBot, 5000);
        } else {
            console.log(chalk.green(' [ SYSTEM ] ') + chalk.white('توقف البوت بشكل طبيعي. إعادة التشغيل لضمان الاستمرارية...'));
            startBot();
        }
    });

    child.on('error', (err) => {
        console.error(chalk.red(' [ SYSTEM ] ') + chalk.white('فشل بدء العملية:'), err);
        setTimeout(startBot, 10000);
    });
}

console.log(chalk.bold.blue('\n ——————————————————————————————————————————————'));
console.log(chalk.bold.blue(' |       MIRROR BOT AUTO-RESTART SYSTEM       |'));
console.log(chalk.bold.blue(' ——————————————————————————————————————————————\n'));

startBot();
