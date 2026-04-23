import type { Metadata } from "next";

import "./globals.css";
import { ToastProvider } from "@/components/toast/CustomToast";
import ConditionalLayout from "./ConditionalLayout";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import StripeCleanup from "@/components/StripeCleanup";


export const metadata: Metadata = {
  title: "Direct Care | E-Commerce Platform",
  description: "Shop healthcare and wellness products online at great prices.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let categories: any[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/Categories?includeInactive=false&includeSubCategories=true&isActive=true&isDeleted=false`,
      {
        next: { revalidate: 600 }, // ⭐ FIXED — NO MORE DYNAMIC SERVER ERROR
      }
    );
    if (res.ok) {
      const json = await res.json();
     if (json?.success) {
  const items = json.data?.items || [];

  categories = items
    .filter((c: any) => !c.parentCategoryId)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
    }
  } catch (error) {
    console.error("❌ Categories API failed:", error);
  }
let deliveryStrip: any[] = [];

try {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/DeliveryStrip`,
    {
      next: { revalidate: 600 }, // same as categories ✅
    }
  );

  if (res.ok) {
    const json = await res.json();

    if (json?.success) {
      deliveryStrip = json.data
        .filter((item: any) => item.isActive && !item.isDeleted)
        .sort(
          (a: any, b: any) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        );
    }
  }
} catch (error) {
  console.error("❌ DeliveryStrip API failed:", error);
}
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap"
  rel="stylesheet"
/>
  </head>
     <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                 <StripeCleanup />
             <ConditionalLayout 
  categories={categories} 
  deliveryStrip={deliveryStrip}
>
                  {children}
                </ConditionalLayout>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
