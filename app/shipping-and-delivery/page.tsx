"use client";

import { Truck, Clock, Package, MapPin } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="bg-[#445D41] text-white py-2 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Shipping And Delivery
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* INTRO */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm black leading-relaxed">
            Direct Care recognises that when you purchase a product online, you generally expect it to be delivered to your doorstep as swiftly as possible. Please refer to our shipping and delivery information below to understand how it operates.
          </p>
        </div>

        {/* SHIPPING DETAILS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Package className="text-[#445D41]" />
            <h2 className="text-lg font-semibold">
              Shipping and Tracking Details
            </h2>
          </div>

          <p className="text-sm black mb-3">
            Orders above <strong>£35 qualify for free delivery</strong>. Once your order is confirmed and your goods are dispatched from our Direct Care Warehouse, we will notify you by email. This email will include the following:
          </p>

          <ul className="list-disc pl-5 text-sm black space-y-1">
            <li>Parcel Number</li>
            <li>Item/Product information in the shipment</li>
            <li>Tracking number</li>
          </ul>
        </div>

        {/* DELIVERY INFO */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Delivery Information
          </h2>

          <ul className="list-disc pl-5 text-sm black space-y-2">
            <li>Standard Delivery: £2.99</li>
            <li>Next Day Delivery: £3.75 (Order before 1 PM)</li>
          </ul>

          <p className="text-sm black mt-4">
            Please Note: Deliveries typically occur between 10 am and 5 pm, and all estimated delivery times are calculated from the moment you place your order. They do not include weekends and Bank Holidays. A customer’s signature may be required in some instances.
          </p>
        </div>

        {/* NEXT DAY */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Next-Day Delivery
          </h2>

          <p className="text-sm black leading-relaxed">
            Any orders placed before 1 pm from Monday to Friday will be dispatched the same day and delivered the following working day. Orders placed after 1 pm on a Friday or over the weekend will be delivered the next working day.
          </p>
        </div>

        {/* DESTINATIONS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="text-[#445D41]" />
            <h2 className="text-lg font-semibold">
              Delivery Destinations and Restrictions
            </h2>
          </div>

          <p className="text-sm black leading-relaxed">
            Delivery is from Monday to Friday, except for bank holidays, and the products on https://www.direct-care.co.uk/ are delivered throughout the UK mainland and Northern Ireland, Isle of Man, Isle of Wight, and Scottish Highlands. Please note that the postcodes below do not qualify for next-day delivery:
          </p>

          <div className="text-xs black mt-3 max-h-60 overflow-y-auto leading-relaxed">
            AB37, AB38, AB55, AB56, FK20, GY1, IV2, GY2, IV4, IV5, IV6, IV7, IV8, IV9, IV10, GY3, IV12, GY4, GY5, IV15, GY6, IV17, GY7, IV19, GY8, IV21, GY9, IV23, GY10, IV25, JE1, IV27, JE2, IV30, JE3, IV32, AB54, IV40, PH16, IV42, BF1, IV44, AB10, IV46, AB11, IV48, AB12, IV51, AB13, IV53, AB14, IV55, AB15, IV63, KA27, AB16, KW1, AB21, KW3, KW4, KW5, AB22, KW7, AB23, KW9, KW10, AB24, KW12, AB25, KW14, PA20, AB30, PA22, AB31, PA24, AB32, PA26, AB33, PA28, AB39, PA30, AB41, PA32, AB42, PA34, AB43, PA36, AB44, PA38, AB45, PA42, AB51, PA44, AB52, PA46, AB53, PA48, PA60, PA62, PA64, PA66, PA68, PA70, PA72, PA74, PA76, PA78, PA80, PH21, PH23, PH25, PH30, PH32, PH34, PH36, PH38, PH40, PH42, PH44, PH50, PO30, PO31, PO32, PO33, PO34, PO35, PO36, PO37, PO38, PO39, PO40, PO41, KW16, PH18, FK18, FK19, TR22, TR24, BT, IM, ZE, HS, HS1, HS2, HS3, HS4, HS5, HS6, HS7, HS8, HS9, IV1, IV3, IV11, IV13, IV14, IV16, IV18, IV20, IV22, IV24, IV26, IV28, IV31, IV36, IV41, IV43, IV45, IV47, IV49, IV52, IV54, IV56, KA28, KW2, KW6, KW8, KW11, KW13, KW15, KW17, PA21, PA23, PA25, PA27, PA29, PA31, PA33, PA35, PA37, PA39, PA40, PA41, PA43, PA45, PA47, PA49, PA61, PA63, PA65, PA67, PA69, PA71, PA73, PA75, PA77, PH17, PH19, PH20, PH22, PH24, PH26, PH31, PH33, PH35, PH37, PH39, PH41, PH43, PH49, ZE1, ZE2, ZE3, BT1, BT2, BT3, BT4, BT5, BT6, BT7, BT8, BT9, BT10, BT11, BT12, BT13, BT14, BT15, BT16, BT17, BT18, BT19, BT20, BT21, BT22, BT23, BT24, BT25, BT26, BT27, BT28, BT29, BT30, BT31, BT32, BT33, BT34, BT35, BT36, BT37, BT38, BT39, BT40, BT41, BT42T79, BT80, BT43, BT44, BT45, BT46, BT47, BT48, BT49, BT51, BT52, BT53, BT54, BT55, BT56, BT57, BT60, BT61, BT62, BT63, BT64, BT65, BT66, BT67, BT68, BT69, BT70, BT71, BT74, BT75, BT76, BT77, BT78, BT81, BT82, BT92, BT93, BT94, BT99, IM1, IM2, IM3, IM4, IM5, IM6, IM7, IM8, IM9, IM99, TR21, TR23, TR25, PH15, AB34, AB35, AB36, FK17, FK21, G83, IV29, IV33, IV34, IV35, JE4, BT50, BT58, BT59, BT72, BT73, BT83, BT84, BT85, BT86, BT87, BT88, BT89, BT90, IV37, IV38, IV39, IV50, IV99, PH10, PH13, SP11
          </div>
        </div>

      </div>
    </div>
  );
}