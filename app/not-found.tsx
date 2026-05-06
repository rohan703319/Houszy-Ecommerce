// app/not-found.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Package, ShoppingCart, TrendingUp, PhoneCall, Gift, } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  


  return (
    <div className="min-h-screen bg-white py-4 md:py-12">
      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-6xl">       
        {/* 404 Hero - Compact */}
        <div className="text-center mb-4">         
          {/* 404 Number & Icon */}
          <div className="relative mb-3">
            {/* Background 404 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
              <div className="text-[180px] font-black text-[#4a6f52] leading-none select-none">
                404
              </div>
            </div> 
            <div className="relative pt-4 ">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#4a6f52]/10 rounded-full mb-2">
                <Package className="w-10 h-10 text-[#4a6f52]" />
              </div>            
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
                Page Not Found
              </h1>
              {/* Description */}
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-1">
                Sorry, we couldn't find the page you're looking for.
              </p>
             
            </div>
          </div>
          {/* Search Bar - Compact */}
        
          {/* Action Buttons - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-5 py-2.5 border-2 border-[#4a6f52] text-[#4a6f52] rounded-full hover:bg-[#4a6f52] hover:text-white transition-all font-semibold text-sm" >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4a6f52] text-white rounded-full hover:bg-[#3d5c43] transition-all font-semibold text-sm" >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/offers"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all font-semibold text-sm" >
              <Gift className="w-4 h-4" />
              View Offers
            </Link>
          </div>
        </div>
      
        {/* Trust Features - Compact */}
        <div className="bg-gradient-to-br from-[#4a6f52]/5 to-emerald-50 rounded-2xl p-5">
          <div className="grid md:grid-cols-3 gap-4">           
            {/* Fast Delivery */}
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 bg-[#4a6f52] rounded-full flex items-center justify-center mb-2">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-0.5">Fast & Reliable Delivery</h3>
              <p className="text-gray-600 text-xs">
                Standard or next-day delivery options available.
              </p>
            </div>
            {/* Returns */}
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 bg-[#4a6f52] rounded-full flex items-center justify-center mb-2">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-0.5">30-Day Hassle-Free Returns</h3>
              <p className="text-gray-600 text-xs">
                Shop with confidence, return within 30 days if needed.
              </p>
            </div>
            {/* Support */}
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 bg-[#4a6f52] rounded-full flex items-center justify-center mb-2">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-0.5">Dedicated Customer Support</h3>
              <p className="text-gray-600 text-xs">
                Our team is available [Mon-Sat, 9 AM - 6 PM]
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
