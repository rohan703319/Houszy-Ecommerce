interface SidebarButtonProps {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export default function SidebarButton({
  children,
  active,
  danger,
  onClick,
}: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 tracking-wide
        ${
          danger
            ? "text-red-500 hover:bg-red-50 hover:text-red-600"
            : active
            ? "bg-white text-[#f38918] shadow-sm border border-gray-100"
            : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 border border-transparent"
        }`}
    >
      {children}
    </button>
  );
}