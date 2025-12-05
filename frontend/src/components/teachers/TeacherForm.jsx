import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { createTeacher, updateTeacher } from '../../services/teacherService';
import { getSchools } from '../../services/schoolService';
import api from '../../services/api';

const TeacherForm = ({ teacher, onClose }) => {
  const [formData, setFormData] = useState({
    nic: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    dob: '',
    appointment_date: '',
    designation: '',
    mobile: '',
    email: '',
    appointed_subject_id: '',
    current_school_id: '',
    photo: null
  });

  const [workHistory, setWorkHistory] = useState([]);
  const [schools, setSchools] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSchools();
    fetchSubjects();
    
    if (teacher) {
      setFormData({
        ...teacher,
        photo: null
      });
    }
  }, [teacher]);

  const fetchSchools = async () => {
    try {
      const data = await getSchools({ limit: 1000 });
      setSchools(data.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/teachers/meta/subjects');
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  const addWorkHistory = () => {
    setWorkHistory([
      ...workHistory,
      { from_school_id: '', to_school_id: '', transfer_date: '', remarks: '' }
    ]);
  };

  const updateWorkHistory = (index, field, value) => {
    const updated = [...workHistory];
    updated[index][field] = value;
    setWorkHistory(updated);
  };

  const removeWorkHistory = (index) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nic) newErrors.nic = 'NIC is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.appointment_date) newErrors.appointment_date = 'Appointment date is required';
    if (!formData.appointed_subject_id) newErrors.appointed_subject_id = 'Subject is required';
    if (!formData.current_school_id) newErrors.current_school_id = 'Current school is required';
    
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (workHistory.length > 0) {
        submitData.append('work_history', JSON.stringify(workHistory));
      }

      if (teacher) {
        await updateTeacher(teacher.teacher_id, submitData);
      } else {
        await createTeacher(submitData);
      }

      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error saving teacher';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {teacher ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  className={`input-field ${errors.nic ? 'border-red-500' : ''}`}
                  disabled={!!teacher}
                />
                {errors.nic && <p className="text-red-500 text-xs mt-1">{errors.nic}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`input-field ${errors.first_name ? 'border-red-500' : ''}`}
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`input-field ${errors.last_name ? 'border-red-500' : ''}`}
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`input-field ${errors.mobile ? 'border-red-500' : ''}`}
                  placeholder="0771234567"
                />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  className={`input-field ${errors.appointment_date ? 'border-red-500' : ''}`}
                />
                {errors.appointment_date && <p className="text-red-500 text-xs mt-1">{errors.appointment_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Senior Teacher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointed Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="appointed_subject_id"
                  value={formData.appointed_subject_id}
                  onChange={handleChange}
                  className={`input-field ${errors.appointed_subject_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
                {errors.appointed_subject_id && <p className="text-red-500 text-xs mt-1">{errors.appointed_subject_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current School <span className="text-red-500">*</span>
                </label>
                <select
                  name="current_school_id"
                  value={formData.current_school_id}
                  onChange={handleChange}
                  className={`input-field ${errors.current_school_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.school_id} value={school.school_id}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
                {errors.current_school_id && <p className="text-red-500 text-xs mt-1">{errors.current_school_id}</p>}
              </div>
            </div>
          </div>

          {/* Work History */}
          {!teacher && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Work History (Optional)</h3>
                <button
                  type="button"
                  onClick={addWorkHistory}
                  className="btn-secondary flex items-center text-sm"
                >
                  <FaPlus className="mr-2" />
                  Add Previous School
                </button>
              </div>

              {workHistory.map((history, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From School</label>
                      <select
                        value={history.from_school_id}
                        onChange={(e) => updateWorkHistory(index, 'from_school_id', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select School</option>
                        {schools.map((school) => (
                          <option key={school.school_id} value={school.school_id}>
                            {school.school_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To School</label>
                      <select
                        value={history.to_school_id}
                        onChange={(e) => updateWorkHistory(index, 'to_school_id', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select School</option>
                        {schools.map((school) => (
                          <option key={school.school_id} value={school.school_id}>
                            {school.school_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Date</label>
                      <input
                        type="date"
                        value={history.transfer_date}
                        onChange={(e) => updateWorkHistory(index, 'transfer_date', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                      <input
                        type="text"
                        value={history.remarks}
                        onChange={(e) => updateWorkHistory(index, 'remarks', e.target.value)}
                        className="input-field"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeWorkHistory(index)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                  >
                    <FaTrash className="mr-1" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : teacher ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;