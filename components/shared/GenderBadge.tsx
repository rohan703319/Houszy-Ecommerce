"use client";

interface GenderBadgeProps {
  gender?: string | null;
  className?: string; // optional override if ever needed
  absolute?: boolean; // ✅ THIS MUST EXIST
}

const getGenderConfig = (gender?: string | null) => {
  switch (gender?.toLowerCase()) {
    case "male":
      return {
        label: "Male",
        icon: "/icons/male.svg",
      };
    case "female":
      return {
        label: "Female",
        icon: "/icons/female.svg",
      };
    case "unisex":
      return {
        label: "Unisex",
        icon: "/icons/unisex.svg",
      };
    default:
      return null;
  }
};

export default function GenderBadge({
  gender,
  className = "",
  absolute = true,
}: GenderBadgeProps) {
  const config = getGenderConfig(gender);

  if (!config) return null;

  return (
    <div
      className={`
        ${absolute ? "absolute top-1 left-1 sm:top-2 sm:left-2 z-20" : ""}
        bg-white/80 px-1.5 py-0.5 rounded shadow-sm
        flex items-center gap-1
        ${className}
      `}
    >
      <img
        src={config.icon}
        alt={config.label}
        className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5"
        loading="lazy"
      />
      <span className="text-[7px] sm:text-[9px] font-semibold text-gray-700">
        {config.label}
      </span>
    </div>
  );
}
