import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const input = path.resolve('./public/icon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(input);

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('./public/pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('./public/pwa-512x512.png'));

  // maskable icon with padding
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 246, g: 242, b: 231, alpha: 1 } // #F6F2E7
    }
  })
    .composite([{ input: svgBuffer, blend: 'over' }])
    .png()
    .toFile(path.resolve('./public/pwa-maskable-512x512.png'));

  // apple-touch-icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('./public/apple-touch-icon.png'));

  console.log('Icons generated successfully');
}

generateIcons().catch(console.error);
