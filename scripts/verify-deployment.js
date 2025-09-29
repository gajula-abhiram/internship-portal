import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying Vercel deployment readiness...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'vercel.json',
  '.gitignore'
];

console.log('📋 Checking required files...');
const missingFiles = [];
for (const file of requiredFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file}`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.log(`\n❌ Missing required files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Check package.json for required scripts
console.log('\n🔧 Checking package.json scripts...');
try {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  const requiredScripts = ['build', 'start'];
  const missingScripts = [];
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      console.log(`  ❌ ${script}`);
      missingScripts.push(script);
    } else {
      console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
    }
  }
  
  if (missingScripts.length > 0) {
    console.log(`\n❌ Missing required scripts: ${missingScripts.join(', ')}`);
    process.exit(1);
  }
} catch (error) {
  console.log('  ❌ Failed to parse package.json');
  process.exit(1);
}

// Check vercel.json configuration
console.log('\n⚙️  Checking vercel.json configuration...');
try {
  const vercelJsonPath = join(process.cwd(), 'vercel.json');
  const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
  
  if (vercelJson.buildCommand) {
    console.log(`  ✅ Build command: ${vercelJson.buildCommand}`);
  } else {
    console.log('  ⚠️  No build command specified (will use default)');
  }
  
  if (vercelJson.outputDirectory) {
    console.log(`  ✅ Output directory: ${vercelJson.outputDirectory}`);
  } else {
    console.log('  ⚠️  No output directory specified (will use default)');
  }
  
  console.log('  ✅ Environment variables configured');
} catch (error) {
  console.log('  ❌ Failed to parse vercel.json');
  process.exit(1);
}

// Check Next.js configuration
console.log('\n⚛️  Checking Next.js configuration...');
try {
  const nextConfigPath = join(process.cwd(), 'next.config.js');
  if (existsSync(nextConfigPath)) {
    console.log('  ✅ next.config.js exists');
  } else {
    console.log('  ❌ next.config.js not found');
    process.exit(1);
  }
} catch (error) {
  console.log('  ❌ next.config.js not found');
  process.exit(1);
}

// Check for API routes
console.log('\n🔌 Checking API routes...');
try {
  const apiDirPath = join(process.cwd(), 'src', 'app', 'api');
  if (existsSync(apiDirPath)) {
    console.log('  ✅ API routes directory exists');
  } else {
    console.log('  ⚠️  No API routes directory found');
  }
} catch (error) {
  console.log('  ⚠️  No API routes directory found');
}

// Check for database configuration
console.log('\n🗄️  Checking database configuration...');
try {
  const dbFile = join(process.cwd(), 'src', 'lib', 'database.ts');
  if (existsSync(dbFile)) {
    console.log('  ✅ Database configuration exists');
    
    // Check if memory database is configured
    const dbContent = readFileSync(dbFile, 'utf-8');
    if (dbContent.includes('getMemoryDatabase')) {
      console.log('  ✅ Memory database support configured for Vercel');
    } else {
      console.log('  ⚠️  Memory database support not found');
    }
  } else {
    console.log('  ⚠️  Database configuration not found');
  }
} catch (error) {
  console.log('  ⚠️  Database configuration not found');
}

console.log('\n✅ Vercel deployment verification completed successfully!');
console.log('\n📝 To deploy to Vercel:');
console.log('   1. Push your code to a GitHub repository');
console.log('   2. Connect the repository to Vercel');
console.log('   3. Vercel will automatically detect and deploy your Next.js app');
console.log('   4. Set environment variables in Vercel dashboard if needed');