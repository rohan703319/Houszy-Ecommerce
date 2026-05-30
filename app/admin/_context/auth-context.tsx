"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/lib/services/auth";

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  accessToken: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("authToken");

        const storedUserData =
          localStorage.getItem("userData");

        setAccessToken(token);

        if (storedUserData) {
          const userData = JSON.parse(storedUserData);

          setUser({
            id: userData.id,

            firstName:
              userData.firstName || "",

            lastName:
              userData.lastName || "",

            email:
              userData.email ||
              localStorage.getItem(
                "userEmail"
              ) ||
              "",

            role:
              userData.role || "admin",

            permissions:
              userData.permissions || [],
          });
        } else {
          const email =
            localStorage.getItem(
              "userEmail"
            );

          if (email) {
            setUser({
              email,

              firstName:
                localStorage.getItem(
                  "userFirstName"
                ) || "",

              lastName:
                localStorage.getItem(
                  "userLastName"
                ) || "",

              role: "admin",
            });
          }
        }
      } catch (error) {
        console.error(
          "Error loading user data:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {

    // Clear React State
    setUser(null);

    setAccessToken(null);

    // Centralized Logout
    authService.logout();
  };

  const value: AuthContextType = {
    user,

    isLoading,

    accessToken,

    isAuthenticated:
      !!user && !!accessToken,

    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
};