//app\products\[slug]\loading.tsx
export default function Loading() {
    
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT IMAGE */}
        <div className="bg-gray-200 h-[300px] md:h-[400px] rounded-xl" />

        {/* RIGHT SIDE */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />

          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-full" />

          <div className="h-24 bg-gray-200 rounded w-full" />
        </div>

      </div>
    </div>
  );
}