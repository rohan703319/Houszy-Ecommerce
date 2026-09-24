'use client';

import { useEffect, useRef } from 'react';

interface TrustpilotBadgeProps {
  className?: string;
  isMobile?: boolean;
}

export default function TrustpilotBadge({ className = '', isMobile = false }: TrustpilotBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically re-trigger Trustpilot widget rendering on mount and route change
    if (typeof window !== 'undefined' && (window as any).Trustpilot && ref.current) {
      try {
        (window as any).Trustpilot.loadFromElement(ref.current, true);
      } catch (err) {
        // Fallback gracefully
      }
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-slot flex items-center outline-none focus:outline-none focus-visible:outline-none ${
        isMobile
          ? 'w-full max-w-[270px] scale-[0.95] origin-left'
          : 'w-full max-w-[270px] scale-[0.88] origin-right translate-y-[5px]'
      } ${className}`}
      aria-label="Trustpilot reviews"
      style={{ outline: 'none' }}
    >
      <div
        className="trustpilot-widget outline-none focus:outline-none focus-visible:outline-none"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="6aa3de0ca2bcf6af73013f15"
        data-style-height="52px"
        data-style-width="100%"
        data-token="a7351fd2-7ec8-4557-a78a-59701182c170"
        style={{ outline: 'none' }}
      >
        <a
          href="https://www.trustpilot.com/review/www.houszy.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.currentTarget.blur()}
          onMouseUp={(e) => e.currentTarget.blur()}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-gray-900 border border-gray-200 rounded-md text-xs font-semibold hover:border-[#00b67a] hover:text-[#00b67a] transition-all shadow-sm outline-none focus:outline-none focus-visible:outline-none focus:ring-0 select-none"
          style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          <span>Review us on</span>
          <span className="text-[#00b67a] font-bold">★ Trustpilot</span>
        </a>
      </div>
      <style jsx global>{`
        .trustpilot-slot,
        .trustpilot-slot *,
        .trustpilot-widget,
        .trustpilot-widget *,
        .trustpilot-widget iframe {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        .trustpilot-slot *:focus,
        .trustpilot-slot *:focus-visible,
        .trustpilot-widget *:focus,
        .trustpilot-widget *:focus-visible,
        .trustpilot-widget iframe:focus,
        .trustpilot-widget iframe:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
