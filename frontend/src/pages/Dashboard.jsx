import React, { useState, useEffect, useContext } from 'react';
import { FaSchool, FaUserGraduate, FaMapMarkedAlt, FaUsers } from 'react-icons/fa';
import { getDashboardStats } from '../services/schoolService';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
          <Icon className={`text-2xl ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {user?.role === 'Admin' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FaUserGraduate}
              title="Total Teachers"
              value={stats.totalTeachers}
              color="bg-blue-500"
            />
            <StatCard
              icon={FaSchool}
              title="Total Schools"
              value={stats.totalSchools}
              color="bg-green-500"
            />
            <StatCard
              icon={FaMapMarkedAlt}
              title="Districts"
              value={stats.totalDistricts}
              color="bg-purple-500"
            />
            <StatCard
              icon={FaUsers}
              title="Zones"
              value={stats.totalZones}
              color="bg-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Teachers by School Type</h3>
              {stats.teachersByType?.map((item, index) => (
                <div key={index} className="flex justify-between items-center mb-3 pb-3 border-b last:border-0">
                  <span className="text-gray-700">{item.school_type}</span>
                  <span className="font-semibold text-primary-600">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
              {stats.recentTransfers?.length > 0 ? (
                stats.recentTransfers.map((transfer, index) => (
                  <div key={index} className="mb-3 pb-3 border-b last:border-0">
                    <p className="font-medium text-gray-800">{transfer.teacher_name}</p>
                    <p className="text-sm text-gray-600">
                      {transfer.from_school} → {transfer.to_school}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transfer.transfer_date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No recent transfers</p>
              )}
            </div>
          </div>
        </>
      )}

      {user?.role === 'Principal' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            icon={FaUserGraduate}
            title="Teachers in School"
            value={stats.totalTeachers}
            color="bg-blue-500"
          />
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Teachers by Subject</h3>
            {stats.teachersBySubject?.map((item, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{item.subject_name}</span>
                <span className="font-semibold text-primary-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'Teacher' && stats?.profile && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{stats.profile.first_name} {stats.profile.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">School:</span>
              <span className="font-medium">{stats.profile.school_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subject:</span>
              <span className="font-medium">{stats.profile.subject_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Years of Service:</span>
              <span className="font-medium">{stats.profile.years_of_service} years</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;