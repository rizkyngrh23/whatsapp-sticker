import sharp from 'sharp';
import * as path from 'path';

export const convertToSticker = async (inputPath: string, outputPath: string): Promise<void> => {
    try {
        await sharp(inputPath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .webp({ quality: 100 })
            .toFile(outputPath);

        console.log(`Sticker created at: ${outputPath}`);
    } catch (error) {
        console.error('Error converting image to sticker:', error);
        throw error;
    }
};

const inputImagePath = path.join(__dirname, 'media', 'example.jpeg');
const outputStickerPath = path.join(__dirname, 'media', 'example.webp');
