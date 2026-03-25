import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function BusinessRegistered() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const business = state?.business || null;
  const trialEnd = state?.trial_end_date || null;
  const pending = state?.pending_admin_approval || false;

  return (
    <div>
      <Header title="Registration Complete" />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Account Registered</h2>
          {pending ? (
            <p className="mb-4 text-gray-700">
              Thank you. Your business account has been created and is pending
              admin approval because you created a new mall. You will be
              notified when verification is complete.
            </p>
          ) : (
            <>
              <p className="mb-2 text-gray-700">
                Your account for{' '}
                <strong>{business?.name || 'the business'}</strong> has been
                successfully registered.
              </p>
              {trialEnd && (
                <p className="mb-4 text-gray-600">
                  Your free trial runs until{' '}
                  <strong>{new Date(trialEnd).toLocaleString()}</strong>.
                </p>
              )}
            </>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Go to my account
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-100 rounded"
            >
              Back to home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
