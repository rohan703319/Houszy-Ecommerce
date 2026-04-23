export default function Loading() {
  return (
    <main className="bg-white py-3">
      <div className="max-w-full mx-4 grid grid-cols-1 lg:grid-cols-3 gap-4 px-0 md:px-12">

        {/* LEFT ARTICLE */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-2xl p-4 md:p-8 border animate-pulse">

            {/* Breadcrumb */}
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />

            {/* Title */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />

            {/* Meta */}
            <div className="flex gap-3 mb-4">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>

            {/* Labels */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>

            {/* Image */}
            <div className="w-full h-[250px] md:h-[350px] bg-gray-200 rounded-xl mb-4" />

            {/* Content */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/6" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-6">
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>

            {/* Comments */}
            <div className="mt-10">
              <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
              <div className="h-20 bg-gray-200 rounded w-full mb-3" />
              <div className="h-20 bg-gray-200 rounded w-full" />
            </div>

          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-1 mt-10 lg:mt-0">

          {/* Recent */}
          <div className="bg-white shadow-xl rounded-2xl p-6 border mb-8 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-5" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-14 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related */}
          <div className="bg-white shadow-xl rounded-2xl p-6 border animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-5" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-14 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </main>
  );
}