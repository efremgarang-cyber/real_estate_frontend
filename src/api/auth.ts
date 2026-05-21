import { api } from '../lib/api';
import { 
  LoginCredentials, 
  AuthResponse, 
  SuccessMessage, 
  UserProfile, 
  APIUser 
} from '../types';

// Concrete type definitions for our internal auth parameters
export interface RegisterPayload extends LoginCredentials {
  name: string;
}

export interface InitializeWorkspacePayload {
  agency_name: string;
  role: 'Admin' | 'Agent';
}

export interface WorkspaceResponse {
  profile: UserProfile;
  user?: APIUser;
}

export const authApi = {
  /**
   * Secure user login via core credentials
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/login', credentials);
    return response.data;
  },

  /**
   * Register a brand new user account directly on the API
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/register', payload);
    return response.data;
  },

  /**
   * Safe session revocation
   */
  logout: async (): Promise<SuccessMessage> => {
    const response = await api.post<SuccessMessage>('/v1/logout');
    return response.data;
  },

  /**
   * Re-verify session cookies / tokens on layout reload
   */
  getCurrentUser: async (): Promise<{ user: APIUser; profile: UserProfile | null }> => {
    const response = await api.get<{ user: APIUser; profile: UserProfile | null }>('/v1/me');
    return response.data;
  },

  /**
   * Setup initial multi-tenant agency spaces and user roles
   */
  initializeWorkspace: async (payload: InitializeWorkspacePayload): Promise<WorkspaceResponse> => {
    const response = await api.post<WorkspaceResponse>('/v1/vault/initialize-workspace', payload);
    return response.data;
  }
};