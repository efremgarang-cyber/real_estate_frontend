import { api } from '../lib/api';
import {
  LoginCredentials,
  AuthResponse,
  SuccessMessage,
  UserProfile,
  User,
} from '../types';

export interface RegisterPayload extends LoginCredentials {
  name: string;
  agency_code: string;
}

export interface InitializeWorkspacePayload {
  agency_name: string;
  role: 'Admin' | 'Agent';
}

export interface WorkspaceResponse {
  profile: UserProfile;
  user?: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/login', credentials);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/register', payload);
    return response.data;
  },

  logout: async (): Promise<SuccessMessage> => {
    const response = await api.post<SuccessMessage>('/v1/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User; profile: UserProfile | null }> => {
    const response = await api.get<{ user: User; profile: UserProfile | null }>('/v1/me');
    return response.data;
  },

  // Creates a new agency — for users who land in limbo and choose "Create New"
  initializeWorkspace: async (payload: InitializeWorkspacePayload): Promise<WorkspaceResponse> => {
    const response = await api.post<WorkspaceResponse>('/v1/vault/initialize-workspace', payload);
    return response.data;
  },

  // Joins an existing agency via join code — for limbo users who choose "Join Existing"
  joinAgency: async (joinCode: string): Promise<WorkspaceResponse> => {
    const response = await api.post<WorkspaceResponse>('/v1/agency/join', { join_code: joinCode });
    return response.data;
  },
};