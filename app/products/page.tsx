// app/products/page.tsx
export const dynamic = "force-dynamic";

import ProductsClient from "./ProductsClient";

interface SearchParams {
  sortBy?: string;
  sortDirection?: string;
  page?: string;
  pageSize?: string;
}

async function getProducts(params: SearchParams = {}) {
  const {
    page = "1",
    pageSize = "20",
    sortBy = "name",
    sortDirection = "asc",
  } = params;

  const query = new URLSearchParams({
    page,
    pageSize,
    sortBy,
    sortDirection,
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/Products?${query.toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to load products");
  }

  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  // ✅ IMPORTANT
  const sp = (await searchParams) ?? {};

  const productsRes = await getProducts(sp);

  return (
    <ProductsClient
      initialProducts={productsRes.data.items}
      currentPage={productsRes.data.page}
      totalPages={productsRes.data.totalPages}
      initialSortBy={sp.sortBy || "name"}
      initialSortDirection={sp.sortDirection || "asc"}
    />
  );
}
