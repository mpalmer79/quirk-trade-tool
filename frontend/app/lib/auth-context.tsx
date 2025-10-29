"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "./auth-types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem("quirk_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Convert date strings back to Date objects
          parsedUser.createdAt = new Date(parsedUser.createdAt);
          parsedUser.updatedAt = new Date(parsedUser.updatedAt);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem("quirk_user");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    // For now, this is a mock implementation
    try {
      // Simulate API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const userData = await response.json();
      
      // Convert date strings to Date objects
      userData.createdAt = new Date(userData.createdAt);
      userData.updatedAt = new Date(userData.updatedAt);
      
      setUser(userData);
      localStorage.setItem("quirk_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // TODO: Call logout API endpoint
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("quirk_user");
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      setUser(updatedUser);
      localStorage.setItem("quirk_user", JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for requiring authentication
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login page
      window.location.href = "/login";
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
