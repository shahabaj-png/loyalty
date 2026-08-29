const { execSync } = require('child_process');

console.log('=== Generating Prisma Client ===');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('=== Running Database Migrations ===');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('=== Starting Application ===');
require('./dist/main');
