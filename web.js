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
    try { return JSON.parse(fs.readFileSync('./database/database.json', 'utf-8')); }
    catch { return {}; }
}

function readStore() {
    try { return JSON.parse(fs.readFileSync('./database/baileys_store.json', 'utf-8')); }
    catch { return {}; }
}

function str(raw, pattern, def = '') {
    return (raw.match(pattern) || [])[1] || def;
}
function arr(raw, pattern, def = []) {
    const m = raw.match(pattern);
    return m ? m[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean) : def;
}
function num(raw, pattern, def = 0) {
    return parseFloat((raw.match(pattern) || [])[1]) || def;
}
function bool(raw, pattern, def = false) {
    const m = raw.match(pattern);
    return m ? m[1] === 'true' : def;
}

function readAllSettings() {
    const raw = fs.readFileSync('./settings.js', 'utf-8');
    return {
        // General
        botname:      str(raw, /global\.botname\s*=\s*['"](.+?)['"]/),
        author:       str(raw, /global\.author\s*=\s*['"](.+?)['"]/),
        packname:     str(raw, /global\.packname\s*=\s*['"](.+?)['"]/),
        timezone:     str(raw, /global\.timezone\s*=\s*['"](.+?)['"]/),
        locale:       str(raw, /global\.locale\s*=\s*['"](.+?)['"]/),
        number_bot:   str(raw, /global\.number_bot\s*=\s*['"](.+?)['"]/),
        pairing_code: bool(raw, /global\.pairing_code\s*=\s*(true|false)/, true),
        owner:        arr(raw, /global\.owner\s*=\s*\[([^\]]*)\]/),
        listprefix:   arr(raw, /global\.listprefix\s*=\s*\[([^\]]*)\]/),
        chatLength:   num(raw, /global\.chatLength\s*=\s*(\d+)/, 1000),
        // Limits
        limit_free:    num(raw, /global\.limit\s*=\s*\{[^}]*?free:\s*(\d+)/s, 20),
        limit_premium: num(raw, /global\.limit\s*=\s*\{[^}]*?premium:\s*(\d+)/s, 9999999),
        limit_vip:     num(raw, /global\.limit\s*=\s*\{[^}]*?vip:\s*(\d+)/s, 9099999990),
        // Money
        money_free:    num(raw, /global\.money\s*=\s*\{[^}]*?free:\s*(\d+)/s, 10000000),
        money_premium: num(raw, /global\.money\s*=\s*\{[^}]*?premium:\s*(\d+)/s, 10000000000),
        money_vip:     num(raw, /global\.money\s*=\s*\{[^}]*?vip:\s*(\d+)/s, 100000000000),
        // API Keys
        apikey_naze:       str(raw, /'https:\/\/api\.naze\.biz\.id'\s*:\s*'(.+?)'/),
        apikey_neosantara: str(raw, /'https:\/\/api\.neosantara\.xyz\/v1'\s*:\s*'(.+?)'/),
        // Links
        my_yt: str(raw, /yt:\s*["'](.+?)["']/),
        my_gh: str(raw, /gh:\s*["'](.+?)["']/),
        my_gc: str(raw, /gc:\s*["'](.+?)["']/),
        my_ch: str(raw, /ch:\s*["'](.+?)["']/),
        // Media
        fake_anonim:      str(raw, /anonim:\s*['"](.+?)['"]/),
        fake_thumbnailUrl: str(raw, /thumbnailUrl:\s*['"](.+?)['"]/),
        // Moderation
        badWords: arr(raw, /global\.badWords\s*=\s*\[([^\]]*)\]/),
    };
}

function updateAllSettings(changes) {
    let raw = fs.readFileSync('./settings.js', 'utf-8');

    const esc = v => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const setStr = (key, val) => {
        raw = raw.replace(new RegExp(`(global\\.${key}\\s*=\\s*)['"][^'"]*['"]`), `$1'${esc(val)}'`);
    };
    const setArr = (key, arr) => {
        const joined = arr.map(v => `"${esc(v)}"`).join(',');
        raw = raw.replace(new RegExp(`(global\\.${key}\\s*=\\s*)\\[[^\\]]*\\]`), `$1[${joined}]`);
    };
    const setBool = (key, val) => {
        raw = raw.replace(new RegExp(`(global\\.${key}\\s*=\\s*)(true|false)`), `$1${val}`);
    };
    const setNum = (key, val) => {
        raw = raw.replace(new RegExp(`(global\\.${key}\\s*=\\s*)\\d+`), `$1${val}`);
    };
    const setInBlock = (block, field, val, isNum = false) => {
        // Replaces `field: value` inside the block object
        const valStr = isNum ? val : `'${esc(val)}'`;
        const re = new RegExp(`(global\\.${block}\\s*=\\s*\\{[^}]*?${field}:\\s*)(?:'[^']*'|"[^"]*"|\\d+)`, 's');
        raw = raw.replace(re, `$1${valStr}`);
    };
    const setApiKey = (url, val) => {
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        raw = raw.replace(new RegExp(`('${escapedUrl}'\\s*:\\s*)'[^']*'`), `$1'${esc(val)}'`);
    };
    const setMyField = (field, val) => {
        raw = raw.replace(new RegExp(`(${field}:\\s*)["'][^"']*["']`), `$1"${esc(val)}"`);
    };

    if (changes.botname)      setStr('botname', changes.botname);
    if (changes.author !== undefined)   setStr('author', changes.author);
    if (changes.packname !== undefined) setStr('packname', changes.packname);
    if (changes.timezone !== undefined) setStr('timezone', changes.timezone);
    if (changes.locale !== undefined)   setStr('locale', changes.locale);
    if (changes.number_bot !== undefined) setStr('number_bot', changes.number_bot);
    if (changes.pairing_code !== undefined) setBool('pairing_code', changes.pairing_code);
    if (changes.owner !== undefined)      setArr('owner', changes.owner);
    if (changes.listprefix !== undefined) setArr('listprefix', changes.listprefix);
    if (changes.chatLength !== undefined) setNum('chatLength', parseInt(changes.chatLength));

    if (changes.limit_free !== undefined)    setInBlock('limit', 'free', changes.limit_free, true);
    if (changes.limit_premium !== undefined) setInBlock('limit', 'premium', changes.limit_premium, true);
    if (changes.limit_vip !== undefined)     setInBlock('limit', 'vip', changes.limit_vip, true);

    if (changes.money_free !== undefined)    setInBlock('money', 'free', changes.money_free, true);
    if (changes.money_premium !== undefined) setInBlock('money', 'premium', changes.money_premium, true);
    if (changes.money_vip !== undefined)     setInBlock('money', 'vip', changes.money_vip, true);

    if (changes.apikey_naze !== undefined)       setApiKey('https://api.naze.biz.id', changes.apikey_naze);
    if (changes.apikey_neosantara !== undefined) setApiKey('https://api.neosantara.xyz/v1', changes.apikey_neosantara);

    if (changes.my_yt !== undefined) setMyField('yt', changes.my_yt);
    if (changes.my_gh !== undefined) setMyField('gh', changes.my_gh);
    if (changes.my_gc !== undefined) setMyField('gc', changes.my_gc);
    if (changes.my_ch !== undefined) setMyField('ch', changes.my_ch);

    if (changes.fake_anonim !== undefined)       setMyField('anonim', changes.fake_anonim);
    if (changes.fake_thumbnailUrl !== undefined) setMyField('thumbnailUrl', changes.fake_thumbnailUrl);

    if (changes.badWords !== undefined) setArr('badWords', changes.badWords);

    fs.writeFileSync('./settings.js', raw, 'utf-8');
}

function readMessages() {
    try {
        const raw = fs.readFileSync('./settings.js', 'utf-8');
        const block = raw.match(/global\.mess\s*=\s*\{([^}]+)\}/s);
        if (!block) return {};
        const result = {};
        for (const line of block[1].split('\n')) {
            const m = line.match(/^\s*(\w+)\s*:\s*["'](.*)["']\s*,?\s*$/);
            if (m) result[m[1]] = m[2];
        }
        return result;
    } catch { return {}; }
}

function updateMessages(updates) {
    let raw = fs.readFileSync('./settings.js', 'utf-8');
    for (const [key, val] of Object.entries(updates)) {
        const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        raw = raw.replace(new RegExp(`(${key}\\s*:\\s*)["'][^"']*["']`), `$1'${escaped}'`);
    }
    fs.writeFileSync('./settings.js', raw, 'utf-8');
}

// ── Stats ──────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
    const db = readDB();
    const store = readStore();
    const s = readAllSettings();
    const hit = db.hit || {};
    const users = db.users || {};
    const groups = db.groups || {};
    const setData = db.set || {};
    const botSettings = setData[s.number_bot + '@s.whatsapp.net'] || Object.values(setData)[0] || {};

    res.json({
        botname: s.botname || 'Bot',
        number: s.number_bot,
        owner: s.owner,
        totalcmd: hit.totalcmd || 0,
        todaycmd: hit.todaycmd || 0,
        userCount: Object.keys(users).length,
        groupCount: Object.keys(groups).length,
        vipCount: Object.values(users).filter(u => u.vip).length,
        bannedCount: Object.values(users).filter(u => u.ban).length,
        contactCount: Object.keys(store.contacts || {}).length,
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

// ── All Settings ────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
    res.json(readAllSettings());
});

app.post('/api/settings', (req, res) => {
    try {
        updateAllSettings(req.body);
        res.json({ success: true, settings: readAllSettings() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Messages ────────────────────────────────────────────────────────────────
app.get('/api/messages', (req, res) => {
    res.json(readMessages());
});

app.post('/api/messages', (req, res) => {
    try {
        updateMessages(req.body);
        res.json({ success: true, messages: readMessages() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Users ───────────────────────────────────────────────────────────────────
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(Object.entries(db.users || {}).map(([jid, d]) => ({
        jid, number: jid.replace('@s.whatsapp.net', ''), ...d
    })));
});

// ── User Management ─────────────────────────────────────────────────────────
app.get('/api/user/:number', (req, res) => {
    const db = readDB();
    const jid = req.params.number.replace(/\D/g, '') + '@s.whatsapp.net';
    const user = db.users?.[jid];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, jid, number: req.params.number.replace(/\D/g, ''), ...user });
});

app.post('/api/user/:number', (req, res) => {
    try {
        const dbPath = './database/database.json';
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        const jid = req.params.number.replace(/\D/g, '') + '@s.whatsapp.net';
        if (!db.users) db.users = {};
        if (!db.users[jid]) {
            db.users[jid] = { vip: false, ban: false, limit: 20, money: 10000000, afkTime: -1, afkReason: '', register: false };
        }
        const { vip, ban, limit, money } = req.body;
        if (vip !== undefined)   db.users[jid].vip   = Boolean(vip);
        if (ban !== undefined)   db.users[jid].ban   = Boolean(ban);
        if (limit !== undefined) db.users[jid].limit = parseInt(limit);
        if (money !== undefined) db.users[jid].money = parseInt(money);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ success: true, user: db.users[jid] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Groups ──────────────────────────────────────────────────────────────────
app.get('/api/groups', (req, res) => {
    const db = readDB();
    res.json(Object.entries(db.groups || {}).map(([jid, d]) => ({
        jid, id: jid.replace('@g.us', ''), ...d
    })));
});

function formatUptime(s) {
    return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${Math.floor(s%60)}s`;
}

app.listen(PORT, '0.0.0.0', () => console.log(`Dashboard running on port ${PORT}`));
