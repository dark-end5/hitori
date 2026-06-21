import fs from 'fs';
import chalk from 'chalk';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

/*
	* Create By Naze
	* Follow https://github.com/nazedev
	* Whatsapp : https://whatsapp.com/channel/0029VaWOkNm7DAWtkvkJBK43
*/

//~~~~~~~~~~~~< GLOBAL SETTINGS >~~~~~~~~~~~~\\

global.owner = ["254706519089"] // ['628','628'] 2 owner atau lebih
global.author = 'BaileysBot'
global.botname = 'Lesta Bot'
global.packname = 'Bot WhatsApp'
global.timezone = 'Africa/Nairobi' // East Africa Time (EAT) - Changed from Asia/Jakarta
global.locale = 'en' // Ganti pakai command .setlocale
global.listprefix = ["+","!","."]
global.defaultAdminKey = crypto.randomBytes(5).toString("hex");

global.listv = ['➩','➢','➣','➤','✦']
global.tempatDB = 'database.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.tempatStore = 'baileys_store.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.pairing_code = true
global.number_bot = '254706519089' // Kalo pake panel bisa masukin nomer di sini, jika belum ambil session. Format : '628xx'

global.fake = {
	anonim: 'https://telegra.ph/file/95670d63378f7f4210f03.png',
	thumbnailUrl: 'https://telegra.ph/file/fe4843a1261fc414542c4.jpg',
	thumbnail: fs.readFileSync('./src/media/naze.png'),
	docs: fs.readFileSync('./src/media/fake.pdf'),
	listfakedocs: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

global.my = {
	yt: "https://youtube.com/c/Nazedev",
	gh: "https://github.com/dark-end5",
	gc: "https://chat.whatsapp.com/EqMTCcxdCZgHUJNl5KooCr",
	ch: "120363250409960161@newsletter"
}

global.limit = {
	free: 20,
	premium: 9999999,
	vip: 9099999990
}

global.money = {
	free: 10000000,
	premium: 10000000000,
	vip: 100000000000
}

global.mess = {
	key: "Apikey limit! Silahkan Upgrade: https://naze.biz.id",
	owner: "*For Owner* !",
	admin: "*For Admin* !",
	botAdmin: "Bot Must be Admin!",
	onWa: "Nomor tersebut tidak terdaftar di WhatsApp!",
	group: "For Grup!",
	private: "For Private Chat!",
	quoted: "Reply pesannya!",
	limit: "Limit habis!",
	prem: "Khusus Premium!",
	text: "Masukkan teksnya!",
	media: "Kirim medianya!",
	wait: "*Processing* 🔄🔄▪️▪️▪️...",
	fail: "Failed to load❌!",
	error: "Error❗❗🔕!",
	done: "*Done* 👍 ✅"
}

global.APIs = {
	naze: 'https://api.naze.biz.id',
	neosantara: 'https://api.neosantara.xyz/v1',
}
global.APIKeys = {
	'https://api.naze.biz.id': 'nz-298327ff62',
	'https://api.neosantara.xyz/v1': 'API_KEY_NEOSANTARA_AI',
}

// Lainnya
global.jadwalSholat = {
	Subuh: '04:30',
	Dzuhur: '12:06',
	Ashar: '15:21',
	Maghrib: '18:08',
	Isya: '19:00'
}

global.badWords = [""] // input kata-kata toxic yg lain. ex: ['dongo','dongonya']
global.chatLength = 1000

// Template message types
global.templateTypes = {
	1: 'Button Message',
	2: 'List Message',
	3: 'Document Message',
	4: 'Video Message'
}

fs.watchFile(__filename, async () => {
	console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});
