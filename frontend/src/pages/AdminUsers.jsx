import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';

const pageSize = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/users', {
          params: { page, pageSize, search },
        });
        setUsers(res.data.rows || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error('Failed to load users', err?.response || err);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, search]);

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      toast.success('Role updated');
      // refresh current page
      setPage(1);
    } catch (err) {
      console.error('Role change failed', err?.response || err);
      toast.error('Failed to change role');
    }
  };

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      setConfirmOpen(false);
      setPendingDeleteId(null);
      setUsers((u) => u.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Delete failed', err?.response || err);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div>
      <Header title="Admin — Users" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold mb-4">Users</h2>

        <div className="flex items-center gap-4 mb-4">
          <input
            placeholder="Search users"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded w-64"
          />
        </div>

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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    No users.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => changeRole(u.id, 'admin')}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
                        >
                          Admin
                        </button>
                        <button
                          onClick={() => changeRole(u.id, 'business')}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Business
                        </button>
                        <button
                          onClick={() => changeRole(u.id, 'customer')}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                          Customer
                        </button>
                        <button
                          onClick={() => confirmDelete(u.id)}
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
          onPageChange={setPage}
        />

        <ConfirmModal
          open={confirmOpen}
          title="Delete user"
          description="Delete this user? This action cannot be undone."
          onConfirm={() => deleteUser(pendingDeleteId)}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }}
        />
      </main>
    </div>
  );
}
