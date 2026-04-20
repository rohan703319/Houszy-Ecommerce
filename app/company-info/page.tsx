"use client";

export default function CompanyInfoPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="bg-[#445D41] text-white py-2 px-2 text-center">
        <h1 className="text-xl md:text-3xl font-bold">
          Our Company
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ABOUT */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">About Direct Care</h2>

          <p className="text-sm black leading-relaxed mb-3">
            At Direct Care, we are dedicated to transforming the online shopping experience for our customers in the UK by offering high-quality personal care, health products, and more at affordable prices. Established in 2012, our mission is to provide a smooth shopping experience, catering to diverse needs from baby and child care to beauty, skincare, and health essentials.
          </p>

          <p className="text-sm black leading-relaxed">
            Direct Care is a trusted platform designed to be your go-to destination for beauty and cosmetic products, skincare items, baby and child items, stop-smoking aids, incontinence products, and vitamin supplements. Our commitment to quality and convenience ensures that our customers receive the best products from brands they love, delivered quickly to their doorstep.
          </p>
        </div>

        {/* INFORMATION */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Information</h2>

<p className="text-sm black">
  <strong>Owner name:</strong> Brijesh Kumar
</p>

<p className="text-sm black">
  <strong>Superintendent pharmacist:</strong>{" "}
  <span className="font-semibold underline">
    Surabhi Kumari (2057840)
  </span>
</p>

<p className="text-sm black">
  <strong>Pharmacy address:</strong> Unit 38A, Plume Street, Aston, Birmingham
</p>

<p className="text-sm black">
  <strong>GPhC registration number:</strong> Awaiting
</p>

<p className="text-sm black mt-4">
  <strong>Drop us an email</strong> if you have any complaints, concerns, or feedback at{" "}
  <span className="font-semibold underline">
    Suby@direct-care.co.uk
  </span>
</p>

          <p className="text-sm black mt-4">
            Drop us an email if you have any complaints, concerns, or feedback at Suby@direct-care.co.uk
          </p>

          <p className="text-sm black mt-4 leading-relaxed">
            To complain about a pharmacy, you should first contact the pharmacy directly on their registered email address or phone number to try and resolve the issue. If you are not satisfied, you can then escalate your complaint to the local or national ombudsman or through your local Integrated Care Board (ICB). The complaint should be made within 12 months of the incident, and you should receive a response acknowledging the complaint within three working days, with a full response provided within a specified timeframe, typically under six months.
          </p>
        </div>

        {/* HERITAGE */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Our Heritage</h2>

          <p className="text-sm black leading-relaxed">
            Direct Care was born out of a vision to transform the way UK consumers access and purchase essential products. We continue to innovate and enhance our services, maintaining our dedication to extraordinary customer experience and satisfaction. Our goal is to simplify your shopping process, providing a reliable and user-friendly platform for all your personal care and health needs.
          </p>
        </div>

        {/* COMMITMENT */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Our Commitment</h2>

          <p className="text-sm black leading-relaxed">
            We are dedicated to making online shopping for essential products not only convenient but also sustainable. By leveraging cutting-edge retail models and innovative strategies, we aim to change how you buy your everyday necessities, ensuring you receive affordable, high-quality products every time.
          </p>
        </div>

      </div>
    </div>
  );
}