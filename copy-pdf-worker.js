// Script to copy PDF.js worker file to public assets
const fs = require('fs');
const path = require('path');

// PDF.js 4.x uses .mjs extension for ES modules
const source = path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const dest = path.join(__dirname, 'public/assets/pdf.worker.min.mjs');

// Create assets directory if it doesn't exist
const assetsDir = path.dirname(dest);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created directory: ${assetsDir}`);
}

// Copy the file
try {
  fs.copyFileSync(source, dest);
  console.log(`✅ PDF worker copied to: ${dest}`);
} catch (error) {
  console.error(`❌ Failed to copy PDF worker:`, error.message);
  process.exit(1);
}
