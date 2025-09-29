import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database setup (copied from database.ts)
 */
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/internship.db' 
    : join(process.cwd(), 'internship.db');
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

/**
 * Auth utilities (copied from auth.ts)
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Seed script to populate the database with Rajasthan-specific realistic sample data
 * Usage: node scripts/seed-realistic-data.js
 */

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding with realistic Rajasthan data...');
    
    const db = getDatabase();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.prepare('DELETE FROM feedback').run();
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM internships').run();
    db.prepare('DELETE FROM users').run();

    // Sample password hash - now meets strong password requirements
    const defaultPasswordHash = await hashPassword('Password123!');

    // Seed Users - Tenant and roles data
    console.log('👥 Seeding users with realistic Rajasthan data...');
    
    // Companies and HR users
    const companies = [
      { id: "cmp_jaipursoft", name: "JaipurSoft Solutions Pvt Ltd", city: "Jaipur", industry: "Software" },
      { id: "cmp_deserttech", name: "DesertTech Analytics Pvt Ltd", city: "Jodhpur", industry: "Data/AI" },
      { id: "cmp_thariot", name: "Thar IoT Labs", city: "Jaisalmer", industry: "IoT/Embedded" },
      { id: "cmp_aravalli", name: "Aravalli Fintech", city: "Udaipur", industry: "Fintech" },
      { id: "cmp_marwarmotors", name: "Marwar Motors R&D", city: "Jodhpur", industry: "Automotive" },
      { id: "cmp_ajmercloud", name: "Ajmer Cloud Services", city: "Ajmer", industry: "Cloud/Infra" },
      { id: "cmp_bikanerfoods", name: "Bikaner Foods Automation", city: "Bikaner", industry: "FMCG/Automation" },
      { id: "cmp_kotasteel", name: "Kota SteelWorks Digital", city: "Kota", industry: "Industry 4.0" }
    ];
    
    // HR users
    const hrUsers = [
      { id: "hr_1", name: "Ananya Rathore", email: "ananya.hr@jaipursoft.local", phone: "9876000101", company_id: "cmp_jaipursoft" },
      { id: "hr_2", name: "Rohit Singh", email: "rohit.hr@deserttech.local", phone: "9876000102", company_id: "cmp_deserttech" },
      { id: "hr_3", name: "Sara Mehta", email: "sara.hr@thariot.local", phone: "9876000103", company_id: "cmp_thariot" },
      { id: "hr_4", name: "Vikram Soni", email: "vikram.hr@aravalli.local", phone: "9876000104", company_id: "cmp_aravalli" },
      { id: "hr_5", name: "Neha Purohit", email: "neha.hr@marwarmotors.local", phone: "9876000105", company_id: "cmp_marwarmotors" },
      { id: "hr_6", name: "Kunal Jain", email: "kunal.hr@ajmercloud.local", phone: "9876000106", company_id: "cmp_ajmercloud" },
      { id: "hr_7", name: "Priyanka Sharma", email: "priyanka.hr@bikanerfoods.local", phone: "9876000107", company_id: "cmp_bikanerfoods" },
      { id: "hr_8", name: "Imran Khan", email: "imran.hr@kotasteel.local", phone: "9876000108", company_id: "cmp_kotasteel" }
    ];
    
    // Faculty mentors
    const mentors = [
      { id: "mnt_1", name: "Prof. Nidhi Bansal", department: "CSE", email: "nidhi.bansal@rtu.local", phone: "9829000201", mentor_load: 18 },
      { id: "mnt_2", name: "Dr. Arvind Kulhari", department: "ECE", email: "arvind.kulhari@rtu.local", phone: "9829000202", mentor_load: 20 },
      { id: "mnt_3", name: "Prof. Shreya Joshi", department: "AI&DS", email: "shreya.joshi@rtu.local", phone: "9829000203", mentor_load: 16 },
      { id: "mnt_4", name: "Dr. Mukesh Verma", department: "ME", email: "mukesh.verma@rtu.local", phone: "9829000204", mentor_load: 22 },
      { id: "mnt_5", name: "Prof. Kavita Jain", department: "EE", email: "kavita.jain@rtu.local", phone: "9829000205", mentor_load: 19 },
      { id: "mnt_6", name: "Prof. Ritu Choudhary", department: "IT", email: "ritu.choudhary@rtu.local", phone: "9829000206", mentor_load: 17 }
    ];
    
    // Students
    const students = [
      {
        id: "stu_1001",
        name: "Aarav Gupta",
        email: "aarav.gupta@rtu.local",
        phone: "9818000301",
        roll_no: "21CSE001",
        department: "CSE",
        year: 4,
        cgpa: 8.6,
        skills: ["Java", "Spring", "SQL", "Data Structures", "Algorithms", "Git"],
        preferences: { cities: ["Jaipur", "Udaipur"], modes: ["Hybrid", "Remote"], min_stipend_inr: 8000 },
        mentor_id: "mnt_1"
      },
      {
        id: "stu_1002",
        name: "Ishita Sharma",
        email: "ishita.sharma@rtu.local",
        phone: "9818000302",
        roll_no: "21IT014",
        department: "IT",
        year: 3,
        cgpa: 8.1,
        skills: ["JavaScript", "React", "Next.js", "Node.js", "MongoDB"],
        preferences: { cities: ["Jaipur"], modes: ["Remote"], min_stipend_inr: 6000 },
        mentor_id: "mnt_6"
      },
      {
        id: "stu_1003",
        name: "Mohit Verma",
        email: "mohit.verma@rtu.local",
        phone: "9818000303",
        roll_no: "21AIDS007",
        department: "AI&DS",
        year: 4,
        cgpa: 9.0,
        skills: ["Python", "Machine Learning", "Data Analysis", "Power BI", "SQL"],
        preferences: { cities: ["Jodhpur", "Jaipur"], modes: ["Hybrid"], min_stipend_inr: 10000 },
        mentor_id: "mnt_3"
      },
      {
        id: "stu_1004",
        name: "Sara Khan",
        email: "sara.khan@rtu.local",
        phone: "9818000304",
        roll_no: "21ECE022",
        department: "ECE",
        year: 4,
        cgpa: 7.9,
        skills: ["Embedded C", "IoT", "MATLAB", "Verilog", "C++"],
        preferences: { cities: ["Jaisalmer", "Jaipur"], modes: ["Onsite"], min_stipend_inr: 7000 },
        mentor_id: "mnt_2"
      },
      {
        id: "stu_1005",
        name: "Rohan Singh",
        email: "rohan.singh@rtu.local",
        phone: "9818000305",
        roll_no: "21ME010",
        department: "ME",
        year: 3,
        cgpa: 7.4,
        skills: ["AutoCAD", "SolidWorks", "HVAC", "PLC"],
        preferences: { cities: ["Kota", "Jodhpur"], modes: ["Onsite"], min_stipend_inr: 5000 },
        mentor_id: "mnt_4"
      },
      {
        id: "stu_1006",
        name: "Priya Jain",
        email: "priya.jain@rtu.local",
        phone: "9818000306",
        roll_no: "21EE019",
        department: "EE",
        year: 4,
        cgpa: 8.3,
        skills: ["Power Systems", "MATLAB", "Python", "Data Analysis"],
        preferences: { cities: ["Kota"], modes: ["Hybrid"], min_stipend_inr: 6000 },
        mentor_id: "mnt_5"
      },
      {
        id: "stu_1007",
        name: "Kunal Pareek",
        email: "kunal.pareek@rtu.local",
        phone: "9818000307",
        roll_no: "21CSE055",
        department: "CSE",
        year: 3,
        cgpa: 8.0,
        skills: ["TypeScript", "Next.js", "PostgreSQL", "Docker"],
        preferences: { cities: ["Ajmer", "Jaipur"], modes: ["Remote", "Hybrid"], min_stipend_inr: 7000 },
        mentor_id: "mnt_1"
      },
      {
        id: "stu_1008",
        name: "Neeraj Yadav",
        email: "neeraj.yadav@rtu.local",
        phone: "9818000308",
        roll_no: "21CIV022",
        department: "CIVIL",
        year: 4,
        cgpa: 7.2,
        skills: ["Construction Management", "AutoCAD", "Project Scheduling"],
        preferences: { cities: ["Jaipur"], modes: ["Onsite"], min_stipend_inr: 5000 },
        mentor_id: "mnt_4"
      },
      {
        id: "stu_1009",
        name: "Meera Choudhary",
        email: "meera.choudhary@rtu.local",
        phone: "9818000309",
        roll_no: "21IT037",
        department: "IT",
        year: 4,
        cgpa: 8.7,
        skills: ["JavaScript", "React", "SQL", "Tableau"],
        preferences: { cities: ["Jaipur", "Udaipur"], modes: ["Hybrid"], min_stipend_inr: 9000 },
        mentor_id: "mnt_6"
      },
      {
        id: "stu_1010",
        name: "Farhan Ali",
        email: "farhan.ali@rtu.local",
        phone: "9818000310",
        roll_no: "21AIDS033",
        department: "AI&DS",
        year: 3,
        cgpa: 8.9,
        skills: ["Python", "NLP", "Machine Learning", "MongoDB"],
        preferences: { cities: ["Jodhpur"], modes: ["Remote"], min_stipend_inr: 10000 },
        mentor_id: "mnt_3"
      },
      {
        id: "stu_1011",
        name: "Ritika Maheshwari",
        email: "ritika.maheshwari@rtu.local",
        phone: "9818000311",
        roll_no: "21ECE041",
        department: "ECE",
        year: 4,
        cgpa: 8.2,
        skills: ["Computer Vision", "Embedded C", "C++", "Python"],
        preferences: { cities: ["Jaisalmer", "Jaipur"], modes: ["Onsite", "Hybrid"], min_stipend_inr: 8000 },
        mentor_id: "mnt_2"
      },
      {
        id: "stu_1012",
        name: "Aditya Paliwal",
        email: "aditya.paliwal@rtu.local",
        phone: "9818000312",
        roll_no: "21ME044",
        department: "ME",
        year: 4,
        cgpa: 7.6,
        skills: ["SolidWorks", "Automation", "PLC"],
        preferences: { cities: ["Jodhpur"], modes: ["Onsite"], min_stipend_inr: 6000 },
        mentor_id: "mnt_4"
      },
      {
        id: "stu_1013",
        name: "Harshita Saini",
        email: "harshita.saini@rtu.local",
        phone: "9818000313",
        roll_no: "21EE052",
        department: "EE",
        year: 3,
        cgpa: 8.5,
        skills: ["Power Systems", "Python", "Data Analysis"],
        preferences: { cities: ["Kota"], modes: ["Hybrid"], min_stipend_inr: 7000 },
        mentor_id: "mnt_5"
      },
      {
        id: "stu_1014",
        name: "Yashvi Kothari",
        email: "yashvi.kothari@rtu.local",
        phone: "9818000314",
        roll_no: "21CSE077",
        department: "CSE",
        year: 4,
        cgpa: 9.2,
        skills: ["TypeScript", "Next.js", "PostgreSQL", "Docker", "Kubernetes", "AWS"],
        preferences: { cities: ["Ajmer", "Jaipur"], modes: ["Remote", "Hybrid"], min_stipend_inr: 12000 },
        mentor_id: "mnt_1"
      },
      {
        id: "stu_1015",
        name: "Lakshya Jain",
        email: "lakshya.jain@rtu.local",
        phone: "9818000315",
        roll_no: "21CIV059",
        department: "CIVIL",
        year: 4,
        cgpa: 7.8,
        skills: ["AutoCAD", "Project Scheduling", "Communication"],
        preferences: { cities: ["Jaipur"], modes: ["Onsite"], min_stipend_inr: 5000 },
        mentor_id: "mnt_4"
      }
    ];
    
    // Insert HR users as EMPLOYER role
    for (const hr of hrUsers) {
      const company = companies.find(c => c.id === hr.company_id);
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department)
        VALUES (?, ?, 'EMPLOYER', ?, ?, ?)
      `).run(
        `hr_${hr.id.split('_')[1]}`,
        defaultPasswordHash,
        hr.name,
        hr.email,
        company?.industry || 'Tech'
      );
    }
    
    // Insert mentors as MENTOR role
    for (const mentor of mentors) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department, current_semester)
        VALUES (?, ?, 'MENTOR', ?, ?, ?, ?)
      `).run(
        `mnt_${mentor.id.split('_')[1]}`,
        defaultPasswordHash,
        mentor.name,
        mentor.email,
        mentor.department,
        mentor.mentor_load
      );
    }
    
    // Insert students as STUDENT role
    for (const student of students) {
      db.prepare(`
        INSERT INTO users (username, password_hash, role, name, email, department, current_semester, skills)
        VALUES (?, ?, 'STUDENT', ?, ?, ?, ?, ?)
      `).run(
        `stu_${student.id.split('_')[1]}`,
        defaultPasswordHash,
        student.name,
        student.email,
        student.department,
        student.year,
        JSON.stringify(student.skills)
      );
    }
    
    // Insert a TPO_ADMIN user
    db.prepare(`
      INSERT INTO users (username, password_hash, role, name, email, department)
      VALUES (?, ?, 'STAFF', ?, ?, ?)
    `).run(
      'tpo_admin',
      defaultPasswordHash,
      'TPO Admin',
      'tpo.admin@rtu.local',
      'Placement Cell'
    );
    
    console.log('✅ Users seeded successfully');

    // Get staff IDs for internship posting
    const staffIds = db.prepare('SELECT id FROM users WHERE role = ?').all('STAFF').map(u => u.id);
    const employerIds = db.prepare('SELECT id FROM users WHERE role = ?').all('EMPLOYER').map(u => u.id);

    // Seed Internships - Using the realistic data
    console.log('💼 Seeding internships with realistic data...');
    
    const internships = [
      {
        id: "int_2001",
        company_id: "cmp_jaipursoft",
        title: "Full-Stack Web Intern (React/Node)",
        description: "Work on internal dashboards with React, Next.js, Node.js, and PostgreSQL; implement role-based access and unit tests.",
        required_skills: ["JavaScript", "React", "Next.js", "Node.js", "PostgreSQL", "Git"],
        department: ["CSE", "IT"],
        stipend_min_inr: 8000,
        stipend_max_inr: 12000,
        duration_weeks: 12,
        mode: "Hybrid",
        seats: 6,
        eligibility_cgpa_min: 7.0,
        ppo_probability: 0.4,
        tags: ["Web", "RBAC", "Testing"],
        location_city: "Jaipur",
        hr_id: "hr_1"
      },
      {
        id: "int_2002",
        company_id: "cmp_deserttech",
        title: "Data Analyst Intern",
        description: "Assist analytics team with data cleaning, SQL pipelines, dashboards in Power BI, and exploratory analysis in Python.",
        required_skills: ["Python", "SQL", "Power BI", "Data Analysis"],
        department: ["AI&DS", "CSE", "EE"],
        stipend_min_inr: 10000,
        stipend_max_inr: 15000,
        duration_weeks: 16,
        mode: "Hybrid",
        seats: 4,
        eligibility_cgpa_min: 7.5,
        ppo_probability: 0.6,
        tags: ["Analytics", "Dashboards"],
        location_city: "Jodhpur",
        hr_id: "hr_2"
      },
      {
        id: "int_2003",
        company_id: "cmp_thariot",
        title: "IoT Firmware Intern",
        description: "Develop embedded C firmware for sensor nodes; assist in PCB bring-up and test automation for edge devices.",
        required_skills: ["Embedded C", "C", "IoT", "MATLAB"],
        department: ["ECE", "EE"],
        stipend_min_inr: 7000,
        stipend_max_inr: 9000,
        duration_weeks: 10,
        mode: "Onsite",
        seats: 3,
        eligibility_cgpa_min: 7.0,
        ppo_probability: 0.35,
        tags: ["Embedded", "Edge"],
        location_city: "Jaisalmer",
        hr_id: "hr_3"
      },
      {
        id: "int_2004",
        company_id: "cmp_aravalli",
        title: "ML Intern — Risk Scoring",
        description: "Prototype ML models for credit risk scoring; build feature pipelines and evaluate model drift.",
        required_skills: ["Python", "Machine Learning", "SQL", "Data Structures"],
        department: ["AI&DS", "CSE"],
        stipend_min_inr: 12000,
        stipend_max_inr: 18000,
        duration_weeks: 20,
        mode: "Remote",
        seats: 2,
        eligibility_cgpa_min: 8.0,
        ppo_probability: 0.7,
        tags: ["Fintech", "ML"],
        location_city: "Udaipur",
        hr_id: "hr_4"
      },
      {
        id: "int_2005",
        company_id: "cmp_marwarmotors",
        title: "Mechanical Design Intern",
        description: "Assist R&D with SolidWorks assemblies, tolerance stack-up, and test fixtures for automotive components.",
        required_skills: ["SolidWorks", "AutoCAD", "Problem Solving"],
        department: ["ME"],
        stipend_min_inr: 6000,
        stipend_max_inr: 8000,
        duration_weeks: 8,
        mode: "Onsite",
        seats: 5,
        eligibility_cgpa_min: 7.0,
        ppo_probability: 0.3,
        tags: ["Automotive", "Design"],
        location_city: "Jodhpur",
        hr_id: "hr_5"
      },
      {
        id: "int_2006",
        company_id: "cmp_ajmercloud",
        title: "DevOps Intern",
        description: "Create CI pipelines, write Dockerfiles, and assist with Kubernetes deployments on internal clusters.",
        required_skills: ["Docker", "Kubernetes", "Git", "Linux", "AWS"],
        department: ["CSE", "IT"],
        stipend_min_inr: 12000,
        stipend_max_inr: 20000,
        duration_weeks: 12,
        mode: "Remote",
        seats: 3,
        eligibility_cgpa_min: 8.0,
        ppo_probability: 0.55,
        tags: ["DevOps", "Cloud"],
        location_city: "Ajmer",
        hr_id: "hr_6"
      },
      {
        id: "int_2007",
        company_id: "cmp_bikanerfoods",
        title: "Automation Intern — FMCG",
        description: "Support PLC-based line automation, data logging, and preventive maintenance analytics.",
        required_skills: ["PLC", "Python", "Data Analysis"],
        department: ["EE", "ME"],
        stipend_min_inr: 5000,
        stipend_max_inr: 7000,
        duration_weeks: 6,
        mode: "Onsite",
        seats: 4,
        eligibility_cgpa_min: 6.5,
        ppo_probability: 0.25,
        tags: ["Automation", "Industry 4.0"],
        location_city: "Bikaner",
        hr_id: "hr_7"
      },
      {
        id: "int_2008",
        company_id: "cmp_kotasteel",
        title: "Data Engineering Intern — Industry 4.0",
        description: "Ingest sensor data, build ETL in SQL/Python, and implement quality checks for factory analytics.",
        required_skills: ["Python", "SQL", "ETL", "Power BI"],
        department: ["AI&DS", "CSE", "EE"],
        stipend_min_inr: 9000,
        stipend_max_inr: 13000,
        duration_weeks: 12,
        mode: "Hybrid",
        seats: 3,
        eligibility_cgpa_min: 7.5,
        ppo_probability: 0.5,
        tags: ["Manufacturing", "Analytics"],
        location_city: "Kota",
        hr_id: "hr_8"
      },
      {
        id: "int_2009",
        company_id: "cmp_jaipursoft",
        title: "Frontend Intern — Design Systems",
        description: "Build a design system library in React/TypeScript and integrate storybook testing.",
        required_skills: ["React", "TypeScript", "CSS", "Git"],
        department: ["CSE", "IT"],
        stipend_min_inr: 8000,
        stipend_max_inr: 10000,
        duration_weeks: 10,
        mode: "Remote",
        seats: 2,
        eligibility_cgpa_min: 7.0,
        ppo_probability: 0.35,
        tags: ["Frontend", "DesignSystem"],
        location_city: "Jaipur",
        hr_id: "hr_1"
      },
      {
        id: "int_2010",
        company_id: "cmp_deserttech",
        title: "NLP Intern",
        description: "Develop text cleaning pipelines, fine-tune small transformers, and evaluate classification metrics.",
        required_skills: ["Python", "NLP", "Machine Learning"],
        department: ["AI&DS", "CSE"],
        stipend_min_inr: 15000,
        stipend_max_inr: 25000,
        duration_weeks: 24,
        mode: "Remote",
        seats: 2,
        eligibility_cgpa_min: 8.0,
        ppo_probability: 0.75,
        tags: ["NLP", "ML"],
        location_city: "Jodhpur",
        hr_id: "hr_2"
      },
      {
        id: "int_2011",
        company_id: "cmp_aravalli",
        title: "BI Intern — Fintech Ops",
        description: "Build ops dashboards, track SLAs, and automate data quality alerts.",
        required_skills: ["SQL", "Tableau", "Power BI"],
        department: ["AI&DS", "IT"],
        stipend_min_inr: 8000,
        stipend_max_inr: 12000,
        duration_weeks: 12,
        mode: "Hybrid",
        seats: 2,
        eligibility_cgpa_min: 7.0,
        ppo_probability: 0.45,
        tags: ["BI", "Fintech"],
        location_city: "Udaipur",
        hr_id: "hr_4"
      },
      {
        id: "int_2012",
        company_id: "cmp_thariot",
        title: "Computer Vision Intern — Edge",
        description: "Implement lightweight CV models for object detection on constrained hardware; support dataset curation.",
        required_skills: ["Computer Vision", "Python", "Embedded C++"],
        department: ["ECE", "AI&DS"],
        stipend_min_inr: 9000,
        stipend_max_inr: 14000,
        duration_weeks: 14,
        mode: "Onsite",
        seats: 2,
        eligibility_cgpa_min: 7.5,
        ppo_probability: 0.5,
        tags: ["EdgeAI", "CV"],
        location_city: "Jaisalmer",
        hr_id: "hr_3"
      }
    ];

    for (const internship of internships) {
      const company = companies.find(c => c.id === internship.company_id);
      const randomStaffId = staffIds[Math.floor(Math.random() * staffIds.length)];
      
      db.prepare(`
        INSERT INTO internships (title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, posted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        internship.title,
        internship.description,
        JSON.stringify(internship.required_skills),
        JSON.stringify(internship.department),
        internship.stipend_min_inr,
        internship.stipend_max_inr,
        0, // is_placement = false for internships
        randomStaffId
      );
    }

    console.log('✅ Internships seeded successfully');

    // Get user and internship IDs for applications
    const studentUserIds = db.prepare('SELECT id FROM users WHERE role = ?').all('STUDENT').map(u => u.id);
    const internshipIds = db.prepare('SELECT id FROM internships').all().map(i => i.id);
    const mentorUserIds = db.prepare('SELECT id FROM users WHERE role = ?').all('MENTOR').map(u => u.id);

    // Seed Applications and approvals - Using the realistic data
    console.log('📋 Seeding applications with realistic data...');
    
    const applications = [
      { id: "app_3001", internship_id: "int_2001", student_id: "stu_1001", status: "Under Review", applied_at: "2025-08-01T09:15:00Z", stage_history: ["Applied"] },
      { id: "app_3002", internship_id: "int_2001", student_id: "stu_1002", status: "Shortlisted", applied_at: "2025-08-01T09:18:00Z", stage_history: ["Applied", "Shortlisted"] },
      { id: "app_3003", internship_id: "int_2002", student_id: "stu_1003", status: "Shortlisted", applied_at: "2025-08-02T10:10:00Z", stage_history: ["Applied", "Shortlisted"] },
      { id: "app_3004", internship_id: "int_2003", student_id: "stu_1004", status: "Mentor Approved", applied_at: "2025-08-03T08:45:00Z", stage_history: ["Applied", "Mentor Approved"] },
      { id: "app_3005", internship_id: "int_2005", student_id: "stu_1005", status: "Under Review", applied_at: "2025-08-03T09:02:00Z", stage_history: ["Applied"] },
      { id: "app_3006", internship_id: "int_2006", student_id: "stu_1007", status: "Rejected", applied_at: "2025-08-04T11:20:00Z", stage_history: ["Applied", "Rejected"] },
      { id: "app_3007", internship_id: "int_2008", student_id: "stu_1006", status: "Shortlisted", applied_at: "2025-08-05T12:00:00Z", stage_history: ["Applied", "Shortlisted"] },
      { id: "app_3008", internship_id: "int_2010", student_id: "stu_1010", status: "Mentor Approved", applied_at: "2025-08-05T12:10:00Z", stage_history: ["Applied", "Mentor Approved"] },
      { id: "app_3009", internship_id: "int_2011", student_id: "stu_1009", status: "Under Review", applied_at: "2025-08-06T07:55:00Z", stage_history: ["Applied"] },
      { id: "app_3010", internship_id: "int_2009", student_id: "stu_1014", status: "Shortlisted", applied_at: "2025-08-06T08:30:00Z", stage_history: ["Applied", "Shortlisted"] },
      { id: "app_3011", internship_id: "int_2007", student_id: "stu_1013", status: "Under Review", applied_at: "2025-08-06T08:40:00Z", stage_history: ["Applied"] },
      { id: "app_3012", internship_id: "int_2004", student_id: "stu_1003", status: "Shortlisted", applied_at: "2025-08-07T10:20:00Z", stage_history: ["Applied", "Shortlisted"] },
      { id: "app_3013", internship_id: "int_2006", student_id: "stu_1014", status: "Under Review", applied_at: "2025-08-07T10:45:00Z", stage_history: ["Applied"] },
      { id: "app_3014", internship_id: "int_2012", student_id: "stu_1011", status: "Mentor Approved", applied_at: "2025-08-08T06:15:00Z", stage_history: ["Applied", "Mentor Approved"] }
    ];
    
    const approvals = [
      { id: "apr_4001", application_id: "app_3004", mentor_id: "mnt_2", status: "Approved", remarks: "Good embedded profile.", approved_at: "2025-08-03T12:00:00Z" },
      { id: "apr_4002", application_id: "app_3008", mentor_id: "mnt_3", status: "Approved", remarks: "Excellent ML/NLP projects.", approved_at: "2025-08-05T15:30:00Z" },
      { id: "apr_4003", application_id: "app_3014", mentor_id: "mnt_2", status: "Approved", remarks: "CV + embedded match.", approved_at: "2025-08-08T08:00:00Z" }
    ];

    // Map application IDs to actual database IDs
    const applicationIdMap = {};
    
    for (const application of applications) {
      // Find the student user ID
      const studentUserId = studentUserIds.find(id => id === parseInt(application.student_id.split('_')[1]));
      
      // Find the internship ID (we need to match by title since we don't have company_id in current schema)
      const internshipData = internships.find(i => i.id === application.internship_id);
      const internshipRecord = db.prepare('SELECT id FROM internships WHERE title = ?').get(internshipData.title);
      const internshipId = internshipRecord ? internshipRecord.id : null;
      
      if (studentUserId && internshipId) {
        // Convert status to database format
        let dbStatus = 'APPLIED';
        if (application.status === "Shortlisted") dbStatus = 'INTERVIEW_SCHEDULED';
        else if (application.status === "Mentor Approved") dbStatus = 'MENTOR_APPROVED';
        else if (application.status === "Rejected") dbStatus = 'NOT_OFFERED';
        else if (application.status === "Under Review") dbStatus = 'MENTOR_REVIEW';
        
        const result = db.prepare(`
          INSERT INTO applications (student_id, internship_id, status, applied_at)
          VALUES (?, ?, ?, ?)
        `).run(
          studentUserId,
          internshipId,
          dbStatus,
          application.applied_at
        );
        
        applicationIdMap[application.id] = result.lastInsertRowid;
      }
    }

    // Process approvals
    for (const approval of approvals) {
      const applicationId = applicationIdMap[approval.application_id];
      // Find mentor user ID by matching the mentor ID pattern
      const mentorUserId = mentorUserIds.find(id => {
        // Get the mentor ID number from the approval data
        const mentorNum = parseInt(approval.mentor_id.split('_')[1]);
        // Check if this user ID matches the pattern we used for mentors
        const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
        return user && user.username === `mnt_${mentorNum}`;
      });
      
      if (applicationId && mentorUserId) {
        db.prepare(`
          UPDATE applications 
          SET status = 'MENTOR_APPROVED', mentor_id = ?, mentor_approved_at = ?
          WHERE id = ?
        `).run(
          mentorUserId,
          approval.approved_at,
          applicationId
        );
      }
    }

    console.log('✅ Applications seeded successfully');

    // Seed Interviews
    console.log('📅 Seeding interviews...');
    
    const interviews = [
      {
        id: "iv_5001",
        application_id: "app_3002",
        type: "Technical",
        scheduled_at: "2025-08-09T10:00:00Z",
        panel: ["Ananya Rathore (HR)", "Lead Engg — Frontend"],
        room_or_meeting: "meet_iv_5001",
        status: "Scheduled"
      },
      {
        id: "iv_5002",
        application_id: "app_3003",
        type: "Technical",
        scheduled_at: "2025-08-10T09:30:00Z",
        panel: ["Rohit Singh (HR)", "Senior Analyst"],
        room_or_meeting: "meet_iv_5002",
        status: "Scheduled"
      },
      {
        id: "iv_5003",
        application_id: "app_3008",
        type: "Tech + HM",
        scheduled_at: "2025-08-11T11:00:00Z",
        panel: ["Rohit Singh (HR)", "NLP Lead"],
        room_or_meeting: "meet_iv_5003",
        status: "Scheduled"
      },
      {
        id: "iv_5004",
        application_id: "app_3010",
        type: "Technical",
        scheduled_at: "2025-08-11T14:00:00Z",
        panel: ["Ananya Rathore (HR)", "UI Engg"],
        room_or_meeting: "meet_iv_5004",
        status: "Scheduled"
      }
    ];

    // Create calendar events for interviews
    for (const interview of interviews) {
      const applicationId = applicationIdMap[interview.application_id];
      if (applicationId) {
        // Get student ID from application
        const application = db.prepare('SELECT student_id FROM applications WHERE id = ?').get(applicationId);
        if (application) {
          const organizerId = employerIds[Math.floor(Math.random() * employerIds.length)] || staffIds[0];
          
          db.prepare(`
            INSERT INTO calendar_events (title, description, event_type, start_datetime, end_datetime, organizer_id, participants, location, meeting_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `Interview - ${interview.type}`,
            `Interview panel: ${interview.panel.join(', ')}`,
            'INTERVIEW',
            interview.scheduled_at,
            new Date(new Date(interview.scheduled_at).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
            organizerId,
            JSON.stringify([application.student_id]),
            interview.room_or_meeting,
            interview.room_or_meeting.startsWith('meet_') ? `https://meet.google.com/${interview.room_or_meeting}` : null,
            interview.status.toUpperCase()
          );
        }
      }
    }

    console.log('✅ Interviews seeded successfully');

    // Seed Offers and certificates
    console.log('📜 Seeding offers and certificates...');
    
    const offers = [
      {
        id: "off_6001",
        application_id: "app_3002",
        offer_type: "Internship",
        monthly_stipend_inr: 10000,
        joining_date: "2025-08-18",
        expiry_date: "2025-08-15",
        status: "Offered"
      },
      {
        id: "off_6002",
        application_id: "app_3003",
        offer_type: "Internship",
        monthly_stipend_inr: 15000,
        joining_date: "2025-08-20",
        expiry_date: "2025-08-16",
        status: "Offered"
      },
      {
        id: "off_6003",
        application_id: "app_3008",
        offer_type: "Internship",
        monthly_stipend_inr: 20000,
        joining_date: "2025-08-22",
        expiry_date: "2025-08-18",
        status: "Offered"
      },
      {
        id: "off_6004",
        application_id: "app_3010",
        offer_type: "Internship",
        monthly_stipend_inr: 9000,
        joining_date: "2025-08-21",
        expiry_date: "2025-08-17",
        status: "Offered"
      }
    ];

    // Create placement offers
    for (const offer of offers) {
      const applicationId = applicationIdMap[offer.application_id];
      if (applicationId) {
        // Get application details
        const application = db.prepare('SELECT student_id, internship_id FROM applications WHERE id = ?').get(applicationId);
        if (application) {
          // Get company ID from internship
          const internship = db.prepare('SELECT company_name FROM internships WHERE id = ?').get(application.internship_id);
          
          db.prepare(`
            INSERT INTO placement_offers (application_id, student_id, company_id, position_title, offer_type, offer_details, offer_status, offer_date, response_deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            applicationId,
            application.student_id,
            1, // Default company ID
            'Intern Position',
            offer.offer_type.toUpperCase(),
            JSON.stringify({
              stipend: offer.monthly_stipend_inr,
              joining_date: offer.joining_date,
              expiry_date: offer.expiry_date
            }),
            offer.status.toUpperCase(),
            new Date().toISOString(),
            new Date(offer.expiry_date).toISOString()
          );
          
          // Update application status
          db.prepare(`
            UPDATE applications 
            SET status = 'OFFERED', offer_made_at = ?
            WHERE id = ?
          `).run(
            new Date().toISOString(),
            applicationId
          );
        }
      }
    }

    console.log('✅ Offers seeded successfully');

    // Seed Feedback
    console.log('⭐ Seeding feedback...');
    
    const feedbacks = [
      {
        id: "fb_7001",
        internship_id: "int_2001",
        student_id: "stu_1002",
        supervisor_hr_id: "hr_1",
        ratings: { technical: 4, communication: 4, dependability: 5 },
        comments: "Good ownership and UI quality.",
        strengths: ["React patterns", "Teamwork"],
        improvements: ["Test coverage"],
        created_at: "2025-11-30T12:00:00Z"
      }
    ];

    for (const feedback of feedbacks) {
      const studentUserId = studentUserIds.find(id => id === parseInt(feedback.student_id.split('_')[1]));
      const hrUser = hrUsers.find(hr => hr.id === feedback.supervisor_hr_id);
      const employerId = employerIds.find(id => id === parseInt(hrUser.id.split('_')[1]));
      
      if (studentUserId && employerId) {
        // Find application for this student and internship
        const internshipId = internshipIds.find(id => id === parseInt(feedback.internship_id.split('_')[1]));
        const application = db.prepare('SELECT id FROM applications WHERE student_id = ? AND internship_id = ?').get(studentUserId, internshipId);
        
        if (application) {
          db.prepare(`
            INSERT INTO feedback (application_id, supervisor_id, rating, comments, technical_skills_rating, communication_rating, professionalism_rating, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            application.id,
            employerId,
            Math.round((feedback.ratings.technical + feedback.ratings.communication + feedback.ratings.dependability) / 3),
            feedback.comments,
            feedback.ratings.technical,
            feedback.ratings.communication,
            feedback.ratings.dependability,
            feedback.created_at
          );
          
          // Update application status to completed
          db.prepare(`
            UPDATE applications 
            SET status = 'COMPLETED', completion_date = ?
            WHERE id = ?
          `).run(
            feedback.created_at,
            application.id
          );
        }
      }
    }

    console.log('✅ Feedback seeded successfully');

    // Seed Certificates
    console.log('📜 Seeding certificates...');
    
    const certificates = [
      {
        id: "crt_8001",
        student_id: "stu_1002",
        internship_id: "int_2001",
        certificate_no: "RTU-INT-2025-0001",
        issued_at: "2025-12-01T10:00:00Z",
        verify_token: "verify_9f31c2"
      }
    ];

    for (const certificate of certificates) {
      const studentUserId = studentUserIds.find(id => id === parseInt(certificate.student_id.split('_')[1]));
      const internshipId = internshipIds.find(id => id === parseInt(certificate.internship_id.split('_')[1]));
      
      if (studentUserId && internshipId) {
        // Find application for this student and internship
        const application = db.prepare('SELECT id FROM applications WHERE student_id = ? AND internship_id = ?').get(studentUserId, internshipId);
        
        if (application) {
          db.prepare(`
            INSERT INTO certificates (application_id, student_id, certificate_type, certificate_data, qr_code, verification_url, issued_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            application.id,
            studentUserId,
            'INTERNSHIP',
            JSON.stringify({
              certificate_no: certificate.certificate_no,
              student_name: students.find(s => s.id === certificate.student_id)?.name,
              internship_title: internships.find(i => i.id === certificate.internship_id)?.title,
              company_name: companies.find(c => c.id === internships.find(i => i.id === certificate.internship_id)?.company_id)?.name,
              duration: internships.find(i => i.id === certificate.internship_id)?.duration_weeks + ' weeks',
              stipend: `₹${internships.find(i => i.id === certificate.internship_id)?.stipend_min_inr}-${internships.find(i => i.id === certificate.internship_id)?.stipend_max_inr}/month`
            }),
            certificate.verify_token,
            `https://internship-portal.example.com/verify/${certificate.verify_token}`,
            certificate.issued_at
          );
        }
      }
    }

    console.log('✅ Certificates seeded successfully');
    console.log('🎉 Database seeding with realistic Rajasthan data completed!');
    
    // Print summary
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const internshipCount = db.prepare('SELECT COUNT(*) as count FROM internships').get().count;
    const applicationCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get().count;

    console.log('\n📊 Seeding Summary:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💼 Internships: ${internshipCount}`);
    console.log(`📋 Applications: ${applicationCount}`);
    console.log(`⭐ Feedback: ${feedbackCount}`);

    console.log('\n🔑 Sample Login Credentials:');
    console.log('Student: stu_1001 / Password123!');
    console.log('Mentor: mnt_1 / Password123!');
    console.log('Employer: hr_1 / Password123!');
    console.log('TPO Admin: tpo_admin / Password123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
