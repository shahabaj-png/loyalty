const { execSync } = require('child_process');

console.log('=== Generating Prisma Client ===');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('=== Running Database Migrations ===');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('=== Starting Application ===');
const fs = require('fs');
if (fs.existsSync('./dist/src/main.js')) {
  require('./dist/src/main');
} else {
  require('./dist/main');
}
