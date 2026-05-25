"use client";

import { useState } from "react";


const categories = [
  {
    id: 1,
    title: "General Questions",
    faqs: [
      {
        question: "What products do you offer on your site?",
        answer:
          "Houszy is a Big Brand, and we offer a wide range of kitchenware, homeware and gym equipment products, including cookware, glassware, and fitness accessories.",
      },
      {
        question: "What are your delivery charges?",
        answer:
          "For all orders placed on the Houszy website, you can select either:\n\n• Standard Delivery: Free\n• Next Day Delivery: £3.99\n• Royal Mail Special Delivery Guaranteed 1PM: £10.99",
      },
      {
        question: "My order arrived damaged - what should I do?",
        answer:
          "We always inspect and check all products before shipping, but in case the item is damaged during transit, kindly contact our friendly customer service team for assistance.",
      },
      {
        question: "What is your return policy?",
        answer:
          "To learn more about our Return Policy, please visit our refund and return policy page.",
      },
      {
        question: "Can I modify or cancel my order after it has been placed?",
        answer:
          "Sure, for order modification or cancellation, feel free to contact our customer service team at customersupport@houszy.co.uk or call +441214616837. They will assist you in every step.",
      },
    ],
  },

  {
    id: 2,
    title: "Cookware",
    faqs: [
      {
        question:
          "Why Houszy Cookware sets are the must-have options in the market?",
        answer:
          "Houszy cookware sets are not only made of durable materials, but they are food-safe and feature an improved granite coating for unmatched non-stick capabilities. Also, these non-stick cookware sets feature a stainless steel base that promotes even-heat distribution.",
      },
      {
        question:
          "What cleaning and maintenance steps are recommended to prolong the lifespan of the cookware?",
        answer:
          "Houszy cookware sets are easy to clean and maintain. With the non-stick granite coating, all you need is just a gentle hand wash. Avoid using a dishwasher as it may damage the non-stick coating.",
      },
      {
        question:
          "Are the handles securely attached to the cookware, and are they comfortable to hold?",
        answer:
          "While you will have to drive the screws to attach the Bakelite Silicone handle with the pressed aluminium body, the easy DIY process makes the handles securely attached to the cookware, providing a sturdy and comfortable hold.",
      },
      {
        question:
          "Does the pressed aluminium used in the cookware contain any harmful chemicals such as PFOA or PFAS?",
        answer:
          "No, all the Houszy cookware products are non-toxic and food-safe, meaning there are no harmful chemicals including PFOA or PFAS that can leach into your meals.",
      },
      {
        question:
          "Can this cookware be used on all types of stovetops, including induction?",
        answer:
          "Yes, apart from being induction-ready, the Houszy cookware range can be used on almost all types of stovetops such as gas, ceramic, electric, and downdraft.",
      },
      {
        question:
          "How does the non-stick coating hold up over time, and is it safe to use metal utensils with it?",
        answer:
          "The granite coating on our cookware sets is scratch-resistant and requires the use of plastic, wooden, or silicone cooking utensils. Only clean with soap, water, a soft sponge, or wipe with a thin oil film for maximum durability.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const formatAnswer = (text: string) => {
    const phoneRegex = /(\+?\d[\d\s\/\-]{7,})/g;
    const emailRegex =
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/g;

    let formatted = text
      .replace(
        phoneRegex,
        `<span class="font-semibold text-black">$1</span>`
      )
      .replace(
        emailRegex,
        `<span class="font-semibold text-black">$1</span>`
      );

    formatted = formatted
      .replace(
        "• Standard Delivery: Free",
        `<div class="ml-1">• Standard Delivery: <span class="font-semibold text-black">Free</span></div>`
      )
      .replace(
        "• Next Day Delivery: £3.99",
        `<div class="ml-1">• Next Day Delivery: <span class="font-semibold text-black">£3.99</span></div>`
      )
      .replace(
        "• Royal Mail Special Delivery Guaranteed 1PM: £10.99",
        `<div class="ml-1">• Royal Mail Special Delivery Guaranteed 1PM: <span class="font-semibold text-black">£10.99</span></div>`
      );

    return formatted;
  };

  return (
    <div className="bg-white min-h-screen">

      {/* 🔥 HERO */}
      <div className="bg-black text-[#f38918] py-2 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Frequently Asked Questions
        </h1>

      </div>

      {/* 🔥 FAQ LIST */}
      <div className="max-w-8xl mx-auto px-4 py-2 space-y-4 mb-5">
        <div className="grid lg:grid-cols-[350px_1fr] gap-10">

          {/* LEFT SIDEBAR */}
          <div className="bg-white border rounded-sm h-fit">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(index)}
                className={`w-full flex items-center gap-4 px-8 py-8 border-b text-left transition ${activeCategory === index
                  ? "text-[#f38918]"
                  : "text-black"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeCategory === index
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-black"
                    }`}
                >
                  {category.id}
                </div>

                <span className="text-xl font-medium">
                  {category.title}
                </span>
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {categories[activeCategory].id}.{" "}
              {categories[activeCategory].title}
            </h2>

            <div className="space-y-4">
              {categories[activeCategory].faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-base font-semibold text-black mb-2">
                    {faq.question}
                  </h3>

                  <div
                    className="text-[16px] text-gray-600 leading-5 whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html: formatAnswer(faq.answer),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}