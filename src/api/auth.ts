import { api } from '../lib/api';
import {
  LoginCredentials,
  RegisterPayload,
  AuthResponse,
  SuccessMessage,
  UserProfile,
  User,
} from '../types';


export interface LoginResult {
  requires2FA: boolean;
  email?: string;
  success?: boolean;
}

export interface InitializeWorkspacePayload {
  agency_name: string;
  role: 'Admin' | 'Agent';
}

export interface WorkspaceResponse {
  profile: UserProfile;
  user?: User;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  bio?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/login', credentials);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', payload);
    return response.data;
  },

  logout: async (): Promise<SuccessMessage> => {
    const response = await api.post<SuccessMessage>('/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User; profile: UserProfile | null }> => {
    const response = await api.get<{ user: User; profile: UserProfile | null }>('/me');
    return response.data;
  },

  // NEW: Sends profile updates back to the backend
  updateProfile: async (payload: UpdateProfilePayload): Promise<{ success: boolean; user: User; profile: UserProfile }> => {
    const response = await api.put<{ success: boolean; user: User; profile: UserProfile }>('/me', payload);
    return response.data;
  },

  initializeWorkspace: async (payload: InitializeWorkspacePayload): Promise<WorkspaceResponse> => {
    const response = await api.post<WorkspaceResponse>('/v1/vault/initialize-workspace', payload);
    return response.data;
  },

  joinAgency: async (joinCode: string): Promise<WorkspaceResponse> => {
    const response = await api.post<WorkspaceResponse>('/v1/agency/join', { join_code: joinCode });
    return response.data;
  },
};