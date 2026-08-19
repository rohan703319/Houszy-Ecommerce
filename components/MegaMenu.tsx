"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories?: Category[];
}

interface MegaMenuProps {
  activeMainCategory: Category;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ activeMainCategory }) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeSubTabId, setActiveSubTabId] = useState<string | null>(null);

  // Sync activeTabId when the active main category changes
  useEffect(() => {
    if (activeMainCategory?.subCategories?.length) {
      setActiveTabId(activeMainCategory.subCategories[0].id);
    } else {
      setActiveTabId(null);
    }
  }, [activeMainCategory]);

  const activeSubCategory = (activeMainCategory?.subCategories || []).find(
    (s) => s.id === activeTabId
  ) || activeMainCategory?.subCategories?.[0];

  // Sync activeSubTabId when activeSubCategory changes
  useEffect(() => {
    if (activeSubCategory?.subCategories?.length) {
      setActiveSubTabId(activeSubCategory.subCategories[0].id);
    } else {
      setActiveSubTabId(null);
    }
  }, [activeSubCategory]);

  if (!activeMainCategory?.subCategories?.length) {
    return null;
  }

  const hasDeepNesting = activeSubCategory?.subCategories?.some(
    (child) => Array.isArray(child.subCategories) && child.subCategories.length > 0
  );

  const activeSubTab = activeSubCategory?.subCategories?.find(
    (c) => c.id === activeSubTabId
  ) || activeSubCategory?.subCategories?.[0];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex overflow-hidden h-[400px]">

      {/* Column 1: Left Sidebar Tabs Navigation (230px Width) */}
      <div className="w-[230px] bg-slate-50/50 flex-shrink-0 border-r border-slate-100 flex flex-col select-none no-scrollbar overflow-y-auto">
        <div className="flex flex-col gap-0.5 p-2">
          {activeMainCategory.subCategories.map((sub) => {
            const isActive = sub.id === activeTabId;
            const hasChildren = sub.subCategories && sub.subCategories.length > 0;
            return (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                onMouseEnter={() => setActiveTabId(sub.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  isActive
                    ? "bg-gradient-to-r from-orange-50 to-orange-100/20 text-[#f38918] shadow-sm shadow-orange-500/5 border-l-2 border-[#f38918]"
                    : "text-slate-600 border-l-2 border-transparent hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <span className="truncate pr-2">{sub.name}</span>
                {hasChildren && (
                  <svg
                    className={`w-3.5 h-3.5 transition-all duration-200 ${
                      isActive
                        ? "translate-x-0.5 text-[#f38918] opacity-100"
                        : "text-slate-400 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Deep nesting layout: Column 2 (Sub-tabs) & Column 3 (Grandchildren) */}
      {hasDeepNesting ? (
        <>
          {/* Column 2: Level 2 Sub-tabs (190px Width) */}
          <div className="w-[190px] border-r border-slate-100 flex flex-col p-2 select-none no-scrollbar overflow-y-auto bg-white flex-shrink-0 gap-0.5">
            {(activeSubCategory?.subCategories || []).map((child) => {
              const isActive = child.id === activeSubTabId;
              const hasSubChildren = child.subCategories && child.subCategories.length > 0;
              return (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  onMouseEnter={() => setActiveSubTabId(child.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-[12px] sm:text-[12.5px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? "bg-gradient-to-r from-orange-50/50 to-orange-100/10 text-[#f38918] border-l-2 border-[#f38918]"
                      : "text-slate-500 border-l-2 border-transparent hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate pr-2">{child.name}</span>
                  {hasSubChildren && (
                    <svg
                      className={`w-3 h-3 transition-all duration-200 ${
                        isActive
                          ? "translate-x-0.5 text-[#f38918] opacity-100"
                          : "text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Column 3: Level 3 Items (Remaining Width) */}
          <div className="flex-1 bg-white p-6 no-scrollbar overflow-y-auto flex flex-col">
            {activeSubTab && activeSubTab.subCategories && activeSubTab.subCategories.length > 0 && (
              <div className="flex flex-col">
                <div className="mb-4 pb-2 border-b border-slate-100 flex items-center">
                  <Link
                    href={`/category/${activeSubTab.slug}`}
                    className="font-extrabold text-[13px] sm:text-[13.5px] text-slate-800 hover:text-[#f38918] uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-3.5 bg-[#f38918] rounded-full inline-block"></span>
                    {activeSubTab.name}
                  </Link>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {activeSubTab.subCategories.map((grandChild) => (
                    <li key={grandChild.id}>
                      <Link
                        href={`/category/${grandChild.slug}`}
                        className="group text-slate-500 hover:text-[#f38918] hover:translate-x-1 text-[12.5px] sm:text-[13px] font-semibold block transition-all duration-200 py-0.5 leading-snug flex items-center gap-2"
                        title={grandChild.name}
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#f38918] group-hover:scale-125 transition-all duration-200 flex-shrink-0"></span>
                        <span className="leading-snug">{grandChild.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Flat layout: Columns 2 spans remaining width to list flat categories */
        <div className="flex-1 bg-white p-6 no-scrollbar overflow-y-auto flex flex-col">
          {activeSubCategory && activeSubCategory.subCategories && activeSubCategory.subCategories.length > 0 && (
            <div className="flex flex-col">
              <div className="mb-4 pb-2 border-b border-slate-100 flex items-center">
                <Link
                  href={`/category/${activeSubCategory.slug}`}
                  className="font-extrabold text-[13px] sm:text-[13.5px] text-slate-800 hover:text-[#f38918] uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-3.5 bg-[#f38918] rounded-full inline-block"></span>
                  {activeSubCategory.name}
                </Link>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                {activeSubCategory.subCategories.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/category/${child.slug}`}
                      className="group text-slate-500 hover:text-[#f38918] hover:translate-x-1 text-[12.5px] sm:text-[13px] font-semibold block transition-all duration-200 py-0.5 leading-snug flex items-center gap-2"
                      title={child.name}
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#f38918] group-hover:scale-125 transition-all duration-200 flex-shrink-0"></span>
                      <span className="leading-snug">{child.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MegaMenu;
