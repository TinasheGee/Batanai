import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const r of rows) {
    const vals = keys.map((k) => {
      const v = r[k] === null || r[k] === undefined ? '' : String(r[k]);
      return '"' + v.replaceAll('"', '""') + '"';
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

export default function AdminMallsList() {
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingVerifyId, setPendingVerifyId] = useState(null);
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/malls', {
          params: { page, pageSize, search },
        });
        setMalls(res.data.rows || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load malls');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, search]);

  const exportCSV = () => {
    const csv = toCSV(malls);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malls_export_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const createMall = async () => {
    if (!form.name) return toast.error('Name required');
    try {
      const res = await api.post('/admin/malls', form);
      setMalls((s) => [res.data, ...s]);
      setForm({ name: '', address: '', city: '' });
      setShowCreateModal(false);
      toast.success('Mall created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create mall');
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditValues({
      name: m.name || '',
      address: m.address || '',
      city: m.city || '',
    });
    setShowEditModal(true);
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.patch(`/admin/malls/${id}`, editValues);
      setMalls((list) => list.map((it) => (it.id === id ? res.data : it)));
      setEditingId(null);
      toast.success('Mall updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update mall');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setShowEditModal(false);
  };

  const deleteMall = async (id) => {
    try {
      await api.delete(`/admin/malls/${id}`);
      setMalls((s) => s.filter((x) => x.id !== id));
      setConfirmOpen(false);
      setPendingDeleteId(null);
      toast.success('Mall deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete mall');
    }
  };

  const verifyMall = async (id) => {
    try {
      const res = await api.patch(`/admin/malls/${id}/verify`);
      // backend returns { message, mall }
      const updated = (res.data && res.data.mall) || null;
      if (updated) {
        setMalls((s) =>
          s.map((m) => (String(m.id) === String(updated.id) ? updated : m))
        );
      } else {
        // fallback: mark locally if response not containing mall
        setMalls((s) =>
          s.map((m) =>
            String(m.id) === String(id) ? { ...m, is_verified: true } : m
          )
        );
      }
      toast.success(
        (res.data && res.data.message) ||
          'Mall verified and businesses activated'
      );
      return res.data;
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify mall');
      throw err;
    }
  };

  const toggleMallActive = async (id, activate) => {
    try {
      const res = await api.patch(`/admin/malls/${id}`, {
        is_active: activate,
      });
      const updated = res.data;
      // If API returns object directly (updated mall) or wrapped, handle both
      const mallObj =
        updated && updated.id
          ? updated
          : updated && updated.mall
            ? updated.mall
            : null;
      if (mallObj) {
        setMalls((s) =>
          s.map((m) => (String(m.id) === String(mallObj.id) ? mallObj : m))
        );
      } else {
        setMalls((s) =>
          s.map((m) => (m.id === id ? { ...m, is_active: activate } : m))
        );
      }
      toast.success(activate ? 'Mall enabled' : 'Mall disabled');
    } catch (err) {
      console.error('Toggle mall active failed', err);
      toast.error('Failed to update mall active state');
    }
  };

  return (
    <div>
      <Header title="Admin — Malls" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold mb-4">Malls</h2>

        <div className="flex items-center gap-4 my-4">
          <div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              New Mall
            </button>
            <input
              placeholder="Search malls"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ml-3 px-3 py-2 border rounded"
            />
          </div>
          <div className="ml-auto">
            <button
              className="px-3 py-1 bg-gray-100 rounded"
              onClick={exportCSV}
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : malls.length === 0 ? (
          <p>No malls.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {malls.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.is_verified ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {!m.is_verified && (
                          <button
                            onClick={() => {
                              setPendingVerifyId(m.id);
                              setVerifyConfirmOpen(true);
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded"
                          >
                            Verify
                          </button>
                        )}
                        {typeof m.is_active !== 'undefined' && (
                          <button
                            onClick={() => toggleMallActive(m.id, !m.is_active)}
                            className={`px-2 py-1 text-white rounded ${m.is_active ? 'bg-red-600' : 'bg-green-600'}`}
                          >
                            {m.is_active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(m)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setPendingDeleteId(m.id);
                            setConfirmOpen(true);
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
        />

        <Modal
          open={showCreateModal}
          title="Create Mall"
          onClose={() => setShowCreateModal(false)}
        >
          <div className="space-y-2">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="w-48 px-3 py-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createMall}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showEditModal}
          title="Edit Mall"
          onClose={() => setShowEditModal(false)}
        >
          <div className="space-y-2">
            <input
              value={editValues.name || ''}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Name"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              value={editValues.address || ''}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, address: e.target.value }))
              }
              placeholder="Address"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              value={editValues.city || ''}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, city: e.target.value }))
              }
              placeholder="City"
              className="w-48 px-3 py-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  cancelEdit();
                }}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveEdit(editingId);
                  setShowEditModal(false);
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          open={confirmOpen}
          title="Delete mall"
          description="Are you sure you want to delete this mall?"
          onConfirm={() => deleteMall(pendingDeleteId)}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
        />
        <ConfirmModal
          open={verifyConfirmOpen}
          title="Verify mall"
          description="Verify this mall and activate its businesses?"
          onConfirm={async () => {
            console.debug(
              'AdminMallsList: confirm verify for id=',
              pendingVerifyId
            );
            try {
              const res = await verifyMall(pendingVerifyId);
              console.debug('AdminMallsList: verify result', res);
            } catch (err) {
              console.error('AdminMallsList verify failed', err);
            } finally {
              setVerifyConfirmOpen(false);
              setPendingVerifyId(null);
            }
          }}
          onCancel={() => {
            setVerifyConfirmOpen(false);
            setPendingVerifyId(null);
          }}
        />
      </main>
    </div>
  );
}
