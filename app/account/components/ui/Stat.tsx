export default function Stat({ label, value, icon }: any) {
  return (
    <div className="border rounded-xl p-4 flex items-center gap-3 bg-white">
      {icon && (
        <div className="h-10 w-10 rounded-lg bg-[#445D41] text-white flex items-center justify-center">
          {icon}
        </div>
      )}

      <div>
        <p className="text-sm text-[#445D41]">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
