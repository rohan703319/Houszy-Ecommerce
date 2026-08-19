import { notFound } from "next/navigation";
import * as LucideIcons from "lucide-react";

async function getDeliveryData(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/DeliveryStrip/by-slug/${slug}`,
      {
        next: { revalidate: 600 },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();

    if (json.success) {
      return json.data;
    }

    return null;
  } catch {
    return null;
  }
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getDeliveryData(slug);

  if (!data) return notFound();

  let parsedContent: any = null;

  try {
    parsedContent = JSON.parse(data.pageContentJson);
  } catch {
    parsedContent = null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* 🔥 HERO */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          {data.pageTitle}
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          {data.pageSubtitle}
        </p>
      </div>

      {/* 🔥 FEATURE CARDS */}
      {data.featureCards?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {data.featureCards.map((card: any, idx: number) => {
            const IconComponent = (LucideIcons as any)[card.icon] || LucideIcons.Sparkles;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#f38918] mb-4 group-hover:bg-[#f38918] group-hover:text-white transition-colors duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {card.heading}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      )}


      {/* 🔥 INFO POINTS */}
      {data.infoPoints?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">
            {data.infoSectionTitle}
          </h2>

          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {data.infoPoints.map((point: string, i: number) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔥 DYNAMIC CONTENT */}
      {parsedContent?.sections?.map((section: any, i: number) => {
        switch (section.type) {
          case "heading": {
            const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(section.level)
              ? section.level
              : 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            
            const styles = {
              h1: "text-3xl font-black mb-4 mt-8",
              h2: "text-2xl font-bold mb-3 mt-6",
              h3: "text-xl font-semibold mb-2 mt-4",
              h4: "text-lg font-medium mb-2 mt-4",
              h5: "text-base font-medium mb-2 mt-3",
              h6: "text-sm font-medium mb-2 mt-3"
            };

            return (
              <Tag
                key={i}
                className={`${styles[Tag]} text-gray-900 ${
                  section.bold ? 'font-bold' : ''
                } ${section.italic ? 'italic' : ''} ${
                  section.strike ? 'line-through' : ''
                }`}
              >
                {section.text}
              </Tag>
            );
          }

          case "intro":
            return (
              <p key={i} className="mb-6 text-gray-700">
                {section.content}
              </p>
            );

          case "steps":
            return (
              <div key={i} className="mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p className="text-gray-600 mb-4">
                  {section.intro}
                </p>

                <div className="space-y-4">
                  {section.steps.map((step: any) => (
                    <div key={step.number}>
                      <p className="font-semibold">
                        {step.number}. {step.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "bullets":
            return (
              <div key={i} className="mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p className="text-gray-600 mb-3">
                  {section.intro}
                </p>

                <ul className="list-disc pl-5 space-y-2">
                  {section.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            );

          case "checklist":
            return (
              <div key={i} className="mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p className="text-gray-600 mb-3">
                  {section.intro}
                </p>

                <div className="space-y-3">
                  {section.items.map((item: any, idx: number) => (
                    <div key={idx}>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );

          case "cta":
            return (
              <div
                key={i}
                className="bg-[#f38918] text-white p-6 rounded-lg text-center mb-10"
              >
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p>{section.content}</p>
              </div>
            );

          case "support":
            return (
              <div key={i} className="border-t pt-6 mt-6 mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p className="text-gray-600 mb-2">
                  {section.content}
                </p>
                <p className="text-sm">📞 {section.phone}</p>
                <p className="text-sm">📧 {section.email}</p>
                <p className="text-sm">⏰ {section.hours}</p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}