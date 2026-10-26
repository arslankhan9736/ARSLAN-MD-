
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

async function startMiniBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./mini-bot-auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['ARSLAN-MD MINI', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'open') {
      console.log('ARSLAN-MD MINI BOT Connected!');
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status !== DisconnectReason.loggedOut) {
        startMiniBot();
      } else {
        console.log('WhatsApp logged out. Re-link the device.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const text = (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''
      ).trim();

      if (text.toLowerCase() === '.menu') {
        await sock.sendMessage(from, {
          text: `╭━━━『 ARSLAN-MD MINI 』━━━╮
┃ 🤖 WhatsApp Mini Bot
┃
┃ .menu  — Show menu
┃ .ping  — Check bot status
┃ .owner — Owner information
╰━━━━━━━━━━━━━━━━━━━━╯`
        });
      } else if (text.toLowerCase() === '.ping') {
        await sock.sendMessage(from, { text: '🏓 Pong! ARSLAN-MD MINI is online.' });
      } else if (text.toLowerCase() === '.owner') {
        await sock.sendMessage(from, { text: '👑 Owner: MR ARSLAN' });
      }
    }
  });
}

startMiniBot().catch(console.error);
