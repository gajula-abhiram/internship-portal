'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, use } from 'react';
import { internshipsApi, applicationsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Internship {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  eligible_departments: string[];
  stipend_min: number;
  stipend_max: number;
  is_placement: boolean;
  posted_by_name: string;
  created_at: string;
}

interface InternshipDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InternshipDetailPage({ params }: InternshipDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        setLoading(true);
        const data = await internshipsApi.getById(parseInt(resolvedParams.id));
        setInternship(data);

        // Check if user has already applied
        if (user?.role === 'STUDENT') {
          try {
            const applications = await applicationsApi.getAll();
            const existingApplication = applications.find(
              (app: any) => app.internship_id === parseInt(resolvedParams.id)
            );
            setHasApplied(!!existingApplication);
          } catch (error) {
            console.error('Failed to check application status:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch internship:', error);
        router.push('/internships');
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [resolvedParams.id, user, router]);

  const handleApply = async () => {
    if (!user || user.role !== 'STUDENT') return;

    try {
      setApplying(true);
      await applicationsApi.create({ internship_id: parseInt(resolvedParams.id) });
      setHasApplied(true);
      
      // Show success message (you could use a toast library here)
      alert('Application submitted successfully! You will be notified of any updates.');
    } catch (error) {
      console.error('Failed to apply:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading internship details...</p>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Internship Not Found</h2>
          <p className="text-gray-600 mb-4">
            The internship you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            href="/internships"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Browse All Internships
          </Link>
        </div>
      </div>
    );
  }

  const isEligible = user?.role === 'STUDENT' && 
    user.department && 
    internship.eligible_departments.includes(user.department);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/internships"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Internships
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{internship.title}</h1>
              <p className="text-blue-100">Posted by {internship.posted_by_name}</p>
              <p className="text-blue-100 text-sm">
                Posted on {new Date(internship.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                internship.is_placement 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}>
                {internship.is_placement ? 'Full-Time Placement' : 'Internship'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-1">Stipend Range</h3>
              <p className="text-2xl font-bold text-green-600">
                ₹{internship.stipend_min?.toLocaleString()} - ₹{internship.stipend_max?.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">per month</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-1">Departments</h3>
              <p className="text-sm text-purple-600">
                {internship.eligible_departments.length} eligible
              </p>
              <p className="text-xs text-purple-500 mt-1">
                {internship.eligible_departments.slice(0, 2).join(', ')}
                {internship.eligible_departments.length > 2 && ` +${internship.eligible_departments.length - 2} more`}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-1">Skills Required</h3>
              <p className="text-sm text-blue-600">
                {internship.required_skills.length} skills
              </p>
              <p className="text-xs text-blue-500 mt-1">
                {internship.required_skills.slice(0, 2).join(', ')}
                {internship.required_skills.length > 2 && ` +${internship.required_skills.length - 2} more`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Opportunity</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {internship.description}
              </p>
            </div>
          </div>

          {/* Required Skills */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-3">
              {internship.required_skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Eligible Departments */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Eligible Departments</h2>
            <div className="flex flex-wrap gap-3">
              {internship.eligible_departments.map((dept, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Application Section */}
          {user?.role === 'STUDENT' && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply for This Position</h2>
              
              {!isEligible ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Not Eligible</h3>
                      <p className="text-yellow-700">
                        This internship is only available for students from: {internship.eligible_departments.join(', ')}
                      </p>
                      <p className="text-yellow-600 text-sm mt-1">
                        Your department: {user.department || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasApplied ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-green-600 text-2xl mr-3">✅</div>
                    <div>
                      <h3 className="font-semibold text-green-800">Application Submitted</h3>
                      <p className="text-green-700">
                        You have already applied for this position. Check your applications page for updates.
                      </p>
                      <Link
                        href="/applications"
                        className="text-green-600 hover:text-green-800 font-medium mt-2 inline-block"
                      >
                        View My Applications →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-2">Ready to Apply?</h3>
                      <p className="text-blue-700 mb-4">
                        Your application will be reviewed by your department mentor before being forwarded to the employer.
                      </p>
                      <div className="flex items-center text-sm text-blue-600 mb-4">
                        <span className="mr-2">📋</span>
                        <span>Make sure your profile is complete with updated skills and resume</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                        applying 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {applying ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Applying...
                        </span>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                    
                    <Link
                      href="/profile"
                      className="px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md font-semibold transition-colors duration-300"
                    >
                      Update Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-student user message */}
          {user?.role && user.role !== 'STUDENT' && (
            <div className="border-t pt-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-gray-500 text-2xl mr-3">ℹ️</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Information</h3>
                    <p className="text-gray-600">
                      Applications are only available for students. You are logged in as {user.role.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}