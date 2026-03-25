import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

export default function AdminBusinesses() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');

  const [malls, setMalls] = useState([]);

  // Modal / form state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    description: '',
    mall_id: null,
    is_active: true,
    is_verified: true,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const fetchMalls = async () => {
    try {
      const r = await api.get('/malls');
      setMalls(r.data || []);
    } catch (err) {
      console.warn('Failed to load malls', err);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/businesses', {
        params: { page, pageSize, search },
      });
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load businesses', err);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMalls();
  }, []);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      category: '',
      description: '',
      mall_id: null,
      is_active: true,
      is_verified: true,
    });
    setOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name || '',
      email: b.email || '',
      phone: b.phone || '',
      category: b.category || '',
      description: b.description || '',
      mall_id: b.mall_id || null,
      is_active: !!b.is_active,
      is_verified: !!b.is_verified,
    });
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async () => {
    try {
      if (editing && editing.id) {
        const res = await api.patch(`/admin/businesses/${editing.id}`, form);
        toast.success('Business updated');
      } else {
        const res = await api.post('/admin/businesses', form);
        toast.success('Business created');
      }
      setOpen(false);
      fetch();
    } catch (err) {
      console.error('Save failed', err);
      toast.error(err?.response?.data?.error || 'Save failed');
    }
  };

  const confirmDelete = (b) => {
    setToDelete(b);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/businesses/${toDelete.id}`);
      toast.success('Business deleted');
      setConfirmOpen(false);
      setToDelete(null);
      fetch();
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Delete failed');
    }
  };

  const verify = async (id) => {
    try {
      // Use admin verify endpoint if available
      await api.patch(`/admin/businesses/${id}/verify`);
      toast.success('Business verified');
      fetch();
    } catch (err) {
      // fallback to updating the flag
      try {
        await api.patch(`/admin/businesses/${id}`, {
          is_verified: true,
          is_active: true,
        });
        toast.success('Business verified');
        fetch();
      } catch (e) {
        console.error('Verify failed', e);
        toast.error('Failed to verify business');
      }
    }
  };

  const getMallName = (id) => {
    if (!id) return '—';
    const m = malls.find((x) => String(x.id) === String(id));
    return m ? m.name : id;
  };

  return (
    <div>
      <Header title="Admin — Businesses" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Manage Businesses</h2>
          <div className="flex items-center gap-2">
            <input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <button
              onClick={openCreate}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
            >
              New Business
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Mall</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-600"
                  >
                    No businesses found.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">{b.id}</td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3">{b.email}</td>
                    <td className="px-4 py-3">{b.phone || '—'}</td>
                    <td className="px-4 py-3">{getMallName(b.mall_id)}</td>
                    <td className="px-4 py-3">
                      {b.is_verified ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3">{b.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!b.is_verified && (
                          <button
                            onClick={() => verify(b.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(b)}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(b)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
        />

        <Modal
          open={open}
          title={editing ? 'Edit Business' : 'New Business'}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-3">
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            <select
              name="mall_id"
              value={form.mall_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Select Mall (optional) --</option>
              {malls.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_verified"
                checked={form.is_verified}
                onChange={handleChange}
              />{' '}
              Verified
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />{' '}
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          open={confirmOpen}
          title="Delete business"
          description={`Are you sure you want to delete ${toDelete?.name || ''}?`}
          onConfirm={doDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </main>
    </div>
  );
}
