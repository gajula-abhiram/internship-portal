// Simple in-memory database for Vercel deployment
// In production, you would use a cloud database like PlanetScale, Supabase, or Neon

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER';
  name: string;
  email: string;
  department?: string;
  current_semester?: number;
  skills?: string;
  resume?: string;
  created_at: string;
  updated_at: string;
}

interface Internship {
  id: number;
  title: string;
  description: string;
  required_skills: string;
  eligible_departments: string;
  stipend_min?: number;
  stipend_max?: number;
  is_placement: boolean;
  posted_by: number;
  is_active: boolean;
  created_at: string;
}

interface Application {
  id: number;
  student_id: number;
  internship_id: number;
  status: string;
  applied_at: string;
  mentor_approved_at?: string;
  mentor_id?: number;
  created_at: string;
  updated_at: string;
}

interface Feedback {
  id: number;
  application_id: number;
  supervisor_id: number;
  rating: number;
  comments?: string;
  created_at: string;
}

// In-memory storage (will reset on each deployment)
let users: User[] = [];
let internships: Internship[] = [];
let applications: Application[] = [];
let feedback: Feedback[] = [];

// Initialize with sample data
function initializeSampleData() {
  if (users.length === 0) {
    // Add sample users
    users = [
      {
        id: 1,
        username: 'admin',
        password_hash: '$2a$10$8YJZ9YQGj7qXUcNZj7QKrOw1LkC6K7z0.Br9SBFZwX4X4X4X4X4X4u', // password: admin123
        role: 'STAFF',
        name: 'Admin User',
        email: 'admin@university.edu',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'student1',
        password_hash: '$2a$10$8YJZ9YQGj7qXUcNZj7QKrOw1LkC6K7z0.Br9SBFZwX4X4X4X4X4X4u', // password: student123
        role: 'STUDENT',
        name: 'John Doe',
        email: 'john@university.edu',
        department: 'Computer Science',
        current_semester: 6,
        skills: JSON.stringify(['JavaScript', 'React', 'Node.js']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Add sample internships
    internships = [
      {
        id: 1,
        title: 'Frontend Developer Intern',
        description: 'Work on exciting React projects with our development team.',
        required_skills: JSON.stringify(['React', 'JavaScript', 'CSS']),
        eligible_departments: JSON.stringify(['Computer Science', 'Information Technology']),
        stipend_min: 15000,
        stipend_max: 25000,
        is_placement: false,
        posted_by: 1,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
  }
}

export function getMemoryDatabase() {
  initializeSampleData();
  
  return {
    // User queries
    createUser: {
      run: (username: string, password_hash: string, role: string, name: string, email: string, department?: string, current_semester?: number, skills?: string, resume?: string) => {
        const newUser: User = {
          id: users.length + 1,
          username,
          password_hash,
          role: role as any,
          name,
          email,
          department,
          current_semester,
          skills,
          resume,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        users.push(newUser);
        return { lastInsertRowid: newUser.id };
      }
    },
    
    getUserByUsername: {
      get: (username: string) => users.find(u => u.username === username)
    },
    
    getUserById: {
      get: (id: number) => users.find(u => u.id === id)
    },
    
    updateUser: {
      run: (name: string, email: string, department: string, current_semester: number, skills: string, resume: string, id: number) => {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          users[userIndex] = {
            ...users[userIndex],
            name,
            email,
            department,
            current_semester,
            skills,
            resume,
            updated_at: new Date().toISOString()
          };
        }
        return { changes: userIndex !== -1 ? 1 : 0 };
      }
    },

    // Internship queries
    createInternship: {
      run: (title: string, description: string, required_skills: string, eligible_departments: string, stipend_min: number, stipend_max: number, is_placement: boolean, posted_by: number) => {
        const newInternship: Internship = {
          id: internships.length + 1,
          title,
          description,
          required_skills,
          eligible_departments,
          stipend_min,
          stipend_max,
          is_placement,
          posted_by,
          is_active: true,
          created_at: new Date().toISOString()
        };
        internships.push(newInternship);
        return { lastInsertRowid: newInternship.id };
      }
    },
    
    getActiveInternships: {
      all: () => internships
        .filter(i => i.is_active)
        .map(i => ({
          ...i,
          posted_by_name: users.find(u => u.id === i.posted_by)?.name || 'Unknown'
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
    
    getInternshipById: {
      get: (id: number) => {
        const internship = internships.find(i => i.id === id);
        if (!internship) return null;
        return {
          ...internship,
          posted_by_name: users.find(u => u.id === internship.posted_by)?.name || 'Unknown'
        };
      }
    },

    // Application queries
    createApplication: {
      run: (student_id: number, internship_id: number) => {
        const newApplication: Application = {
          id: applications.length + 1,
          student_id,
          internship_id,
          status: 'APPLIED',
          applied_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        applications.push(newApplication);
        return { lastInsertRowid: newApplication.id };
      }
    },
    
    getApplicationsByStudent: {
      all: (student_id: number) => applications
        .filter(a => a.student_id === student_id)
        .map(a => {
          const internship = internships.find(i => i.id === a.internship_id);
          return {
            ...a,
            internship_title: internship?.title || 'Unknown',
            internship_description: internship?.description || ''
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
    
    getApplicationsForMentor: {
      all: (mentor_id: number) => {
        const mentor = users.find(u => u.id === mentor_id);
        if (!mentor) return [];
        
        return applications
          .filter(a => a.status === 'APPLIED')
          .map(a => {
            const student = users.find(u => u.id === a.student_id);
            const internship = internships.find(i => i.id === a.internship_id);
            return {
              ...a,
              internship_title: internship?.title || 'Unknown',
              student_name: student?.name || 'Unknown',
              student_department: student?.department || 'Unknown'
            };
          })
          .filter(a => a.student_department === mentor.department)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    },
    
    updateApplicationStatus: {
      run: (status: string, mentor_id: number, id: number) => {
        const appIndex = applications.findIndex(a => a.id === id);
        if (appIndex !== -1) {
          applications[appIndex] = {
            ...applications[appIndex],
            status,
            mentor_id,
            mentor_approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return { changes: appIndex !== -1 ? 1 : 0 };
      }
    },

    // Feedback queries
    createFeedback: {
      run: (application_id: number, supervisor_id: number, rating: number, comments: string) => {
        const newFeedback: Feedback = {
          id: feedback.length + 1,
          application_id,
          supervisor_id,
          rating,
          comments,
          created_at: new Date().toISOString()
        };
        feedback.push(newFeedback);
        return { lastInsertRowid: newFeedback.id };
      }
    },
    
    getFeedbackByApplication: {
      all: (application_id: number) => feedback
        .filter(f => f.application_id === application_id)
        .map(f => ({
          ...f,
          supervisor_name: users.find(u => u.id === f.supervisor_id)?.name || 'Unknown'
        }))
    },

    // Analytics queries
    getUnplacedStudentsCount: {
      get: () => {
        const placedStudents = new Set(
          applications
            .filter(a => ['OFFERED', 'COMPLETED'].includes(a.status))
            .map(a => a.student_id)
        );
        const totalStudents = users.filter(u => u.role === 'STUDENT').length;
        return { count: totalStudents - placedStudents.size };
      }
    },
    
    getApplicationStatusBreakdown: {
      all: () => {
        const breakdown: { [key: string]: number } = {};
        applications.forEach(a => {
          breakdown[a.status] = (breakdown[a.status] || 0) + 1;
        });
        return Object.entries(breakdown).map(([status, count]) => ({ status, count }));
      }
    },
    
    getOpenPositionsCount: {
      get: () => ({ count: internships.filter(i => i.is_active).length })
    }
  };
}