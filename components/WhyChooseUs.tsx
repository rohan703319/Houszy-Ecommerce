"use client";

import React from "react";
import { Truck, RotateCcw, PoundSterling, Headset } from "lucide-react";

const reasons = [
  {
    icon: Truck,
    title: "Fast & Reliable Delivery",
    desc: "Get your order quickly with standard or next-day delivery options",
    color: "from-[#445D41] to-[#2A3F28]",
    shadow: "shadow-[#445D41]/30",
  },
  {
    icon: RotateCcw,
    title: "30-Day Hassle-Free Returns",
    desc: "Shop with confidence and return within 30 days if needed.",
    color: "from-[#445D41] to-black",
    shadow: "shadow-[#445D41]/40",
  },
  {
    icon: PoundSterling,
    title: "Best Prices Guaranteed",
    desc: "Competitive pricing on all health & personal care products.",
    color: "from-[#445D41] to-[#2A3F28]",
    shadow: "shadow-[#445D41]/30",
  },
  {
    icon: Headset,
    title: "Dedicated Customer Support",
    desc: "Our team is available to assist you [Mon-Sat, 9 AM - 6 PM].",
    color: "from-[#445D41] to-black",
    shadow: "shadow-[#445D41]/40",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="pt-8 pb-12 md:pt-10 md:pb-16 bg-[#F3F4F6] border-y border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4">

        {/* ✅ HEADING (Moved higher) */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
            Why Choose <span className="text-[#445D41]">Direct Care?</span>
          </h2>
        </div>

        {/* ✅ BALANCED HORIZONTAL GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white p-5 md:p-6 rounded-2xl border border-gray-100 hover:border-white shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden flex items-start gap-4"
              >
                {/* Icon Container - Balanced Side Aligned */}
                <div className={`relative w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shrink-0 shadow-md ${item.shadow} transform group-hover:scale-105 transition-all duration-500`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4 className="text-[15px] md:text-base font-bold text-gray-900 leading-snug group-hover:text-[#445D41] transition-colors duration-300">
                    {item.title}
                  </h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed mt-1.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
