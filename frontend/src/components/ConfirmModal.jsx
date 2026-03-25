import React, { useState } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

export default function ConfirmModal({
  open,
  title = 'Confirm',
  description,
  onConfirm,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!onConfirm) return;
    try {
      setLoading(true);
      console.debug('ConfirmModal: invoking onConfirm');
      // call and await in case onConfirm is async
      await onConfirm();
    } catch (err) {
      console.error('Confirm action failed', err);
      toast.error(
        err?.response?.data?.error || err?.message || 'Action failed'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-gray-700 mb-4">{description}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded">
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-3 py-1 text-white rounded ${
            loading ? 'bg-red-400 cursor-wait' : 'bg-red-600'
          }`}
        >
          {loading ? 'Working…' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
