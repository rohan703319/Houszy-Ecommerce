"use client";

import React from "react";
import Image from "next/image";

const reasons = [
  {
    iconSrc: "/images/free-shipping.png",
    title: "FREE SHIPPING",
    desc: "We are happy to offer Standard Free Shipping on all our products.",
  },
  {
    iconSrc: "/images/premium-quality.png",
    title: "PREMIUM QUALITY",
    desc: "We are Providing premium quality products on Houszy",
  },
  {
    iconSrc: "/images/easy-returns.png",
    title: "EASY RETURNS",
    desc: "30-day returns with a hassle-free refund policy",
  },
  {
    iconSrc: "/images/money-back.png",
    title: "MONEY BACK GUARANTEE",
    desc: "We are offering 30-days Money Back Guarantee",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="w-full py-8 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12">

        {/* Heading */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-[18px] md:text-[22px] font-bold text-black -mt-[20px]">
            Why Choose Houszy?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {reasons.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">

              {/* Icon Image */}
              <div className="w-16 h-16 md:w-18 md:h-18 relative mb-3 flex items-center justify-center">
                {/* Fallback styling in case image doesn't exist yet */}
                <div className="w-full h-full relative">
                  <Image
                    src={item.iconSrc}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Title */}
              <h4 className="text-[13px] md:text-[15px] font-bold text-black uppercase mb-2 md:mb-3">
                {item.title}
              </h4>

              {/* Description */}
              <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed max-w-[280px]">
                {item.desc}
              </p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}