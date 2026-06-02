import axios from 'axios';

const getBaseURL = (): string => {
  try {
    return (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
  } catch {
    return 'http://localhost:8000/api/v1';
  }
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: true, // <--- CRITICAL for Sanctum cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
// Interceptor to inject the Sanctum token since your payment routes are guarded
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});