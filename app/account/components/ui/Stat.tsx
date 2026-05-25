"use client";

import React from "react";

type StatProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function Stat({
  label,
  value,
  icon,
  onClick,
  className = "",
}: StatProps) {
  const isClickable = typeof onClick === "function";

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        bg-gray-50 rounded-xl px-2.5 py-3 md:px-4 flex items-center gap-2 md:gap-3
        transition-all duration-200 border border-transparent
        ${isClickable ? "cursor-pointer hover:bg-orange-50 hover:border-orange-100 group" : ""}
        focus:outline-none focus:ring-2 focus:ring-[#f38918]/40
        ${className}
      `}
    >
      {icon && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 text-gray-400 [&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-5 md:[&>svg]:w-5 group-hover:text-[#f38918] transition-colors">
          {icon}
        </div>
      )}

      <div className="flex flex-col min-w-0">
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide md:tracking-widest text-gray-400 group-hover:text-gray-500 mb-0.5 leading-tight">{label}</p>
        <p className="text-xs md:text-sm font-black text-gray-900 tracking-tight truncate group-hover:text-[#f38918] transition-colors">{value}</p>
      </div>
    </div>
  );
}