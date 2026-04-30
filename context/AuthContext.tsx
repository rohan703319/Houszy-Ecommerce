"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  itemsCount: number;
}
export type LoyaltyTier = "Bronze" | "Silver" | "Gold";

export interface LoyaltyPoints {
  id: string;
  userId: string;

  hasAccount: boolean;

  currentBalance: number;
  redemptionValue: number;

  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;

  tierLevel: "Bronze" | "Silver" | "Gold";

  pointsToNextTier: number;
  nextTierName?: string;

  firstOrderBonusAwarded?: boolean;
  totalReviewBonusEarned?: number;
  totalReferralBonusEarned?: number;

  lastEarnedAt?: string;
  lastRedeemedAt?: string;
    redemptionRate: number;
  redemptionRateText: string;
  minimumRedemptionPoints: number;
  maxPointsPerRedemption: number;
  maxRedemptionPercentOfOrder: number;

  pointsExpiryEnabled: boolean;
  pointsExpiryMonths: number;

  expiringPoints: {
    points: number;
    expiresAt: string;
    description?: string;
  }[];
}


interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber?: string;

  dateOfBirth?: string;
  gender?: string;

  createdAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;

  profileImageUrl?: string;
  // ✅ ADD THIS
  loyaltyPoints?: LoyaltyPoints;
  addresses?: any[];
  orders?: any[];
  totalOrders?: number;
  totalSpent?: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  profileLoading: boolean;
  isReady: boolean;
  refreshProfile: () => Promise<void>; // ✅ ADD THIS
}



const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
const [profileLoading, setProfileLoading] = useState(false);
const [isReady, setIsReady] = useState(false);
  // 🔁 Restore session
useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const storedAccess = localStorage.getItem("accessToken");
  const storedRefresh = localStorage.getItem("refreshToken");

  if (storedUser && storedAccess) {
    try {
      const payload = JSON.parse(atob(storedAccess.split(".")[1]));
      const roleKey =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const role: string | string[] = payload[roleKey] ?? "";
      const isAdmin = Array.isArray(role)
        ? role.includes("Admin")
        : role === "Admin";

      if (!isAdmin) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
      }
    } catch {}
  }

  // ✅ ALWAYS RUN
  setIsReady(true);

}, []);
const fetchProfile = async () => {
  if (!accessToken || !user?.email) return;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Customers/by-email/${encodeURIComponent(
        user.email
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) return;

    const json = await res.json();
    if (json?.success && json.data) {
      setUser(json.data);
      localStorage.setItem("user", JSON.stringify(json.data));
    }
  } catch (e) {
    console.error(e);
  }
};

useEffect(() => {
  if (!accessToken || !user?.email) return;

  const initLoad = async () => {
    setProfileLoading(true);
    await fetchProfile();
    setProfileLoading(false);
  };

  initLoad();
}, [accessToken, user?.email]);



  // 🔐 LOGIN (UNCHANGED)
 const login = async (email: string, password: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw {
      message: errorData?.message || "Invalid email or password",
    };
  }

  const data = await res.json();

  localStorage.removeItem("guestEmail");

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));

  // Restore user's saved cart session from previous logout (if any).
  // This ensures items added before logout are still present after re-login.
  const userId = data.user?.id;

  // (else: keep current anonymous sessionId — guest cart merges naturally)

  window.dispatchEvent(new CustomEvent("auth:login"));

  setUser(data.user);
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);

  // 🔥 REVIEW REDIRECT AFTER LOGIN (ADD HERE)
  try {
    const rawDraft = sessionStorage.getItem("pendingReviewDraft");

    if (rawDraft) {
      const draft = JSON.parse(rawDraft);

      if (draft?.productSlug) {
  window.location.href = `/product/${draft.productSlug}#reviews-section`;
  return;
}

    }
  } catch {
    sessionStorage.removeItem("pendingReviewDraft");
  }
};


  // 🔐 REGISTER (UNCHANGED)
  const register = async (regData: any) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw {
        errors: errorData?.errors,
        message: errorData?.message || "Registration failed",
      };
    }

    const data = await res.json();

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
  };

  // 🚪 LOGOUT
  const logout = () => {
    // Save current cart session tied to this user BEFORE removing it.
    // On next login, CartContext will restore from cart_user_{userId}.
    try {
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr)?.id : null;
      const currentCartSession = localStorage.getItem("cartSessionId");
      if (userId && currentCartSession) {
        localStorage.setItem(`cart_user_${userId}`, currentCartSession);
      }
    } catch {/* ignore */}

    // Remove cartSessionId so CartContext generates a fresh anonymous UUID
    // for any new guest session after this logout.
    localStorage.removeItem("cartSessionId");
    window.dispatchEvent(new CustomEvent("auth:logout"));

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("guestEmail");

    // Remove all pharma_ keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("pharma_")) {
        localStorage.removeItem(key);
      }
    });

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
   <AuthContext.Provider
  value={{
    user,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    isAuthenticated: !!accessToken,
    profileLoading,
    isReady,
     refreshProfile: fetchProfile, // ✅ ADD THIS
  }}
>

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
