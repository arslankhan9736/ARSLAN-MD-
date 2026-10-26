import 'dotenv/config';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const BOT_NAME = process.env.BOT_NAME || 'ARSLAN-MD';
const OWNER_NAME = process.env.OWNER_NAME || 'MR ARSLAN';
const PREFIX = process.env.PREFIX || '.';
const OWNER_NUMBER = (process.env.OWNER_NUMBER || '923467214839').replace(/\D/g, '');
const AUTH_DIR = '.auth_info';
const cooldowns = new Map();

const jokes = [
  'استاد: ہوم ورک کہاں ہے؟ طالب علم: سر، کاپی آج چھٹی پر ہے! 😂',
  'دوست: تم اتنے خاموش کیوں ہو؟ دوسرا: موبائل کی بیٹری بھی کم ہے اور میری بھی! 😄',
  'امی: پڑھائی کیسی جا رہی ہے؟ بیٹا: کتاب کھلی ہے، اب دیکھتے ہیں بات کہاں تک جاتی ہے! 🤭'
];

function getText(message) {
  const m = message?.message;
  return m?.conversation
    || m?.extendedTextMessage?.text
    || m?.imageMessage?.caption
    || m?.videoMessage?.caption
    || m?.documentMessage?.caption
    || '';
}

function senderNumber(jid = '') {
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

function isAdminParticipant(groupMetadata, jid) {
  const participant = groupMetadata?.participants?.find(p => p.id === jid);
  return Boolean(participant?.admin);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: [BOT_NAME, 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\\nWhatsApp میں Linked devices کھول کر یہ QR اسکین کریں:\\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log(`✅ ${BOT_NAME} کنیکٹ ہو گیا ہے۔`);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log('کنکشن بند ہوا۔', shouldReconnect ? 'دوبارہ کنیکٹ ہو رہا ہے...' : 'لاگ آؤٹ ہوا؛ دوبارہ لنک کریں۔');
      if (shouldReconnect) startBot().catch(console.error);
    }
  });

  sock.ev.on('group-participants.update', async update => {
    try {
      const metadata = await sock.groupMetadata(update.id);
      const groupName = metadata.subject || 'گروپ';
      for (const participant of update.participants) {
        const number = participant.split('@')[0];
        if (update.action === 'add') {
          await sock.sendMessage(update.id, {
            text: `👋 خوش آمدید @${number}!\nآپ ${groupName} میں شامل ہوئے ہیں۔\n🤖 ${BOT_NAME}`,
            mentions: [participant]
          });
        } else if (update.action === 'remove') {
          await sock.sendMessage(update.id, {
            text: `👋 @${number} گروپ سے چلے گئے۔ اللہ حافظ!`,
            mentions: [participant]
          });
        }
      }
    } catch (err) {
      console.error('Welcome/Goodbye error:', err.message);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast') continue;

      const text = getText(msg).trim();
      const isGroup = jid.endsWith('@g.us');
      const senderJid = msg.key.participant || jid;
      const sender = senderNumber(senderJid);
      const isOwner = OWNER_NUMBER && sender === OWNER_NUMBER;
      const lower = text.toLowerCase();

      // Simple, opt-out-friendly keyword auto-replies.
      if (lower === 'salam' || lower === 'السلام علیکم' || lower === 'assalamualaikum') {
        await sock.sendMessage(jid, { text: 'وعلیکم السلام! 😊 میں Arslan-MD ہوں۔ کمانڈز کے لیے .menu لکھیں۔' }, { quoted: msg });
      }

      if (!text.startsWith(PREFIX)) continue;
      const parts = text.slice(PREFIX.length).trim().split(/\s+/);
      const command = (parts.shift() || '').toLowerCase();
      const args = parts.join(' ');

      const cooldownKey = `${sender}:${command}`;
      const now = Date.now();
      if (cooldowns.has(cooldownKey) && now - cooldowns.get(cooldownKey) < 1000) continue;
      cooldowns.set(cooldownKey, now);

      try {
        switch (command) {
          case 'menu':
          case 'help':
            await sock.sendMessage(jid, {
              text:
`╭━━━〔 🤖 ${BOT_NAME} 〕━━━╮
│ .menu  — کمانڈ مینو
│ .ping  — بوٹ چیک
│ .joke  — لطیفہ
│ .info  — بوٹ کی معلومات
│ .ai سوال — AI فیچر (ابھی کنیکٹ نہیں)
│ .sticker — جواب میں تصویر دے کر اسٹیکر
│ .tagall — گروپ ممبرز کو ٹیگ (صرف ایڈمن)
│ .kick @member — ممبر نکالیں (صرف ایڈمن)
│ .promote @member — ایڈمن بنائیں (صرف ایڈمن)
│ .demote @member — ایڈمن ہٹائیں (صرف ایڈمن)
╰━━━━━━━━━━━━━━━━━━━━━━╯

نوٹ: AI، تصویر بنانے اور ڈاؤن لوڈ فیچرز کے لیے الگ سروس/API درکار ہے۔`
            }, { quoted: msg });
            break;

          case 'ping':
            await sock.sendMessage(jid, { text: '🏓 Pong! Arslan-MD چل رہا ہے۔' }, { quoted: msg });
            break;

          case 'joke':
            await sock.sendMessage(jid, { text: jokes[Math.floor(Math.random() * jokes.length)] }, { quoted: msg });
            break;

          case 'info':
            await sock.sendMessage(jid, {
              text: `🤖 نام: ${BOT_NAME}\n🧩 ورژن: 1.0.0\n📱 پلیٹ فارم: Node.js / Termux\n🔑 Prefix: ${PREFIX}`
            }, { quoted: msg });
            break;

          case 'ai':
            await sock.sendMessage(jid, {
              text: args
                ? '🧠 AI سروس ابھی منسلک نہیں ہے۔ حقیقی AI جواب کے لیے کسی قابلِ اعتماد AI provider کی API key اور integration شامل کرنا ہوگی۔'
                : 'استعمال: .ai اپنا سوال'
            }, { quoted: msg });
            break;

          case 'sticker': {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const hasImage = msg.message?.imageMessage || quoted?.imageMessage;
            if (!hasImage) {
              await sock.sendMessage(jid, { text: 'پہلے کسی تصویر پر Reply کریں، پھر .sticker لکھیں۔' }, { quoted: msg });
              break;
            }
            const target = quoted ? {
              key: {
                remoteJid: jid,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
              },
              message: quoted
            } : msg;
            const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buffer, {
              pack: BOT_NAME,
              author: 'Arslan',
              type: StickerTypes.FULL,
              categories: ['🤖', '✨']
            });
            await sock.sendMessage(jid, await sticker.toMessage(), { quoted: msg });
            break;
          }

          case 'tagall': {
            if (!isGroup) {
              await sock.sendMessage(jid, { text: 'یہ کمانڈ صرف گروپ میں کام کرتی ہے۔' }, { quoted: msg });
              break;
            }
            const metadata = await sock.groupMetadata(jid);
            if (!isAdminParticipant(metadata, senderJid)) {
              await sock.sendMessage(jid, { text: 'یہ کمانڈ صرف گروپ ایڈمن استعمال کر سکتا ہے۔' }, { quoted: msg });
              break;
            }
            const mentions = metadata.participants.map(p => p.id);
            const lines = mentions.map(p => `• @${p.split('@')[0]}`).join('\\n');
            await sock.sendMessage(jid, { text: `📢 ${args || 'تمام ممبرز'}\\n${lines}`, mentions }, { quoted: msg });
            break;
          }

          case 'kick':
          case 'promote':
          case 'demote': {
            if (!isGroup) {
              await sock.sendMessage(jid, { text: 'یہ کمانڈ صرف گروپ میں کام کرتی ہے۔' }, { quoted: msg });
              break;
            }
            const metadata = await sock.groupMetadata(jid);
            if (!isAdminParticipant(metadata, senderJid)) {
              await sock.sendMessage(jid, { text: 'یہ کمانڈ صرف گروپ ایڈمن استعمال کر سکتا ہے۔' }, { quoted: msg });
              break;
            }
            const context = msg.message?.extendedTextMessage?.contextInfo;
            const mentioned = context?.mentionedJid || [];
            const targets = mentioned.length ? mentioned : (context?.participant ? [context.participant] : []);
            if (!targets.length) {
              await sock.sendMessage(jid, { text: `کسی ممبر کو @mention یا Reply کریں، پھر .${command} لکھیں۔` }, { quoted: msg });
              break;
            }
            const action = command === 'kick' ? 'remove' : command;
            await sock.groupParticipantsUpdate(jid, targets, action);
            await sock.sendMessage(jid, { text: `✅ کمانڈ مکمل: ${command}` }, { quoted: msg });
            break;
          }

          default:
            // Unknown commands are intentionally ignored to avoid noisy group chats.
            break;
        }
      } catch (err) {
        console.error(`Command .${command} error:`, err.message);
        await sock.sendMessage(jid, { text: 'معذرت، اس کمانڈ میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔' }, { quoted: msg }).catch(() => {});
      }
    }
  });
}

startBot().catch(err => {
  console.error('Bot start error:', err);
  process.exitCode = 1;
});
