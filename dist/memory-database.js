"use strict";
// Simple in-memory database for Vercel deployment
// In production, you would use a cloud database like PlanetScale, Supabase, or Neon
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemoryDatabase = getMemoryDatabase;
// In-memory storage (will reset on each deployment)
var users = [];
var internships = [];
var applications = [];
var feedback = [];
var calendarEvents = [];
// Initialize with sample data
function initializeSampleData() {
    var _this = this;
    if (users.length === 0) {
        // Import bcrypt to hash passwords
        Promise.resolve().then(function () { return require('bcryptjs'); }).then(function (bcrypt) { return __awaiter(_this, void 0, void 0, function () {
            var defaultPasswordHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bcrypt.hash('Password123!', 12)];
                    case 1:
                        defaultPasswordHash = _a.sent();
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
                        // Add sample calendar events
                        calendarEvents = [
                            {
                                id: 1,
                                title: 'Internship Interview',
                                description: 'Technical interview for Frontend Developer Intern position',
                                event_type: 'INTERVIEW',
                                start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                                end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 1 hour duration
                                organizer_id: 1,
                                participants: JSON.stringify([2, 1]), // student and organizer
                                location: 'Room 101',
                                status: 'SCHEDULED',
                                created_at: new Date().toISOString()
                            },
                            {
                                id: 2,
                                title: 'Midterm Exam',
                                description: 'Midterm exam for Database Systems',
                                event_type: 'EXAM',
                                start_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // In 2 days
                                end_datetime: new Date(Date.now() + 51 * 60 * 60 * 1000).toISOString(), // 3 hours duration
                                organizer_id: 6,
                                participants: JSON.stringify([2, 5]), // student participants
                                location: 'Exam Hall A',
                                status: 'SCHEDULED',
                                created_at: new Date().toISOString()
                            }
                        ];
                        console.log('Memory database initialized with default users and calendar events');
                        return [2 /*return*/];
                }
            });
        }); }).catch(function (error) {
            console.error('Error initializing memory database:', error);
        });
    }
}
function getMemoryDatabase() {
    initializeSampleData();
    return {
        // User queries
        createUser: {
            run: function (username, password_hash, role, name, email, department, current_semester, skills, resume) {
                var newUser = {
                    id: users.length + 1,
                    username: username,
                    password_hash: password_hash,
                    role: role,
                    name: name,
                    email: email,
                    department: department,
                    current_semester: current_semester,
                    skills: skills,
                    resume: resume,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                users.push(newUser);
                return { lastInsertRowid: newUser.id };
            }
        },
        getUserByUsername: {
            get: function (username) { return users.find(function (u) { return u.username === username; }); }
        },
        getUserById: {
            get: function (id) { return users.find(function (u) { return u.id === id; }); }
        },
        updateUser: {
            run: function (name, email, department, current_semester, skills, resume, id) {
                var userIndex = users.findIndex(function (u) { return u.id === id; });
                if (userIndex !== -1) {
                    users[userIndex] = __assign(__assign({}, users[userIndex]), { name: name, email: email, department: department, current_semester: current_semester, skills: skills, resume: resume, updated_at: new Date().toISOString() });
                }
                return { changes: userIndex !== -1 ? 1 : 0 };
            }
        },
        // Internship queries
        createInternship: {
            run: function (title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, posted_by) {
                var newInternship = {
                    id: internships.length + 1,
                    title: title,
                    description: description,
                    required_skills: required_skills,
                    eligible_departments: eligible_departments,
                    stipend_min: stipend_min,
                    stipend_max: stipend_max,
                    is_placement: is_placement,
                    posted_by: posted_by,
                    is_active: true,
                    created_at: new Date().toISOString()
                };
                internships.push(newInternship);
                return { lastInsertRowid: newInternship.id };
            }
        },
        getActiveInternships: {
            all: function () { return internships
                .filter(function (i) { return i.is_active; })
                .map(function (i) {
                var _a;
                return (__assign(__assign({}, i), { posted_by_name: ((_a = users.find(function (u) { return u.id === i.posted_by; })) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown' }));
            })
                .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }); }
        },
        getInternshipById: {
            get: function (id) {
                var _a;
                var internship = internships.find(function (i) { return i.id === id; });
                if (!internship)
                    return null;
                return __assign(__assign({}, internship), { posted_by_name: ((_a = users.find(function (u) { return u.id === internship.posted_by; })) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown' });
            }
        },
        // Application queries
        createApplication: {
            run: function (student_id, internship_id) {
                var newApplication = {
                    id: applications.length + 1,
                    student_id: student_id,
                    internship_id: internship_id,
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
            all: function (student_id) {
                return applications
                    .filter(function (a) { return a.student_id === student_id; })
                    .map(function (a) {
                    var internship = internships.find(function (i) { return i.id === a.internship_id; });
                    return __assign(__assign({}, a), { internship_title: (internship === null || internship === void 0 ? void 0 : internship.title) || 'Unknown', internship_description: (internship === null || internship === void 0 ? void 0 : internship.description) || 'No description' });
                })
                    .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            }
        },
        getApplicationsForMentor: {
            all: function (mentor_id) {
                // Simplified implementation - in real app, would filter by department
                return applications
                    .filter(function (a) { return a.status === 'APPLIED'; })
                    .map(function (a) {
                    var internship = internships.find(function (i) { return i.id === a.internship_id; });
                    var student = users.find(function (u) { return u.id === a.student_id; });
                    return __assign(__assign({}, a), { internship_title: (internship === null || internship === void 0 ? void 0 : internship.title) || 'Unknown', student_name: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown', student_department: (student === null || student === void 0 ? void 0 : student.department) || 'Unknown' });
                })
                    .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            }
        },
        getAllApplications: {
            all: function () {
                return applications.map(function (a) {
                    var internship = internships.find(function (i) { return i.id === a.internship_id; });
                    var student = users.find(function (u) { return u.id === a.student_id; });
                    var mentor = a.mentor_id ? users.find(function (u) { return u.id === a.mentor_id; }) : null;
                    return __assign(__assign({}, a), { internship_title: (internship === null || internship === void 0 ? void 0 : internship.title) || 'Unknown', student_name: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown', student_department: (student === null || student === void 0 ? void 0 : student.department) || 'Unknown', mentor_name: (mentor === null || mentor === void 0 ? void 0 : mentor.name) || null });
                }).sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            }
        },
        getApplicationsByInternship: {
            all: function (internship_id) {
                return applications
                    .filter(function (a) { return a.internship_id === internship_id; })
                    .map(function (a) {
                    var student = users.find(function (u) { return u.id === a.student_id; });
                    return __assign(__assign({}, a), { student_name: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown', student_department: (student === null || student === void 0 ? void 0 : student.department) || 'Unknown', student_email: (student === null || student === void 0 ? void 0 : student.email) || 'Unknown', student_skills: (student === null || student === void 0 ? void 0 : student.skills) || '[]', student_resume: (student === null || student === void 0 ? void 0 : student.resume) || '' });
                })
                    .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            }
        },
        updateApplicationStatus: {
            run: function (status, mentor_id, id) {
                var appIndex = applications.findIndex(function (a) { return a.id === id; });
                if (appIndex !== -1) {
                    applications[appIndex] = __assign(__assign({}, applications[appIndex]), { status: status, mentor_id: mentor_id, mentor_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                }
                return { changes: appIndex !== -1 ? 1 : 0 };
            }
        },
        // Feedback queries
        createFeedback: {
            run: function (application_id, supervisor_id, rating, comments) {
                var newFeedback = {
                    id: feedback.length + 1,
                    application_id: application_id,
                    supervisor_id: supervisor_id,
                    rating: rating,
                    comments: comments,
                    created_at: new Date().toISOString()
                };
                feedback.push(newFeedback);
                return { lastInsertRowid: newFeedback.id };
            }
        },
        getFeedbackByApplication: {
            all: function (application_id) {
                return feedback
                    .filter(function (f) { return f.application_id === application_id; })
                    .map(function (f) {
                    var supervisor = users.find(function (u) { return u.id === f.supervisor_id; });
                    return __assign(__assign({}, f), { supervisor_name: (supervisor === null || supervisor === void 0 ? void 0 : supervisor.name) || 'Unknown' });
                });
            }
        },
        getAllFeedback: {
            all: function () {
                return feedback.map(function (f) {
                    var supervisor = users.find(function (u) { return u.id === f.supervisor_id; });
                    var application = applications.find(function (a) { return a.id === f.application_id; });
                    var student = application ? users.find(function (u) { return u.id === application.student_id; }) : null;
                    var internship = application ? internships.find(function (i) { return i.id === application.internship_id; }) : null;
                    return __assign(__assign({}, f), { supervisor_name: (supervisor === null || supervisor === void 0 ? void 0 : supervisor.name) || 'Unknown', student_id: (student === null || student === void 0 ? void 0 : student.id) || null, student_name: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown', internship_title: (internship === null || internship === void 0 ? void 0 : internship.title) || 'Unknown' });
                }).sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); });
            }
        },
        // Calendar Event queries
        createCalendarEvent: {
            run: function (title, description, event_type, start_datetime, end_datetime, organizer_id, participants, location, meeting_url, status) {
                var newEvent = {
                    id: calendarEvents.length + 1,
                    title: title,
                    description: description,
                    event_type: event_type,
                    start_datetime: start_datetime,
                    end_datetime: end_datetime,
                    organizer_id: organizer_id,
                    participants: participants,
                    location: location,
                    meeting_url: meeting_url,
                    status: status,
                    created_at: new Date().toISOString()
                };
                calendarEvents.push(newEvent);
                return { lastInsertRowid: newEvent.id };
            }
        },
        getCalendarEventsByUser: {
            all: function (userId, startDate, endDate) {
                return calendarEvents
                    .filter(function (event) {
                    // Check if user is organizer or participant
                    var isOrganizer = event.organizer_id === userId;
                    var isParticipant = event.participants &&
                        (event.participants.includes("[".concat(userId, "]")) ||
                            event.participants.includes("".concat(userId, ",")) ||
                            event.participants.includes(",".concat(userId, ",")) ||
                            event.participants === "[".concat(userId, "]"));
                    // Check date range
                    var eventStart = new Date(event.start_datetime);
                    var eventEnd = new Date(event.end_datetime);
                    var rangeStart = new Date(startDate);
                    var rangeEnd = new Date(endDate);
                    var inDateRange = eventStart >= rangeStart && eventEnd <= rangeEnd;
                    return (isOrganizer || isParticipant) && inDateRange;
                })
                    .map(function (event) { return (__assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] })); });
            }
        },
        getCalendarEventsForDate: {
            all: function (date, userId) {
                return calendarEvents
                    .filter(function (event) {
                    var eventDate = new Date(event.start_datetime).toISOString().split('T')[0];
                    var targetDate = new Date(date).toISOString().split('T')[0];
                    var dateMatch = eventDate === targetDate;
                    if (userId) {
                        var isOrganizer = event.organizer_id === userId;
                        var isParticipant = event.participants &&
                            (event.participants.includes("[".concat(userId, "]")) ||
                                event.participants.includes("".concat(userId, ",")) ||
                                event.participants.includes(",".concat(userId, ",")) ||
                                event.participants === "[".concat(userId, "]"));
                        return dateMatch && (isOrganizer || isParticipant);
                    }
                    return dateMatch;
                })
                    .map(function (event) { return (__assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] })); });
            }
        },
        getCalendarEventById: {
            get: function (id) {
                var event = calendarEvents.find(function (e) { return e.id === id; });
                if (!event)
                    return null;
                return __assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] });
            }
        },
        updateCalendarEvent: {
            run: function (id, title, description, event_type, start_datetime, end_datetime, organizer_id, participants, location, meeting_url, status) {
                var eventIndex = calendarEvents.findIndex(function (e) { return e.id === id; });
                if (eventIndex !== -1) {
                    calendarEvents[eventIndex] = __assign(__assign({}, calendarEvents[eventIndex]), { title: title, description: description, event_type: event_type, start_datetime: start_datetime, end_datetime: end_datetime, organizer_id: organizer_id, participants: participants, location: location, meeting_url: meeting_url, status: status });
                }
                return { changes: eventIndex !== -1 ? 1 : 0 };
            }
        },
        deleteCalendarEvent: {
            run: function (id) {
                var initialLength = calendarEvents.length;
                calendarEvents = calendarEvents.filter(function (e) { return e.id !== id; });
                return { changes: initialLength - calendarEvents.length };
            }
        },
        getUpcomingCalendarEvents: {
            all: function (userId, limit) {
                if (limit === void 0) { limit = 10; }
                var now = new Date().toISOString();
                return calendarEvents
                    .filter(function (event) {
                    // Check if user is organizer or participant
                    var isOrganizer = event.organizer_id === userId;
                    var isParticipant = event.participants &&
                        (event.participants.includes("[".concat(userId, "]")) ||
                            event.participants.includes("".concat(userId, ",")) ||
                            event.participants.includes(",".concat(userId, ",")) ||
                            event.participants === "[".concat(userId, "]"));
                    // Check if event is in the future
                    var isFuture = event.start_datetime >= now;
                    return (isOrganizer || isParticipant) && isFuture;
                })
                    .sort(function (a, b) { return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(); })
                    .slice(0, limit)
                    .map(function (event) { return (__assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] })); });
            }
        },
        getCalendarEventsByType: {
            all: function (userId, eventType, startDate, endDate) {
                return calendarEvents
                    .filter(function (event) {
                    // Check if user is organizer or participant
                    var isOrganizer = event.organizer_id === userId;
                    var isParticipant = event.participants &&
                        (event.participants.includes("[".concat(userId, "]")) ||
                            event.participants.includes("".concat(userId, ",")) ||
                            event.participants.includes(",".concat(userId, ",")) ||
                            event.participants === "[".concat(userId, "]"));
                    // Check event type
                    var typeMatch = event.event_type === eventType;
                    // Check date range
                    var eventStart = new Date(event.start_datetime);
                    var eventEnd = new Date(event.end_datetime);
                    var rangeStart = new Date(startDate);
                    var rangeEnd = new Date(endDate);
                    var inDateRange = eventStart >= rangeStart && eventEnd <= rangeEnd;
                    return (isOrganizer || isParticipant) && typeMatch && inDateRange;
                })
                    .map(function (event) { return (__assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] })); });
            }
        },
        getCalendarEventsWithConflicts: {
            all: function (userId, startDateTime, endDateTime, excludeEventId) {
                return calendarEvents
                    .filter(function (event) {
                    // Check if user is organizer or participant
                    var isOrganizer = event.organizer_id === userId;
                    var isParticipant = event.participants &&
                        (event.participants.includes("[".concat(userId, "]")) ||
                            event.participants.includes("".concat(userId, ",")) ||
                            event.participants.includes(",".concat(userId, ",")) ||
                            event.participants === "[".concat(userId, "]"));
                    // Exclude specific event if provided
                    var notExcluded = excludeEventId ? event.id !== excludeEventId : true;
                    // Check for time conflicts
                    var eventStart = new Date(event.start_datetime);
                    var eventEnd = new Date(event.end_datetime);
                    var checkStart = new Date(startDateTime);
                    var checkEnd = new Date(endDateTime);
                    var hasConflict = ((checkStart < eventEnd && checkEnd > eventStart) ||
                        (checkStart >= eventStart && checkEnd <= eventEnd));
                    return (isOrganizer || isParticipant) && notExcluded && hasConflict;
                })
                    .map(function (event) { return (__assign(__assign({}, event), { participants: event.participants ? JSON.parse(event.participants) : [] })); });
            }
        },
        // Analytics queries
        getUnplacedStudentsCount: {
            get: function () {
                var placedStudentIds = new Set(applications
                    .filter(function (a) { return a.status === 'OFFERED' || a.status === 'COMPLETED'; })
                    .map(function (a) { return a.student_id; }));
                var unplacedCount = users.filter(function (u) {
                    return u.role === 'STUDENT' && !placedStudentIds.has(u.id);
                }).length;
                return { count: unplacedCount };
            }
        },
        getApplicationStatusBreakdown: {
            all: function () {
                var statusCounts = {};
                applications.forEach(function (a) {
                    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
                });
                return Object.entries(statusCounts).map(function (_a) {
                    var status = _a[0], count = _a[1];
                    return ({
                        status: status,
                        count: count
                    });
                });
            }
        },
        getOpenPositionsCount: {
            get: function () {
                var count = internships.filter(function (i) { return i.is_active; }).length;
                return { count: count };
            }
        },
        getAverageFeedbackRating: {
            get: function () {
                if (feedback.length === 0) {
                    return { average_rating: 0, total_feedback: 0 };
                }
                var totalRating = feedback.reduce(function (sum, f) { return sum + f.rating; }, 0);
                var average = totalRating / feedback.length;
                return {
                    average_rating: parseFloat(average.toFixed(2)),
                    total_feedback: feedback.length
                };
            }
        },
        getRecentApplications: {
            all: function (limit) {
                return applications
                    .map(function (a) {
                    var internship = internships.find(function (i) { return i.id === a.internship_id; });
                    var student = users.find(function (u) { return u.id === a.student_id; });
                    return __assign(__assign({}, a), { internship_title: (internship === null || internship === void 0 ? void 0 : internship.title) || 'Unknown', student_name: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown', student_department: (student === null || student === void 0 ? void 0 : student.department) || 'Unknown' });
                })
                    .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); })
                    .slice(0, limit);
            }
        },
        getTopInternships: {
            all: function (limit) {
                // Count applications per internship
                var appCounts = {};
                applications.forEach(function (a) {
                    appCounts[a.internship_id] = (appCounts[a.internship_id] || 0) + 1;
                });
                return internships
                    .filter(function (i) { return i.is_active; })
                    .map(function (i) {
                    var postedBy = users.find(function (u) { return u.id === i.posted_by; });
                    return __assign(__assign({}, i), { posted_by_name: (postedBy === null || postedBy === void 0 ? void 0 : postedBy.name) || 'Unknown', application_count: appCounts[i.id] || 0 });
                })
                    .sort(function (a, b) {
                    // Sort by application count (descending), then by creation date (descending)
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
