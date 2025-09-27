# Internship Portal

A modern internship and placement management system built with Next.js 15 and TypeScript.

## Features

- **Role-based Access Control**: Students, Staff, Mentors, and Employers
- **Internship Management**: Create, browse, and apply for internships
- **Application Tracking**: Monitor application status and mentor approvals
- **Dashboard Analytics**: Track placement statistics and application metrics
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based auth
- **Database**: SQLite (local), In-memory (production demo)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Initialize the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Users

- **Admin**: username: `admin`, password: `admin123`
- **Student**: username: `student1`, password: `student123`

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/internships` - List internships
- `POST /api/applications` - Apply for internship
- `GET /api/analytics/dashboard` - Dashboard statistics

## Deployment

This application is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set the `JWT_SECRET` environment variable
3. Deploy automatically on every push

## License

MIT License

# Internship Portal - Setup Instructions

## Overview
This is a complete internship and placement management system built with Next.js, SQLite, and Tailwind CSS. It's optimized for Vercel deployment but can also run locally.

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Steps

1. **Clone and Install Dependencies**
   ```bash
   cd internship-portal
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # The default values in .env.local should work for development
   ```

3. **Initialize Database and Seed Data**
   ```bash
   # Initialize database (creates tables)
   npm run db:init
   
   # Seed with sample Rajasthan-specific data
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Use the demo credentials provided below

---

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Internship Portal"
   git branch -M main
   git remote add origin https://github.com/yourusername/internship-portal.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `JWT_SECRET`: A secure random string (generate one online)
   - Click "Deploy"

3. **Initialize Database on Vercel**
   After deployment, you'll need to initialize the database:
   
   **Option A: Using Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   vercel env pull .env.local  # Download env vars
   vercel dev  # Run locally with production env
   npm run seed  # Seed the database
   ```
   
   **Option B: Manual API Call**
   - Visit your deployed app
   - Register a new admin user through the UI
   - Manually add some sample data through the interface

4. **Verify Deployment**
   - Visit your Vercel app URL
   - Test login with the seeded credentials
   - Check all major features work

---

## Demo Login Credentials

After running the seed script, you can use these accounts:

### Students
- **Username:** `amit.sharma` **Password:** `password123`
- **Username:** `priya.singh` **Password:** `password123`

### Staff (Placement Cell)
- **Username:** `rajesh.staff` **Password:** `password123`
- **Username:** `sunita.staff` **Password:** `password123`

### Faculty Mentors
- **Username:** `vikram.mentor` **Password:** `password123`
- **Username:** `meera.mentor` **Password:** `password123`

### Employers/Supervisors
- **Username:** `suresh.employer` **Password:** `password123`
- **Username:** `anita.employer` **Password:** `password123`

---

## Key Features by Role

### Students
- ✅ Create and update profile with skills and resume
- ✅ Browse internships filtered by department
- ✅ Apply to internships with one click
- ✅ Track application status
- ✅ View feedback from supervisors

### Placement Cell Staff
- ✅ Post new internship opportunities
- ✅ Manage all internship postings
- ✅ View all applications across departments
- ✅ Access analytics dashboard
- ✅ Track placement statistics

### Faculty Mentors
- ✅ Review applications from department students
- ✅ Approve or reject applications
- ✅ Monitor student progress

### Employers/Supervisors
- ✅ View applications for their internships
- ✅ Provide feedback and ratings
- ✅ Mark internships as completed

---

## Database Information

### Technology
- **Database:** SQLite (file-based, no external dependencies)
- **Location:** 
  - Development: `./internship.db`
  - Production: `/tmp/internship.db` (Vercel's temporary filesystem)

### Tables
- `users` - All user accounts (students, staff, mentors, employers)
- `internships` - Job/internship postings
- `applications` - Student applications with status tracking
- `feedback` - Supervisor feedback after internship completion

### Sample Data
The seed script creates:
- 10 students from various Rajasthan colleges
- 3 placement cell staff members
- 5 faculty mentors
- 5 employer representatives
- 10 internship postings (mix of internships and placements)
- 15 sample applications
- 5 feedback entries

---

## Troubleshooting

### Common Issues

**"Database is locked" error:**
- Stop the development server
- Delete `internship.db` file
- Run `npm run db:init && npm run seed` again

**API errors in production:**
- Check Vercel function logs in the dashboard
- Ensure JWT_SECRET is set in Vercel environment variables
- Verify all dependencies are in `package.json`

**Login not working:**
- Ensure you've run the seed script
- Check browser console for any JavaScript errors
- Verify the API endpoints are accessible

**Vercel deployment fails:**
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify package.json scripts are correct

### Development Tips

1. **Reset Database:**
   ```bash
   rm internship.db
   npm run db:init
   npm run seed
   ```

2. **View Database Contents:**
   ```bash
   # Install sqlite3 CLI tool
   sqlite3 internship.db
   .tables
   SELECT * FROM users LIMIT 5;
   ```

3. **Add Custom Data:**
   - Modify `scripts/seed.js`
   - Run `npm run seed` again

---

## Project Structure

```
internship-portal/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── ...             # Other pages
│   ├── components/         # Reusable React components
│   ├── contexts/           # React contexts (auth)
│   └── lib/               # Utility libraries
├── scripts/               # Database scripts
├── docs/                  # Documentation
├── database/              # SQL schema files
└── public/               # Static assets
```

---

## Security Notes

### Production Deployment
- Change JWT_SECRET to a secure random string
- Consider implementing rate limiting
- Add input validation and sanitization
- Use HTTPS in production (Vercel provides this automatically)

### Development
- Default passwords are "password123" for all seeded users
- JWT secret is set to a default value in .env.local
- Database is stored locally without encryption

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation in `docs/API_SPECIFICATION.md`
3. Check the database schema in `database/schema.sql`

---

## Technology Stack Summary

- **Frontend:** Next.js 15 + React 19 + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** SQLite + better-sqlite3
- **Authentication:** JWT + bcryptjs
- **Deployment:** Vercel (optimized)
- **Development:** TypeScript + ESLint