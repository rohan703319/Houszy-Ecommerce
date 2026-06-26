export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-8xl mx-auto px-4 md:px-8 py-4 md:py-6">

        {/* Topbar: Breadcrumb + Sort Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Mobile filters button skeleton */}
            <div className="lg:hidden h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
            {/* Sort select skeleton */}
            <div className="h-9 w-40 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Outer Shell Grid */}
        <div className="flex gap-8">

          {/* Sidebar FILTERS (DESKTOP) Skeleton */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 h-[calc(100vh-96px)] overflow-y-auto pr-2 hide-scrollbar">

            {/* Filter Header */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Filters</span>
              <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Categories skeleton */}
            <div className="py-3 border-b border-gray-200 space-y-2">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <div className="w-3.5 h-3.5 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              ))}
            </div>

            {/* Brands skeleton */}
            <div className="py-3 border-b border-gray-200 space-y-2">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <div className="w-3.5 h-3.5 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>

            {/* Price skeleton */}
            <div className="py-3 border-b border-gray-200">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
            </div>

            {/* Rating skeleton */}
            <div className="py-3 border-b border-gray-200 space-y-2">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <div className="w-3.5 h-3.5 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                </div>
              ))}
            </div>

          </aside>

          {/* MAIN PRODUCT GRID VIEW Skeleton */}
          <div className="flex-1">

            {/* Header / Results title skeleton */}
            <div className="h-8 w-60 bg-gray-100 rounded animate-pulse mb-6" />

            {/* Grid of Product Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-white overflow-hidden border shadow-sm">
                  {/* Image skeleton */}
                  <div className="h-44 md:h-56 bg-gray-100 rounded-t-lg animate-pulse" />
                  {/* Content skeleton */}
                  <div className="p-2 md:p-4 space-y-2">
                    {/* Title */}
                    <div className="h-3.5 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-3.5 bg-gray-100 rounded w-4/5 animate-pulse" />

                    {/* Rating row */}
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                    </div>

                    {/* Price */}
                    <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse" />

                    {/* Add to Cart button */}
                    <div className="h-9 bg-gray-100 rounded-md w-full animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}