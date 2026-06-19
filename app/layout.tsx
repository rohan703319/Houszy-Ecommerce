import type { Metadata } from "next";
import { Lato } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { ToastProvider } from "@/components/toast/CustomToast";
import ConditionalLayout from "./ConditionalLayout";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import StripeCleanup from "@/components/StripeCleanup";
import { GTM_ID } from "@/lib/analytics";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: {
    default: "Houszy | Shop Kitchenware, Fitness, Homeware & More",
    template: "%s | Houszy",
  },
  description: "Shop kitchenware, fitness equipment, homeware, household essentials, toys & games at Houszy UK. Free standard delivery on all products.",
  keywords: ["kitchenware", "fitness equipment", "homeware", "household", "toys", "games", "UK", "Houszy"],
  openGraph: {
    title: "Houszy | Shop Kitchenware, Fitness, Homeware & More",
    description: "Shop kitchenware, fitness equipment, homeware, household essentials, toys & games at Houszy UK. Free standard delivery on all products.",
    type: "website",
    locale: "en_GB",
    siteName: "Houszy",
  },
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
        next: { revalidate: 600 },
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
        next: { revalidate: 600 },
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
    <html lang="en" className={lato.variable} suppressHydrationWarning>
      <body className={lato.className} suppressHydrationWarning>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
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
