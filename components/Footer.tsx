'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { useNewsletter } from "@/app/hooks/useNewsletter";

export default function Footer() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    inspiration: false,
    information: false,
    findus: false,
    subscribe: true,
  });

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));
  const [localError, setLocalError] = useState<string | null>(null);
  const { submitEmail, error, success } = useNewsletter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    await submitEmail(email.trim());
    setLoading(false);
    setEmail("");
  };

  return (
    <footer className="bg-black w-full text-white pt-8 pb-3 border-t border-gray-900">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-4 pb-6">

          {/* Column 1: INSPIRATION */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="mb-4">
              <Link href="/" className="inline-block bg-white px-3 py-2 rounded-xl shadow-md border border-gray-800 hover:scale-105 transition-all">
                <Image
                  src="/logo/logo.png"
                  alt="Houszy Logo"
                  width={130}
                  height={48}
                  className="h-9 w-auto object-contain"
                />
              </Link>
            </div>
            <button className="w-full flex items-center justify-between md:justify-start" onClick={() => toggle("inspiration")}>
              <h4 className="text-[16px] font-bold tracking-wider mb-0 md:mb-2.5">INSPIRATION</h4>
              <ChevronDown className={`${open.inspiration ? "rotate-180" : "rotate-0"} md:hidden transition-transform h-4 w-4`} />
            </button>
            <ul className={`text-[13px] md:text-[14px] text-gray-300 mt-2 space-y-2 ${open.inspiration ? "block" : "hidden md:block"}`}>
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>

              <li><Link href="/reviews" className="hover:text-white transition">Reviews</Link></li>
            </ul>
          </div>

          {/* Column 2: INFORMATION */}
          <div className="lg:col-span-3">
            <button className="w-full flex items-center justify-between md:justify-start" onClick={() => toggle("information")}>
              <h4 className="text-[16px] font-bold tracking-wider mb-0 md:mb-2.5">INFORMATION</h4>
              <ChevronDown className={`${open.information ? "rotate-180" : "rotate-0"} md:hidden transition-transform h-4 w-4`} />
            </button>
            <ul className={`text-[13px] md:text-[14px] text-gray-300 mt-2 space-y-2 ${open.information ? "block" : "hidden md:block"}`}>
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/refund-and-return-policy" className="hover:text-white transition">Refund and Returns Policy</Link></li>
              <li><Link href="/shipping-and-delivery" className="hover:text-white transition">Shipping and Delivery Information</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Column 3: FIND US AT */}
          <div className="lg:col-span-3">
            <button className="w-full flex items-center justify-between md:justify-start" onClick={() => toggle("findus")}>
              <h4 className="text-[16px] font-bold tracking-wider mb-0 md:mb-2.5">FIND US AT</h4>
              <ChevronDown className={`${open.findus ? "rotate-180" : "rotate-0"} md:hidden transition-transform h-4 w-4`} />
            </button>
            <div className={`text-[13px] md:text-[14px] text-white font-medium mt-2 space-y-1 ${open.findus ? "block" : "hidden md:block"}`}>
              <p>Address: Spacebox Business Park</p>
              <p>Unit 38A, Plume Street</p>
              <p>Birmingham B6 7RT</p>
              <p>United Kingdom</p>
              <p className="mt-3">Email: <a href="mailto:customersupport@houszy.co.uk" className="hover:underline font-semibold">customersupport@houszy.co.uk</a></p>
              <p>Phone: <span className="font-semibold">+44 121 461 6837</span></p>

              <div className="mt-2 inline-block">
                <a href="https://maps.app.goo.gl/2bkJtoFb5xJCUqFe9" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white font-semibold hover:text-gray-300 border-b-2 border-white pb-0.5 transition">
                  Get Direction <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: SUBSCRIBE & SAVE */}
          <div className="lg:col-span-4">
            <h3 className="text-[20px] md:text-[22px] font-semibold mb-2">Subscribe & Stay Connected</h3>
            <p className="text-[13px] md:text-[14px] text-gray-400 mb-4 leading-relaxed pr-0 md:pr-10">
              Subscribe to Our Newsletter for New Arrivals, Special Deals, Exclusive Discounts, and Exciting Product Updates.

            </p>

            <form onSubmit={handleSubscribe} className="relative mb-4 max-w-sm">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white px-4 py-2.5 rounded-full text-sm outline-none border border-transparent focus:border-gray-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1 top-1 bottom-1 bg-black text-white px-4 rounded-full text-sm font-semibold flex items-center gap-0.5 hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading ? "..." : "Subscribe"} <ArrowUpRight className="h-3 w-3" />
              </button>
            </form>

            {localError && <p className="text-xs text-red-400 -mt-3 mb-3">{localError}</p>}
            {error && <p className="text-xs text-red-400 -mt-3 mb-3">{error}</p>}
            {success && <p className="text-xs text-green-400 -mt-3 mb-3">{success}</p>}

            {/* Social Icons */}
            <div className="flex gap-3 flex-wrap">
              {[
                { name: "Facebook", icon: "/social/facebook.svg", link: "https://www.facebook.com/houszy" },
                { name: "X", icon: "/social/x.svg", link: "https://x.com/Houszy_" },
                { name: "Instagram", icon: "/social/instagram.svg", link: "https://www.instagram.com/houszy_/" },
                { name: "YouTube", icon: "/social/youtube.svg", link: "https://www.youtube.com/channel/UCPR6dSE0gCzhe-y4dzIOStA" },
                { name: "Pinterest", icon: "/social/pinterest.svg", link: "https://uk.pinterest.com/houszy_/" },
                { name: "TikTok", icon: "/social/tiktok.svg", link: "https://www.tiktok.com/@houszy__" }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-white hover:scale-105 transition-all"
                >
                  <Image
                    src={social.icon}
                    alt={social.name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Payments Strip combined */}
        <div className="pt-4 pb-2 border-t border-[#f38918] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-gray-300 font-semibold tracking-wide text-center md:text-left">
            Copyright © 2026 <span className="text-[#f39a16]">Houszy</span> Designed by <a href="https://www.mezzex.com/" target="_blank" rel="noopener noreferrer" className="text-[#f39a16] hover:underline">Mezzex</a>
          </p>
          <div className="flex items-center">
            {/* Using next/image for better performance and caching control */}
            <Image src="/payments/visa.png" unoptimized alt="Payments" width={220} height={34} className="h-7 w-auto object-contain" />
          </div>
        </div>

      </div>
    </footer>
  );
}
