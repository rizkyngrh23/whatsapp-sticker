import makeWASocket, { DisconnectReason, useMultiFileAuthState, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { convertToSticker } from './sticker';
import QRCode from 'qrcode';

const authDirPath = process.env.AUTH_INFO_PATH || path.join(__dirname, 'auth_info_baileys');
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

console.log('=== WhatsApp Sticker Bot Starting ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('Host:', HOST);
console.log('Auth state path:', authDirPath);

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    } else if (req.url === '/qr' && req.method === 'GET') {
        if (fs.existsSync('qr_code.png')) {
            const qrImage = fs.readFileSync('qr_code.png');
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(qrImage);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'QR code not available. Bot may already be connected.' }));
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Health check server running on ${HOST}:${PORT}`);
});

const startBot = async () => {
    if (!fs.existsSync(authDirPath)) {
        fs.mkdirSync(authDirPath, { recursive: true });
    }
    
    console.log('Loading auth state from:', authDirPath);
    const { state, saveCreds } = await useMultiFileAuthState(authDirPath);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: isProduction,
    });

    sock.ev.on('creds.update', () => {
        console.log('Credentials updated and saved.');
        saveCreds();
    });
    sock.ev.on('connection.update', async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log('Generating QR code...');
            await QRCode.toFile('qr_code.png', qr);
            if (isProduction) {
                console.log('QR Code generated. Access it at: /qr endpoint');
                console.log('QR Code for WhatsApp Web:');
                console.log(qr);
            } else {
                console.log('QR code saved as qr_code.png. Open the file to scan it.');
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async (message) => {
        console.log('Received message:', JSON.stringify(message, null, 2));
        const msg = message.messages[0];
        if (!msg.message) return;

        if (msg.message.imageMessage) {
            console.log('Image received. Processing...');
            const mediaPath = path.join(__dirname, 'media');
            if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath);
            const stream = await downloadMediaMessage(msg, 'buffer', {}, {
                logger: sock.logger,
                reuploadRequest: sock.updateMediaMessage
            });
            const inputPath = path.join(mediaPath, `${Date.now()}.jpeg`);
            const outputPath = path.join(mediaPath, `${Date.now()}.webp`);
            fs.writeFileSync(inputPath, stream);
            console.log('Image saved to:', inputPath);

            try {
                await convertToSticker(inputPath, outputPath);
                console.log('Sticker created at:', outputPath);
                await sock.sendMessage(msg.key.remoteJid!, {
                    sticker: fs.readFileSync(outputPath),
                });
                console.log('Sticker sent to user.');
            } catch (error) {
                console.error('Error creating or sending sticker:', error);
            }
        }
    });
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

startBot().catch((err) => {
    console.error('Error starting bot:', err);
    process.exit(1);
});

