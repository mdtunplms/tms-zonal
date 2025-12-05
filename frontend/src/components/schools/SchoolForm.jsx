import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createSchool, updateSchool } from '../../services/schoolService';

const SchoolForm = ({ school, zones, onClose }) => {
  const [formData, setFormData] = useState({
    school_code: '',
    school_name: '',
    zone_id: '',
    address: '',
    school_type: 'Primary'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (school) {
      setFormData({
        school_code: school.school_code,
        school_name: school.school_name,
        zone_id: school.zone_id,
        address: school.address || '',
        school_type: school.school_type
      });
    }
  }, [school]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.school_code) newErrors.school_code = 'School code is required';
    if (!formData.school_name) newErrors.school_name = 'School name is required';
    if (!formData.zone_id) newErrors.zone_id = 'Zone is required';
    if (!formData.school_type) newErrors.school_type = 'School type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      if (school) {
        await updateSchool(school.school_id, formData);
      } else {
        await createSchool(formData);
      }
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error saving school';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const schoolTypes = ['Primary', 'Secondary', 'National', 'Provincial'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {school ? 'Edit School' : 'Add New School'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="school_code"
                value={formData.school_code}
                onChange={handleChange}
                className={`input-field ${errors.school_code ? 'border-red-500' : ''}`}
                disabled={!!school}
              />
              {errors.school_code && <p className="text-red-500 text-xs mt-1">{errors.school_code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleChange}
                className={`input-field ${errors.school_name ? 'border-red-500' : ''}`}
              />
              {errors.school_name && <p className="text-red-500 text-xs mt-1">{errors.school_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Type <span className="text-red-500">*</span>
              </label>
              <select
                name="school_type"
                value={formData.school_type}
                onChange={handleChange}
                className={`input-field ${errors.school_type ? 'border-red-500' : ''}`}
              >
                {schoolTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.school_type && <p className="text-red-500 text-xs mt-1">{errors.school_type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone <span className="text-red-500">*</span>
              </label>
              <select
                name="zone_id"
                value={formData.zone_id}
                onChange={handleChange}
                className={`input-field ${errors.zone_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.zone_name} - {zone.district_name}
                  </option>
                ))}
              </select>
              {errors.zone_id && <p className="text-red-500 text-xs mt-1">{errors.zone_id}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
                rows="3"
              />
            </div>
          </div>

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
              {loading ? 'Saving...' : school ? 'Update School' : 'Add School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolForm;