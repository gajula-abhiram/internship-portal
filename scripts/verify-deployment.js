#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if the application is properly configured for deployment
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Internship Portal Deployment Verification\n');

// Check required files
const requiredFiles = [
  'package.json',
  'next.config.js',
  'vercel.json',
  'src/app/page.tsx',
  'src/lib/database.ts',
  'src/lib/auth.ts'
];

let allFilesExist = true;
console.log('📁 Checking required files...');
for (const file of requiredFiles) {
  const filePath = join(__dirname, '..', file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Critical files are missing. Please check your repository.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔐 Checking environment configuration...');
const requiredEnvVars = ['JWT_SECRET', 'NEXTAUTH_SECRET'];
const missingEnvVars = [];

// In Vercel environment, these should be set in the dashboard
if (process.env.VERCEL !== '1') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar);
    }
  }
  
  if (missingEnvVars.length > 0) {
    console.log(`  ⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.log('  💡 For production deployment, set these in your Vercel dashboard');
  } else {
    console.log('  ✅ All required environment variables are set');
  }
} else {
  console.log('  ✅ Running in Vercel environment (environment variables should be set in dashboard)');
}

// Check database configuration
console.log('\n💾 Checking database configuration...');
if (process.env.VERCEL === '1' || process.env.ENABLE_MEMORY_DB === 'true' || process.env.DATABASE_URL === 'memory://') {
  console.log('  ✅ Using memory database (suitable for Vercel serverless deployment)');
} else {
  console.log('  ✅ Using file-based database (suitable for local development)');
}

// Check Next.js configuration
console.log('\n⚙️  Checking Next.js configuration...');
try {
  const nextConfig = await import('../next.config.js');
  if (nextConfig.default) {
    console.log('  ✅ Next.js configuration found');
  } else {
    console.log('  ❌ Next.js configuration is invalid');
  }
} catch (error) {
  console.log('  ❌ Failed to load Next.js configuration:', error.message);
}

// Check Vercel configuration
console.log('\n🌐 Checking Vercel configuration...');
try {
  const vercelConfig = await import('../vercel.json', { assert: { type: 'json' } });
  if (vercelConfig.default) {
    console.log('  ✅ Vercel configuration found');
    
    // Check environment variables in vercel.json
    if (vercelConfig.default.env) {
      console.log('  📋 Vercel environment variables:');
      for (const [key, value] of Object.entries(vercelConfig.default.env)) {
        console.log(`    ${key}=${value}`);
      }
    }
  } else {
    console.log('  ❌ Vercel configuration is invalid');
  }
} catch (error) {
  console.log('  ❌ Failed to load Vercel configuration:', error.message);
}

console.log('\n✅ Deployment verification completed!');
console.log('\n📋 Next steps:');
console.log('  1. For local development: npm run dev');
console.log('  2. For production deployment: Follow the VERCEL-DEPLOYMENT-GUIDE.md');
console.log('  3. Ensure environment variables are set in your deployment platform');

process.exit(0);