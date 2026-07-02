import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, LoginResult } from "../api/auth";
import { UserProfile, User } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
  register: (email: string, password: string, displayName: string, agencyCode: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  createAgencyAndProfile: (agencyName: string, role: "Admin" | "Agent") => Promise<void>;
  joinAgency: (joinCode: string) => Promise<void>;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session on mount or tab refresh
  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem("makao_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: backendUser, profile: backendProfile } = await authApi.getCurrentUser();
        setUser(backendUser);
        setProfile(backendProfile || null);
      } catch (error) {
        console.error("Session restoration failed:", error);
        localStorage.removeItem("makao_token");
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const login = async (
    email: string, 
    password: string, 
    remember: boolean
  ): Promise<LoginResult> => { // Use the interface
    try {
      const data = await authApi.login({ email, password, remember });

      if (data.status === '2fa_required') {
        // TypeScript is happy now because email is optional in LoginResult
        return { requires2FA: true, email: data.email };
      }

      // Standard Login
      if (data.token && data.user) {
        localStorage.setItem("makao_token", data.token);
        setUser(data.user);
        setProfile(data.profile || null);
        
        // matches LoginResult interface
        return { requires2FA: false, success: true }; 
      }
      
      throw new Error("Invalid response format from server");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // agencyCode is validated server-side against agencies.join_code
  const register = async (
    email: string,
    password: string,
    displayName: string,
    agencyCode: string,
    role?: string
  ) => {
    try {
      const data = await authApi.register({
        email,
        password,
        name: displayName,
        agency_code: agencyCode,
        role: role 
      });

      // 1. Validate mandatory fields using a guard
      if (!data.token || !data.user) {
        throw new Error("Registration succeeded, but the server returned an incomplete user profile.");
      }

      // 2. Safely set states with fallbacks
      localStorage.setItem("makao_token", data.token);
      
      // Explicitly handle the 'data.user' to ensure it's not undefined
      setUser(data.user); 
      
      // Fallback to null if profile is undefined/missing
      setProfile(data.profile ?? null); 
      
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Remote token revocation failed:", error);
    } finally {
      localStorage.removeItem("makao_token");
      setUser(null);
      setProfile(null);
    }
  };

  // For users who land in the limbo state — creates a new agency and assigns them as Admin
  const createAgencyAndProfile = async (agencyName: string, role: "Admin" | "Agent" = "Admin") => {
    if (!user) return;
    try {
      const data = await authApi.initializeWorkspace({ agency_name: agencyName, role });
      setProfile(data.profile);
      if (data.user) setUser(data.user);
    } catch (error) {
      console.error("Workspace initialization failed:", error);
      throw error;
    }
  };

  // For users in limbo who want to join an existing agency via code
  const joinAgency = async (joinCode: string) => {
    if (!user) return;
    try {
      const data = await authApi.joinAgency(joinCode);
      setProfile(data.profile);
      if (data.user) setUser(data.user);
    } catch (error) {
      console.error("Agency join failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      login, register, logout,
      createAgencyAndProfile, joinAgency,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};