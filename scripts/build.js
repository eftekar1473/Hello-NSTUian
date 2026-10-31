const { execSync } = require('child_process');

const isRender = Boolean(process.env.RENDER || process.env.IS_RENDER);
const isVercel = Boolean(process.env.VERCEL);

console.log(`[build.js] Environment detected: RENDER=${isRender}, VERCEL=${isVercel}`);

if (isRender) {
  console.log('[build.js] Building for Render API backend (server only)...');
  execSync('npm run build:server', { stdio: 'inherit' });
} else if (isVercel) {
  console.log('[build.js] Building for Vercel (client SPA)...');
  execSync('npm run build:client', { stdio: 'inherit' });
} else {
  console.log('[build.js] Building full stack (server + client)...');
  execSync('npm run build:server', { stdio: 'inherit' });
  execSync('npm run build:client', { stdio: 'inherit' });
}
