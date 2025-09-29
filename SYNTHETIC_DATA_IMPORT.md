# Synthetic Data Import for Internship Portal

This document explains how to import synthetic data into the Internship Portal database, replacing the demo accounts with realistic user data that includes chat conversations and all application data.

## Overview

The synthetic dataset includes:
- 160 Students with realistic profiles
- 28 Mentors
- 10 Employers
- 37 Internship postings
- 572 Applications
- 455 Chat rooms with 1,758 messages

All accounts have working passwords: `Password123!`

## Import Scripts

There are several scripts available for data management:

1. `npm run seed` - Original demo data
2. `npm run seed:synthetic` - Import synthetic dataset (recommended)

## How to Import Synthetic Data

### Prerequisites
- Ensure you have all dependencies installed (`npm install`)
- The synthetic dataset should be in the `internship_portal_synthetic_dataset/dataset` directory

### Run the Import

```bash
npm run seed:synthetic
```

This script will:
1. Reset the database by dropping all existing tables
2. Recreate all tables with the full schema
3. Import all synthetic data including users, internships, applications, and chat messages
4. Display a summary of imported data

### Sample Login Credentials

After importing, you can log in with:

- **Student**: `student_1` / `Password123!`
- **Mentor**: `mentor_1` / `Password123!`
- **Employer**: `employer_1` / `Password123!`
- **Admin**: `admin` / `Password123!`

## Data Structure

The synthetic dataset includes:

### Users
- Students with realistic names, emails, departments, CGPA, and contact info
- Mentors with department affiliations
- Employers with company information

### Internships
- Realistic job postings with titles, descriptions, stipends, and requirements
- Various companies and positions

### Applications
- Realistic application data showing various stages (applied, interviewed, offered, etc.)
- Mentor approvals and feedback

### Chat System
- Real chat conversations between students and mentors
- Contextual messages related to applications and internships

## Database Schema

The import script ensures that the database has the complete schema including all tables:
- Users and roles (students, mentors, employers, staff)
- Internships and job postings
- Applications and their statuses
- Chat rooms and messages
- Feedback and evaluations
- And all other features of the system

## Troubleshooting

### "FOREIGN KEY constraint failed" Error
This occurs when trying to drop tables with foreign key relationships. The reset script handles this by temporarily disabling foreign key constraints.

### "no such column" Error
This indicates a schema mismatch. The reset script resolves this by dropping all existing tables and recreating them with the current schema.

### No Data Imported
Ensure that the synthetic dataset files are in the correct location:
`internship_portal_synthetic_dataset/dataset/`

## Verification

After importing, you can verify the data by:

1. Checking the import summary printed to the console
2. Running the check script: `node scripts/check-schema.js`
3. Testing login with the sample credentials
4. Browsing the application to see real data

The system is now ready for realistic testing and demonstration with full chat functionality and comprehensive user data.