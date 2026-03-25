import React from 'react';
import Header from '../components/Header';
import TermsContentCustomer from '../components/TermsContentCustomer';

export default function TermsCustomer() {
  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Customer Terms & Conditions" />
      <TermsContentCustomer />
    </div>
  );
}
