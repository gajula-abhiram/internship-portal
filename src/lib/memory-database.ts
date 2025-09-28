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
    // Import bcrypt to hash passwords
    import('bcryptjs').then(async (bcrypt) => {
      const defaultPasswordHash = await bcrypt.hash('Password123!', 12);
      
      // Add default users with the same credentials as the SQLite database
      users = [
        {
          id: 1,
          username: 'admin',
          password_hash: defaultPasswordHash,
          role: 'STAFF',
          name: 'Admin User',
          email: 'admin@example.com',
          department: 'Computer Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'student',
          password_hash: defaultPasswordHash,
          role: 'STUDENT',
          name: 'Student User',
          email: 'student@example.com',
          department: 'Computer Science',
          current_semester: 6,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          username: 'mentor',
          password_hash: defaultPasswordHash,
          role: 'MENTOR',
          name: 'Mentor User',
          email: 'mentor@example.com',
          department: 'Computer Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          username: 'employer',
          password_hash: defaultPasswordHash,
          role: 'EMPLOYER',
          name: 'Employer User',
          email: 'employer@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        // Rajasthan-specific demo users
        {
          id: 5,
          username: 'amit.sharma',
          password_hash: defaultPasswordHash,
          role: 'STUDENT',
          name: 'Amit Sharma',
          email: 'amit.sharma@rtu.ac.in',
          department: 'Computer Science',
          current_semester: 6,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 6,
          username: 'rajesh.staff',
          password_hash: defaultPasswordHash,
          role: 'STAFF',
          name: 'Dr. Rajesh Gupta',
          email: 'rajesh.gupta@rtu.ac.in',
          department: 'Computer Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 7,
          username: 'vikram.mentor',
          password_hash: defaultPasswordHash,
          role: 'MENTOR',
          name: 'Dr. Vikram Singh',
          email: 'vikram.singh@rtu.ac.in',
          department: 'Computer Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 8,
          username: 'suresh.employer',
          password_hash: defaultPasswordHash,
          role: 'EMPLOYER',
          name: 'Mr. Suresh Agarwal',
          email: 'suresh@jaipurit.com',
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
      
      console.log('Memory database initialized with default users');
    }).catch((error) => {
      console.error('Error initializing memory database:', error);
    });
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
      all: (student_id: number) => {
        return applications
          .filter(a => a.student_id === student_id)
          .map(a => {
            const internship = internships.find(i => i.id === a.internship_id);
            return {
              ...a,
              internship_title: internship?.title || 'Unknown',
              internship_description: internship?.description || 'No description'
            };
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    },
    
    getApplicationsForMentor: {
      all: (mentor_id: number) => {
        // Simplified implementation - in real app, would filter by department
        return applications
          .filter(a => a.status === 'APPLIED')
          .map(a => {
            const internship = internships.find(i => i.id === a.internship_id);
            const student = users.find(u => u.id === a.student_id);
            return {
              ...a,
              internship_title: internship?.title || 'Unknown',
              student_name: student?.name || 'Unknown',
              student_department: student?.department || 'Unknown'
            };
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    },
    
    getAllApplications: {
      all: () => {
        return applications.map(a => {
          const internship = internships.find(i => i.id === a.internship_id);
          const student = users.find(u => u.id === a.student_id);
          const mentor = a.mentor_id ? users.find(u => u.id === a.mentor_id) : null;
          return {
            ...a,
            internship_title: internship?.title || 'Unknown',
            student_name: student?.name || 'Unknown',
            student_department: student?.department || 'Unknown',
            mentor_name: mentor?.name || null
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    },
    
    getApplicationsByInternship: {
      all: (internship_id: number) => {
        return applications
          .filter(a => a.internship_id === internship_id)
          .map(a => {
            const student = users.find(u => u.id === a.student_id);
            return {
              ...a,
              student_name: student?.name || 'Unknown',
              student_department: student?.department || 'Unknown',
              student_email: student?.email || 'Unknown',
              student_skills: student?.skills || '[]',
              student_resume: student?.resume || ''
            };
          })
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
      run: (application_id: number, supervisor_id: number, rating: number, comments?: string) => {
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
      all: (application_id: number) => {
        return feedback
          .filter(f => f.application_id === application_id)
          .map(f => {
            const supervisor = users.find(u => u.id === f.supervisor_id);
            return {
              ...f,
              supervisor_name: supervisor?.name || 'Unknown'
            };
          });
      }
    },
    
    getAllFeedback: {
      all: () => {
        return feedback.map(f => {
          const supervisor = users.find(u => u.id === f.supervisor_id);
          const application = applications.find(a => a.id === f.application_id);
          const student = application ? users.find(u => u.id === application.student_id) : null;
          const internship = application ? internships.find(i => i.id === application.internship_id) : null;
          
          return {
            ...f,
            supervisor_name: supervisor?.name || 'Unknown',
            student_id: student?.id || null,
            student_name: student?.name || 'Unknown',
            internship_title: internship?.title || 'Unknown'
          };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    },

    // Analytics queries
    getUnplacedStudentsCount: {
      get: () => {
        const placedStudentIds = new Set(
          applications
            .filter(a => a.status === 'OFFERED' || a.status === 'COMPLETED')
            .map(a => a.student_id)
        );
        
        const unplacedCount = users.filter(u => 
          u.role === 'STUDENT' && !placedStudentIds.has(u.id)
        ).length;
        
        return { count: unplacedCount };
      }
    },
    
    getApplicationStatusBreakdown: {
      all: () => {
        const statusCounts: Record<string, number> = {};
        applications.forEach(a => {
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });
        
        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        }));
      }
    },
    
    getOpenPositionsCount: {
      get: () => {
        const count = internships.filter(i => i.is_active).length;
        return { count };
      }
    },
    
    getAverageFeedbackRating: {
      get: () => {
        if (feedback.length === 0) {
          return { average_rating: 0, total_feedback: 0 };
        }
        
        const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
        const average = totalRating / feedback.length;
        
        return { 
          average_rating: parseFloat(average.toFixed(2)), 
          total_feedback: feedback.length 
        };
      }
    },
    
    getRecentApplications: {
      all: (limit: number = 10) => {
        return applications
          .map(a => {
            const internship = internships.find(i => i.id === a.internship_id);
            const student = users.find(u => u.id === a.student_id);
            return {
              ...a,
              internship_title: internship?.title || 'Unknown',
              student_name: student?.name || 'Unknown',
              student_department: student?.department || 'Unknown'
            };
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
      }
    },
    
    getTopInternships: {
      all: (limit: number = 5) => {
        // Count applications per internship
        const appCounts: Record<number, number> = {};
        applications.forEach(a => {
          appCounts[a.internship_id] = (appCounts[a.internship_id] || 0) + 1;
        });
        
        return internships
          .filter(i => i.is_active)
          .map(i => {
            const postedBy = users.find(u => u.id === i.posted_by);
            return {
              ...i,
              posted_by_name: postedBy?.name || 'Unknown',
              application_count: appCounts[i.id] || 0
            };
          })
          .sort((a, b) => {
            // Sort by application count first, then by creation date
            if (b.application_count !== a.application_count) {
              return b.application_count - a.application_count;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, limit);
      }
    }
  };
}