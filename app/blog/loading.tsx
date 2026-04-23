export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100 pt-[0.5rem] pb-[2.5rem]">
      <div className="max-w-7xl mx-auto px-1 space-y-4 animate-pulse">

        {/* ================= CATEGORIES ================= */}
        <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border">
          <div className="h-6 bg-gray-200 rounded w-60 mb-6" />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 border p-3 rounded-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-2 bg-gray-200 rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ARTICLES ================= */}
        <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border">
          <div className="h-6 bg-gray-200 rounded w-60 mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 border rounded-xl p-3 flex flex-col"
              >
                {/* image */}
                <div className="w-full h-28 bg-gray-200 rounded-lg mb-2" />

                {/* category */}
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />

                {/* title */}
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />

                {/* description */}
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-3" />

                {/* footer */}
                <div className="flex justify-between mt-auto">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>

                {/* labels */}
                <div className="flex gap-2 mt-3">
                  <div className="h-5 w-12 bg-gray-200 rounded-full" />
                  <div className="h-5 w-14 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}