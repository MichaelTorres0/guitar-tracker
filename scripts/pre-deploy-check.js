#!/usr/bin/env node
// Pre-deployment verification script
// Checks that project is ready for Vercel deployment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const checks = [];

function check(name, condition, fix = '') {
  const passed = condition();
  checks.push({ name, passed, fix });
  console.log(`${passed ? '✓' : '✗'} ${name}`);
  if (!passed && fix) {
    console.log(`  Fix: ${fix}`);
  }
}

console.log('Guitar Tracker - Pre-Deployment Verification\n');

// Check required files exist
check(
  'vercel.json exists',
  () => fs.existsSync(path.join(rootDir, 'vercel.json')),
  'Create vercel.json configuration file'
);

check(
  'public/index.html exists',
  () => fs.existsSync(path.join(rootDir, 'public', 'index.html')),
  'Move index.html to public/ directory'
);

check(
  'api/health.js exists',
  () => fs.existsSync(path.join(rootDir, 'api', 'health.js')),
  'Create api/health.js endpoint'
);

check(
  'package.json has @notionhq/client',
  () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    return pkg.dependencies && pkg.dependencies['@notionhq/client'];
  },
  'Run: npm install @notionhq/client'
);

check(
  'package.json has "type": "module"',
  () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    return pkg.type === 'module';
  },
  'Add "type": "module" to package.json'
);

check(
  '.env.example exists',
  () => fs.existsSync(path.join(rootDir, '.env.example')),
  'Create .env.example with required variables'
);

check(
  '.gitignore excludes .env',
  () => {
    const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
    return gitignore.includes('.env');
  },
  'Add .env to .gitignore'
);

// Check git status for critical files
check(
  'No uncommitted changes in public/ or api/',
  () => {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const lines = status.trim().split('\n').filter(line => line);
      // Check if any changes are in critical directories
      const criticalChanges = lines.filter(line => {
        const file = line.substring(3); // Remove status prefix
        return file.startsWith('public/') ||
               file.startsWith('api/') ||
               file === 'vercel.json' ||
               file === 'package.json';
      });
      return criticalChanges.length === 0;
    } catch {
      return false;
    }
  },
  'Commit changes in public/, api/, vercel.json, or package.json'
);

// Check API routes exist
check(
  'API routes exist',
  () => {
    const apiDir = path.join(rootDir, 'api');
    if (!fs.existsSync(apiDir)) return false;
    const files = fs.readdirSync(apiDir);
    return files.includes('health.js');
  },
  'Create required API routes in api/ directory'
);

// Check service worker exists (optional for initial deployment)
const hasServiceWorker = fs.existsSync(path.join(rootDir, 'public', 'sw.js'));
console.log(`${hasServiceWorker ? '✓' : '⚠'} Service worker exists ${!hasServiceWorker ? '(optional - PWA features limited)' : ''}`);
if (!hasServiceWorker) {
  console.log('  Note: App will work without service worker, but offline capabilities will be limited');
}

// Check manifest exists
check(
  'PWA manifest exists',
  () => fs.existsSync(path.join(rootDir, 'public', 'manifest.json')),
  'Create public/manifest.json'
);

// Summary
const passed = checks.filter(c => c.passed).length;
const total = checks.length;

console.log(`\n${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n✅ Project is ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub: git push origin main');
  console.log('2. Deploy to Vercel: vercel --prod');
  console.log('3. See docs/DEPLOYMENT.md for full guide');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the issues above before deploying');
  process.exit(1);
}
