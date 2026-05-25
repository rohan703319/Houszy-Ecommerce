import React from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Us | Houszy",
  description: "Learn about Houszy's mission to transform houses into homes with thoughtfully crafted essentials.",
};

export default function AboutUsPage() {
  return (
    <main className="bg-white min-h-screen pt-10 pb-10">
      <div className="max-w-7xl mx-auto px-4">

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-black text-black mb-6 text-center leading-tight">
          Houszy - Where Every Corner Tells a Story
        </h1>

        {/* Hero Section with Overlapping Text */}
        <div className="relative mb-10 md:mb-32 max-w-6xl mx-auto">
          {/* Hero Banner */}
          <div className="w-full relative aspect-[16/9] md:aspect-[21/9]">
            <Image
              src="/about1.webp"
              alt="Houszy Banner"
              fill
              className="object-contain md:object-cover"
            />
          </div>

          {/* Intro Paragraph (Overlapping) */}
          <div className="static bg-[#fffdf8] md:absolute md:bottom-[-55px] md:-right-20 bg-[#fffdfb] w-full md:w-[85%] lg:w-[80%] p-6 md:p-6 z-10 ">
            <p className="text-gray-600 text-sm leading-[2] text-center md:text-left">
              For the past two years, we have been on a mission to transform houses into homes, one exceptional piece at a time. We believe that the essence of a home lies in the harmony of its surroundings. This is why <strong className="text-gray-800">HOUSZY</strong> is not just a houseware brand, it is a steward of comfort, champion of functionality, and provider of style.
            </p>
          </div>
        </div>

        {/* Our Mission Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center mb-32">
          <div className="order-2 md:order-1">
            <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase mb-6 text-black">
              OUR MISSION
            </h2>
            <p className="text-gray-600 text-[15px] md:text-[17px] leading-[1.8]">
              <strong className="text-gray-800">Houszy</strong> aims to improve your living space with thoughtfully crafted essentials that reflect your personality and enhance your everyday experiences. From the moment you step into your kitchen to prepare a hearty meal, to the joyful comfort of sinking into your favourite armchair at the end of a long day, Houszy is there, smoothly blending into your lifestyle, making every moment at home a delight.
            </p>
          </div>
          <div className="order-1 md:order-2 relative aspect-square w-full max-w-lg mx-auto">
            <Image
              src="/about2.webp"
              alt="Our Mission"
              fill
              className="object-contain shadow-sm"
            />
          </div>
        </div>

        {/* Premium Quality Only Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center mb-16">
          <div className="relative aspect-square w-full max-w-lg mx-auto">
            <Image
              src="/about3.webp"
              alt="Premium Quality Only"
              fill
              className="object-contain shadow-sm"
            />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase mb-6 text-black">
              PREMIUM QUALITY ONLY
            </h2>
            <p className="text-gray-600 text-[15px] md:text-[17px] leading-[1.8]">
              Our curated collection features an array of perfectly designed kitchenware, elegant furniture pieces, stylish utensils, and everything in between, all carefully selected to meet the highest standards of quality, durability, and aesthetic appeal. Whether you are a professional chef, a home decor enthusiast, or simply someone who appreciates the finer things in life, <strong className="text-gray-800">Houszy</strong> has something special waiting for you.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center mb-32">
          <div className="order-2 md:order-1">
            <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase mb-6 text-black">
              OUR MISSION
            </h2>
            <p className="text-gray-600 text-[15px] md:text-[17px] leading-[1.8]">
              <strong className="text-gray-800">Houszy</strong> aims to improve your living space with thoughtfully crafted essentials that reflect your personality and enhance your everyday experiences. From the moment you step into your kitchen to prepare a hearty meal, to the joyful comfort of sinking into your favourite armchair at the end of a long day, Houszy is there, smoothly blending into your lifestyle, making every moment at home a delight.
            </p>
          </div>
          <div className="order-1 md:order-2 relative aspect-square w-full max-w-lg mx-auto">
            <Image
              src="/about4.webp"
              alt="Our Mission"
              fill
              className="object-contain shadow-sm"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
