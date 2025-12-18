/**
 * Build Verification Script
 * Checks that the production build is ready
 */

import { existsSync } from 'fs';
import { join } from 'path';

const checks = [
  {
    name: 'Dist directory exists',
    check: () => existsSync(join(process.cwd(), 'dist')),
  },
  {
    name: 'Main app file exists',
    check: () => existsSync(join(process.cwd(), 'dist', 'app.js')),
  },
  {
    name: 'Config directory exists',
    check: () => existsSync(join(process.cwd(), 'dist', 'config')),
  },
  {
    name: 'Routes directory exists',
    check: () => existsSync(join(process.cwd(), 'dist', 'routes')),
  },
  {
    name: 'Services directory exists',
    check: () => existsSync(join(process.cwd(), 'dist', 'services')),
  },
  {
    name: 'Model directory exists',
    check: () => existsSync(join(process.cwd(), 'model')),
  },
];

console.log('🔍 Verifying production build...\n');

let allPassed = true;

for (const { name, check } of checks) {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (!passed) {
    allPassed = false;
  }
}

console.log('');

if (allPassed) {
  console.log('✅ All checks passed! Build is ready for production.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please run: npm run build');
  process.exit(1);
}

