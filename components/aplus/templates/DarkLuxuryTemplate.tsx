"use client";

export default function DarkLuxuryTemplate({ data }: { data: Record<string, string> }) {
  const heroTitle = data.heroTitle || "";
  const heroSubtitle = data.heroSubtitle || "";
  const heroImage = data.heroImage || "";

  return (
    <div className="aplus-luxury bg-slate-955 text-slate-100 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 font-sans space-y-12">
      {/* Hero Section */}
      {heroImage && (
        <div 
          className="aplus-hero relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-cover bg-center flex items-end p-6 sm:p-10 text-white shadow-lg border border-slate-850" 
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 text-center items-center">
            {heroTitle && <h3 className="text-xl sm:text-4xl font-light tracking-widest text-white uppercase">{heroTitle}</h3>}
            <div className="w-16 h-[1px] bg-amber-450 my-3" />
            {heroSubtitle && <p className="text-[10px] sm:text-xs text-slate-300 max-w-lg font-light tracking-wide uppercase">{heroSubtitle}</p>}
          </div>
        </div>
      )}

      {/* Alternating Split Rows */}
      {['1', '2', '3'].map((num, i) => {
        const title = data[`split${num}Title`] || "";
        const text = data[`split${num}Text`] || data[`split${num}Desc`] || "";
        const image = data[`split${num}Image`] || "";
        if (!image && !title) return null;
        return (
          <div key={num} className={`aplus-split flex flex-col md:flex-row gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
            {image && (
              <div className="aplus-split-img w-full md:w-1/2 rounded-2xl overflow-hidden aspect-video bg-slate-90 shadow-md">
                <img src={image} alt={title || "Luxury highlight"} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="aplus-split-txt w-full md:w-1/2 space-y-3.5">
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">0{num} / Feature Details</span>
              {title && <h4 className="text-lg sm:text-2xl font-light text-slate-100 tracking-wide uppercase">{title}</h4>}
              <div className="w-8 h-[2px] bg-amber-500 rounded" />
              {text && <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light whitespace-pre-line">{text}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
