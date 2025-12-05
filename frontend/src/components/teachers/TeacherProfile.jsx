import React, { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { getTeacher } from '../../services/teacherService';
import { format } from 'date-fns';

const TeacherProfile = ({ teacherId, onClose }) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacher();
  }, [teacherId]);

  const fetchTeacher = async () => {
    try {
      const data = await getTeacher(teacherId);
      setTeacher(data.data);
    } catch (error) {
      console.error('Error fetching teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Teacher Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-start mb-6 pb-6 border-b">
            <img
              src={teacher.photo_url || 'https://via.placeholder.com/150'}
              alt={teacher.first_name}
              className="w-32 h-32 rounded-full object-cover mr-6"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {teacher.first_name} {teacher.last_name}
              </h3>
              <p className="text-lg text-gray-600 mb-2">{teacher.designation}</p>
              <p className="text-gray-600 mb-1">
                <strong>Subject:</strong> {teacher.subject_name}
              </p>
              <p className="text-gray-600">
                <strong>Current School:</strong> {teacher.current_school_name}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">NIC</label>
                <p className="font-medium">{teacher.nic}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <p className="font-medium">{teacher.gender}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Date of Birth</label>
                <p className="font-medium">
                  {teacher.dob ? format(new Date(teacher.dob), 'MMMM dd, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Appointment Date</label>
                <p className="font-medium">
                  {format(new Date(teacher.appointment_date), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h4>
            <div className="space-y-2">
              {teacher.mobile && (
                <div className="flex items-center">
                  <FaPhone className="mr-3 text-gray-500" />
                  <span>{teacher.mobile}</span>
                </div>
              )}
              {teacher.email && (
                <div className="flex items-center">
                  <FaEnvelope className="mr-3 text-gray-500" />
                  <span>{teacher.email}</span>
                </div>
              )}
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-3 text-gray-500" />
                <span>{teacher.zone_name}, {teacher.district_name}</span>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Service Information</h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Total Years of Service</label>
                  <p className="text-2xl font-bold text-primary-600">{teacher.total_years} years</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">School Code</label>
                  <p className="font-medium">{teacher.school_code}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Work History */}
          {teacher.work_history && teacher.work_history.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                <FaBriefcase className="mr-2" />
                Work History
              </h4>
              <div className="space-y-3">
                {teacher.work_history.map((history, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-gray-800">
                          {history.from_school} → {history.to_school}
                        </p>
                        <p className="text-sm text-gray-600">
                          Transfer Date: {format(new Date(history.transfer_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    {history.remarks && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Remarks:</strong> {history.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;