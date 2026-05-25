import Link from "next/link";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";

/* ==================
   Products Fetch
===================== */

async function getGroupedProducts(page = 1, pageSize = 20) {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortDirection: "asc",
    productType: "grouped",
    isPublished: "true",
    isActive: "true",
    isDeleted: "false",
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${query.toString()}`,
    { cache: "no-store" }
  );

  return res.json();
}

/* =====================
   Loading UI
===================== */

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-[#f38918]" />
    </div>
  );
}

/* =====================
   Page
===================== */

export default async function BundleDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams?.page || 1);
  const pageSize = 20;

  const productsRes = await getGroupedProducts(currentPage, pageSize);
  const items = productsRes?.data?.items || [];
  const totalPages = productsRes?.data?.totalPages || 1;

  return (
    <Suspense fallback={<Loading />}>
      <div className="bg-gray-50 min-h-screen pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center uppercase">
            Bundle Deals
          </h1>

          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No bundle deals found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((product: any) => (
                  <ProductCard key={product.id} product={product} cardSlug={product.slug} />
                ))}
              </div>

              {/* Simple Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <Link
                        key={pageNum}
                        href={`/bundle-deals?page=${pageNum}`}
                        className={`w-10 h-10 flex items-center justify-center rounded text-sm font-semibold transition-colors ${isActive
                            ? "bg-[#f38918] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Suspense>
  );
}
