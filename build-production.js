const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('--- STARTING MONOREPO PRODUCTION BUILD ---');

  // 1. Build frontend-web
  console.log('\n[1/3] Building frontend-web...');
  execSync('npm run build --workspace=frontend-web', { stdio: 'inherit' });

  // 2. Build mobile-simulator
  console.log('\n[2/3] Building mobile-simulator...');
  execSync('npm run build --workspace=mobile-simulator', { stdio: 'inherit' });

  // 3. Build backend
  console.log('\n[3/3] Building NestJS backend...');
  execSync('npm run build --workspace=backend', { stdio: 'inherit' });

  // 4. Create target directories in backend/dist
  console.log('\nCreating static file directories in backend/dist...');
  const publicDir = path.join(__dirname, 'backend', 'dist', 'public');
  const simulatorDir = path.join(__dirname, 'backend', 'dist', 'public-simulator');

  // Clean old targets if they exist
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  if (fs.existsSync(simulatorDir)) {
    fs.rmSync(simulatorDir, { recursive: true, force: true });
  }

  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(simulatorDir, { recursive: true });

  // 5. Copy built files
  console.log('Copying frontend-web dist to backend/dist/public...');
  fs.cpSync(path.join(__dirname, 'frontend-web', 'dist'), publicDir, { recursive: true });

  console.log('Copying mobile-simulator dist to backend/dist/public-simulator...');
  fs.cpSync(path.join(__dirname, 'mobile-simulator', 'dist'), simulatorDir, { recursive: true });

  console.log('\n--- PRODUCTION BUILD COMPLETED SUCCESSFULLY ---');
} catch (error) {
  console.error('\nBuild failed:', error);
  process.exit(1);
}
