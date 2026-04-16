export default function Detail({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm">
      <div className="flex items-center gap-2 text-[#445D41]">
        {icon}
        <span>{label}</span>
      </div>

      <span className="font-medium text-gray-900">
        {value || "-"}
      </span>
    </div>
  );
}
