import axios from 'axios';

const getBaseURL = (): string => {
  // For development with proxy, use relative path
  const meta: any = import.meta;
  if (meta.env && meta.env.DEV) {
    return '/api/v1';
  }
  return (meta.env && meta.env.VITE_API_URL) || 'http://localhost:8000/api/v1';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // increased timeout for payment flows
  withCredentials: false, // set to true only if using Sanctum cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);