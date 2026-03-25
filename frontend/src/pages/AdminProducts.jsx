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

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    business_id: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/products', {
          params: { page, pageSize, search },
        });
        setProducts(res.data.rows || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, search]);

  const exportCSV = () => {
    const csv = toCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const createProduct = async () => {
    if (!form.name || !form.business_id)
      return toast.error('Name and business ID required');
    try {
      const res = await api.post('/admin/products', {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        business_id: form.business_id,
      });
      // refresh current page
      setPage(1);
      setProducts((p) => [res.data, ...p]);
      setForm({ name: '', description: '', price: '', business_id: '' });
      setShowCreateModal(false);
      toast.success('Product created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create product');
    }
  };

  const removeProduct = async (id) => {
    try {
      await api.delete(`/admin/products/${id}`);
      // reload page
      setProducts((p) => p.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setConfirmOpen(false);
      setPendingDeleteId(null);
      toast.success('Product deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditValues({
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
    });
    setShowEditModal(true);
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.patch(`/admin/products/${id}`, editValues);
      setProducts((list) => list.map((it) => (it.id === id ? res.data : it)));
      setEditingId(null);
      toast.success('Product updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update product');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div>
      <Header title="Admin — Products" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="flex items-center gap-4 my-4">
          <div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              New Product
            </button>
          </div>
          <div className="ml-4">
            <input
              placeholder="Search products"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded"
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
                    Business ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {p.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.business_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setPendingDeleteId(p.id);
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
          title="Create Product"
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
              name="business_id"
              value={form.business_id}
              onChange={handleChange}
              placeholder="Business ID"
              className="w-48 px-3 py-2 border rounded"
            />
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Price"
              className="w-32 px-3 py-2 border rounded"
            />
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createProduct}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showEditModal}
          title="Edit Product"
          onClose={() => setShowEditModal(false)}
        >
          <div className="space-y-2">
            <input
              value={editValues.name}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Name"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              value={editValues.price}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, price: e.target.value }))
              }
              placeholder="Price"
              className="w-32 px-3 py-2 border rounded"
            />
            <input
              value={editValues.description}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, description: e.target.value }))
              }
              placeholder="Description"
              className="w-full px-3 py-2 border rounded"
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
          title="Delete product"
          description="Are you sure you want to delete this product?"
          onConfirm={() => removeProduct(pendingDeleteId)}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
        />
      </main>
    </div>
  );
}
