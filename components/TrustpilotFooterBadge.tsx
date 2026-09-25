'use client';

import { useEffect, useRef } from 'react';

interface TrustpilotFooterBadgeProps {
  className?: string;
}

export default function TrustpilotFooterBadge({ className = '' }: TrustpilotFooterBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadWidget = () => {
      if (typeof window !== 'undefined' && (window as any).Trustpilot && ref.current) {
        try {
          (window as any).Trustpilot.loadFromElement(ref.current, true);
        } catch (e) {
          // ignore
        }
      }
    };

    loadWidget();
    const timer = setTimeout(loadWidget, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-widget min-w-[320px] ${className}`}
      data-locale="en-US"
      data-template-id="5419b732fbfb950b10de65e5"
      data-businessunit-id="6aa3de0ca2bcf6af73013f15"
      data-style-height="24px"
      data-style-width="100%"
      data-theme="dark"
      data-token="196ae862-5164-450b-bab9-b5fd5d10b9fb"
      data-text-color="#f3a916"
    >
      <a
        href="https://www.trustpilot.com/review/www.houszy.co.uk"
        target="_blank"
        rel="noopener"
      >
        Trustpilot
      </a>
    </div>
  );
}
