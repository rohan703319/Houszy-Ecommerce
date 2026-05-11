"use client";

import { List } from "lucide-react";

interface Props {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: "h2" | "h3" | "h4";
}

export default function TableOfContents({
  content,
}: Props) {
  const headings: Heading[] = [];

  const regex = /<(h2|h3|h4)[^>]*>(.*?)<\/\1>/gi;

  let match;
  let index = 0;

 while ((match = regex.exec(content)) !== null) {
  const fullMatch = match[0];

  const level = match[1] as "h2" | "h3";

  const text = match[2]
    .replace(/<[^>]+>/g, "")
    .trim();

  // ✅ Prefer existing heading ID
  const existingIdMatch = fullMatch.match(
    /id=["']([^"']+)["']/
  );

  const existingId = existingIdMatch?.[1];

  const generatedId =
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-") +
    `-${index}`;

  headings.push({
    id: existingId || generatedId,
    text,
    level,
  });

  index++;
}

  if (headings.length === 0) return null;

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);

    if (!el) return;

 const scrollContainer = document.querySelector(
  ".blog-scroll-container"
) as HTMLElement | null;

if (scrollContainer) {
  const containerTop =
    scrollContainer.getBoundingClientRect().top;

  const elementTop =
    el.getBoundingClientRect().top;

  const scrollOffset =
    elementTop -
    containerTop +
    scrollContainer.scrollTop -
    100;

  scrollContainer.scrollTo({
    top: scrollOffset,
    behavior: "smooth",
  });
}
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <List className="h-5 w-5 text-[#445D41]" />

        <h3 className="text-lg font-bold text-gray-900">
          Table of Contents
        </h3>
      </div>

     <nav className="space-y-0.5">
  {headings.map((heading) => {
    const isSubHeading = heading.level === "h3";

    return (
      <button
        key={heading.id}
        onClick={() => handleScroll(heading.id)}
        className={`
          group flex items-start gap-2 w-full text-left
          rounded-md px-2 py-1.5
          transition-all duration-200
          hover:bg-[#445D41]/8
          hover:text-[#445D41]
          ${
            isSubHeading
              ? "ml-4 text-[13px] text-gray-500"
              : "text-[14px] font-medium text-gray-800"
          }
        `}
      >
        {/* Bullet */}
        <span
          className={`
            mt-[7px] flex-shrink-0 rounded-full
            transition-colors duration-200
            ${
              isSubHeading
                ? "h-1.5 w-1.5 bg-gray-400 group-hover:bg-[#445D41]"
                : "h-2 w-2 bg-[#445D41]"
            }
          `}
        />

        {/* Text */}
        <span className="leading-5">
          {heading.text}
        </span>
      </button>
    );
  })}
</nav>
    </div>
  );
}