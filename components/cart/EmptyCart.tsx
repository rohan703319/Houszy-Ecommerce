"use client";

import Link from "next/link";

export default function EmptyCart() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Illustration / Icon */}
      <div className="mb-6">
        <svg
          width="150"
          height="150"
          viewBox="0 0 24 24"
          stroke="#f38918"
          fill="none"
          strokeWidth="1.5"
          className="opacity-80 drop-shadow-sm"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.5 6h2l1.5 9h10l2-6H6M8 17.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm8 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"
          />
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
        Your cart is empty
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 max-w-md mb-6">
        Looks like you haven’t added anything yet.
        Explore our exclusive products and find what you love.
      </p>

      {/* CTA Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#f38918] hover:bg-black text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
