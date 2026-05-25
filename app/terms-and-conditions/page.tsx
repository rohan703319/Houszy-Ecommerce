"use client";

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* HERO */}
      <div className="bg-black text-[#f38918] py-3 text-center px-4">
        <h1 className="text-xl md:text-3xl font-bold">
          Terms & Conditions
        </h1>
      </div>

      <div className="max-w-8xl mx-auto px-4 py-2 space-y-2 mb-5">

        {/* INTRO */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Important Notice
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            These terms and conditions govern how we supply the products listed on this site, https://houszy.co.uk/ to customers. By using our website and buying our products, you accept these terms and conditions, together with our privacy policy.
          </p>

          <p className="text-base text-gray-700 leading-relaxed mt-3">
            Please carefully read the terms and conditions before you use or purchase any product from our website. If you do not accept our terms and conditions, or our privacy policy, please do not use or order any product on this website.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Registration
          </h2>

          <ul className="list-disc pl-5 text-base text-gray-700 space-y-2">
            <li>
              When you register to the Houszy website as a customer, the personal data that you provide must be correct, current, accurate and complete.
            </li>
            <li>
              You must not register using a name that you are not authorised to use or impersonate another person or entity.
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Our Rights
          </h2>

          <ul className="list-disc pl-5 text-base text-gray-700 space-y-2">
            <li>
              Houszy reserves the right to modify these terms and conditions at any time.
            </li>
            <li>
              We may withdraw or change this website temporarily or permanently without notice.
            </li>
            <li>
              Continued use of the website means acceptance of any updated terms.
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Third-Party Links
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            Houszy may provide links to third-party websites and resources. We are not responsible for their content, privacy policies, terms, products, services or any losses arising from their use.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Placing and Accepting Orders
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            An order number or order acknowledgement email does not constitute order acceptance. Acceptance of an order only occurs once the product has been dispatched.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Order Cancellation
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            Orders placed before 2pm Monday to Saturday are usually dispatched the same day. To cancel an order please contact
            <strong> customersupport@houszy.co.uk </strong>
            or call
            <strong> +441214616837</strong>.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Price and Payment
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            All prices are displayed in GBP and include UK VAT. Delivery charges are shown during checkout. Houszy accepts debit and credit card payments and may verify customer details through third-party services.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Product Description Information
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            We make every effort to ensure product descriptions, prices, measurements and images are accurate, however actual product colours may vary depending on your display settings.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Availability and Delivery
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            Product availability is subject to stock levels. If an item becomes unavailable, customers will be informed and offered a refund or exchange where applicable.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Intellectual Property
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            All content, trademarks, graphics and intellectual property on the Houszy website remain the property of Houszy or its licensors and may not be reproduced without permission.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Indemnity
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            You agree to indemnify and hold harmless Houszy, its employees, directors and suppliers against claims, liabilities, damages and expenses resulting from misuse of this website or breach of these terms.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Governing Jurisdiction and Law
          </h2>

          <p className="text-base text-gray-700 leading-relaxed">
            These Terms and Conditions are governed by the laws of England and Wales and any disputes shall be subject to the jurisdiction of the English Courts.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Company Details
          </h2>

          <div className="text-base text-gray-700 space-y-2">
            <p>
              <strong>Houszy</strong> is a trademark of Direct Care LTD
            </p>

            <p>Spacebox Business Park</p>
            <p>Unit 38A, Plume Street</p>
            <p>B6 7RT Birmingham</p>
            <p>United Kingdom</p>

            <p className="pt-2">
              Company Number: <strong>06874500</strong>
            </p>

            <p>
              VAT Number: <strong>985055882</strong>
            </p>
          </div>
        </div>




      </div>
    </div>
  );
}