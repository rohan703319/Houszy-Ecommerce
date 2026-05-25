"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/account"); // protect route
    }
  }, [isAuthenticated, router]);

  if (!user) return null; // while checking redirect

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          My Account
        </h1>

        <div className="bg-white rounded-2xl shadow-lg px-8 py-10 border border-gray-200">

          <div className="flex items-center gap-5 mb-6">
            <div className="h-16 w-16 rounded-full bg-[#f38918] text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </div>

            <div>
              <p className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-gray-600 text-sm mt-1">{user.email}</p>
              <p className="text-gray-600 text-sm">{user.phoneNumber}</p>
            </div>
          </div>

          <hr className="my-6" />

          {/* Account Sections */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-100 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">Email Address</p>
              <p className="text-gray-900 font-semibold mt-1">{user.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-100 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">Phone Number</p>
              <p className="text-gray-900 font-semibold mt-1">{user.phoneNumber}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="mt-8 w-full py-4 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

}
