const fs = require('fs');
const file = 'c:/Ecom/src/Frontend/app/product/[slug]/ProductDetails.tsx';
let content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const groupStart = lines.findIndex(l => l.includes('{/* 🔥 GROUPED PRODUCTS + BUNDLE OFFER (SINGLE BOX) */}'));
let groupEnd = groupStart;
let braceCount = 0;
let started = false;
for (let i = groupStart + 1; i < lines.length; i++) {
  const line = lines[i];
  braceCount += (line.match(/\{/g) || []).length;
  braceCount -= (line.match(/\}/g) || []).length;
  if (!started && braceCount > 0) started = true;
  if (started && braceCount === 0 && line.includes(')}')) {
    groupEnd = i;
    break;
  }
}
const groupBlock = lines.slice(groupStart, groupEnd + 1);

const crossStart = lines.findIndex(l => l.includes('{/* PAIR IT WITH (Cross-Sell) Section */}'));
let crossEnd = crossStart;
let cBraceCount = 0;
let cStarted = false;
for (let i = crossStart + 1; i < lines.length; i++) {
  const line = lines[i];
  cBraceCount += (line.match(/\{/g) || []).length;
  cBraceCount -= (line.match(/\}/g) || []).length;
  if (!cStarted && cBraceCount > 0) cStarted = true;
  if (cStarted && cBraceCount === 0 && line.includes(')}')) {
    crossEnd = i;
    break;
  }
}

if (crossEnd < crossStart) {
  crossEnd = crossStart;
}

const relatedStart = lines.findIndex(l => l.includes('{/* RELATED PRODUCTS */}'));

const newCrossSliderBlock = `        {/* CROSS-SELL PRODUCTS SLIDER */}
        {crossSellProducts.length > 0 && (
          <section className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-20">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-[22px] md:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                Pair it with
              </h2>
            </div>
            <div className="relative">
              {shouldShowCrossNav && (
                <>
                  <button
                    id="cross-prev"
                    className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 z-20"
                  >
                    <ChevronLeft className="w-7 h-7 text-gray-700" />
                  </button>
                  <button
                    id="cross-next"
                    className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-20"
                  >
                    <ChevronRight className="w-7 h-7 text-gray-700" />
                  </button>
                </>
              )}
              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                onSwiper={(swiper) => { crossSwiperRef.current = swiper; }}
                navigation={{ prevEl: "#cross-prev", nextEl: "#cross-next" }}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
                loop
                spaceBetween={16}
                slidesPerView={2}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 16 },
                  768: { slidesPerView: 3, spaceBetween: 20 },
                  1024: { slidesPerView: 4, spaceBetween: 22 },
                  1280: { slidesPerView: 5, spaceBetween: 24 },
                }}
                className="pb-10"
              >
                {crossSellProducts.map((p) => (
                  <SwiperSlide key={p.id}>
                    <CrossSellProductCard product={p as any} getImageUrl={getImageUrl} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}`.split('\n');

let newLines = [...lines];

newLines.splice(relatedStart, 0, ...newCrossSliderBlock);
newLines.splice(crossStart, (crossEnd - crossStart) + 1, ...groupBlock);
newLines.splice(groupStart, (groupEnd - groupStart) + 1);

fs.writeFileSync(file, newLines.join('\n'));
console.log('Successfully refactored layouts!');
