/**
 * Build script to create admin panel static files for backend
 * This copies the built admin pages from the main frontend build
 */

import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const backendDir = __dirname;
const adminDistDir = join(backendDir, 'admin-dist');

console.log('🏗️  Building Admin Panel for Backend...\n');

// Step 1: Build the main frontend
console.log('📦 Building frontend...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Frontend build complete\n');
} catch (error) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}

// Step 2: Clean previous admin dist
if (existsSync(adminDistDir)) {
  console.log('🧹 Cleaning previous admin build...');
  rmSync(adminDistDir, { recursive: true, force: true });
}

// Step 3: Copy dist to backend
console.log('📋 Copying admin files to backend...');
const distDir = join(rootDir, 'dist');
if (!existsSync(distDir)) {
  console.error('❌ Dist directory not found');
  process.exit(1);
}

cpSync(distDir, adminDistDir, { recursive: true });
console.log('✅ Admin files copied\n');

console.log('🎉 Admin panel build complete!');
console.log(`📁 Admin files location: ${adminDistDir}`);
