import Image from "next/image";
import Link from "next/link";
import { AwardIcon, Star } from "lucide-react";
export const dynamic = "force-dynamic"; 

export default async function SearchPage({ searchParams }: any) {
  const query = searchParams.q ?? "";

  let products: any[] = [];
  let errorMessage = "";

  if (query.length > 1) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/Products/quick-search?query=${query}&limit=50`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (json.success) {
        products = json.data;
      } else {
        errorMessage = json.message;
      }
    } catch (err) {
      errorMessage = "Something went wrong. Please try again.";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Search results for: 
        <span className="text-[#445D41]"> "{query}"</span>
      </h1>

      {/* NO QUERY */}
      {query.length < 2 && (
        <p className="text-gray-600 text-sm">
          Please enter at least 2 characters to search.
        </p>
      )}

      {/* ERROR */}
      {errorMessage && (
        <p className="text-red-600 font-medium mt-4">{errorMessage}</p>
      )}

      {/* NO RESULTS */}
      {query.length > 1 && products.length === 0 && !errorMessage && (
        <p className="text-gray-500 text-sm mt-4">
          No products found. Try another search.
        </p>
      )}

      {/* RESULTS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
        {products.map((item) => {
        const hasDiscount = item.hasDiscount;
const discountPercentage = item.discountPercentage || 0;

const finalPrice = hasDiscount
  ? item.price - (item.price * discountPercentage) / 100
  : item.price;

          const imageUrl = item.mainImageUrl?.startsWith("http")
            ? item.mainImageUrl
            : `${process.env.NEXT_PUBLIC_API_URL}${item.mainImageUrl}`;

          return (
            <Link
              key={item.sku}
              href={`/product/${item.slug}`}
              className="relative border rounded-xl p-2 shadow-sm hover:shadow-md transition"
            >
             {hasDiscount && (
  <div className="absolute top-1 right-2 z-20">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md ring-2 ring-white">
      <div className="flex flex-col items-center leading-none">
        <span className="text-xs font-bold">
          {discountPercentage}%
        </span>
        <span className="text-[8px]">OFF</span>
      </div>
    </div>
  </div>
)}
              <Image
                src={imageUrl}
                alt={item.name}
                width={200}
                height={200}
                className="object-contain w-full h-52"
              />

              <h3 className="text-sm font-medium text-gray-900 hover:text-[#445D41] mt-2 line-clamp-2">
                {item.name}
              </h3>

 <div className="flex items-center gap-1 min-h-[20px] mb-0 flex-nowrap overflow-hidden">

  {/* ⭐ Rating badge */}
  <div className="flex items-center bg-green-600 text-white px-1 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">
    <span>{item.averageRating?.toFixed(1) ?? "0.0"}</span>
    <Star className="h-2.5 w-2.5 ml-0.5 fill-white" />
  </div>

  {/* Review count */}
   <span className="text-[10px] text-gray-500 flex-shrink-0">
    ({item.approvedReviewCount ?? 0})
  </span>

  {/* Loyalty */}
  {item.loyaltyPointsMessage && (
    <span className="inline-flex items-center text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-0.5 py-0.5 rounded whitespace-nowrap leading-none flex-shrink-0">
     
      {item.loyaltyPointsMessage}
    </span>
  )}

</div>
           
       <div className="mt-1 flex items-center gap-1">

  {/* PRICE */}
  <span className="text-sm font-bold text-[#445D41] leading-none">
    £{finalPrice.toFixed(2)}
  </span>

  {hasDiscount && (
    <span className="text-xs text-gray-400 line-through">
      £{item.price.toFixed(2)}
    </span>
  )}

  {/* STOCK */}
  <span
    className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
      item.inStock
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-600"
    }`}
  >
    {item.inStock ? "In Stock" : "Out of Stock"}
  </span>

</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
