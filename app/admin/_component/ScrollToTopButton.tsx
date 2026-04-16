'use client';

import { useState, useEffect, useRef } from 'react';

export const ScrollToTopButton = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 🔍 Find the actual scrollable container
    const getScrollableParent = (): HTMLElement | Window => {
      const mainContent = document.querySelector('main');
      const contentDiv = document.querySelector('[class*="overflow"]');
      const body = document.body;
      
      if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
        return mainContent as HTMLElement;
      }
      
      if (contentDiv && contentDiv.scrollHeight > contentDiv.clientHeight) {
        return contentDiv as HTMLElement;
      }
      
      if (body.scrollHeight > body.clientHeight) {
        return body;
      }
      
      return window;
    };

    const scrollContainer = getScrollableParent();
    
    const toggleVisibility = () => {
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;
      
      if (scrollContainer === window) {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        const element = scrollContainer as HTMLElement;
        scrollTop = element.scrollTop;
        scrollHeight = element.scrollHeight;
        clientHeight = element.clientHeight;
      }
      
      // Calculate scroll progress (0-100%)
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      
      // Show "Scroll to Top" when scrolled down more than 300px
      setShowScrollTop(scrollTop > 300);
      
      // Show "Scroll to Bottom" when NOT at bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      setShowScrollBottom(distanceFromBottom > 300);

      // Detect scrolling state
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    toggleVisibility();
    scrollContainer.addEventListener('scroll', toggleVisibility as any);

    return () => {
      scrollContainer.removeEventListener('scroll', toggleVisibility as any);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 🚀 PROFESSIONAL SMOOTH SCROLL with Easing
  const smoothScrollTo = (targetPosition: number, duration: number = 800) => {
    const mainContent = document.querySelector('main');
    const contentDiv = document.querySelector('[class*="overflow"]');
    const scrollElement = mainContent || contentDiv || window;
    
    const start = scrollElement === window 
      ? window.pageYOffset 
      : (scrollElement as HTMLElement).scrollTop;
    
    const distance = targetPosition - start;
    let startTime: number | null = null;

    // Easing function (easeInOutCubic) - Professional smooth curve
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easing = easeInOutCubic(progress);
      
      const scrollTo = start + (distance * easing);
      
      if (scrollElement === window) {
        window.scrollTo(0, scrollTo);
      } else {
        (scrollElement as HTMLElement).scrollTop = scrollTo;
      }

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const scrollToTop = () => {
    smoothScrollTo(0, 800);
  };

  const scrollToBottom = () => {
    const mainContent = document.querySelector('main');
    const contentDiv = document.querySelector('[class*="overflow"]');
    const scrollElement = mainContent || contentDiv;
    
    const maxScroll = scrollElement 
      ? (scrollElement as HTMLElement).scrollHeight 
      : document.documentElement.scrollHeight;
    
    smoothScrollTo(maxScroll, 800);
  };

  return (
    <>
      {/* SCROLL PROGRESS INDICATOR */}
      {(showScrollTop || showScrollBottom) && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800/50 z-50">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          disabled={isScrolling}
          className={`
            fixed bottom-24 right-8 z-50 
            p-3.5 
            bg-gradient-to-r from-violet-500 to-cyan-500 
            hover:from-violet-600 hover:to-cyan-600 
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white rounded-full 
            shadow-2xl shadow-violet-500/50 
            transition-all duration-300 
            hover:scale-110 hover:shadow-violet-500/70 
            active:scale-95
            backdrop-blur-sm
            border border-white/10
            group
          `}
          title="Scroll to Top"
          aria-label="Scroll to top"
        >
          <svg 
            className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M5 10l7-7m0 0l7 7m-7-7v18" 
            />
          </svg>
          
          {/* Ripple Effect */}
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
        </button>
      )}

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          disabled={isScrolling}
          className={`
            fixed bottom-8 right-8 z-50 
            p-3.5 
            bg-gradient-to-r from-emerald-500 to-teal-500 
            hover:from-emerald-600 hover:to-teal-600 
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white rounded-full 
            shadow-2xl shadow-emerald-500/50 
            transition-all duration-300 
            hover:scale-110 hover:shadow-emerald-500/70 
            active:scale-95
            backdrop-blur-sm
            border border-white/10
            group
          `}
          title="Scroll to Bottom"
          aria-label="Scroll to bottom"
        >
          <svg 
            className="w-6 h-6 transform group-hover:translate-y-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
          
          {/* Ripple Effect */}
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;
