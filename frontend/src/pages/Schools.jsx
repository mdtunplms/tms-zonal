import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { getSchools, deleteSchool, getZonesAndDistricts } from '../services/schoolService';
import SchoolForm from '../components/schools/SchoolForm';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    school_type: ''
  });

  useEffect(() => {
    fetchSchools();
    fetchZones();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await getSchools(filters);
      setSchools(data.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await getZonesAndDistricts();
      setZones(data.data.zones);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleSearch = () => {
    fetchSchools();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await deleteSchool(id);
        fetchSchools();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting school');
      }
    }
  };

  const handleEdit = (school) => {
    setSelectedSchool(school);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSchool(null);
    fetchSchools();
  };

  const schoolTypes = ['Primary', 'Secondary', 'National', 'Provincial'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Schools</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add School
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="School name or code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
            <select
              value={filters.school_type}
              onChange={(e) => setFilters({ ...filters, school_type: e.target.value })}
              className="input-field"
            >
              <option value="">All Types</option>
              {schoolTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
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

      {/* Schools Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teachers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.school_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {school.school_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {school.school_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {school.school_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {school.zone_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {school.teacher_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(school)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(school.school_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <SchoolForm
          school={selectedSchool}
          zones={zones}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Schools;