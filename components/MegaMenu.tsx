"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activeMainCategory?.subCategories?.length) {
    return null;
  }

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="absolute top-full left-0 mt-0 w-[280px] bg-[#f3f3f3] shadow-md py-2 z-50 max-h-[calc(100vh-110px)] overflow-y-auto overscroll-contain scrollbar-thin">
      <ul className="flex flex-col">
        {activeMainCategory.subCategories.map((sub) => {
          const hasChildren =
            Array.isArray(sub.subCategories) && sub.subCategories.length > 0;
          const isExpanded = expandedId === sub.id;

          return (
            <li key={sub.id} className="flex flex-col">
              <div className="flex items-center justify-between px-5 py-2.5">
                <Link
                  href={`/category/${sub.slug}`}
                  className="text-[#000000] text-[15px] font-semibold hover:underline w-full"
                >
                  {sub.name}
                </Link>
                {hasChildren && (
                  <button
                    onClick={(e) => toggleExpand(e, sub.id)}
                    className="p-1 text-black cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                )}
              </div>

              {/* Children Accordion */}
              {hasChildren && isExpanded && (
                <ul className="flex flex-col pb-2">
                  {sub.subCategories!.map((child) => {
                    const hasGrandChildren =
                      Array.isArray(child.subCategories) &&
                      child.subCategories.length > 0;

                    return (
                      <li key={child.id} className="flex flex-col px-8 py-1.5">
                        <Link
                          href={`/category/${child.slug}`}
                          className="text-[#000000] text-[14px] font-normal hover:underline block w-full"
                        >
                          {child.name}
                        </Link>
                        {hasGrandChildren && (
                          <ul className="flex flex-col pl-4 mt-1 space-y-1">
                            {child.subCategories!.map((grandChild) => (
                              <li key={grandChild.id}>
                                <Link
                                  href={`/category/${grandChild.slug}`}
                                  className="text-[#555555] hover:text-[#000000] text-[13px] font-normal hover:underline block w-full"
                                >
                                  {grandChild.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MegaMenu;
