export default function Loading() {
  return (
    <main className="min-h-screen bg-white pt-4 pb-16">
      <div className="max-w-8xl mx-auto px-8 animate-pulse">
        {/* Breadcrumb */}
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />

        {/* Categories Horizontal Menu */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="w-20 h-9 bg-gray-200 rounded-full" />
          <div className="w-24 h-9 bg-gray-200 rounded-full" />
          <div className="w-32 h-9 bg-gray-200 rounded-full" />
          <div className="w-28 h-9 bg-gray-200 rounded-full" />
          <div className="w-24 h-9 bg-gray-200 rounded-full" />
        </div>

        {/* Categories & Posts loop */}
        {[1, 2].map((i) => (
          <div key={i} className="mb-16">
            {/* Category Title */}
            <div className="h-10 w-64 bg-gray-200 rounded mb-8" />
            
            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex flex-col h-full">
                  {/* IMAGE */}
                  <div className="w-full aspect-[16/10] bg-gray-200 rounded-xl mb-4" />
                  
                  {/* TITLE */}
                  <div className="h-6 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                  
                  {/* OVERVIEW */}
                  <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
                  
                  {/* DATE & VIEWS */}
                  <div className="flex gap-2 mb-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                  
                  {/* TAGS */}
                  <div className="flex gap-2 mb-4 mt-auto">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                  
                  {/* READ MORE */}
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
            
            {/* LOAD MORE BUTTON */}
            <div className="mt-12">
              <div className="w-36 h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}