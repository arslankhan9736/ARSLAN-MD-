

import 'dotenv/config';
import express from 'express';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';
import fs from 'fs';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const sessions = new Map();

app.get('/', (req, res) => {
  res.send(`
    <h2>ARSLAN-MD Pairing</h2>
    <form action="/pair" method="get">
      <input name="number" placeholder="923001234567" required />
      <button type="submit">Get Pairing Code</button>
    </form>
  `);
});

app.get('/pair', async (req, res) => {
  const number = String(req.query.number || '').replace(/\D/g, '');

  if (number.length < 10 || number.length > 15) {
    return res.status(400).send('Valid number with country code required.');
  }

  if (sessions.has(number)) {
    return res.status(429).send('Pairing request already running. Try later.');
  }

  sessions.set(number, true);

  try {
    const authDir = `sessions/${number}`;
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['ARSLAN-MD', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    const code = await sock.requestPairingCode(number);

    res.type('text').send(
      `ARSLAN-MD Pairing Code: ${code}\n\nWhatsApp > Linked Devices > Link a Device > Link with phone number`
    );
  } catch (err) {
    console.error('Pairing error:', err);
    res.status(500).send('Pairing failed. Check Heroku logs.');
  } finally {
    sessions.delete(number);
  }
});

app.listen(PORT, () => {
  console.log(`ARSLAN-MD Pairing server running on ${PORT}`);
});
