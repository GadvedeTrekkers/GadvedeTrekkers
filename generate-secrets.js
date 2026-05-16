#!/usr/bin/env node

/**
 * Generate secure secrets for production deployment
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Secrets for Production\n');
console.log('='.repeat(60));

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n1️⃣  JWT_SECRET (copy this to Render environment variables):');
console.log('-'.repeat(60));
console.log(jwtSecret);

// Generate Admin API Key
const adminApiKey = crypto.randomBytes(32).toString('hex');
console.log('\n2️⃣  ADMIN_API_KEY (copy this to both Render and Netlify):');
console.log('-'.repeat(60));
console.log(adminApiKey);

// Generate a strong password suggestion
const passwordChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
let suggestedPassword = '';
for (let i = 0; i < 16; i++) {
  suggestedPassword += passwordChars.charAt(Math.floor(Math.random() * passwordChars.length));
}

console.log('\n3️⃣  Suggested Admin Password:');
console.log('-'.repeat(60));
console.log(suggestedPassword);
console.log('\n   Use this in ADMIN_USERS:');
console.log(`   [{"username":"admin","password":"${suggestedPassword}","name":"Admin","role":"Super Admin"}]`);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets generated successfully!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Copy these to your hosting platform (Render/Netlify)');
console.log('   - NEVER commit these to Git');
console.log('   - Save the admin password securely');
console.log('   - These are one-time use - generate new ones if lost\n');
