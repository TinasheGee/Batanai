import React, { useState } from 'react';

export default function SiteEditForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    contact_email: initial.contact_email || '',
    contact_phone: initial.contact_phone || '',
    contact_address: initial.contact_address || '',
    contact_hours: initial.contact_hours || '',
    terms_url: initial.terms_url || '',
    privacy_url: initial.privacy_url || '',
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="p-2 border rounded"
          placeholder="Contact Email"
          value={form.contact_email}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_email: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Contact Phone"
          value={form.contact_phone}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_phone: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded md:col-span-2"
          placeholder="Contact Address"
          value={form.contact_address}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_address: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Contact Hours"
          value={form.contact_hours}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_hours: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Terms URL"
          value={form.terms_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, terms_url: e.target.value }))
          }
        />
        <input
          className="p-2 border rounded"
          placeholder="Privacy URL"
          value={form.privacy_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, privacy_url: e.target.value }))
          }
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded bg-yellow-600 text-white"
          onClick={() => onSave(form)}
        >
          Save Site Info
        </button>
      </div>
    </div>
  );
}
