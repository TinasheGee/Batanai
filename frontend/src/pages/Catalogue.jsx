import React, { useState, useEffect, useRef } from 'react';
import BusinessLayout from '../components/BusinessLayout';
import api from '../api/axios';

export default function Catalogue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [businessId, setBusinessId] = useState(null);
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    category: '',
    imageFile: null,
  });

  // Dropdown States
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const catRef = useRef(null);
  const sortRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (catRef.current && !catRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 1. Initial Business Load
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const userRes = await api.get('/user/dashboard');
        const businesses = userRes.data.businesses;
        if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id);
        }
      } catch (err) {
        console.error('Failed to load business', err);
      }
    };
    fetchBusiness();
  }, []);

  // 2. Fetch Products & Categories when filters change
  const fetchProducts = async (opts = {}) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const params = {
        limit: 100,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sort: selectedSort,
        search: searchTerm,
        ...opts,
      };

      const res = await api.get(`/business/${businessId}/products`, {
        params,
      });
      setProducts(res.data.products);

      if (res.data.categories) {
        setCategories(['All', ...res.data.categories]);
      }
    } catch (err) {
      console.error('Failed to fetch filtered products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [businessId, selectedCategory, selectedSort, searchTerm]);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <BusinessLayout title="Our Catalogue">
      {/* Main Content Card - Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 min-h-[600px]">
        {/* Top Row: Title + Rating */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-3xl font-extrabold text-[#0047AB]">
            Our Catalogue
          </h2>
          {/* Add Product Button for Business Owners */}
          {businessId && (
            <div className="ml-0 md:ml-4">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setForm({
                    name: '',
                    description: '',
                    price: '',
                    unit: '',
                    category: '',
                  });
                  setShowModal(true);
                }}
                className="ml-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow hover:bg-green-700 transition"
              >
                + Add Product
              </button>
            </div>
          )}
          {/* Rating Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2 flex items-center gap-3">
            <div className="flex text-yellow-400 text-2xl">
              {'★'.repeat(3)}
              <span className="text-gray-300">{'★'.repeat(2)}</span>
            </div>
            <span className="font-bold text-gray-800 text-sm">
              3.5 (158 Reviews)
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md mb-6">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search our Products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-full border-2 border-gray-300 shadow-inner text-gray-700 font-medium focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-4 mb-6 relative">
          {/* Category Dropdown */}
          <div className="relative flex-1 max-w-[200px]" ref={catRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full bg-[#0047AB] text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md hover:bg-blue-800 transition"
            >
              {selectedCategory === 'All' ? 'Category' : selectedCategory}{' '}
              <span className="text-xs">▼</span>
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center ${selectedCategory === cat ? 'bg-blue-50 text-[#0047AB] font-bold' : 'text-gray-700'}`}
                    >
                      {cat}
                      {selectedCategory === cat && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 max-w-[200px]" ref={sortRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full bg-[#0047AB] text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md hover:bg-blue-800 transition"
            >
              Price <span className="text-xs">▼</span>
              {/* Keeping label "Price" as per design, even though it mixes sort types */}
            </button>

            {showSortDropdown && (
              <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {[
                  'Oldest',
                  'Highest Rating',
                  'Lowest Rating',
                  'Most Commented',
                  'A-Z',
                ].map((option) => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedSort(option);
                      setShowSortDropdown(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-0 font-medium ${selectedSort === option ? 'bg-blue-50 text-[#0047AB]' : 'text-gray-700'}`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 font-semibold">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-semibold">
            No products match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border border-gray-800 bg-white">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative border border-gray-800 p-4 hover:shadow-lg transition-all flex flex-col items-center text-center bg-[#cae6fa]"
              >
                {/* Title */}
                <h3 className="font-bold text-gray-900 text-sm mb-3">
                  {product.name}
                </h3>

                {/* Image Placeholder */}
                <div className="bg-white p-2 rounded-2xl shadow-sm mb-3 w-32 h-24 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">
                      {product.name} Image
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="text-gray-900 font-bold text-sm">
                  ${Number(product.price).toFixed(2)}
                </p>

                {/* Description */}
                <p className="text-gray-700 text-xs mb-1 line-clamp-2">
                  {product.description || product.name}
                </p>

                {/* Star Icon (Bottom Right) */}
                <div className="absolute bottom-3 right-3 text-2xl">
                  <span className="text-yellow-400 drop-shadow-sm">★</span>
                </div>
                {/* Edit / Delete Controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setForm({
                        name: product.name || '',
                        description: product.description || '',
                        price: product.price || '',
                        unit: product.unit || '',
                        category: product.category || '',
                      });
                      setShowModal(true);
                    }}
                    className="bg-white/90 px-2 py-1 rounded text-xs font-semibold border hover:bg-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Delete this product?')) return;
                      try {
                        await api.delete(`/products/${product.id}`);
                        fetchProducts();
                      } catch (err) {
                        console.error('Failed to delete product', err);
                      }
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="p-2 border rounded"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Category
                  </label>
                  <select
                    className="p-2 border rounded w-full"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((c) => c && c !== 'All')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <textarea
                  className="p-2 border rounded"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="p-2 border rounded flex-1"
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                  <input
                    className="p-2 border rounded w-32"
                    placeholder="Unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        imageFile: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full"
                  />
                  {editingProduct &&
                    editingProduct.image_url &&
                    !form.imageFile && (
                      <div className="mt-2 text-xs text-gray-600">
                        Current: {editingProduct.image_url}
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (editingProduct) {
                        // If an image file is selected, send multipart/form-data to PUT (backend accepts upload.single('image'))
                        if (form.imageFile) {
                          const payload = new FormData();
                          payload.append('name', form.name);
                          payload.append('description', form.description);
                          payload.append('price', form.price);
                          payload.append('unit', form.unit);
                          if (form.category)
                            payload.append('category', form.category);
                          payload.append('image', form.imageFile);
                          await api.put(
                            `/products/${editingProduct.id}`,
                            payload,
                            {
                              headers: {
                                'Content-Type': 'multipart/form-data',
                              },
                            }
                          );
                        } else {
                          const payload = { ...form };
                          // remove imageFile if present
                          delete payload.imageFile;
                          await api.put(
                            `/products/${editingProduct.id}`,
                            payload
                          );
                        }
                      } else {
                        const payload = new FormData();
                        payload.append('name', form.name);
                        payload.append('description', form.description);
                        payload.append('price', form.price);
                        payload.append('unit', form.unit);
                        if (form.category)
                          payload.append('category', form.category);
                        if (form.imageFile)
                          payload.append('image', form.imageFile);
                        await api.post(
                          `/business/${businessId}/products`,
                          payload,
                          {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          }
                        );
                      }
                      setShowModal(false);
                      // reset imageFile after save
                      setForm((f) => ({ ...f, imageFile: null }));
                      fetchProducts();
                    } catch (err) {
                      console.error('Failed to save product', err);
                      alert('Failed to save product');
                    }
                  }}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
