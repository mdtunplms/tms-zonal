import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { getTeachers, deleteTeacher } from '../services/teacherService';
import { getSchools } from '../services/schoolService';
import TeacherForm from '../components/teachers/TeacherForm';
import TeacherProfile from '../components/teachers/TeacherProfile';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    school_id: '',
    min_years: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchSchools();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await getTeachers(filters);
      setTeachers(data.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const data = await getSchools({ limit: 1000 });
      setSchools(data.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleSearch = () => {
    fetchTeachers();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteTeacher(id);
        fetchTeachers();
      } catch (error) {
        alert('Error deleting teacher');
      }
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowProfile(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTeacher(null);
    fetchTeachers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Teachers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Name or NIC..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
            <select
              value={filters.school_id}
              onChange={(e) => setFilters({ ...filters, school_id: e.target.value })}
              className="input-field"
            >
              <option value="">All Schools</option>
              {schools.map((school) => (
                <option key={school.school_id} value={school.school_id}>
                  {school.school_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Years in Current School</label>
            <input
              type="number"
              placeholder="Years..."
              value={filters.min_years}
              onChange={(e) => setFilters({ ...filters, min_years: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="btn-primary w-full flex items-center justify-center"
            >
              <FaSearch className="mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Teachers List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.teacher_id} className="card">
              <div className="flex items-start">
                <img
                  src={teacher.photo_url || 'https://via.placeholder.com/100'}
                  alt={teacher.first_name}
                  className="w-20 h-20 rounded-full object-cover mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {teacher.first_name} {teacher.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{teacher.subject_name}</p>
                  <p className="text-sm text-gray-600">{teacher.current_school_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {teacher.years_in_current_school} years at current school
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => handleView(teacher)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEdit(teacher)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(teacher.teacher_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TeacherForm
          teacher={selectedTeacher}
          onClose={handleFormClose}
        />
      )}

      {showProfile && selectedTeacher && (
        <TeacherProfile
          teacherId={selectedTeacher.teacher_id}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default Teachers;