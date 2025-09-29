-- Initial Badges for the Internship Portal System
-- This file contains default badges that students can earn

-- Skill-based badges
INSERT OR IGNORE INTO badges (name, description, icon, criteria, points, badge_type) VALUES 
('JavaScript Master', 'Demonstrated proficiency in JavaScript development', '💻', '{"skill": "JavaScript", "projects": 3, "rating": 4}', 50, 'SKILL'),
('Python Expert', 'Advanced Python programming skills', '🐍', '{"skill": "Python", "projects": 3, "rating": 4}', 50, 'SKILL'),
('React Developer', 'Proficient in React framework development', '⚛️', '{"skill": "React", "projects": 2, "rating": 4}', 45, 'SKILL'),
('Java Professional', 'Strong Java programming and OOP concepts', '☕', '{"skill": "Java", "projects": 3, "rating": 4}', 50, 'SKILL'),
('Database Designer', 'Expert in database design and SQL', '🗄️', '{"skill": "SQL", "projects": 2, "rating": 4}', 40, 'SKILL'),
('Cloud Computing', 'Experience with cloud platforms and services', '☁️', '{"skills": ["AWS", "Azure", "GCP"], "projects": 1}', 60, 'SKILL'),
('Machine Learning', 'Applied machine learning in projects', '🤖', '{"skill": "ML", "projects": 1, "rating": 3}', 70, 'SKILL'),
('UI/UX Designer', 'Strong design and user experience skills', '🎨', '{"skills": ["UI", "UX", "Design"], "projects": 2}', 45, 'SKILL');

-- Achievement badges
INSERT OR IGNORE INTO badges (name, description, icon, criteria, points, badge_type) VALUES 
('First Application', 'Applied to your first internship', '🚀', '{"applications": 1}', 10, 'ACHIEVEMENT'),
('Quick Applier', 'Applied within 24 hours of posting', '⚡', '{"quick_application": true}', 15, 'ACHIEVEMENT'),
('Interview Ace', 'Successfully completed 5 interviews', '🎯', '{"interviews_completed": 5}', 30, 'ACHIEVEMENT'),
('Offer Collector', 'Received 3 or more offers', '🏆', '{"offers_received": 3}', 50, 'ACHIEVEMENT'),
('Feedback Champion', 'Received excellent feedback (4.5+ rating)', '⭐', '{"feedback_rating": 4.5}', 40, 'ACHIEVEMENT'),
('Skill Builder', 'Added 10 or more skills to profile', '📚', '{"skills_count": 10}', 20, 'ACHIEVEMENT'),
('Profile Perfectionist', 'Completed 100% of profile fields', '✨', '{"profile_completion": 100}', 25, 'ACHIEVEMENT'),
('Early Bird', 'Applied in the first week of posting', '🌅', '{"early_application": true}', 20, 'ACHIEVEMENT');

-- Milestone badges
INSERT OR IGNORE INTO badges (name, description, icon, criteria, points, badge_type) VALUES 
('First Internship', 'Successfully completed your first internship', '🎓', '{"internships_completed": 1}', 75, 'MILESTONE'),
('Placement Success', 'Secured a placement offer', '🏢', '{"placement_secured": true}', 100, 'MILESTONE'),
('Mentor Favorite', 'Highly recommended by mentor', '👨‍🏫', '{"mentor_recommendation": true}', 60, 'MILESTONE'),
('Industry Ready', 'Completed 3 internships successfully', '💼', '{"internships_completed": 3}', 150, 'MILESTONE'),
('Top Performer', 'Ranked in top 10% of department', '🥇', '{"performance_rank": "top_10"}', 80, 'MILESTONE'),
('Leadership', 'Led a project or team during internship', '👑', '{"leadership_role": true}', 65, 'MILESTONE');

-- Recognition badges
INSERT OR IGNORE INTO badges (name, description, icon, criteria, points, badge_type) VALUES 
('Department Star', 'Outstanding performance in department', '🌟', '{"department_recognition": true}', 90, 'RECOGNITION'),
('Innovation Award', 'Demonstrated innovative thinking', '💡', '{"innovation_project": true}', 85, 'RECOGNITION'),
('Team Player', 'Excellent collaboration and teamwork', '🤝', '{"teamwork_rating": 5}', 45, 'RECOGNITION'),
('Problem Solver', 'Solved critical problems during internship', '🧩', '{"problem_solving": true}', 55, 'RECOGNITION'),
('Client Favorite', 'Highly rated by external clients', '🤩', '{"client_rating": 5}', 70, 'RECOGNITION'),
('Fast Learner', 'Quickly adapted to new technologies', '🚄', '{"learning_speed": "fast"}', 40, 'RECOGNITION');

-- Employer Achievement badges
INSERT OR IGNORE INTO badges (name, description, icon, criteria, points, badge_type) VALUES 
('First Offer', 'Made your first internship offer', '🎯', '{"offers_made": 1}', 20, 'ACHIEVEMENT'),
('Quick Application Responder', 'Reviewed applications within 24 hours', '⚡', '{"quick_response": true}', 25, 'ACHIEVEMENT'),
('Positive Feedback Champion', 'Received excellent feedback (4.5+ rating) from students', '⭐', '{"feedback_rating": 4.5}', 50, 'ACHIEVEMENT'),
('Internship Completion Master', 'Successfully completed 10 internships with students', '🏆', '{"internships_completed": 10}', 100, 'MILESTONE');