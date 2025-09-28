'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, handleApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    name: '',
    email: '',
    department: '',
    current_semester: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    const passwordErrors = [];
    if (formData.password.length < 8) passwordErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(formData.password)) passwordErrors.push('one uppercase letter');
    if (!/[a-z]/.test(formData.password)) passwordErrors.push('one lowercase letter');
    if (!/\d/.test(formData.password)) passwordErrors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) passwordErrors.push('one special character');
    
    if (passwordErrors.length > 0) {
      setError(`Password must contain ${passwordErrors.join(', ')}`);
      return;
    }

    // Validate university email
    if (!formData.email.includes('.edu') && !formData.email.includes('.ac.') && !formData.email.includes('university')) {
      setError('Please use your institutional/university email address');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        email: formData.email,
        department: formData.department || undefined,
        current_semester: formData.current_semester ? parseInt(formData.current_semester) : undefined
      };

      const response = await authApi.register(registrationData);
      login(response.user, response.token);
      router.push('/dashboard');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="MENTOR">Mentor</option>
                <option value="EMPLOYER">Employer</option>
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (University/Institutional Email)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.name@university.edu"
              />
              <p className="mt-1 text-xs text-gray-500">
                Please use your institutional email address (.edu, .ac.in, university domain)
              </p>
            </div>

            {(formData.role === 'STUDENT' || formData.role === 'STAFF' || formData.role === 'MENTOR') && (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.role === 'STUDENT' && (
              <div>
                <label htmlFor="current_semester" className="block text-sm font-medium text-gray-700">
                  Current Semester
                </label>
                <select
                  id="current_semester"
                  name="current_semester"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.current_semester}
                  onChange={(e) => setFormData({ ...formData, current_semester: e.target.value })}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setPasswordFocused(true)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordFocused && (
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                      One lowercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                      One number
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1 text-xs ${
                  formData.password === formData.confirmPassword 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formData.password === formData.confirmPassword 
                    ? '✓ Passwords match' 
                    : '✗ Passwords do not match'
                  }
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}