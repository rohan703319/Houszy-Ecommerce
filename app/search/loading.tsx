export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* HEADER */}
      <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-6" />

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl p-2 shadow-sm"
          >

            {/* IMAGE */}
            <div className="w-full h-52 bg-gray-200 rounded animate-pulse" />

            {/* TITLE */}
            <div className="h-4 bg-gray-200 rounded animate-pulse mt-3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mt-2 w-3/4" />

            {/* RATING */}
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-3" />

            {/* PRICE */}
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mt-3" />
          </div>
        ))}

      </div>
    </div>
  );
}