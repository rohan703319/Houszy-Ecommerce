"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Who is Direct Care?",
    answer:
      "Direct Care is the UK’s leading online retailer specialising in baby and child care, skincare items, and a broad range of everyday essentials. We are the best in the digital marketplace, offering an extensive selection of products from reputable brands. Our customers enjoy the luxury of accessing a vast array of items from the comfort of their own homes, ensuring a convenient shopping experience. For more information about our products and services, please click here.",
  },
  {
    question: "What is the best way to get in touch with your Customer Care team?",
    answer:
      "You can reach our Customer Care team through multiple channels:\n\nPhone: Call us at +441216616357/+441214616835 for immediate assistance.\nEmail: Send your queries to customersupport@direct-care.co.uk",
  },
  {
    question: "What are the steps to place an order with Direct Care?",
    answer:
      "Placing an order with Direct Care is simple:\n\nBrowse: Visit our website and browse through our range of products.\n\nSelect: Choose the items you wish to purchase and add them to your cart.\n\nCheckout: Proceed to checkout, where you will need to provide your shipping and payment information.\n\nConfirm: Review your order and confirm the purchase.",
  },
  {
    question: "How can I keep track of my order's status?",
    answer:
      "You can track your order status through the following methods:\n\nOrder Confirmation Email: Check the email you received after placing your order for tracking details.\n\nAccount Dashboard: Log in to your Direct Care account and navigate to the ‘Order History’ section.\n\nCustomer Care: Contact our Customer Care team for updates on your order status.",
  },
  {
    question: "What is the usual time frame for refund processing?",
    answer:
      "Refunds are typically processed within 3-4 working days from the date of approval. The exact timeline may vary depending on your payment method and bank processing times. Please note that certain conditions or exceptions may apply, and our Customer Care team will provide detailed information during the refund process.",
  },
  {
    question: "Which types of payment do you accept?",
    answer:
      "We accept a variety of payment methods to ensure a convenient shopping experience:\n\nCredit/Debit Cards: Visa, MasterCard, American Express\n\nDigital Wallets: PayPal, Google Pay",
  },
  {
    question: "What should I do to qualify for free delivery?",
    answer:
      "To qualify for free delivery, you must meet the following criteria:\n\nMinimum Order Value: Orders over £35 qualify for free standard delivery.\n\nEligible Locations: Free delivery is available within the UK mainland. Additional charges may apply for remote areas.",
  },
  {
    question: "How can I return my purchase?",
    answer:
      "You have the right to return your items within 30 days. For additional information, please refer to our complete returns policy.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
const formatAnswer = (text: string) => {
  // Phone numbers detect
  const phoneRegex = /(\+?\d[\d\s\/\-]{7,})/g;

  // Email detect
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/g;

  let formatted = text
    .replace(phoneRegex, `<span class="font-semibold text-black">$1</span>`)
    .replace(emailRegex, `<span class="font-semibold text-black">$1</span>`);

  return formatted;
};
  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* 🔥 HERO */}
      <div className="bg-[#445D41] text-white py-2 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Frequently Asked Questions
        </h1>
       
      </div>

      {/* 🔥 FAQ LIST */}
      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="bg-white rounded-xl border shadow-sm divide-y">

          {faqs.map((faq, index) => (
            <div key={index}>

              {/* QUESTION */}
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                <span className="text-sm md:text-base font-semibold text-gray-900">
                  {faq.question}
                </span>

                {openIndex === index ? (
                  <ChevronUp className="text-[#445D41]" size={18} />
                ) : (
                  <ChevronDown className="text-[#445D41]" size={18} />
                )}
              </button>

              {/* ANSWER */}
           <div
  className={`grid transition-all duration-300 ${
    openIndex === index
      ? "grid-rows-[1fr] opacity-100"
      : "grid-rows-[0fr] opacity-0"
  }`}
>
  <div className="overflow-hidden">
   <div
  className="px-5 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line"
  dangerouslySetInnerHTML={{ __html: formatAnswer(faq.answer) }}
/>
  </div>
</div>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}