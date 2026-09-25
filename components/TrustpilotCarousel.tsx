'use client';

import { useEffect, useRef } from 'react';

interface TrustpilotCarouselProps {
  className?: string;
  isContained?: boolean;
}

export default function TrustpilotCarousel({ className = '', isContained = false }: TrustpilotCarouselProps) {
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

  const widgetContent = (
    <div
      ref={ref}
      className="trustpilot-widget w-full"
      data-locale="en-US"
      data-template-id="53aa8912dec7e10d38f59f36"
      data-businessunit-id="6aa3de0ca2bcf6af73013f15"
      data-style-height="140px"
      data-style-width="100%"
      data-token="f9e3e5af-cbe3-4c1f-9e65-e9690930353e"
      data-stars="1,2,3,4,5"
      data-review-languages="en"
      data-text-color="#f38a16"
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

  if (isContained) {
    return <div className={`w-full ${className}`}>{widgetContent}</div>;
  }

  return (
    <section className={`w-full bg-white py-8 md:py-12 ${className}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16">
        {widgetContent}
      </div>
    </section>
  );
}
