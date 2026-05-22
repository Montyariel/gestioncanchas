const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'app');
const destDir = path.join(__dirname, 'dist');

console.log(`[CopyDist] Copying assets from ${srcDir} to ${destDir}...`);

try {
  // Ensure destDir exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy everything recursively
  fs.cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log('[CopyDist] ✅ Assets copied successfully!');
} catch (err) {
  console.error('[CopyDist] ❌ Error copying assets:', err.message);
  process.exit(1);
}
