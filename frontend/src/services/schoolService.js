import api from './api';

export const getSchools = async (params) => {
  const response = await api.get('/schools', { params });
  return response.data;
};

export const getSchool = async (id) => {
  const response = await api.get(`/schools/${id}`);
  return response.data;
};

export const createSchool = async (schoolData) => {
  const response = await api.post('/schools', schoolData);
  return response.data;
};

export const updateSchool = async (id, schoolData) => {
  const response = await api.put(`/schools/${id}`, schoolData);
  return response.data;
};

export const deleteSchool = async (id) => {
  const response = await api.delete(`/schools/${id}`);
  return response.data;
};

export const getZonesAndDistricts = async () => {
  const response = await api.get('/schools/meta/zones');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};