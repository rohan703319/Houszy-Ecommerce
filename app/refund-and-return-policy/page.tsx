"use client";

import { RefreshCw, AlertCircle, PackageCheck, Phone, Mail } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="bg-black text-[#f38918] py-3 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Refund and Returns Policy
        </h1>
      </div>

      <div className="max-w-8xl mx-auto px-4 py-2 space-y-2 mb-5">

        {/* OVERVIEW */}
        <div className="p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Overview</h2>
          <p className="text-base text-gray-700 leading-relaxed">
            Your highest possible satisfaction is what we strive for, and we hope you will love your Houszy purchase/order. If the product you have ordered is not what you were looking for, you may return the item(s) to us in an unused condition, within 30 working days of receiving it. We want the process to be as simple as possible, and this policy does not affect your statutory rights.
          </p>

          <p className="text-base text-gray-700 leading-relaxed mt-3">
            While the item(s) may be tried out, you must understand that it must not be damaged or show signs of wear, and should be in its original packing and with the manufacturer labels still attached. In case the returned product/item is damaged, washed, or shows any signs of frequent use, the refund will not be processed.
          </p>

          <p className="text-base text-gray-700 leading-relaxed mt-3">
            <strong>NB:</strong> It is advisable to know that refunds will automatically be processed once the product/item is back in our warehouse and passed the necessary inspection.
          </p>
        </div>
        <div className="p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">
            How to Contact Us When Returning Your Product/Item?
          </h2>

          <p className="text-base text-gray-700 mb-3">
            Feel free to give us a call at{" "}
            <strong className="text-black">+441214616837</strong>
            {" "}or email{" "}
            <strong className="text-black">
              customersupport@houszy.co.uk
            </strong>.
            You are advised to provide all the necessary details of your return request when sending an email, including:
          </p>

          <ul className="list-disc pl-5 text-base text-gray-700 space-y-1">
            <li>First and last name</li>
            <li>Date of the original order</li>
            <li>Order number</li>
            <li>Date of delivery</li>
            <li>Address (including postcode)</li>
            <li>Telephone number</li>
            <li>Name and product code</li>
            <li>Reason for refund</li>
          </ul>

          <p className="text-base text-gray-700 mt-3">
            After you have notified us that you want to return the product/item(s), a return label will be provided for you and you will be requested to return the parcel to our warehouse within 14 days of your notice.
          </p>

        </div>

        {/* ADDRESS */}
        <div className="p-6 rounded-xl">
          <p className="text-base text-gray-700">
            Houszy Warehouse address:
            <strong className="text-black">
              {" "}Spacebox Business Park Unit 38A, Plume Street, B6 7RT, Birmingham, United Kingdom.
            </strong>
          </p>

          <p className="text-base text-gray-700 mt-3">
            After we have received the product/item back to our warehouse and go through the inspection process, the total purchase price will be refunded to your original payment method as soon as possible. This normally takes up to 3-4 working days, depending on the bank’s handling time.
          </p>
        </div>

        {/* EXCHANGE */}
        <div className="p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-orange-700 mb-2">
            An Exchange Instead Of A Refund
          </h2>

          <p className="text-base text-orange-700">
            Houszy offers exchange facilities if you are returning your product/item, it is important to know that we will collect your unwanted item in its original packaging, and you have to pay for the delivery charges of the exchanged product as we will not take care of it.
          </p>
        </div>
        <div className="p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-orange-700 mb-2">
            Money-Back Guarantee
          </h2>

          <p className="text-base text-orange-700">
            We are confident in the quality of our products, which is why we are proud to offer a 100% Money-Back Guarantee. If you are not completely satisfied with your purchase, we will refund the full purchase price after the item is returned and passes inspection. This ensures you can shop with complete peace of mind.
          </p>
        </div>

        <div className="p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">
            Requirements
          </h2>

          <ul className="list-disc pl-5 text-base text-gray-700 space-y-2">
            <li>
              The product must be in its original packaging, unused, and undamaged, with all manufacturer labels still attached.
            </li>
            <li>
              If the returned item is damaged, washed, or shows any signs of frequent use, the refund will not be processed.
            </li>
            <li>
              Refunds will be processed once the product is returned to our warehouse and has passed inspection. This typically takes 3-4 working days, depending on bank processing times.
            </li>
          </ul>
        </div>
        {/* CONTACT */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Contact Us
          </h2>

          <p className="text-base text-gray-700">
            Feel free to contact our Houszy customer service team by calling us at{" "}
            <strong className="text-black">+441214616837</strong>
            {" "}or email{" "}
            <strong className="text-black">
              customersupport@houszy.co.uk
            </strong>
            {" "}for any questions about our refund and return policy.
          </p>
        </div>

      </div>
    </div>
  );
}