import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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

function readMessages() {
    try {
        const raw = fs.readFileSync('./settings.js', 'utf-8');
        const block = raw.match(/global\.mess\s*=\s*\{([^}]+)\}/s);
        if (!block) return {};
        const result = {};
        const lines = block[1].split('\n');
        for (const line of lines) {
            const m = line.match(/^\s*(\w+)\s*:\s*["'](.*)["']\s*,?\s*$/);
            if (m) result[m[1]] = m[2];
        }
        return result;
    } catch {
        return {};
    }
}

function updateMessages(updates) {
    let raw = fs.readFileSync('./settings.js', 'utf-8');
    for (const [key, val] of Object.entries(updates)) {
        const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        raw = raw.replace(
            new RegExp(`(${key}\\s*:\\s*)["'][^"']*["']`),
            `$1'${escaped}'`
        );
    }
    fs.writeFileSync('./settings.js', raw, 'utf-8');
}

function readSettings() {
    try {
        const raw = fs.readFileSync('./settings.js', 'utf-8');
        const botname = (raw.match(/global\.botname\s*=\s*['"](.+?)['"]/) || [])[1] || 'Bot';
        const number = (raw.match(/global\.number_bot\s*=\s*['"](.+?)['"]/) || [])[1] || '';
        const ownerMatch = raw.match(/global\.owner\s*=\s*\[([^\]]*)\]/);
        const owner = ownerMatch
            ? ownerMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
            : [];
        const prefixMatch = raw.match(/global\.listprefix\s*=\s*\[([^\]]*)\]/);
        const prefix = prefixMatch
            ? prefixMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
            : ['.'];
        return { botname, number, owner, prefix };
    } catch {
        return { botname: 'Bot', number: '', owner: [], prefix: ['.'] };
    }
}

function updateSettingsFile(changes) {
    let raw = fs.readFileSync('./settings.js', 'utf-8');

    if (changes.botname) {
        raw = raw.replace(/global\.botname\s*=\s*['"][^'"]*['"]/, `global.botname = '${changes.botname}'`);
    }
    if (changes.owner !== undefined) {
        const arr = JSON.stringify(changes.owner);
        raw = raw.replace(/global\.owner\s*=\s*\[[^\]]*\]/, `global.owner = ${arr}`);
    }
    if (changes.prefix !== undefined) {
        const arr = JSON.stringify(changes.prefix);
        raw = raw.replace(/global\.listprefix\s*=\s*\[[^\]]*\]/, `global.listprefix = ${arr}`);
    }

    fs.writeFileSync('./settings.js', raw, 'utf-8');
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
        uptime: formatUptime(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        memUsed: Math.round(process.memoryUsage().rss / 1024 / 1024),
        cmdBreakdown: Object.entries(hit)
            .filter(([k]) => !['totalcmd', 'todaycmd'].includes(k))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
    });
});

app.get('/api/settings', (req, res) => {
    res.json(readSettings());
});

app.post('/api/settings', (req, res) => {
    try {
        const { botname, owner, prefix } = req.body;
        const changes = {};

        if (botname && typeof botname === 'string' && botname.trim()) {
            changes.botname = botname.trim();
        }
        if (owner !== undefined) {
            const ownerArr = Array.isArray(owner)
                ? owner
                : owner.split(',').map(s => s.trim()).filter(Boolean);
            changes.owner = ownerArr;
        }
        if (prefix !== undefined) {
            const prefixArr = Array.isArray(prefix)
                ? prefix
                : prefix.split(',').map(s => s.trim()).filter(Boolean);
            changes.prefix = prefixArr;
        }

        updateSettingsFile(changes);
        res.json({ success: true, settings: readSettings() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/messages', (req, res) => {
    res.json(readMessages());
});

app.post('/api/messages', (req, res) => {
    try {
        const updates = req.body;
        if (typeof updates !== 'object' || Array.isArray(updates)) {
            return res.status(400).json({ success: false, error: 'Invalid body' });
        }
        updateMessages(updates);
        res.json({ success: true, messages: readMessages() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
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
