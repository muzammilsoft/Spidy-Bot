const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const logger = require('../utils/logger');

const dbPath = path.join(__dirname, 'mirror.db');
const avatarDir = path.join(__dirname, '../avatars');
const db = new Database(dbPath);

if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

// تحديث الجدول ليشمل اللقب والحقول الجديدة
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        nickname TEXT,
        money INTEGER DEFAULT 1000,
        bank INTEGER DEFAULT 5000,
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        createDate INTEGER,
        isRegistered INTEGER DEFAULT 0,
        extraData TEXT DEFAULT '{}'
    )
`).run();

async function getAvatarUrl(userID) {
    try {
        const res = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
            params: {
                doc_id: "5341536295888250",
                variables: JSON.stringify({ height: 500, scale: 1, userID, width: 500 })
            }
        });
        return res.data.data.profile.profile_picture.uri;
    } catch (err) {
        return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
    }
}

async function downloadAvatar(userID, url) {
    const filePath = path.join(avatarDir, `${userID}.png`);
    try {
        const response = await axios({ url, responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (e) {
        logger.error(`فشل تحميل صورة المستخدم: ${userID}`);
        return null;
    }
}

module.exports = {
    get: async (id) => {
        try {
            const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
            if (!user) return null;
            const extra = JSON.parse(user.extraData || '{}');
            return { ...user, ...extra };
        } catch (e) {
            return null;
        }
    },

    set: async (id, updateData) => {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!user) return;

        const coreFields = ['name', 'nickname', 'money', 'bank', 'exp', 'level', 'isRegistered'];
        let extra = JSON.parse(user.extraData || '{}');

        for (let key in updateData) {
            if (coreFields.includes(key)) {
                db.prepare(`UPDATE users SET ${key} = ? WHERE id = ?`).run(updateData[key], id);
            } else {
                extra[key] = updateData[key];
            }
        }
        db.prepare("UPDATE users SET extraData = ? WHERE id = ?").run(JSON.stringify(extra), id);
    },

    create: async (id, name, nickname = "", isRegistered = 0) => {
        const url = await getAvatarUrl(id);
        await downloadAvatar(id, url);
        const stmt = db.prepare("INSERT INTO users (id, name, nickname, createDate, isRegistered) VALUES (?, ?, ?, ?, ?)");
        stmt.run(id, name, nickname, Date.now(), isRegistered);
        logger.loader(`مستخدم جديد: ${name} [${id}]`, 'event');
    },

    addExp: async (id, amount) => {
        const user = db.prepare("SELECT exp, level FROM users WHERE id = ?").get(id);
        if (!user) return;
        let newExp = user.exp + amount;
        let newLevel = user.level;
        let nextLevelExp = newLevel * 500;
        if (newExp >= nextLevelExp) {
            newExp = 0;
            newLevel += 1;
            logger.info(`اللاعب ${id} ارتفع للمستوى ${newLevel}`);
        }
        db.prepare("UPDATE users SET exp = ?, level = ? WHERE id = ?").run(newExp, newLevel, id);
    }
};
