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
        <div className="text-center animate-fade-in">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 max-w-md mx-auto">
            Access the Technical University Internship & Placement Portal to manage your career opportunities
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <span>New user?</span>
            <Link href="/register" className="ml-2 font-medium text-blue-600 hover:text-blue-800 transition-colors duration-300">
              Create a new account
            </Link>
          </div>
        </div>
        
        {/* Demo Accounts Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8 shadow-lg transform transition-all duration-500 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <span className="text-2xl">🔑</span>
              </div>
              <h3 className="text-lg font-bold text-blue-900">Demo Accounts for Testing</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105"
            >
              {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            </button>
          </div>
          
          {showDemoAccounts && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-blue-700 mb-4 bg-blue-100 p-3 rounded-lg">
                <span className="font-bold">💡 Quick Access:</span> Click any button below to auto-fill login credentials
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('amit.sharma', 'Password123!')}
                  className="bg-white border-2 border-blue-300 rounded-xl px-4 py-3 text-sm hover:bg-blue-50 text-left transform transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <div className="font-bold text-blue-900 flex items-center">
                    <span className="mr-2">🎓</span>
                    Student Account
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Username: amit.sharma</div>
                  <div className="text-xs text-blue-600">Password: Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('rajesh.staff', 'Password123!')}
                  className="bg-white border-2 border-green-300 rounded-xl px-4 py-3 text-sm hover:bg-green-50 text-left transform transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <div className="font-bold text-green-900 flex items-center">
                    <span className="mr-2">👨‍🏫</span>
                    Staff Account
                  </div>
                  <div className="text-xs text-green-600 mt-1">Username: rajesh.staff</div>
                  <div className="text-xs text-green-600">Password: Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('vikram.mentor', 'Password123!')}
                  className="bg-white border-2 border-purple-300 rounded-xl px-4 py-3 text-sm hover:bg-purple-50 text-left transform transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <div className="font-bold text-purple-900 flex items-center">
                    <span className="mr-2">🧠</span>
                    Mentor Account
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Username: vikram.mentor</div>
                  <div className="text-xs text-purple-600">Password: Password123!</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('suresh.employer', 'Password123!')}
                  className="bg-white border-2 border-orange-300 rounded-xl px-4 py-3 text-sm hover:bg-orange-50 text-left transform transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <div className="font-bold text-orange-900 flex items-center">
                    <span className="mr-2">🏢</span>
                    Employer Account
                  </div>
                  <div className="text-xs text-orange-600 mt-1">Username: suresh.employer</div>
                  <div className="text-xs text-orange-600">Password: Password123!</div>
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl text-sm text-blue-800 border border-blue-200">
                <div className="font-bold mb-2 flex items-center">
                  <span className="mr-2">📋</span>
                  All Demo Accounts Information:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="font-medium mb-1">Students:</div>
                    <div className="text-xs">amit.sharma, priya.singh, rajesh.kumar, neha.gupta, vivek.agarwal, pooja.jain, etc.</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Staff:</div>
                    <div className="text-xs">rajesh.staff, sunita.staff, vinod.staff</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Mentors:</div>
                    <div className="text-xs">vikram.mentor, meera.mentor, ashok.mentor, kavita.mentor, ramesh.mentor</div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Employers:</div>
                    <div className="text-xs">suresh.employer, anita.employer, deepak.employer, ravi.employer, sneha.employer</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 font-bold">
                  Password for all accounts: <span className="bg-yellow-100 px-2 py-1 rounded">Password123!</span>
                </div>
              </div>
            </div>
          )}
          
          {!showDemoAccounts && (
            <div className="text-center py-3 bg-blue-100 rounded-lg text-blue-700 text-sm animate-pulse">
              Click "Show Demo Accounts" to access test credentials
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform transition-all duration-500 hover:shadow-2xl" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg animate-shake flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <span>{error}</span>
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
        
        <div className="mt-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-pulse-slow">
          <div className="flex items-center justify-center mb-2">
            <span className="text-xl mr-2">⚡</span>
            <h4 className="font-bold text-yellow-800">Quick Access Enabled</h4>
          </div>
          <p className="text-sm text-yellow-700">
            Student credentials pre-filled: <span className="font-mono font-bold">amit.sharma</span> / <span className="font-mono font-bold">Password123!</span>
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Use the Demo Accounts section above for other roles
          </p>
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