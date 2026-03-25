import React from 'react';
import Header from '../components/Header';
import TermsContentBusiness from '../components/TermsContentBusiness';

export default function TermsBusiness() {
  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Business Merchant Terms & Conditions" />
      <TermsContentBusiness />
    </div>
  );
}
