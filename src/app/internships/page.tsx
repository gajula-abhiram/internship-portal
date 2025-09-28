'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { internshipsApi } from '@/lib/api';
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

export default function InternshipsPage() {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [stipendRange, setStipendRange] = useState('');

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const data = await internshipsApi.getAll();
        setInternships(data);
        setFilteredInternships(data);
      } catch (error: any) {
        console.error('Failed to fetch internships:', error);
        // Handle authentication errors gracefully
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.log('Authentication required, but internships should be publicly accessible');
          // You could show a message or redirect to login, but internships should be public
        }
        // For now, we'll just show an empty list if there's an error
        setInternships([]);
        setFilteredInternships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  useEffect(() => {
    let filtered = internships;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(internship =>
        internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.required_skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(internship =>
        internship.eligible_departments.includes(selectedDepartment)
      );
    }

    // Type filter
    if (selectedType) {
      if (selectedType === 'internship') {
        filtered = filtered.filter(internship => !internship.is_placement);
      } else if (selectedType === 'placement') {
        filtered = filtered.filter(internship => internship.is_placement);
      }
    }

    // Stipend filter
    if (stipendRange) {
      filtered = filtered.filter(internship => {
        const min = internship.stipend_min || 0;
        const max = internship.stipend_max || 0;
        
        switch (stipendRange) {
          case '0-10000':
            return max <= 10000;
          case '10000-20000':
            return min >= 10000 && max <= 20000;
          case '20000+':
            return min >= 20000;
          default:
            return true;
        }
      });
    }

    setFilteredInternships(filtered);
  }, [internships, searchTerm, selectedDepartment, selectedType, stipendRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading internships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Available Internships & Placements
        </h1>
        <p className="text-gray-600">
          Discover exciting opportunities from leading companies in Rajasthan
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Find Your Perfect Opportunity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by title, description, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="internship">Internships</option>
              <option value="placement">Placements</option>
            </select>
          </div>

          {/* Stipend Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stipend Range
            </label>
            <select
              value={stipendRange}
              onChange={(e) => setStipendRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ranges</option>
              <option value="0-10000">₹0 - ₹10,000</option>
              <option value="10000-20000">₹10,000 - ₹20,000</option>
              <option value="20000+">₹20,000+</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('');
              setSelectedType('');
              setStipendRange('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredInternships.length} of {internships.length} opportunities
        </p>
      </div>

      {/* Internships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInternships.map((internship) => (
          <div key={internship.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {internship.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Posted by {internship.posted_by_name}
                  </p>
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    internship.is_placement 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {internship.is_placement ? 'Placement' : 'Internship'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {internship.description}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {internship.required_skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {internship.required_skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                      +{internship.required_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Departments */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Eligible Departments:</h4>
                <div className="flex flex-wrap gap-2">
                  {internship.eligible_departments.slice(0, 2).map((dept, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md"
                    >
                      {dept}
                    </span>
                  ))}
                  {internship.eligible_departments.length > 2 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                      +{internship.eligible_departments.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stipend */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Stipend:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{internship.stipend_min?.toLocaleString()} - ₹{internship.stipend_max?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/internships/${internship.id}`}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md font-medium transition-colors duration-300"
              >
                View Details & Apply
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInternships.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No internships found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or clear the filters to see all opportunities.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('');
              setSelectedType('');
              setStipendRange('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}