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
  LogOut,
  Award,
  ChevronRight,
  Menu,
} from "lucide-react";

type Tab =
  | "profile"
  | "orders"
  | "addresses"
  | "change-password"
  | "subscriptions"
  | "tracking"
  | "loyalty";

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: "profile", label: "My Profile", icon: <User size={18} /> },
  { tab: "orders", label: "My Orders", icon: <Package size={18} /> },
  { tab: "subscriptions", label: "Subscriptions", icon: <Repeat size={18} /> },
  { tab: "tracking", label: "Order Tracking", icon: <Truck size={18} /> },
  { tab: "change-password", label: "Change Password", icon: <KeyRound size={18} /> },
  { tab: "addresses", label: "Saved Addresses", icon: <MapPin size={18} /> },
  { tab: "loyalty", label: "Loyalty Points", icon: <Award size={18} /> },
];

export default function AccountDashboard() {
  const { user, logout, profileLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabParam = searchParams.get("tab");
  const validTabs: Tab[] = [
    "profile", "orders", "addresses", "change-password",
    "subscriptions", "tracking", "loyalty",
  ];

  const activeTab: Tab = validTabs.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "profile";

  if (profileLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#f38918] border-t-transparent rounded animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Loading Dashboard…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const goToTab = (tab: Tab) => {
    router.push(`/account?tab=${tab}`);
    setMobileMenuOpen(false);
  };

  const activeNavItem = NAV_ITEMS.find((n) => n.tab === activeTab);

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* UNIFIED APP LAYOUT */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[75vh]">

          {/* MOBILE HEADER */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-[#f38918] to-orange-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{activeNavItem?.label}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-gray-50 rounded text-gray-600 border border-gray-200"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* SIDEBAR (DESKTOP + MOBILE DROPDOWN) */}
          <aside className={`
            ${mobileMenuOpen ? "block" : "hidden"} 
            md:block md:w-72 flex-shrink-0 bg-gray-50/50 border-r border-gray-100
          `}>


            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map(({ tab, label, icon }) => (
                <SidebarButton
                  key={tab}
                  active={activeTab === tab}
                  onClick={() => goToTab(tab)}
                >
                  {icon}
                  {label}
                </SidebarButton>
              ))}

              <div className="h-px bg-gray-200 my-4 mx-2" />

              <SidebarButton danger onClick={() => setShowLogoutModal(true)}>
                <LogOut size={18} />
                Sign Out
              </SidebarButton>
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 bg-white relative overflow-x-hidden">
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto h-full">
              {activeTab === "profile" && <ProfileTab user={user} initials={initials} />}
              {activeTab === "orders" && <OrdersTab orders={user.orders ?? []} />}
              {activeTab === "subscriptions" && <SubscriptionsTab />}
              {activeTab === "tracking" && <OrderTrackingTab />}
              {activeTab === "change-password" && <ChangePasswordTab />}
              {activeTab === "addresses" && <AddressesTab />}
              {activeTab === "loyalty" && <LoyaltyPointsTab loyalty={user.loyaltyPoints} />}
            </div>
          </main>
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Ready to leave?</h2>
              <p className="text-sm font-medium text-gray-500 mt-2">You will need to sign in again to access your account dashboard and order history.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 text-sm font-bold rounded border-2 border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  router.replace("/account");
                }}
                className="flex-1 py-3 text-sm font-bold rounded bg-black text-white hover:bg-gray-900 transition-colors shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
