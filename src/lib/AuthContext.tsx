import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth"; // Pointing to your dedicated frontend endpoint file
import { UserProfile, User } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  createAgencyAndProfile: (agencyName: string, role: "Admin" | "Agent") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session state from backend on mount or tab refresh
  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Leverages the clean endpoint module instead of an inline raw Axios call
        const { user: backendUser, profile: backendProfile } = await authApi.getCurrentUser();
        
        setUser(backendUser);
        setProfile(backendProfile || null);
      } catch (error) {
        console.error("Session restoration failed:", error);
        localStorage.removeItem("token");
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  // Login handler connected to your AuthenticationController
  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setProfile(data.profile || null);
    } catch (error) {
      console.error("Login sequence rejected:", error);
      throw error;
    }
  };

  // Registration handler 
  const register = async (email: string, password: string, displayName: string) => {
    try {
      // Assuming your authApi file implements a register call matching this signature
      const data = await authApi.register({ email, password, name: displayName });
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setProfile(null); // Explicitly null to trigger the "Initialize Workspace" flow
    } catch (error) {
      console.error("Registration sequence rejected:", error);
      throw error;
    }
  };

  // Revoke current session token securely
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Remote token revocation failed:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setProfile(null);
    }
  };

  // Provisioning routine for multi-tenant spaces
  const createAgencyAndProfile = async (agencyName: string, role: "Admin" | "Agent" = "Admin") => {
    if (!user) return;

    try {
      // Assuming this specialized endpoint handles initial tenancy assignment
      const data = await authApi.initializeWorkspace({
        agency_name: agencyName,
        role: role
      });

      setProfile(data.profile);
      
      // Update local user state if the backend updates user properties on workspace setup
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Workspace configuration sequence failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, createAgencyAndProfile }}>
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