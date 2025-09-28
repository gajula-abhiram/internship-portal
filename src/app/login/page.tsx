'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, handleApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: 'amit.sharma', password: 'Password123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(credentials);
      login(response.user, response.token);
      router.push('/dashboard');
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (username: string, password: string) => {
    setCredentials({ username, password });
    setShowDemoAccounts(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Demo Accounts Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-900">Demo Accounts for Testing</h3>
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            </button>
          </div>
          
          {showDemoAccounts && (
            <div className="space-y-3">
              <p className="text-xs text-blue-700 mb-3">
                Click any button below to auto-fill login credentials:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('amit.sharma', 'Password123!')}
                  className="bg-white border border-blue-300 rounded px-3 py-2 text-sm hover:bg-blue-50 text-left"
                >
                  <div className="font-medium text-blue-900">Student Account</div>
                  <div className="text-xs text-blue-600">amit.sharma / Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('rajesh.staff', 'Password123!')}
                  className="bg-white border border-blue-300 rounded px-3 py-2 text-sm hover:bg-blue-50 text-left"
                >
                  <div className="font-medium text-blue-900">Staff Account</div>
                  <div className="text-xs text-blue-600">rajesh.staff / Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('vikram.mentor', 'Password123!')}
                  className="bg-white border border-blue-300 rounded px-3 py-2 text-sm hover:bg-blue-50 text-left"
                >
                  <div className="font-medium text-blue-900">Mentor Account</div>
                  <div className="text-xs text-blue-600">vikram.mentor / Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('suresh.employer', 'Password123!')}
                  className="bg-white border border-blue-300 rounded px-3 py-2 text-sm hover:bg-blue-50 text-left"
                >
                  <div className="font-medium text-blue-900">Employer Account</div>
                  <div className="text-xs text-blue-600">suresh.employer / Password123!</div>
                </button>
              </div>
              
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>All Demo Accounts:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• <strong>Students:</strong> amit.sharma, priya.singh, rajesh.kumar, neha.gupta, vivek.agarwal, pooja.jain, etc.</li>
                  <li>• <strong>Staff:</strong> rajesh.staff, sunita.staff, vinod.staff</li>
                  <li>• <strong>Mentors:</strong> vikram.mentor, meera.mentor, ashok.mentor, kavita.mentor, ramesh.mentor</li>
                  <li>• <strong>Employers:</strong> suresh.employer, anita.employer, deepak.employer, ravi.employer, sneha.employer</li>
                  <li>• <strong>Password for all accounts:</strong> Password123!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
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
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="Enter your username"
              />
            </div>
            
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
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Student credentials (amit.sharma / Password123!) pre-filled for convenience</p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  For security reasons, please contact your system administrator or IT support to reset your password.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Contact Information:</h4>
                  <p className="text-sm text-blue-800">Email: support@university.edu</p>
                  <p className="text-sm text-blue-800">Phone: +1 (555) 123-4567</p>
                  <p className="text-sm text-blue-800">Office Hours: Mon-Fri 9AM-5PM</p>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  You can also try logging in with the demo credentials:
                  <br />Student: amit.sharma / Password123!
                  <br />Staff: rajesh.staff / Password123!
                  <br />Mentor: vikram.mentor / Password123!
                  <br />Employer: suresh.employer / Password123!
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}