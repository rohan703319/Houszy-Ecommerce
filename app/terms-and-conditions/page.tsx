"use client";

export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="bg-[#445D41] text-white py-3 text-center px-4">
        <h1 className="text-xl md:text-3xl font-bold">
          Terms & Conditions
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* INTRO */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm black leading-relaxed">
            These terms and conditions govern the use of our website at https://direct-care.co.uk/ (referred to as “this site”) and all orders placed through it. We recognise that legal documentation such as this can be complex, and we aim to make it understandable for you.
          </p>
        </div>

        {/* INTRODUCTION */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Introduction</h2>

          <p className="text-sm black leading-relaxed mb-3">
            We are Direct Care Ltd, our company is registered in England and Wales (Company Number: 06874500), with our business operations based in England and our registered office located at:
          </p>

          <p className="text-sm font-semibold black leading-relaxed">
            Direct Care Ltd <br />
            Unit 38A, Plume Street <br />
            Spacebox Business Park <br />
            B6 7RT Birmingham
          </p>
        </div>

        {/* REGISTRATION */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">
            Registration, Acceptance of Terms, And Contract With You
          </h2>

          <p className="text-sm black leading-relaxed mb-3">
            Your use of this site and any orders placed on it are subject to English law, and any legal disputes shall be resolved exclusively in English courts.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            Ownership and responsibility for products transfer to you upon dispatch. It is your responsibility to adhere to any restrictions regarding product reception and usage.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            To register and use this website, you must be at least 18 years old, and the information provided must be accurate. You are accountable for your site usage and orders: hence, safeguard your login credentials to prevent misuse.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            While we take precautions in preparing site content, we disclaim all warranties concerning site content to the extent permitted by law.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            We, along with our directors or affiliated entities, bear no liability for losses or claims arising directly or indirectly from site usage, except for damages resulting from negligence causing death or personal injury by us, our directors, or employees.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            Links to other websites on this site are provided for informational purposes only. We have no control over these external sites, and thus disclaim any responsibility or liability for their content. The inclusion of links does not indicate our endorsement of the linked site’s content.
          </p>

          <p className="text-sm black leading-relaxed">
            Non-enforceability of any term or condition shall not affect the validity of the remaining provisions.
          </p>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Orders And Payment</h2>

          <p className="text-sm black leading-relaxed mb-3">
            We reserve the right to accept or reject any order without explanation. Our confirmation email acknowledges receipt of your order, but a contract is formed only upon sending you an invoice.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            Payment is typically processed upon goods dispatch (except for PayPal payments, deducted upon order placement). In case of payment rejection, you must promptly arrange alternative payment methods.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            Failure to fully pay for an order may result in reasonable collection charges or solicitors’ fees added to your customer account.
          </p>

          <p className="text-sm black leading-relaxed mb-3">
            For EU residents, product prices include VAT. Outside the EU or exempt from VAT, prices exclude VAT. These terms do not supersede your consumer rights. All site offers are subject to stock availability.
          </p>

          <p className="text-sm black leading-relaxed">
            Products with the best-before date are dispatched within a minimum three-month period. For extended storage or multipack orders beyond three months, please contact our Customer Services team.
          </p>
        </div>

        {/* MARKETING */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Marketing and Promotions</h2>

          <p className="text-sm black mb-2">
            Discounts and offers using voucher codes are subject to the following conditions:
          </p>

          <ul className="list-disc pl-5 text-sm black space-y-1">
            <li>One voucher code per order.</li>
            <li>Legal restrictions prohibit discounts or promotions on certain items.</li>
            <li>Further conditions may apply.</li>
            <li>Multi-buy promotions will discount the cheapest item. These promotions apply only to UK orders.</li>
          </ul>
        </div>

        {/* PRODUCT REVIEW */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Product Review</h2>

          <p className="text-sm black leading-relaxed">
            All reviews undergo approval. Reviews unrelated to products, mentioning service, or deemed offensive will not be published. Service-related feedback should be directed to our customer service team.
          </p>
        </div>

        {/* PRIVACY */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Privacy Policy</h2>

          <p className="text-sm black leading-relaxed">
            Your privacy matters to us. Please consult our Privacy Policy for details regarding the collection, usage, and safeguarding of data. We process personal information following our Privacy Policy and may verify your identity and credit rating through third-party providers.
          </p>
        </div>

        {/* INTELLECTUAL */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Intellectual Property</h2>

          <p className="text-sm black leading-relaxed">
            We hold the copyright for all designs, text, graphics, and formatting on this site. Limited copying or printing for personal, non-commercial use is permitted. Brand names, product names, service names, titles, and copyrights belong to their respective owners and are not authorised for use.
          </p>

          <p className="text-sm black mt-3">
            These terms may be modified in response to the Consumer Bill of Rights Act 2015.
          </p>
        </div>

        {/* CONTACT */}
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
          <h2 className="text-lg font-semibold mb-3">Contact Information</h2>

          <p className="text-sm black">
            You can reach us by phone at +441216616357/+441214616835 or via email at customersupport@direct-care.co.uk.
          </p>
        </div>

      </div>
    </div>
  );
}