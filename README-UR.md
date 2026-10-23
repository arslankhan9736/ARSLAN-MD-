# Arslan-MD — Android / Termux Starter

یہ ابتدائی پروجیکٹ JavaScript اور Node.js استعمال کرتا ہے۔ یہ unofficial WhatsApp Web library استعمال کرتا ہے؛ WhatsApp اکاؤنٹ محدود یا لاگ آؤٹ ہو سکتا ہے۔ اپنے اہم ذاتی اکاؤنٹ کے بجائے الگ نمبر پر ٹیسٹ کریں اور WhatsApp کی شرائط دیکھیں۔

## فیچرز جو اس ورژن میں شامل ہیں
- `.menu`, `.ping`, `.joke`, `.info`
- سادہ سلام کا خودکار جواب
- گروپ میں آنے/جانے والوں کے لیے welcome/goodbye
- تصویر پر reply کرکے `.sticker`
- `.tagall`, `.kick`, `.promote`, `.demote` — صرف گروپ ایڈمن کے لیے
- `.ai` کا placeholder؛ ابھی حقیقی AI API منسلک نہیں

## Android پر چلانے کا طریقہ

1. F-Droid سے Termux انسٹال کریں: https://f-droid.org/packages/com.termux/
2. Termux کھول کر چلائیں:

```bash
pkg update && pkg upgrade
pkg install nodejs-lts git
```

3. ZIP کو فون کے Downloads فولڈر میں رکھیں۔ Termux میں storage access دیں:

```bash
termux-setup-storage
```

4. اگر ZIP Downloads میں ہے تو:

```bash
pkg install unzip
cd ~/storage/downloads
unzip Arslan-MD.zip
cd Arslan-MD
```

اگر فولڈر کا نام مختلف ہو تو `ls` سے دیکھ کر اس فولڈر میں جائیں۔

5. dependencies انسٹال کریں:

```bash
npm install
```

6. config فائل بنائیں:

```bash
cp .env.example .env
nano .env
```

`OWNER_NUMBER` میں اپنا نمبر ملک کے کوڈ سمیت صرف ہندسوں میں لکھ سکتے ہیں، مثلاً پاکستان کے لیے `923001234567`۔ اسے خالی بھی چھوڑ سکتے ہیں۔ فائل محفوظ کرنے کے لیے nano میں Ctrl+O، Enter، پھر Ctrl+X استعمال کریں۔

7. بوٹ چلائیں:

```bash
npm start
```

8. دکھایا گیا QR کوڈ WhatsApp → Settings → Linked devices → Link a device سے اسکین کریں۔ QR یا `.auth_info` فولڈر کسی کو نہ بھیجیں۔

## اہم سیکیورٹی
- `.env` اور `.auth_info/` نجی رکھیں؛ GitHub پر اپلوڈ نہ کریں۔
- QR / session data، API keys یا tokens کسی سے شیئر نہ کریں۔
- صرف ان گروپس میں استعمال کریں جہاں آپ کو اجازت ہو۔
- Android کی بیٹری/پس منظر کی پابندیوں کی وجہ سے بوٹ مسلسل آن رہنے کی ضمانت نہیں۔
- حقیقی AI Chat، Image Generator اور Download commands ابھی شامل نہیں؛ ان کے لیے الگ API/provider، لاگت، حدود اور حفاظتی جانچ درکار ہے۔
- گروپ ایڈمن کمانڈز کے لیے بوٹ نمبر کو متعلقہ گروپ میں ایڈمن بنانا پڑ سکتا ہے۔
