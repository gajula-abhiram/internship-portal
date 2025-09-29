import { randomBytes } from 'crypto';

console.log('🔐 JWT Secret Generator for Internship Portal\n');

// Generate secure JWT secret
const jwtSecret = randomBytes(32).toString('hex');
const nextAuthSecret = randomBytes(32).toString('hex');

console.log('✅ Generated secure secrets for production deployment:\n');

console.log('🔑 Environment Variables to set:');
console.log('─'.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('─'.repeat(60));

// Save to .env file
import { writeFileSync } from 'fs';
import { join } from 'path';

const envContent = `JWT_SECRET=${jwtSecret}
NEXTAUTH_SECRET=${nextAuthSecret}
`;

const envPath = join(process.cwd(), '.env');
writeFileSync(envPath, envContent);

console.log('\n✅ Secrets saved to .env file');
console.log('\n✨ Your internship portal is now ready for secure production deployment!');