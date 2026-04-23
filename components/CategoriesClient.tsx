"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export default function CategoriesClient({
  categories,
  baseUrl,
}: {
  categories: Category[];
  baseUrl: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");

  const filteredCategories = useMemo(() => {
    let filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sort === "az") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    }

    return filtered;
  }, [categories, search, sort]);
const totalCount = categories.length;
const filteredCount = filteredCategories.length;
  return (
    <>
      {/* SEARCH + SORT BAR */}
  <div className="mb-6 space-y-2">

  {/* 🔹 Row 1: Search + Sort */}
<div className="flex gap-2 md:justify-between md:items-center">

    {/* SEARCH */}
<div className="flex items-center gap-3 w-full md:w-auto">
  
  {/* SEARCH */}
  <div className="relative w-full md:w-[260px]">
    <input
      type="text"
      placeholder="Search categories..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#445D41]"
    />

    {search && (
      <button
        type="button"
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
      >
        <X size={16} />
      </button>
    )}
  </div>

  {/* ✅ COUNT (desktop me right me) */}
  <p className="hidden md:block text-sm text-gray-600 whitespace-nowrap">
    {search
      ? `showing ${filteredCount} of ${totalCount} categories`
      : `${totalCount} total categories`}
  </p>

</div>

    {/* SORT */}
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
     className="w-[120px] md:w-[140px] border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#445D41]"
    >
      <option value="az">A → Z</option>
      <option value="za">Z → A</option>
    </select>

  </div>

  {/* 🔹 Row 2: COUNT */}
<p className="text-xs text-gray-500 md:hidden">
  {search ? (
    <>
      Showing <span className="font-semibold">{filteredCount}</span> of {totalCount} categories
    </>
  ) : (
    <>
      <span className="font-semibold">{totalCount}</span> total categories
    </>
  )}
</p>

</div>

      {/* CATEGORY GRID */}
      {filteredCategories.length === 0 ? (
        <p className="text-center text-gray-500">
          No categories found.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {filteredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center justify-center"
            >

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />

              {/* Image */}
              <div className="relative w-[120px] h-[120px] md:w-[140px] md:h-[140px] flex items-center justify-center mb-5">
                <img
                  src={
                    category.imageUrl?.startsWith("http")
                      ? category.imageUrl
                      : `${baseUrl}${category.imageUrl}`
                  }
                  alt={category.name}
                  className="w-auto h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Name */}
              <h3 className="relative text-sm md:text-base font-semibold text-gray-900 text-center group-hover:text-[#445D41] transition">
                {category.name}
              </h3>

            </Link>
          ))}

        </div>
      )}
    </>
  );
}