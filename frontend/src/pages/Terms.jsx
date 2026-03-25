import React from 'react';
import Header from '../components/Header';

export default function Terms() {
  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Terms & Conditions" />

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Terms &amp; Conditions</h2>
          <p className="text-sm text-gray-600">Effective Date: [Insert Date]</p>
          <div className="mt-4">
            <a href="#business" className="text-brand-600 hover:underline mr-4">
              Business Merchant Terms
            </a>
            <a href="#customer" className="text-brand-600 hover:underline">
              Customer Terms
            </a>
          </div>
        </div>

        <section id="business" className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-xl font-bold mb-3">
            Business Merchant Terms &amp; Conditions
          </h3>
          <p className="mb-3">
            These Merchant Terms apply to all businesses listing
            products/services on Batanai.
          </p>

          <h4 className="font-semibold mt-4">
            1. Merchant Eligibility and Account
          </h4>
          <ul className="list-disc list-inside mb-3">
            <li>Merchant must be legally registered where required by law.</li>
            <li>
              Merchant warrants authority to bind the business to this
              agreement.
            </li>
            <li>
              Merchant must provide accurate business details and maintain
              current account information.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">2. Merchant Responsibilities</h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Provide accurate product descriptions, images, pricing and stock
              status.
            </li>
            <li>Clearly disclose promotion dates, conditions and limits.</li>
            <li>
              Fulfil confirmed orders professionally and within communicated
              timelines.
            </li>
            <li>
              Comply with all applicable consumer, tax, licensing, competition
              and product safety laws.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">3. Listings and Promotions</h4>
          <ul className="list-disc list-inside mb-3">
            <li>No false, deceptive or misleading listings.</li>
            <li>No counterfeit, prohibited, unsafe or illegal products.</li>
            <li>
              Merchant is solely responsible for listing content and legal
              compliance.
            </li>
            <li>
              Batanai may reject, suspend or remove listings at its discretion
              for policy or legal risk.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">
            4. Orders, Cancellations and Refunds
          </h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Merchant must honor valid customer purchases and promotions.
            </li>
            <li>
              If unable to fulfil, merchant must notify the customer promptly
              and provide a lawful resolution.
            </li>
            <li>
              Refund and exchange handling must follow local consumer law and
              merchant policy disclosures.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">5. Fees and Payments</h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Merchant agrees to applicable platform fees, commissions,
              subscription fees and payment processing charges, as communicated
              by Batanai.
            </li>
            <li>Batanai may revise fees with reasonable notice.</li>
            <li>
              Merchant authorizes Batanai/payment partners to process due
              charges and settlements.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">6. Customer Communications</h4>
          <ul className="list-disc list-inside mb-3">
            <li>Merchant must communicate respectfully and lawfully.</li>
            <li>
              Merchant must not use customer data for unauthorized marketing or
              disclosure.
            </li>
            <li>
              Spam, harassment, discriminatory behavior and fraud are strictly
              prohibited.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">7. Data Protection</h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Merchant may only use customer data for order fulfilment, customer
              service and lawful operational needs.
            </li>
            <li>
              Merchant must implement reasonable safeguards to protect personal
              data.
            </li>
            <li>
              Merchant must comply with applicable privacy/data protection laws.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">
            8. Reviews, Ratings and Reputation Integrity
          </h4>
          <ul className="list-disc list-inside mb-3">
            <li>Merchant must not manipulate ratings/reviews.</li>
            <li>
              No fake reviews, incentivized undisclosed reviews or suppression
              of legitimate complaints.
            </li>
            <li>
              Batanai may investigate suspicious activity and apply sanctions.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">9. Intellectual Property</h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Merchant grants Batanai a non-exclusive, royalty-free license to
              display business name, logos, listing media and promotional
              content for operating and marketing the platform.
            </li>
            <li>Merchant warrants it has rights to all submitted content.</li>
            <li>Merchant must not infringe third-party rights.</li>
          </ul>

          <h4 className="font-semibold mt-4">
            10. Service Availability and Platform Rights
          </h4>
          <ul className="list-disc list-inside mb-3">
            <li>
              Batanai may update, modify, limit or suspend platform features as
              needed for security, legal compliance or maintenance.
            </li>
            <li>
              Batanai may moderate and remove content violating policy or law.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">11. Suspension and Termination</h4>
          <p className="mb-3">
            Batanai may suspend or terminate merchant access for material
            breach, fraud, abuse, legal/regulatory requests, or repeated
            customer harm. Upon termination, Batanai may remove listings and
            disable merchant tools, subject to legal and settlement obligations.
          </p>

          <h4 className="font-semibold mt-4">12. Indemnity</h4>
          <p className="mb-3">
            Merchant agrees to indemnify and hold Batanai harmless against
            claims, penalties, damages and costs arising from merchant listings
            or products, legal non-compliance, breach of this agreement, or
            third-party IP or consumer claims related to merchant activity.
          </p>

          <h4 className="font-semibold mt-4">
            13. Disclaimers and Liability Limits
          </h4>
          <ul className="list-disc list-inside mb-3">
            <li>Services are provided “as is” and “as available.”</li>
            <li>
              Batanai does not guarantee sales volume, traffic, uninterrupted
              uptime or specific outcomes.
            </li>
            <li>
              To the maximum extent allowed by law, Batanai’s liability is
              limited to amounts paid by merchant to Batanai in the preceding
              [12] months.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">14. Governing Law and Disputes</h4>
          <ul className="list-disc list-inside mb-3">
            <li>Governed by the laws of [Insert Jurisdiction].</li>
            <li>
              Disputes resolved in courts/tribunals of [Insert Jurisdiction],
              unless mandatory law requires otherwise.
            </li>
          </ul>

          <h4 className="font-semibold mt-4">15. Amendments</h4>
          <ul className="list-disc list-inside mb-3">
            <li>Batanai may update these Merchant Terms with notice.</li>
            <li>
              Continued use after the effective date of updates constitutes
              acceptance.
            </li>
          </ul>

          <p className="mt-4">
            Merchant Acceptance Text: “By registering as a business on Batanai,
            I confirm I am authorized to bind this business and I agree to the
            Merchant Terms and Privacy Policy.”
          </p>
        </section>

        <section id="customer" className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-xl font-bold mb-3">
            Customer Terms &amp; Conditions
          </h3>
          <p className="mb-3">
            Welcome to Batanai. These terms apply when you create an account,
            browse deals, contact businesses, or post reviews.
          </p>

          <h4 className="font-semibold mt-4">1. Using Batanai</h4>
          <p className="mb-3">
            Keep your login details safe. You are responsible for activity on
            your account.
          </p>

          <h4 className="font-semibold mt-4">2. What Batanai Does</h4>
          <p className="mb-3">
            Batanai helps you discover products, promotions, and businesses.
            Businesses are responsible for their listings, prices, stock, and
            fulfilment. Batanai is a platform facilitator unless clearly stated
            otherwise.
          </p>

          <h4 className="font-semibold mt-4">3. Shopping and Orders</h4>
          <p className="mb-3">
            Product details and pricing come from each business. Final purchase
            terms (delivery, refunds, exchanges, stock) are between you and the
            business. If a listing is incorrect, the business must correct it
            promptly.
          </p>

          <h4 className="font-semibold mt-4">4. Location and Distance</h4>
          <p className="mb-3">
            If you allow location access, Batanai may use it to show nearby
            offers. Distances are estimates and may vary. You can change
            location permissions in your browser/device settings.
          </p>

          <h4 className="font-semibold mt-4">5. Reviews and Ratings</h4>
          <p className="mb-3">
            Reviews must be truthful and based on real experiences. Do not post
            abusive, threatening, discriminatory, false, or misleading content.
            Batanai may remove reviews that violate these rules.
          </p>

          <h4 className="font-semibold mt-4">6. Messaging Rules</h4>
          <p className="mb-3">
            Use messaging respectfully. No spam, fraud, harassment, or illegal
            activity. Batanai may restrict access for abuse.
          </p>

          <h4 className="font-semibold mt-4">7. Privacy</h4>
          <p className="mb-3">
            Your personal data is handled under the Privacy Policy. We use data
            to run your account, improve service, and keep the platform secure.
          </p>

          <h4 className="font-semibold mt-4">8. Prohibited Use</h4>
          <ul className="list-disc list-inside mb-3">
            <li>Attempt fraud or unauthorized payments.</li>
            <li>Misrepresent identity or information.</li>
            <li>Upload illegal or harmful content.</li>
            <li>Interfere with platform systems or security.</li>
          </ul>

          <h4 className="font-semibold mt-4">
            9. Account Suspension or Closure
          </h4>
          <p className="mb-3">
            Batanai may suspend or close accounts for serious or repeated
            violations. We may remove content that violates policy or law.
          </p>

          <h4 className="font-semibold mt-4">10. Liability</h4>
          <p className="mb-3">
            Batanai provides services “as is” and does not guarantee
            uninterrupted access. To the extent permitted by law, Batanai is not
            liable for indirect losses from business-to-customer transactions.
          </p>

          <h4 className="font-semibold mt-4">11. Changes to These Terms</h4>
          <p className="mb-3">
            We may update these terms from time to time. Continued use after
            updates means you accept the updated terms.
          </p>

          <h4 className="font-semibold mt-4">12. Contact</h4>
          <p className="mb-3">Email: [Insert contact email]</p>

          <p className="mt-4">
            Acceptance Text: “I have read and agree to the Customer Terms and
            Conditions and Privacy Policy.”
          </p>
        </section>
      </div>
    </div>
  );
}
