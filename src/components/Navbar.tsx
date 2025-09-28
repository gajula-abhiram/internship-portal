'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                Internship Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Loading placeholder */}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // If no user, show public navigation
  if (!user) {
    return (
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                Internship Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/internships"
                className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Internships
              </Link>
              <Link
                href="/login"
                className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-500 hover:bg-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const getNavLinks = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/internships', label: 'Internships' },
          { href: '/applications', label: 'My Applications' },
          { href: '/profile', label: 'Profile' },
        ];
      case 'STAFF':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/internships', label: 'Internships' },
          { href: '/internships/manage', label: 'Manage Internships' },
          { href: '/applications', label: 'All Applications' },
          { href: '/analytics', label: 'Analytics' },
        ];
      case 'MENTOR':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/applications', label: 'Pending Approvals' },
          { href: '/profile', label: 'Profile' },
        ];
      case 'EMPLOYER':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/applications', label: 'Applications' },
          { href: '/feedback', label: 'Feedback' },
          { href: '/profile', label: 'Profile' },
        ];
      default:
        return [];
    }
  };

  // Authenticated user navigation
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold">
              Internship Portal
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {getNavLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-l border-blue-500 pl-4 ml-4">
              <span className="text-sm text-blue-100">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="ml-3 bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}