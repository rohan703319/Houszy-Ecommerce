import React from "react";

type DetailProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
};

export default function Detail({ label, value, icon }: DetailProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm group transition-colors hover:bg-gray-50/50">
      <div className="flex items-center gap-2.5 text-gray-500">
        {icon && (
          <div className="text-gray-400 group-hover:text-black transition-colors">
            {icon}
          </div>
        )}
        <span className="font-medium">{label}</span>
      </div>

      <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">
        {value || "-"}
      </span>
    </div>
  );
}
