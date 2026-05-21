import { notFound } from "next/navigation";



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
    <div className="max-w-6xl mx-auto px-4 py-2">

      {/* 🔥 HERO */}
     <div className="mb-10 text-center">
  <h1 className="text-xl md:text-3xl font-bold text-[#445D41]">
    {data.pageTitle}
  </h1>
  <p className="text-gray-600 mt-2 text-lg max-w-2xl mx-auto">
    {data.pageSubtitle}
  </p>
</div>

      {/* 🔥 FEATURE CARDS */}
      {data.featureCards?.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {data.featureCards.map((card: any, i: number) => (
            <div
              key={i}
              className="border rounded-lg p-5 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg mb-2">
                {card.heading}
              </h3>
              <p className="text-sm text-gray-600">
                {card.description}
              </p>
            </div>
          ))}
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
                className="bg-[#445D41] text-white p-6 rounded-lg text-center mb-10"
              >
                <h2 className="text-xl font-bold mb-2">
                  {section.heading}
                </h2>
                <p>{section.content}</p>
              </div>
            );

          case "support":
            return (
              <div key={i} className="border-t pt-6 mt-6">
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