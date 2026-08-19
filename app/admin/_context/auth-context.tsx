"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/lib/services/auth";
import { permissionsService, Flags } from "@/lib/services/permissions";
import { usePathname } from "next/navigation";

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
  permissions: Record<string, Flags> | null;
  hasPermission: (pageKey: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Flags> | null>(null);

  const handleLogout = () => {
    // Clear React State
    setUser(null);
    setAccessToken(null);
    setPermissions(null);

    // Centralized Logout
    authService.logout();
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await authService.ensureValidToken();
        if (!token) {
          handleLogout();
          return;
        }

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
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Fetch permissions when authenticated user, token, or path changes
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!accessToken || !user) {
        setPermissions(null);
        return;
      }
      try {
        const res = await permissionsService.getMyPermissions();
        if (res.data?.success && res.data.data) {
          setPermissions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch effective permissions:", err);
      }
    };
    fetchPermissions();
  }, [accessToken, user?.id, pathname]);

  const hasPermission = (pageKey: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!user) return false;

    // SuperAdmin always has full access (not restricted)
    if (user.role?.toLowerCase() === "superadmin") {
      return true;
    }

    if (!permissions) {
      return false; // Fail closed while loading
    }

    // Case-insensitive lookup of pageKey in permissions record
    let pagePerms = permissions[pageKey];
    if (!pagePerms) {
      const foundKey = Object.keys(permissions).find(
        (k) => k.toLowerCase() === pageKey.toLowerCase()
      );
      if (foundKey) {
        pagePerms = permissions[foundKey];
      }
    }

    if (!pagePerms) return false; // Unknown page -> fail closed

    return !!pagePerms[action];
  };

  const value: AuthContextType = {
    user,
    isLoading,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    logout: handleLogout,
    permissions,
    hasPermission,
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