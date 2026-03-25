import React from 'react';

export default function TermsContentCustomer() {
  return (
    <div className="max-w-4xl mx-auto px-6 mt-0">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">
          Customer Terms &amp; Conditions
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Effective Date: [Insert Date]
        </p>

        <p className="mb-3">
          These Terms govern the use of Batanai by customers purchasing goods
          and services from listed businesses.
        </p>

        <h3 className="font-semibold mt-4">1. Using the Platform</h3>
        <ul className="list-disc list-inside mb-3">
          <li>
            Users must be of legal age to form binding contracts in their
            jurisdiction.
          </li>
          <li>
            Accounts must use accurate personal information and may not be
            shared in violation of these Terms.
          </li>
          <li>Users are responsible for maintaining account security.</li>
        </ul>

        <h3 className="font-semibold mt-4">2. Orders, Payments and Refunds</h3>
        <ul className="list-disc list-inside mb-3">
          <li>
            Placing an order constitutes an offer to purchase from the merchant;
            order acceptance occurs when the merchant confirms the order.
          </li>
          <li>
            Prices shown may include taxes where indicated; payment methods are
            those presented at checkout.
          </li>
          <li>
            Refunds and cancellations are subject to merchant policies and
            applicable consumer law; Batanai may assist in resolving disputes
            but is not the seller.
          </li>
        </ul>

        <h3 className="font-semibold mt-4">3. Reviews and Community Conduct</h3>
        <ul className="list-disc list-inside mb-3">
          <li>Reviews must be honest, lawful and not defamatory.</li>
          <li>
            Incentivized or fake reviews are prohibited unless fully disclosed
            in accordance with platform policy.
          </li>
          <li>
            Harassment, discrimination, threats or abusive behaviour are not
            permitted.
          </li>
        </ul>

        <h3 className="font-semibold mt-4">
          4. Intellectual Property and Content
        </h3>
        <ul className="list-disc list-inside mb-3">
          <li>
            Users grant Batanai a license to display user-generated content for
            platform operations.
          </li>
          <li>
            Users must not upload content that infringes third-party IP rights
            or violates laws.
          </li>
        </ul>

        <h3 className="font-semibold mt-4">5. Privacy</h3>
        <p className="mb-3">
          Use of personal data is governed by our Privacy Policy. By using the
          service you consent to collection and processing as described in the
          Privacy Policy.
        </p>

        <h3 className="font-semibold mt-4">6. Prohibited Use</h3>
        <ul className="list-disc list-inside mb-3">
          <li>
            Illegal, fraudulent or malicious use of the platform is prohibited.
          </li>
          <li>
            Users must not attempt to circumvent security, manipulate listings,
            or interfere with platform operations.
          </li>
        </ul>

        <h3 className="font-semibold mt-4">
          7. Disclaimers and Limitation of Liability
        </h3>
        <ul className="list-disc list-inside mb-3">
          <li>Platform services provided “as is”.</li>
          <li>
            Batanai is not the seller of listed products unless otherwise
            stated; liability for product quality rests with the merchant and
            seller under applicable law.
          </li>
        </ul>

        <h3 className="font-semibold mt-4">8. Governing Law and Disputes</h3>
        <p className="mb-3">
          These Terms are governed by the laws of [Insert Jurisdiction].
          Consumer rights under mandatory laws remain unaffected.
        </p>

        <p className="mt-4">
          Customer Acceptance Text: “By creating an account or placing an order,
          I agree to the Batanai Customer Terms and Privacy Policy.”
        </p>
      </div>
    </div>
  );
}
