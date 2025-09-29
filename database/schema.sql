-- SQL Schema for Internship and Placement Management System
-- This file contains the complete database schema

-- Users table - stores all user types
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER')),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  current_semester INTEGER,
  skills TEXT, -- JSON array of skills ["Java", "React", "Python"]
  resume TEXT, -- Base64 encoded file or text content
  cover_letter TEXT, -- Digital cover letter content
  profile_picture TEXT, -- File path or base64
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  cgpa REAL,
  graduation_year INTEGER,
  employability_score REAL DEFAULT 0, -- Continuous employability tracking
  placement_status TEXT DEFAULT 'AVAILABLE' CHECK (placement_status IN ('AVAILABLE', 'PLACED', 'INTERNING')),
  preferences TEXT, -- JSON for student preferences (stipend, location, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Internships table - stores job/internship postings
CREATE TABLE IF NOT EXISTS internships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT NOT NULL, -- JSON array ["Java", "Spring Boot"]
  eligible_departments TEXT NOT NULL, -- JSON array ["Computer Science", "IT"]
  stipend_min INTEGER,
  stipend_max INTEGER,
  is_placement BOOLEAN DEFAULT 0, -- 0 for internship, 1 for placement
  placement_conversion_potential TEXT, -- High/Medium/Low
  company_name TEXT NOT NULL,
  location TEXT,
  duration_weeks INTEGER,
  application_deadline DATETIME,
  start_date DATETIME,
  competency_tags TEXT, -- JSON array for competencies
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  posted_by INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Applications table - tracks student applications
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  internship_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPLIED' CHECK (status IN (
    'APPLIED', 
    'MENTOR_REVIEW', 
    'MENTOR_APPROVED', 
    'MENTOR_REJECTED', 
    'EMPLOYER_REVIEW',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED', 
    'OFFERED', 
    'OFFER_ACCEPTED',
    'OFFER_REJECTED',
    'NOT_OFFERED', 
    'COMPLETED',
    'WITHDRAWN'
  )),
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mentor_approved_at DATETIME,
  mentor_id INTEGER,
  interview_scheduled_at DATETIME,
  interview_feedback TEXT,
  offer_made_at DATETIME,
  offer_accepted_at DATETIME,
  completion_date DATETIME,
  tracking_notes TEXT, -- JSON array for tracking notes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (internship_id) REFERENCES internships(id),
  FOREIGN KEY (mentor_id) REFERENCES users(id),
  UNIQUE(student_id, internship_id) -- Prevent duplicate applications
);

-- Feedback table - stores supervisor feedback after internship completion
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  supervisor_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  recommendation_for_placement BOOLEAN DEFAULT 0,
  feedback_type TEXT DEFAULT 'COMPLETION' CHECK (feedback_type IN ('MIDTERM', 'COMPLETION', 'WEEKLY')),
  skills_gained TEXT, -- JSON array of skills gained
  certificate_eligible BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Student Badges and Achievements System
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- Icon file path or code
  criteria TEXT NOT NULL, -- JSON criteria for earning the badge
  points INTEGER DEFAULT 0,
  badge_type TEXT CHECK (badge_type IN ('SKILL', 'ACHIEVEMENT', 'MILESTONE', 'RECOGNITION')),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Badges - tracks which badges users have earned
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verification_data TEXT, -- JSON with verification details
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  UNIQUE(user_id, badge_id)
);

-- Certificates table - tracks all generated certificates
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  certificate_type TEXT CHECK (certificate_type IN ('INTERNSHIP', 'PLACEMENT', 'SKILL', 'ACHIEVEMENT')),
  certificate_data TEXT NOT NULL, -- JSON with certificate details
  qr_code TEXT NOT NULL, -- QR code for verification
  file_path TEXT, -- Path to generated PDF
  verification_url TEXT,
  is_verified BOOLEAN DEFAULT 1,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Notifications table - for real-time notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('APPLICATION', 'APPROVAL', 'INTERVIEW', 'OFFER', 'BADGE', 'GENERAL', 'DEADLINE', 'FEEDBACK', 'REMINDER')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON with additional data
  is_read BOOLEAN DEFAULT 0,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  scheduled_for DATETIME, -- For scheduled notifications
  sent_at DATETIME, -- When notification was actually sent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Calendar Events - for interview scheduling and academic events
CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('INTERVIEW', 'EXAM', 'ACADEMIC', 'DEADLINE', 'PLACEMENT', 'OTHER')),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  organizer_id INTEGER,
  participants TEXT, -- JSON array of user IDs
  location TEXT,
  meeting_url TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Application Tracking - detailed tracking of application steps
CREATE TABLE IF NOT EXISTS application_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  completed_at DATETIME,
  notes TEXT,
  actor_id INTEGER, -- Who performed this step
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- Placement Statistics - for real-time dashboard
CREATE TABLE IF NOT EXISTS placement_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  total_students INTEGER DEFAULT 0,
  placed_students INTEGER DEFAULT 0,
  interning_students INTEGER DEFAULT 0,
  average_package REAL,
  highest_package REAL,
  placement_percentage REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and Reports tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  entity_type TEXT, -- 'application', 'internship', 'user', etc.
  entity_id INTEGER,
  data TEXT, -- JSON with event data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_placement_status ON users(placement_status);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_internships_active ON internships(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_name);
CREATE INDEX IF NOT EXISTS idx_feedback_application ON feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_application_tracking_app ON application_tracking(application_id);
CREATE INDEX IF NOT EXISTS idx_placement_stats_dept ON placement_stats(department, academic_year);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- Additional tables for enhanced features

-- Placement Offers - tracks complete offer lifecycle
CREATE TABLE IF NOT EXISTS placement_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  position_title TEXT NOT NULL,
  offer_type TEXT CHECK (offer_type IN ('INTERNSHIP', 'PLACEMENT', 'FULL_TIME')),
  offer_details TEXT NOT NULL, -- JSON with salary, benefits, etc.
  offer_status TEXT DEFAULT 'DRAFT' CHECK (offer_status IN ('DRAFT', 'EXTENDED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED')),
  offer_date DATETIME NOT NULL,
  response_deadline DATETIME NOT NULL,
  acceptance_date DATETIME,
  rejection_date DATETIME,
  rejection_reason TEXT,
  contract_signed BOOLEAN DEFAULT 0,
  contract_details TEXT, -- JSON with contract information
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Offer Tracking Steps - detailed tracking of offer process
CREATE TABLE IF NOT EXISTS offer_tracking_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  completed_at DATETIME,
  completed_by INTEGER,
  notes TEXT,
  documents_required TEXT, -- JSON array
  documents_submitted TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES placement_offers(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Mentor Approval Requests - automated workflow system
CREATE TABLE IF NOT EXISTS mentor_approval_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  mentor_id INTEGER,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  auto_assigned BOOLEAN DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  comments TEXT,
  escalation_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (mentor_id) REFERENCES users(id)
);

-- Enhanced Calendar Events for Interview Scheduling
CREATE TABLE IF NOT EXISTS interview_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  interviewer_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  scheduled_datetime DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  mode TEXT CHECK (mode IN ('ONLINE', 'OFFLINE', 'PHONE')),
  meeting_link TEXT,
  location TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED')),
  interview_type TEXT DEFAULT 'TECHNICAL' CHECK (interview_type IN ('TECHNICAL', 'HR', 'MANAGER', 'FINAL')),
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (interviewer_id) REFERENCES users(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_placement_offers_student ON placement_offers(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_application ON placement_offers(application_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_status ON placement_offers(offer_status);
CREATE INDEX IF NOT EXISTS idx_offer_tracking_offer ON offer_tracking_steps(offer_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor ON mentor_approval_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_status ON mentor_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_student ON interview_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_interviewer ON interview_schedules(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_datetime ON interview_schedules(scheduled_datetime);

-- Chat System Tables for Mentor-Applicant Communication
-- Implements "in-app chat between mentors and applicants to resolve queries"

CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (mentor_id) REFERENCES users(id),
  UNIQUE(application_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_room_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_application ON chat_rooms(application_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_student ON chat_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_mentor ON chat_rooms(mentor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(chat_room_id, is_read);
