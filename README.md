# WhatsApp Sticker Bot

A bot that converts incoming WhatsApp images into stickers and sends them back to the user.

## Deployment Options

### 1. Railway (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to [Railway](https://railway.app)
3. Deploy automatically
4. Check logs for QR code to scan

### 2. Render
1. Push your code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Deploy and check logs for QR code

### 3. Docker (Any platform)
```bash
docker build -t whatsapp-sticker .
docker run -p 3000:3000 whatsapp-sticker
```

## Local Development
1. Clone the repository
2. Run `npm install`
3. Start with `npm run dev`
4. Scan QR code from `qr_code.png`

## How to Use
1. Deploy the bot using any method above
2. Check deployment logs for QR code
3. Scan QR code with WhatsApp
4. Send images to get stickers back

## Requirements
- Node.js (v20 or later)
- TypeScript
