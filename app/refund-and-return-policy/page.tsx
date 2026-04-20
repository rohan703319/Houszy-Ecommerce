"use client";

import { RefreshCw, AlertCircle, PackageCheck, Phone, Mail } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="bg-[#445D41] text-white py-3 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Refund and Returns Policy
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* OVERVIEW */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-sm black leading-relaxed">
            We always strive for your highest possible satisfaction, and we hope the product you ordered at Direct Care is what you were expecting. In case you have changed your mind about keeping your Direct Care purchase, please return the item(s) to us in an unused condition, within 30 working days of receiving it. We will process the exchange or refund, as long as the item meets our terms and conditions explained in this policy.
          </p>

          <p className="text-sm black mt-3">
            Customers must understand that the returned product should not be damaged or show any signs of wear, and also it should be in its original packing with manufacturer labels still attached. It is important to know that a refund will not be processed if the returned product/item is damaged, washed, or shows any signs of frequent use, the refund will not be processed.
          </p>
        </div>

        {/* NON RETURNABLE */}
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-600" />
            <h2 className="text-lg font-semibold text-red-700">
              Please Note
            </h2>
          </div>

          <p className="text-sm text-red-700 mb-3">
            Direct Care is unable to accept returns for items below unless they are damaged or faulty:
          </p>

          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            <li>Perishable items.</li>
            <li>Baby Milks</li>
            <li>Mixed goods post-delivery that cannot be separated</li>
            <li>Custom-made or personalised items</li>
            <li>Items with broken or removed protective seals (for health or hygiene reasons)</li>
          </ul>

          <p className="text-xs text-red-600 mt-3">
            Remember, this does not affect your statutory rights.
          </p>
        </div>

        {/* REFUND PROCESS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="text-[#445D41]" />
            <h2 className="text-lg font-semibold">Refund Process</h2>
          </div>

          <p className="text-sm black">
            Once the returned product/item is back in our warehouse and passed the inspection process, your refunds will automatically be processed.
          </p>
        </div>

        {/* CONTACT + RETURN PROCESS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            How to Contact Us When Returning Your Product/Item?
          </h2>

          <p className="text-sm black mb-3">
            Our customer service team is available between 8am to 8pm to assist you, so feel free to call +441216616357/+441214616835 or email customersupport@direct-care.co.uk. If you choose to reach out through email, you are advised to provide all the necessary details of your return request, including:
          </p>

          <ul className="list-disc pl-5 text-sm black space-y-1">
            <li>First and last name</li>
            <li>Order Date</li>
            <li>Order number</li>
            <li>Date of delivery</li>
            <li>Address (including postcode)</li>
            <li>Telephone number</li>
            <li>Reason for refund</li>
          </ul>

          <p className="text-sm black mt-3">
            As soon as you notify us that you want to return the product/item(s), a return label will be created and sent to you. You will be requested to send the parcel to our warehouse at the address below and within 30 days of your notice:
          </p>
        </div>

        {/* ADDRESS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm black">
            Direct Care Warehouse address: Spacebox Business Park Unit 38A, Plume Street, B6 7RT, Birmingham, United Kingdom.
          </p>

          <p className="text-sm black mt-3">
            Upon receiving the returned product/item back to our warehouse and conducting the inspection process, the total purchase price will be refunded to your original payment option. Normally, the refund process will take up to 3-4 working days, and this may depend on the bank’s handling time.
          </p>
        </div>

        {/* EXCHANGE */}
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-green-700 mb-2">
            An Exchange Instead Of A Refund
          </h2>

          <p className="text-sm text-green-700">
            At Direct Care, we do offer exchange facilities on products/items that are quality for exchange. If you are returning your items, keep in mind that we will collect your unwanted item in its original packaging when we deliver the new one, this means NO delivery charges for your exchanged product.
          </p>
        </div>

        {/* CONTACT */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Contact Us
          </h2>

          <div className="space-y-2 text-sm black">
           Call our customer service team at +441216616357/+441214616835 or email customersupport@direct-care.co.uk. for any questions about our refund and return policy.
          </div>
        </div>

      </div>
    </div>
  );
}