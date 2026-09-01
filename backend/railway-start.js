const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== Generating Prisma Client ===');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (e) {
  console.warn('Prisma generate notice:', e.message);
}

console.log('=== Running Database Migrations ===');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
  console.warn('Migrate deploy notice, attempting db push...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  } catch (err) {
    console.warn('Db push notice:', err.message);
  }
}

console.log('=== Ensuring Build Exists ===');
if (!fs.existsSync('./dist/src/main.js') && !fs.existsSync('./dist/main.js')) {
  console.log('Building project...');
  try { execSync('npm run build', { stdio: 'inherit' }); } catch (e) {}
}

console.log('=== Starting Application ===');
if (fs.existsSync('./dist/src/main.js')) {
  require('./dist/src/main');
} else if (fs.existsSync('./dist/main.js')) {
  require('./dist/main');
} else {
  console.error('❌ Error: dist/src/main.js not found');
  process.exit(1);
}
