const Database = require('better-sqlite3');

console.log('Updating internship verification status...\n');

try {
  const db = new Database('internship.db');
  
  // Update all pending internships to verified
  const updateResult = db.prepare(`
    UPDATE internships 
    SET verification_status = 'VERIFIED' 
    WHERE verification_status = 'PENDING'
  `).run();
  
  console.log(`✅ Updated ${updateResult.changes} internships from PENDING to VERIFIED`);
  
  // Verify the update
  const verificationStats = db.prepare(`
    SELECT verification_status, COUNT(*) as count
    FROM internships
    GROUP BY verification_status
  `).all();
  
  console.log('\nUpdated Verification Status Distribution:');
  verificationStats.forEach(stat => {
    console.log(`  ${stat.verification_status}: ${stat.count}`);
  });
  
  // Get company count after update
  const companies = db.prepare(`
    SELECT COUNT(DISTINCT company_name) as count 
    FROM internships 
    WHERE is_active = 1 AND verification_status = 'VERIFIED'
  `).get();
  
  console.log(`\nVerified Companies: ${companies.count}`);
  
  db.close();
  
  console.log('\n✅ Internship verification update completed!');
  
} catch (error) {
  console.error('❌ Error updating internships:', error.message);
  process.exit(1);
}