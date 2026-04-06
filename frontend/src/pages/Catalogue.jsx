import React, { useState, useEffect, useRef } from 'react';
import BusinessLayout from '../components/BusinessLayout';
import api from '../api/axios';
import { toast, Toaster } from 'react-hot-toast';

export default function Catalogue() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [categoriesHierarchy, setCategoriesHierarchy] = useState([]);
  const [flatCategories, setFlatCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [businessId, setBusinessId] = useState(null);
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // Delete Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [showUnitWarning, setShowUnitWarning] = useState(false);
  const [dontAskUnitAgain, setDontAskUnitAgain] = useState(false);

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

  // load user preference for skipUnitWarning from server
  useEffect(() => {
    const loadPref = async () => {
      try {
        const res = await api.get('/user/me');
        if (res.data && typeof res.data.skip_unit_warning !== 'undefined') {
          setDontAskUnitAgain(!!res.data.skip_unit_warning);
        }
      } catch (e) {
        // ignore
      }
    };
    loadPref();
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
        // keep product-specific categories for fallback
        const prodCats = Array.isArray(res.data.categories)
          ? res.data.categories
          : [];
        // do not overwrite global flatCategories here
        // but keep product categories if needed elsewhere
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

  // Fetch global categories (hierarchical) for filters and product form
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/business/categories');
        if (res.data && Array.isArray(res.data.categories)) {
          const data = res.data.categories;
          setCategoriesHierarchy(data);
          // flatten: include top-level and subcategories
          const flat = ['All'];
          data.forEach((c) => {
            if (c && c.name) flat.push(c.name);
            if (Array.isArray(c.subcategories)) flat.push(...c.subcategories);
          });
          setFlatCategories(flat);
          setCategories(flat);
        }
      } catch (e) {
        console.warn('Failed to load global categories', e?.message || e);
      }
    };
    loadCategories();
  }, []);

  return (
    <BusinessLayout title="Our Catalogue">
      {/* Main Content Card - Glassmorphism */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 min-h-[600px]">
        {/* Top Row: Title + Rating */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-3xl font-extrabold text-brand-600">
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
          {/* Rating Box removed per request */}
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
            className="w-full pl-4 pr-10 py-2.5 rounded-full border-2 border-gray-300 shadow-inner text-gray-700 font-medium focus:outline-none focus:border-brand-500 bg-white"
          />
        </div>

        {/* Filters Row */}
        <div className="flex gap-4 mb-6 relative">
          {/* Category Dropdown */}
          <div className="relative flex-1 max-w-[200px]" ref={catRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full bg-brand-600 text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md hover:bg-brand-500 transition"
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
                <div className="max-h-40 overflow-y-auto scrollbar-thin">
                  {categoriesHierarchy && categoriesHierarchy.length > 0
                    ? categoriesHierarchy
                        .filter((c) => {
                          const term = categorySearch.toLowerCase();
                          if (!term) return true;
                          if (c.name.toLowerCase().includes(term)) return true;
                          return (
                            Array.isArray(c.subcategories) &&
                            c.subcategories.some((s) =>
                              s.toLowerCase().includes(term)
                            )
                          );
                        })
                        .map((cat) => (
                          <div key={cat.name}>
                            <div
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                setShowCategoryDropdown(false);
                              }}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-brand-200 flex justify-between items-center ${
                                selectedCategory === cat.name
                                  ? 'bg-brand-200 text-brand-600 font-bold'
                                  : 'text-gray-700'
                              }`}
                            >
                              {cat.name}
                              {selectedCategory === cat.name && <span>✓</span>}
                            </div>
                            {Array.isArray(cat.subcategories) &&
                              cat.subcategories
                                .filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(categorySearch.toLowerCase())
                                )
                                .map((sub) => (
                                  <div
                                    key={sub}
                                    onClick={() => {
                                      setSelectedCategory(sub);
                                      setShowCategoryDropdown(false);
                                    }}
                                    className={`px-8 py-2 text-sm cursor-pointer hover:bg-brand-100 flex justify-between items-center ${
                                      selectedCategory === sub
                                        ? 'bg-brand-100 text-brand-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {sub}
                                    {selectedCategory === sub && <span>✓</span>}
                                  </div>
                                ))}
                          </div>
                        ))
                    : filteredCategories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-brand-200 flex justify-between items-center ${selectedCategory === cat ? 'bg-brand-200 text-brand-600 font-bold' : 'text-gray-700'}`}
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
              className="w-full bg-brand-600 text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md hover:bg-brand-500 transition"
            >
              {selectedSort} <span className="text-xs">▼</span>
            </button>

            {showSortDropdown && (
              <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {[
                  'Newest',
                  'Oldest',
                  'Price Low to High',
                  'Price High to Low',
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
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-brand-200 border-b border-gray-100 last:border-0 font-medium ${selectedSort === option ? 'bg-brand-200 text-brand-600' : 'text-gray-700'}`}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative border border-gray-200 rounded-2xl pt-10 px-4 pb-6 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center text-center bg-[#cae6fa] overflow-hidden min-h-[240px]"
              >
                {/* Title */}
                <h3 className="font-bold text-gray-900 text-sm mb-3">
                  {product.name}
                </h3>

                {/* Image Placeholder */}
                <div className="bg-white p-2 rounded-2xl shadow-sm mb-3 w-32 h-24 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${product.image_url}`}
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
                <div className="absolute top-3 right-4 flex gap-2 z-20">
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
                    className="bg-white/90 p-1.5 rounded-md text-xs font-semibold border hover:bg-white shadow-sm"
                    aria-label="Edit product"
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-gray-800"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setProductToDelete(product)}
                    className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 shadow-sm"
                    aria-label="Delete product"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                      />
                    </svg>
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
                    {categoriesHierarchy && categoriesHierarchy.length > 0
                      ? categoriesHierarchy.map((cat) => (
                          <optgroup key={cat.name} label={cat.name}>
                            <option value={cat.name}>{cat.name}</option>
                            {Array.isArray(cat.subcategories) &&
                              cat.subcategories.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                          </optgroup>
                        ))
                      : flatCategories
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
                    Image <span className="text-red-500">*</span>
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
                    required={!editingProduct}
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
                    // Validation
                    if (!form.name?.trim()) {
                      alert('Please enter a product name');
                      return;
                    }
                    if (!form.description?.trim()) {
                      alert('Please enter a product description');
                      return;
                    }
                    if (!form.price || parseFloat(form.price) <= 0) {
                      alert('Please enter a valid price');
                      return;
                    }
                    if (!form.unit?.trim()) {
                      if (dontAskUnitAgain) {
                        // proceed
                      } else {
                        setShowUnitWarning(true);
                        return;
                      }
                    }
                    if (!form.category) {
                      alert('Please select a category');
                      return;
                    }
                    // For new products, image is mandatory
                    if (!editingProduct && !form.imageFile) {
                      alert('Please upload a product image');
                      return;
                    }

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
                          // Do NOT set Content-Type manually — axios sets it with the correct boundary for FormData
                          await api.put(
                            `/business/products/${editingProduct.id}`,
                            payload
                          );
                        } else {
                          const payload = { ...form };
                          // remove imageFile if present
                          delete payload.imageFile;
                          await api.put(
                            `/business/products/${editingProduct.id}`,
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
                        // Do NOT set Content-Type manually — axios sets it with the correct boundary for FormData
                        await api.post(
                          `/business/${businessId}/products`,
                          payload
                        );
                      }
                      setShowModal(false);
                      setForm((f) => ({ ...f, imageFile: null }));
                      fetchProducts();
                      toast.success(
                        editingProduct ? 'Product updated!' : 'Product added!'
                      );
                    } catch (err) {
                      console.error('Failed to save product', err);
                      const msg =
                        err?.response?.data?.error ||
                        err.message ||
                        'Failed to save product';
                      toast.error(`Error: ${msg}`);
                    }
                  }}
                  className="px-4 py-2 rounded bg-brand-600 text-white font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit confirmation modal */}
        {showUnitWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-3">No unit provided</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to save without adding a unit? (e.g., kg,
                unit, piece)
              </p>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={dontAskUnitAgain}
                  onChange={(e) => setDontAskUnitAgain(e.target.checked)}
                />
                <span className="text-sm text-gray-600">
                  Don't show this again
                </span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowUnitWarning(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Persist preference server-side for this user
                      try {
                        await api.put('/user/preferences', {
                          skipUnitWarning: !!dontAskUnitAgain,
                        });
                      } catch (e) {
                        console.warn(
                          'Failed to persist preference',
                          e?.message || e
                        );
                      }
                      setShowUnitWarning(false);
                      // proceed to save: reuse the same click handler by invoking the Save logic
                      // We'll simulate click by calling the Save code path directly here.
                      // Validation repeat (without unit check)
                      if (!form.name?.trim()) {
                        alert('Please enter a product name');
                        return;
                      }
                      if (!form.description?.trim()) {
                        alert('Please enter a product description');
                        return;
                      }
                      if (!form.price || parseFloat(form.price) <= 0) {
                        alert('Please enter a valid price');
                        return;
                      }
                      if (!form.category) {
                        alert('Please select a category');
                        return;
                      }
                      if (!editingProduct && !form.imageFile) {
                        alert('Please upload a product image');
                        return;
                      }

                      try {
                        if (editingProduct) {
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
                              `/business/products/${editingProduct.id}`,
                              payload
                            );
                          } else {
                            const payload = { ...form };
                            delete payload.imageFile;
                            await api.put(
                              `/business/products/${editingProduct.id}`,
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
                            payload
                          );
                        }
                        setShowModal(false);
                        setForm((f) => ({ ...f, imageFile: null }));
                        fetchProducts();
                        toast.success(
                          editingProduct ? 'Product updated!' : 'Product added!'
                        );
                      } catch (err) {
                        console.error('Failed to save product', err);
                        const msg =
                          err?.response?.data?.error ||
                          err.message ||
                          'Failed to save product';
                        toast.error(`Error: ${msg}`);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 rounded bg-brand-600 text-white font-bold"
                >
                  Save without unit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="mb-4 text-red-500">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Product?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{productToDelete.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    console.log(
                      'Delete button clicked, productToDelete:',
                      productToDelete
                    );
                    try {
                      console.log(
                        'Making DELETE request to:',
                        `/business/products/${productToDelete.id}`
                      );
                      const response = await api.delete(
                        `/business/products/${productToDelete.id}`
                      );
                      console.log('Delete response:', response.data);
                      fetchProducts();
                      setProductToDelete(null);
                      toast.success('Product deleted successfully');
                    } catch (err) {
                      console.error('Failed to delete product', err);
                      console.error('Error response:', err?.response);
                      const msg =
                        err?.response?.data?.error ||
                        err.message ||
                        'Failed to delete product';
                      toast.error(`Error: ${msg}`);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <Toaster position="top-right" />
      </div>
    </BusinessLayout>
  );
}
