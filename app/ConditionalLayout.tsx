"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import { captureAttribution } from "@/lib/attribution";

export default function ConditionalLayout({
  children,
  categories,
  deliveryStrip,
}: {
  children: React.ReactNode;
  categories: any[];
  deliveryStrip: any[];
}) {
  const pathname = usePathname();

  // Capture UTM/Attribution parameters on navigation
  useEffect(() => {
    captureAttribution();
  }, [pathname]);

  // Routes jahan Header/Footer NAHI chahiye
  const hideLayoutRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/onboarding",
    "/payment-success",
    "/payment-failed"
  ];

  // ✅ Admin routes ko completely exclude karo
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = hideLayoutRoutes.includes(pathname);

  const hideLayout = isAdminRoute || isAuthRoute;

  // ✅ Admin ya Auth routes par Header/Footer NAHI dikhega
  if (hideLayout) {
    return <>{children}</>;
  }

  // ✅ Main site par Header + Footer dikhega with proper spacing
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        ssrCategories={categories}
        deliveryStrip={deliveryStrip}
      />

      {/* main will push footer to bottom */}
      <main className="flex-1" style={{ paddingTop: "calc(var(--header-height) - 5px)" }}>
        {children}
      </main>

      <Footer />
      <ScrollToTop />
      <CookieConsent />
    </div>
  );

}
