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
  const token = localStorage.getItem('makao_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Catch dead tokens globally
api.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the response
    return response;
  },
  (error) => {
    // If Laravel throws a 401 Unauthorized, the token has expired or is invalid
    if (error.response && error.response.status === 401) {
      
      // 1. Destroy the dead token
      localStorage.removeItem('makao_token');
      localStorage.removeItem('makao_user');
      
      // 2. Prevent infinite redirect loops if they are already on the login page
      if (window.location.pathname !== '/login') {
        // Optional: Dispatch a custom event to trigger a toast notification saying "Session Expired"
        window.dispatchEvent(new CustomEvent('session-expired'));
        
        // 3. Kick them to the login screen
        window.location.href = '/login'; 
      }
    }
    
    return Promise.reject(error);
  }
);