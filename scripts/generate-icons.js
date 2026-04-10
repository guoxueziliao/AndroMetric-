const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '..', 'public', 'icon.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

async function generateIcons() {
  try {
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error('Source icon not found:', SOURCE_ICON);
      process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('PWA Icon Generator');
    console.log('====================');
    console.log('');
    console.log('Source:', SOURCE_ICON);
    console.log('Output:', OUTPUT_DIR);
    console.log('');
    console.log('Required sizes:', SIZES.join(', '));
    console.log('');
    console.log('To generate icons, install ImageMagick:');
    console.log('  Ubuntu/Debian: sudo apt-get install imagemagick');
    console.log('  macOS: brew install imagemagick');
    console.log('  Windows: choco install imagemagick');
    console.log('');
    console.log('Then run: bash scripts/generate-icons.sh');
    console.log('');
    console.log('Or use an online tool:');
    console.log('  https://pwa-asset-generator.nicepkg.cn/');
    console.log('  https://realfavicongenerator.net/');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

generateIcons();
