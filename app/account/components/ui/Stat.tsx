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
        border rounded-xl p-4 flex items-center gap-3 bg-white
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-[1px]" : ""}
        focus:outline-none focus:ring-2 focus:ring-[#445D41]/40
        ${className}
      `}
    >
      {icon && (
        <div className="h-10 w-10 rounded-lg bg-[#445D41] text-white flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}

      <div className="flex flex-col">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm md:text-base font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}