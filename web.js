import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
    try {
        const raw = fs.readFileSync('./database/database.json', 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function readStore() {
    try {
        const raw = fs.readFileSync('./database/baileys_store.json', 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function readSettings() {
    try {
        const raw = fs.readFileSync('./settings.js', 'utf-8');
        const botname = (raw.match(/global\.botname\s*=\s*['"](.+?)['"]/) || [])[1] || 'Bot';
        const number = (raw.match(/global\.number_bot\s*=\s*['"](.+?)['"]/) || [])[1] || '';
        const owner = (raw.match(/global\.owner\s*=\s*\[["'](.+?)["']/) || [])[1] || '';
        return { botname, number, owner };
    } catch {
        return { botname: 'Bot', number: '', owner: '' };
    }
}

app.get('/api/stats', (req, res) => {
    const db = readDB();
    const store = readStore();
    const settings = readSettings();

    const hit = db.hit || {};
    const users = db.users || {};
    const groups = db.groups || {};
    const setData = db.set || {};

    const botNumber = settings.number + '@s.whatsapp.net';
    const botSettings = setData[botNumber] || Object.values(setData)[0] || {};

    const groupCount = Object.keys(groups).length;
    const userCount = Object.keys(users).length;
    const vipCount = Object.values(users).filter(u => u.vip).length;
    const bannedCount = Object.values(users).filter(u => u.ban).length;

    const contacts = store.contacts || {};
    const contactCount = Object.keys(contacts).length;

    const uptime = process.uptime();
    const uptimeStr = formatUptime(uptime);

    res.json({
        botname: settings.botname || botSettings.botname || 'Bot',
        number: settings.number,
        owner: settings.owner,
        totalcmd: hit.totalcmd || 0,
        todaycmd: hit.todaycmd || 0,
        userCount,
        groupCount,
        vipCount,
        bannedCount,
        contactCount,
        public: botSettings.public ?? true,
        log: botSettings.log ?? false,
        autoread: botSettings.autoread ?? false,
        anticall: botSettings.anticall ?? false,
        autotyping: botSettings.autotyping ?? false,
        uptime: uptimeStr,
        nodeVersion: process.version,
        platform: process.platform,
        memUsed: Math.round(process.memoryUsage().rss / 1024 / 1024),
        cmdBreakdown: Object.entries(hit)
            .filter(([k]) => !['totalcmd', 'todaycmd'].includes(k))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
    });
});

app.get('/api/users', (req, res) => {
    const db = readDB();
    const users = db.users || {};
    const list = Object.entries(users).map(([jid, data]) => ({
        jid,
        number: jid.replace('@s.whatsapp.net', ''),
        ...data
    }));
    res.json(list);
});

app.get('/api/groups', (req, res) => {
    const db = readDB();
    const groups = db.groups || {};
    const list = Object.entries(groups).map(([jid, data]) => ({
        jid,
        id: jid.replace('@g.us', ''),
        ...data
    }));
    res.json(list);
});

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard running on port ${PORT}`);
});
