'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { studentsApi } from '@/lib/api';

interface StudentProfile {
  name: string;
  email: string;
  department: string;
  current_semester: number;
  skills: string[];
  resume: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    email: '',
    department: '',
    current_semester: 1,
    skills: [],
    resume: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'HTML/CSS',
    'SQL', 'MongoDB', 'Express.js', 'Angular', 'Vue.js', 'TypeScript',
    'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot', 'Hibernate',
    'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Linux', 'Windows',
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Photoshop', 'Illustrator',
    'Project Management', 'Data Analysis', 'Machine Learning', 'AI',
    'Blockchain', 'Cybersecurity', 'Network Security', 'Ethical Hacking'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await studentsApi.getProfile();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          department: data.department || '',
          current_semester: data.current_semester || 1,
          skills: Array.isArray(data.skills) ? data.skills : (data.skills ? JSON.parse(data.skills) : []),
          resume: data.resume || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Set default values from auth context if API fails
        if (user) {
          setProfile(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            department: user.department || '',
            current_semester: user.current_semester || 1
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'STUDENT') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await studentsApi.updateProfile(profile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addCommonSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  if (user?.role !== 'STUDENT') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">Access Restricted</h3>
              <p className="text-yellow-700">
                This page is only available for students. You are logged in as {user?.role?.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">
          Keep your profile updated to get better internship recommendations
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-6">
          <h2 className="text-2xl font-bold">Student Profile</h2>
          <p className="text-blue-100">Manage your academic and professional information</p>
        </div>

        <div className="p-8">
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={profile.department}
                  onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Semester
                </label>
                <select
                  value={profile.current_semester}
                  onChange={(e) => setProfile(prev => ({ ...prev, current_semester: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Skills & Technologies
              </label>
              
              {/* Current Skills */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Your Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add New Skill */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a new skill"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Common Skills */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Popular Skills (click to add):</h3>
                <div className="flex flex-wrap gap-2">
                  {commonSkills
                    .filter(skill => !profile.skills.includes(skill))
                    .map((skill, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addCommonSkill(skill)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Resume Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume/Bio
              </label>
              <textarea
                value={profile.resume}
                onChange={(e) => setProfile(prev => ({ ...prev, resume: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a brief description about yourself, your achievements, projects, and career goals..."
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be visible to employers when you apply for internships.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                  saving 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {saving ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors duration-300"
              >
                Reset Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Profile Completion Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-2">Profile Completion Tips</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Add at least 5-10 relevant skills to increase your visibility</li>
          <li>• Keep your resume/bio updated with latest achievements and projects</li>
          <li>• Make sure your contact information is accurate</li>
          <li>• Highlight skills that match the internships you're interested in</li>
        </ul>
      </div>
    </div>
  );
}