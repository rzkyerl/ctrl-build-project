import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const filesToOptimize = [
  'src/assets/images/portofolio/3nt-studio/3nt-home-mockup.png',
  'src/assets/images/portofolio/bookingin/bookingin-home-mockup.png',
  'src/assets/images/portofolio/berbagilagi/berbagi-home-mockup.png',
  'src/assets/images/portofolio/the-days/thedays-home-mockup.png'
];

async function optimize() {
  for (const file of filesToOptimize) {
    const absolutePath = path.resolve(file);
    if (fs.existsSync(absolutePath)) {
      const parsedPath = path.parse(absolutePath);
      const outputPath = path.join(parsedPath.dir, `${parsedPath.name}-opt.webp`);
      
      console.log(`Optimizing ${file}...`);
      await sharp(absolutePath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
      console.log(`Saved to ${outputPath}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  }
}

optimize().catch(console.error);
