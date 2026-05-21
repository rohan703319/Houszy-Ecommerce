"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;

      let scrollPos = window.scrollY;

      // If the scroll event comes from our custom blog container
      if (target !== document && (target as HTMLElement).classList?.contains("blog-scroll-container")) {
        scrollPos = (target as HTMLElement).scrollTop;
      } else {
        // Fallback: Check if blog container is scrolled even if event was window
        const blogContainer = document.querySelector(".blog-scroll-container");
        if (blogContainer && blogContainer.scrollTop > scrollPos) {
          scrollPos = blogContainer.scrollTop;
        }
      }

      setVisible(scrollPos > 300);
    };

    // Use capture phase to catch scroll events from any nested containers
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    // Explicitly scroll the blog container if it exists
    const blogContainer = document.querySelector(".blog-scroll-container");
    if (blogContainer) {
      blogContainer.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className=" fixed bottom-12 right-4 z-50 h-12 w-12 rounded-md bg-[#f38918] text-white shadow-lg flex items-center justify-center hover:bg-black transition " >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
