const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  const projectRoot = __dirname;
  const cacheDir = path.join(projectRoot, '.cache', 'puppeteer');

  console.log('====================================================');
  console.log('🚀 [RENDER-BUILD] Starting WatchTower Build on Render');
  console.log('====================================================');

  // 1. Ensure all project dependencies are fully installed
  console.log('📦 [RENDER-BUILD] Verifying and installing project dependencies...');
  try {
    execSync('npm install --include=prod', { stdio: 'inherit' });
    console.log('✅ [RENDER-BUILD] Project dependencies installed.');
  } catch (err) {
    console.warn(`⚠️ [RENDER-BUILD] Dependency install notice: ${err.message}`);
  }

  // 1b. Verify critical runtime modules
  try {
    require('@google/genai');
    console.log('✅ [RENDER-BUILD] Verified @google/genai is resolvable.');
  } catch (modErr) {
    console.warn(`⚠️ [RENDER-BUILD] @google/genai not resolved initially (${modErr.message}), installing explicitly...`);
    try {
      execSync('npm install --no-audit --no-fund @google/genai@^2.30.0', { stdio: 'inherit' });
      require('@google/genai');
      console.log('✅ [RENDER-BUILD] @google/genai explicitly installed and verified.');
    } catch (installErr) {
      console.error('❌ [RENDER-BUILD] Failed to install @google/genai:', installErr.message);
    }
  }

  // 2. Ensure project workspace cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  console.log(`📁 [RENDER-BUILD] Puppeteer workspace cache: ${cacheDir}`);

  // 2. Install Chrome binary directly into workspace cache
  process.env.PUPPETEER_CACHE_DIR = cacheDir;
  console.log('🌐 [RENDER-BUILD] Installing Chrome browser for Puppeteer...');
  try {
    execSync('npx puppeteer browsers install chrome', {
      stdio: 'inherit',
      env: { ...process.env, PUPPETEER_CACHE_DIR: cacheDir }
    });
    console.log('✅ [RENDER-BUILD] Chrome browser installation successful.');
  } catch (err) {
    console.error('❌ [RENDER-BUILD] Chrome browser installation failed:', err.message);
    process.exit(1);
  }

  // 3. Verify installed executable
  try {
    const puppeteer = require('puppeteer');
    const execPath = await Promise.resolve(puppeteer.executablePath());
    console.log(`🔍 [RENDER-BUILD] Verified Puppeteer executablePath: ${execPath}`);
    if (execPath && fs.existsSync(execPath)) {
      console.log('✅ [RENDER-BUILD] Executable exists at verified path!');
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(execPath, 0o755);
          console.log('🔒 [RENDER-BUILD] Set chmod 0755 permissions on Chrome executable.');
        } catch (chmodErr) {
          console.warn(`⚠️ [RENDER-BUILD] Chmod note: ${chmodErr.message}`);
        }
      }
    } else {
      console.warn(`⚠️ [RENDER-BUILD] Warning: executablePath file not verified directly: ${execPath}`);
    }
  } catch (vErr) {
    console.warn(`⚠️ [RENDER-BUILD] Verification note: ${vErr.message}`);
  }

  // 4. Build Vite production bundle
  console.log('⚡ [RENDER-BUILD] Building frontend with Vite...');
  try {
    execSync('npx vite build', { stdio: 'inherit', env: process.env });
    console.log('✅ [RENDER-BUILD] Vite frontend build complete.');
  } catch (err) {
    console.error('❌ [RENDER-BUILD] Vite build failed:', err.message);
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🎉 [RENDER-BUILD] Build completed successfully!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal render-build error:', err);
  process.exit(1);
});
