const Database = require('better-sqlite3');

console.log('Checking internship data...\n');

try {
  const db = new Database('internship.db');
  
  // Get internship statistics
  const internships = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
      COUNT(CASE WHEN verification_status = 'VERIFIED' THEN 1 END) as verified,
      COUNT(CASE WHEN verification_status = 'PENDING' THEN 1 END) as pending,
      COUNT(CASE WHEN verification_status = 'REJECTED' THEN 1 END) as rejected
    FROM internships
  `).get();
  
  console.log('Internship Statistics:');
  console.log(`  Total: ${internships.total}`);
  console.log(`  Active: ${internships.active}`);
  console.log(`  Verified: ${internships.verified}`);
  console.log(`  Pending: ${internships.pending}`);
  console.log(`  Rejected: ${internships.rejected}`);
  
  // Get company names
  const companies = db.prepare(`
    SELECT DISTINCT company_name 
    FROM internships 
    WHERE company_name IS NOT NULL 
    ORDER BY company_name
  `).all();
  
  console.log(`\nCompanies (${companies.length}):`);
  companies.forEach(company => {
    console.log(`  - ${company.company_name}`);
  });
  
  // Get verification status distribution
  const verificationStats = db.prepare(`
    SELECT verification_status, COUNT(*) as count
    FROM internships
    GROUP BY verification_status
  `).all();
  
  console.log('\nVerification Status Distribution:');
  verificationStats.forEach(stat => {
    console.log(`  ${stat.verification_status}: ${stat.count}`);
  });
  
  db.close();
  
  console.log('\n✅ Internship data check completed!');
  
} catch (error) {
  console.error('❌ Error checking internship data:', error.message);
  process.exit(1);
}