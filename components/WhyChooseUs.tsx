"use client";

import Image from "next/image";
import React from "react";

const reasons = [
  {
    icon: "/icons/Fast-Reliable-Delivery.webp",
    title: "Fast & Reliable Delivery",
    description: "Get your order quickly with standard or next-day delivery options",
  },
  {
    icon: "/icons/30-Day-Hassle-Free-Returns.webp",
    title: "30-Day Hassle-Free Returns",
    description: "Shop with confidence and return within 30 days if needed.",
  },
  {
    icon: "/icons/Best-Prices-Guaranteed.webp",
    title: "Best Prices Guaranteed",
    description: "Competitive pricing on all health & personal care products.",
  },
  {
    icon: "/icons/24-7-Customer-Support.webp",
    title: "Dedicated Customer Support",
    description: "Our team is available to assist you [Mon-Sat, 9 AM - 6 PM].",
  },
];

export default function WhyChooseUs() {
  return (
    <section className=" py-4 md:py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">

        {/* ✅ LEFT SIDE (Always visible) */}
        <div className="flex-1">
         <h2 className="text-3xl md:text-4xl font-semibold text-center md:text-left mb-4 md:mb-6 text-gray-800">
  Why Choose Direct Care?
</h2>

          {/* ✅ CARDS GRID → Mobile: 2 per row */}
          <div className="grid grid-cols-2 gap-4">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="bg-[#E6FFFF] rounded-xl p-3 md:p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <img
                  src={reason.icon}
                  alt={reason.title}
                  className="w-12 h-12 object-contain mb-3 rounded-lg"
                />
                <h4 className="text-sm font-semibold mb-1">{reason.title}</h4>
                <p className="text-xs text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ RIGHT IMAGE → HIDE IN MOBILE */}
        <div className="flex-1 text-center mt-2 hidden md:block">
          <img
            src="/whychoose.webp"
            alt="Direct Care"
            className="w-full max-w-[610px] h-[440px] object-cover rounded-2xl shadow-xl mx-auto"
          />
        </div>

      </div>
    </section>
  );
}
