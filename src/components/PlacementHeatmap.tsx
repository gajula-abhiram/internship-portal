'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Department {
  department: string;
  total_students: number;
  placed_students: number;
  interning_students: number;
  placement_percentage: number;
  heat_score: number;
  trend: 'up' | 'down' | 'stable';
  recent_placements: number;
}

interface HeatmapData {
  departments: Department[];
  overall_stats: {
    total_students: number;
    total_placed: number;
    overall_placement_rate: number;
    active_companies: number;
  };
  real_time_updates: {
    last_updated: string;
    recent_activities: Array<{
      type: string;
      student_name: string;
      company: string;
      department: string;
      timestamp: string;
    }>;
  };
}

export function PlacementHeatmap() {
  const { token } = useAuth();
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchHeatmapData();
      const interval = setInterval(fetchHeatmapData, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch('/api/placement/heatmap?action=full', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch heatmap data');

      const data = await response.json();
      setHeatmapData(data.data);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHeatColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          No placement data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {heatmapData.overall_stats.total_students}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {heatmapData.overall_stats.total_placed}
            </div>
            <div className="text-sm text-gray-600">Placed Students</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {heatmapData.overall_stats.overall_placement_rate}%
            </div>
            <div className="text-sm text-gray-600">Placement Rate</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {heatmapData.overall_stats.active_companies}
            </div>
            <div className="text-sm text-gray-600">Active Companies</div>
          </div>
        </div>
      </div>

      {/* Department Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Department-wise Placement Heatmap</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>High (80%+)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium (60-79%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Low (40-59%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Critical (&lt;40%)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {heatmapData.departments.map((dept) => (
            <div
              key={dept.department}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDepartment === dept.department
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDepartment(
                selectedDepartment === dept.department ? null : dept.department
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {dept.department}
                </h3>
                <span className="text-lg">{getTrendIcon(dept.trend)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Placement Rate</span>
                  <span className="font-semibold text-sm">
                    {dept.placement_percentage}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getHeatColor(dept.heat_score)}`}
                    style={{ width: `${dept.placement_percentage}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-600">Total</div>
                    <div className="font-semibold">{dept.total_students}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Placed</div>
                    <div className="font-semibold text-green-600">
                      {dept.placed_students}
                    </div>
                  </div>
                </div>
                
                {dept.recent_placements > 0 && (
                  <div className="text-xs text-blue-600 font-medium">
                    +{dept.recent_placements} this month
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Placement Activities</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Updates</span>
          </div>
        </div>

        <div className="space-y-3">
          {heatmapData.real_time_updates.recent_activities.slice(0, 8).map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 py-2 border-b border-gray-100 last:border-b-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'placement' ? 'bg-green-500' : 
                activity.type === 'internship' ? 'bg-blue-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {activity.student_name}
                  </span>
                  <span className="text-gray-600">
                    {activity.type === 'placement' ? 'got placed at' : 'applied to'}
                  </span>
                  <span className="font-medium text-blue-600">
                    {activity.company}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {activity.department} • {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Details Modal/Panel */}
      {selectedDepartment && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {selectedDepartment} - Detailed View
            </h2>
            <button
              onClick={() => setSelectedDepartment(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {heatmapData.departments.find(d => d.department === selectedDepartment)?.total_students || 0}
              </div>
              <div className="text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {heatmapData.departments.find(d => d.department === selectedDepartment)?.placed_students || 0}
              </div>
              <div className="text-gray-600">Placed Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {heatmapData.departments.find(d => d.department === selectedDepartment)?.placement_percentage || 0}%
              </div>
              <div className="text-gray-600">Placement Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}