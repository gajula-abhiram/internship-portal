#!/usr/bin/env node

/**
 * JWT Secret Generator for Production Deployment
 * Generates cryptographically secure secrets for JWT authentication
 */

import crypto from 'crypto';

console.log('🔐 JWT Secret Generator for Internship Portal\n');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated secure secrets for production deployment:\n');

console.log('🔑 Environment Variables to set:');
console.log('─'.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('─'.repeat(60));

console.log('\n📋 How to use these secrets:\n');

console.log('🌐 For Vercel Deployment:');
console.log('1. Go to your Vercel project dashboard');
console.log('2. Navigate to Settings > Environment Variables');
console.log('3. Add JWT_SECRET with the value above');
console.log('4. Add NEXTAUTH_SECRET with the value above');
console.log('5. Redeploy your application\n');

console.log('💻 For Local Development:');
console.log('1. Create .env.local file in your project root');
console.log('2. Add the environment variables above');
console.log('3. Restart your development server\n');

console.log('🚨 Security Notice:');
console.log('• Keep these secrets confidential');
console.log('• Never commit them to version control');
console.log('• Use different secrets for different environments');
console.log('• Regenerate if compromised\n');

console.log('✨ Your internship portal is now ready for secure production deployment!');