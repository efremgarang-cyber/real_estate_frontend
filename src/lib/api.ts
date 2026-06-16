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
  timeout: 60000, 
  withCredentials: false, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('makao_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Catch dead tokens smartly
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // 1. Destroy the dead token silently
      localStorage.removeItem('makao_token');
      localStorage.removeItem('makao_user');
      
      // 2. Check if the user is currently inside a protected portal
      const currentPath = window.location.pathname;
      const isProtectedArea = currentPath.startsWith('/agent') || currentPath.startsWith('/admin');

      // 3. ONLY redirect to login if they are in a protected area
      if (isProtectedArea) {
        window.dispatchEvent(new CustomEvent('session-expired'));
        window.location.href = '/auth/login'; 
      }
      
      // If they are on the landing page ('/') or public properties page, 
      // do nothing. Let them keep browsing as a guest.
    }
    
    return Promise.reject(error);
  }
);