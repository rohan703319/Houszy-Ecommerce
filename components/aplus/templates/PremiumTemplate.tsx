"use client";

import { ChevronDown } from "lucide-react";

export default function PremiumTemplate({ data }: { data: Record<string, string> }) {
  const heroTitle = data.heroTitle || "";
  const heroSubtitle = data.heroSubtitle || "";
  const heroImage = data.heroImage || "";
  
  return (
    <div className="aplus-premium max-w-7xl mx-auto bg-white text-slate-900 rounded-3xl overflow-hidden">
      {/* Hero Section */}
      {heroImage && (
        <div 
          className="aplus-hero relative w-full aspect-[21/9] bg-cover bg-center flex items-center justify-center p-6 sm:p-10 text-white shadow-md" 
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="aplus-hero-overlay absolute inset-0 bg-gradient-to-t from-slate-955/80 via-slate-955/20 to-transparent" />
          <div className="aplus-hero-txt relative z-10 space-y-2 text-center flex flex-col items-center justify-center">
            {data.heroTag && <span className="aplus-tag bg-violet-650 text-white px-2 py-0.5 rounded text-xs font-semibold uppercase">{data.heroTag}</span>}
            {heroTitle && <h2 className="text-xl sm:text-3xl font-extrabold">{heroTitle}</h2>}
            {heroSubtitle && <p className="text-xs sm:text-base text-slate-200">{heroSubtitle}</p>}
          </div>
        </div>
      )}

      {/* Main Content Area with padding */}
      <div className="px-6 py-10 sm:px-10 sm:py-12 space-y-12">
        {/* Feature List */}
        {(data.feat1Title || data.feature1Title) && (
          <div className="aplus-features bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-100 max-w-3xl mx-auto text-center space-y-4">
            <ul className="space-y-4">
              {['1', '2', '3', '4', '5'].map(num => {
                const title = data[`feature${num}Title`] || data[`feat${num}Title`] || "";
                const desc = data[`feature${num}Desc`] || data[`feat${num}Desc`] || "";
                if (!title) return null;
                return (
                  <li key={num} className="space-y-1">
                    <strong className="block text-slate-800 text-base sm:text-lg">{title}</strong>
                    {desc && <span className="block text-slate-600 text-sm">{desc}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Split Sections */}
        {['1', '2', '3'].map((num, i) => {
          const title = data[`split${num}Title`] || "";
          const text = data[`split${num}Text`] || data[`split${num}Desc`] || "";
          const image = data[`split${num}Image`] || "";
          if (!image && !title) return null;
          return (
            <div key={num} className={`aplus-split flex flex-col md:flex-row gap-8 items-center justify-between ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              {image && (
                <img src={image} alt={title || "Split image"} className="w-full md:w-[40%] max-w-[420px] h-auto hover:scale-[1.01] transition duration-500" />
              )}
              <div className="aplus-split-txt w-full md:w-[55%] space-y-3">
                {title && <h3 className="text-lg sm:text-2xl font-bold text-slate-800">{title}</h3>}
                {text && <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-line">{text}</p>}
              </div>
            </div>
          );
        })}

        {/* FAQ Accordion */}
        {['1', '2', '3'].some(num => data[`faq${num}Question`]) && (
          <div className="aplus-faq space-y-4 pt-8 max-w-3xl mx-auto w-full">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 text-center">Frequently Asked Questions</h3>
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
              {['1', '2', '3'].map(num => {
                const question = data[`faq${num}Question`] || "";
                const answer = data[`faq${num}Answer`] || "";
                if (!question) return null;
                return (
                  <details key={num} className="group bg-white">
                    <summary className="w-full flex justify-between items-center p-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition cursor-pointer list-none">
                      <span>{question}</span>
                      <ChevronDown className="h-4 w-4 text-slate-550 group-open:rotate-180 transition-transform" />
                    </summary>
                    {answer && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-655 leading-relaxed whitespace-pre-line border-t border-slate-50">
                        <p>{answer}</p>
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
