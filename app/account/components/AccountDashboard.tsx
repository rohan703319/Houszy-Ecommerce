"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ProfileTab from "./tabs/ProfileTab";
import OrdersTab from "./tabs/OrdersTab";
import ChangePasswordTab from "./tabs/ChangePasswordTab";
import SubscriptionsTab from "./tabs/SubscriptionsTab";
import OrderTrackingTab from "./tabs/OrderTrackingTab";
import AddressesTab from "./tabs/AddressesTab";
import LoyaltyPointsTab from "./tabs/LoyaltyPointsTab";
import SidebarButton from "./ui/SidebarButton";
import {
  User,
  Package,
  MapPin,
  KeyRound,
  Repeat,
  Truck,
  Gift,
  LogOut,
  Award
} from "lucide-react";

type Tab =
  | "profile"
  | "orders"
  | "addresses"
  | "change-password"
  | "subscriptions"
  | "tracking"
  | "loyalty";

export default function AccountDashboard() {
  const { user, logout, profileLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
const [showLogoutModal, setShowLogoutModal] = useState(false);
  // ✅ URL is the single source of truth
  const tabParam = searchParams.get("tab");

  const validTabs: Tab[] = [
    "profile",
    "orders",
    "addresses",
    "change-password",
    "subscriptions",
    "tracking",
    "loyalty",
  ];

  const activeTab: Tab = validTabs.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "profile";

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your account…
      </div>
    );
  }

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` || "U";

  const goToTab = (tab: Tab) => {
    router.push(`/account?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] py-2">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-xl font-semibold mb-2">My Account</h1>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* LEFT SIDEBAR — vertical on desktop, horizontal scroll on mobile */}
          <div className="col-span-12 md:col-span-3">
            {/* Mobile: horizontal scrollable tabs */}
            <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {(["profile","orders","subscriptions","tracking","change-password","addresses","loyalty"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => goToTab(tab)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition
                    ${activeTab === tab ? "bg-[#445D41] text-white border-[#445D41]" : "bg-white text-gray-600 border-gray-300"}`}
                >
                  {tab === "profile" ? "Profile" : tab === "orders" ? "Orders" : tab === "subscriptions" ? "Subscriptions" : tab === "tracking" ? "Tracking" : tab === "change-password" ? "Password" : tab === "addresses" ? "Addresses" : "Loyalty"}
                </button>
              ))}
              <button
               onClick={() => setShowLogoutModal(true)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border border-red-300 bg-white text-red-600"
              >
                Logout
              </button>
            </div>
            {/* Desktop: vertical sidebar */}
            <div className="hidden md:block sticky top-24">
              <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
                <SidebarButton active={activeTab === "profile"} onClick={() => goToTab("profile")}><User size={18} /> My Profile</SidebarButton>
                <SidebarButton active={activeTab === "orders"} onClick={() => goToTab("orders")}><Package size={18} /> My Orders</SidebarButton>
                <SidebarButton active={activeTab === "subscriptions"} onClick={() => goToTab("subscriptions")}><Repeat size={18} /> Subscriptions</SidebarButton>
                <SidebarButton active={activeTab === "tracking"} onClick={() => goToTab("tracking")}><Truck size={18} /> Order Tracking</SidebarButton>
                <SidebarButton active={activeTab === "change-password"} onClick={() => goToTab("change-password")}><KeyRound size={18} /> Change Password</SidebarButton>
                <SidebarButton active={activeTab === "addresses"} onClick={() => goToTab("addresses")}><MapPin size={18} /> Saved Addresses</SidebarButton>
                <SidebarButton active={activeTab === "loyalty"} onClick={() => goToTab("loyalty")}><Award size={18} /> Loyalty Points</SidebarButton>
                <hr />
               <SidebarButton danger onClick={() => setShowLogoutModal(true)}>
  <LogOut size={18} /> Logout
</SidebarButton>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="col-span-12 md:col-span-9">
            {activeTab === "profile" && (
              <ProfileTab user={user} initials={initials} />
            )}

            {activeTab === "orders" && (
              <OrdersTab orders={user.orders ?? []} />
            )}

            {activeTab === "subscriptions" && <SubscriptionsTab />}

            {activeTab === "tracking" && <OrderTrackingTab />}

            {activeTab === "change-password" && <ChangePasswordTab />}

          {activeTab === "addresses" && <AddressesTab />}

          {activeTab === "loyalty" && (
  <LoyaltyPointsTab loyalty={user.loyaltyPoints} />
)}


          </div>
        </div>
      </div>
{showLogoutModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">

      {/* Header */}
      <div className="bg-[#445D41] px-6 py-4">
        <h2 className="text-white text-lg font-semibold">
          Confirm Logout
        </h2>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to logout from your account?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              logout();
              router.replace("/account");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

    </div>
  </div>
)}
    </div>
  );
}
