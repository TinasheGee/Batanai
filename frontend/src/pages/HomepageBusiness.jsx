import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import api from '../api/axios';
import Header from '../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import bgImage from '../styles/images/Lucid_Origin_A_sleek_professional_world_map_vector_illustratio_2.jpg';

// Fixed User Location (Harare CBD for demo)
const USER_LAT = -17.8252;
const USER_LNG = 31.053;

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default function HomepageBusiness() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [malls, setMalls] = useState([]);
  const [selectedMallFilter, setSelectedMallFilter] = useState('');
  const [role, setRole] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [categoriesHierarchy, setCategoriesHierarchy] = useState([]);
  const [flatCategories, setFlatCategories] = useState(['All']);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default'); // default, name-asc, name-desc
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
  const [openSortMenu, setOpenSortMenu] = useState(false);

  // Distance Filter
  const [maxDistance, setMaxDistance] = useState(50); // Default 50km
  const [openDistanceMenu, setOpenDistanceMenu] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('Newest');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('All Ratings');
  const [activeReviewDropdown, setActiveReviewDropdown] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [reviewReplies, setReviewReplies] = useState({});

  const reviewSortOptions = [
    'Newest',
    'Oldest',
    'Highest Rating',
    'Lowest Rating',
    'Most Agreed',
    'Most Commented',
  ];

  const reviewRatingOptions = [
    'All Ratings',
    { label: '5 Stars Only', stars: 5 },
    { label: '4 Stars & Up', stars: 4 },
    { label: '3 Stars & Up', stars: 3 },
    { label: '2 Stars & up', stars: 2 },
    { label: '1 Star & Up', stars: 1 },
  ];

  useEffect(() => {
    const userRole =
      localStorage.getItem('role') || sessionStorage.getItem('role');
    setRole(userRole);

    const fetchPromotions = async () => {
      try {
        const res = await api.get('/business/promotions');
        setPromotions(res.data);
      } catch (err) {
        console.error('Failed to fetch promotions', err);
      }
    };

    const fetchMalls = async () => {
      try {
        const r = await api.get('/malls');
        setMalls(r.data || []);
      } catch (err) {
        console.warn('Failed to fetch malls', err?.message || err);
      }
    };

    fetchPromotions();
    fetchMalls();

    if (userRole === 'business') {
      const fetchBusinessProfile = async () => {
        try {
          const res = await api.get('/user/dashboard');
          if (res.data.businesses && res.data.businesses.length > 0) {
            const business = res.data.businesses[0];
            setBusinessProfile(business);
            // Fetch reviews for this business
            fetchReviews(business.id);
          }
        } catch (err) {
          console.error('Failed to fetch business info', err);
        }
      };
      fetchBusinessProfile();
    }
  }, []);

  // Fetch reviews for business
  const fetchReviews = async (businessId) => {
    try {
      const res = await api.get(`/reviews/business/${businessId}`);
      setReviews(res.data);
      // Fetch replies for each review
      res.data.forEach((review) => fetchReplies(review.id));
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  // Fetch replies for a review
  const fetchReplies = async (reviewId) => {
    try {
      const res = await api.get(`/reviews/${reviewId}/replies`);
      setReviewReplies((prev) => ({ ...prev, [reviewId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch replies', err);
    }
  };

  // Submit reply
  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/reply`, { reply_text: replyText });
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted successfully');
      // Refresh replies
      fetchReplies(reviewId);
    } catch (err) {
      console.error('Failed to post reply', err);
      const msg = err?.response?.data?.error || 'Failed to post reply';
      toast.error(msg);
    }
  };

  // -- 1. Derive Unique Categories --
  // -- 1. Derive Unique Categories --
  // Prefer global categories when available, otherwise fallback to promotions-derived
  const productDerivedCategories = [
    'All',
    ...new Set(promotions.map((p) => p.category || 'Uncategorized')),
  ];

  const categories =
    flatCategories && flatCategories.length > 0
      ? flatCategories
      : productDerivedCategories;

  // Load global categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/business/categories');
        if (res.data && Array.isArray(res.data.categories)) {
          setCategoriesHierarchy(res.data.categories);
          const flat = ['All'];
          res.data.categories.forEach((c) => {
            if (c && c.name) flat.push(c.name);
            if (Array.isArray(c.subcategories)) flat.push(...c.subcategories);
          });
          setFlatCategories(flat);
        }
      } catch (e) {
        console.warn('Failed to load categories', e?.message || e);
      }
    };
    loadCategories();
  }, []);

  // -- 2. Filter & Sort Logic --
  const filteredPromotions = promotions
    .map((shop) => {
      // Create a shallow copy to check products without mutating original logic yet
      const tempShop = { ...shop };
      // Ensure we clone array so sort doesn't mutate original
      if (tempShop.products) tempShop.products = [...tempShop.products];

      const lowerTerm = searchTerm.toLowerCase();
      const matchBusiness = tempShop.business_name
        .toLowerCase()
        .includes(lowerTerm);

      // If search is active and business name DOES NOT match, we only show matching products
      if (searchTerm && !matchBusiness && tempShop.products) {
        tempShop.products = tempShop.products.filter((p) =>
          p.name.toLowerCase().includes(lowerTerm)
        );
      }

      // If business name matches, we show ALL products (default behavior)

      // Sort products internally if price sort involves
      if (tempShop.products) {
        if (sortOption === 'price-asc') {
          tempShop.products.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortOption === 'price-desc') {
          tempShop.products.sort((a, b) => Number(b.price) - Number(a.price));
        }
      }

      return tempShop;
    })
    .filter((shop) => {
      // Category Filter
      const matchesCategory =
        selectedCategory === 'All' ||
        (shop.category || 'Uncategorized') === selectedCategory;
      if (!matchesCategory) return false;

      // Mall Filter
      if (selectedMallFilter) {
        // shop.mall_id may be null; coerce to string for comparison
        if (
          !shop.mall_id ||
          String(shop.mall_id) !== String(selectedMallFilter)
        )
          return false;
      }

      // Distance Filter
      const dist = getDistanceFromLatLonInKm(
        USER_LAT,
        USER_LNG,
        shop.latitude,
        shop.longitude
      );
      if (Number(dist) > maxDistance) return false;

      // Search Filter
      // If we are searching, we only keep the shop if:
      // 1. Business name matched (in which case we show all products)
      // 2. OR if there are matching products (products.length > 0)
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchBusiness = shop.business_name
          .toLowerCase()
          .includes(lowerTerm);
        return matchBusiness || (shop.products && shop.products.length > 0);
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.business_name.localeCompare(b.business_name);
      } else if (sortOption === 'name-desc') {
        return b.business_name.localeCompare(a.business_name);
      } else if (sortOption === 'price-asc') {
        const priceA =
          a.products?.length > 0 ? Number(a.products[0].price) : Infinity;
        const priceB =
          b.products?.length > 0 ? Number(b.products[0].price) : Infinity;
        return priceA - priceB;
      } else if (sortOption === 'price-desc') {
        const priceA =
          a.products?.length > 0 ? Number(a.products[0].price) : -Infinity;
        const priceB =
          b.products?.length > 0 ? Number(b.products[0].price) : -Infinity;
        return priceB - priceA;
      } else if (sortOption === 'distance-asc') {
        const distA = Number(
          getDistanceFromLatLonInKm(USER_LAT, USER_LNG, a.latitude, a.longitude)
        );
        const distB = Number(
          getDistanceFromLatLonInKm(USER_LAT, USER_LNG, b.latitude, b.longitude)
        );
        return distA - distB;
      }
      return 0; // default order
    });

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10 route-transition">
      <Header
        title={
          role === 'business' && businessProfile
            ? businessProfile.name
            : 'Promotions, Discounts and Daily Deals!'
        }
      />

      {/* MOBILE FILTERS - Customer only, visible only on mobile */}
      {role !== 'business' && (
        <div className="lg:hidden max-w-[1600px] mx-auto mt-4 px-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50">
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute right-3 top-2 text-gray-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Row with Category and Sort */}
              <div className="grid grid-cols-2 gap-2">
                {/* Categories Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenCategoryMenu(!openCategoryMenu)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-semibold transition text-xs"
                  >
                    <span className="truncate">
                      {selectedCategory === 'All'
                        ? 'Categories'
                        : selectedCategory}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 flex-shrink-0 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  {openCategoryMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 max-h-40 overflow-y-auto scrollbar-thin">
                      {categoriesHierarchy && categoriesHierarchy.length > 0
                        ? categoriesHierarchy.map((cat) => (
                            <div key={cat.name}>
                              <button
                                onClick={() => {
                                  setSelectedCategory(cat.name);
                                  setOpenCategoryMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-brand-200 transition ${selectedCategory === cat.name ? 'bg-brand-200 text-brand-600 font-bold' : 'text-gray-700'}`}
                              >
                                {cat.name}
                              </button>
                              {Array.isArray(cat.subcategories) &&
                                cat.subcategories.map((sub) => (
                                  <button
                                    key={sub}
                                    onClick={() => {
                                      setSelectedCategory(sub);
                                      setOpenCategoryMenu(false);
                                    }}
                                    className={`w-full text-left px-6 py-1 text-xs hover:bg-brand-100 transition ${selectedCategory === sub ? 'bg-brand-100 text-brand-600 font-medium' : 'text-gray-600'}`}
                                  >
                                    {sub}
                                  </button>
                                ))}
                            </div>
                          ))
                        : categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setOpenCategoryMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-brand-200 transition ${selectedCategory === cat ? 'bg-brand-200 text-brand-600 font-bold' : 'text-gray-700'}`}
                            >
                              {cat}
                            </button>
                          ))}
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenSortMenu(!openSortMenu)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-semibold transition text-xs"
                  >
                    <span className="truncate">Sort</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 flex-shrink-0 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  </button>
                  {openSortMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSortOption('default');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Default
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('name-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Name (A-Z)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('name-desc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Name (Z-A)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('price-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Price Low-High
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('price-desc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Price High-Low
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('distance-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-200 text-gray-700"
                      >
                        Closest
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mall Filter */}
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none"
                  value={selectedMallFilter}
                  onChange={(e) => setSelectedMallFilter(e.target.value)}
                >
                  <option value="">All malls</option>
                  {malls.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-800">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Distance Filter Panel */}
              {sortOption === 'distance-asc' && (
                <div className="bg-gray-100 rounded-xl px-3 py-2 border border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-brand-900">
                      Range
                    </span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm text-brand-800">
                      {maxDistance} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-800 mt-1">
                    <span>1km</span>
                    <span>100km</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={`max-w-[1600px] mx-auto mt-6 grid grid-cols-1 ${role === 'business' ? 'lg:grid-cols-[280px_1fr_280px]' : 'lg:grid-cols-[280px_1fr_280px]'} gap-8 px-6`}
      >
        {/* LEFT MENU - CUSTOM */}
        {role === 'business' ? (
          // BUSINESS SIDEBAR
          <aside className="hidden lg:flex flex-col gap-5 sticky top-32 h-fit">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
              <h3 className="mt-0 mb-4 text-xl text-brand-600 font-bold text-center">
                Profile
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate('/home')}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all text-sm font-semibold shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Reviews
                </button>
                <button
                  onClick={() => navigate('/catalogue')}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-white hover:bg-brand-200 hover:text-brand-600 border border-transparent hover:border-brand-200 text-gray-700 transition-all text-sm font-semibold shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  Catalogue
                </button>
                <button
                  onClick={() => navigate('/portfolio')}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-white hover:bg-brand-200 hover:text-brand-600 border border-transparent hover:border-brand-200 text-gray-700 transition-all text-sm font-semibold shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="7"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Portfolio
                </button>
                <button
                  onClick={() => navigate('/contact-us')}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-white hover:bg-brand-200 hover:text-brand-600 border border-transparent hover:border-brand-200 text-gray-700 transition-all text-sm font-semibold shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                  Contact Us
                </button>
              </div>
            </div>
          </aside>
        ) : (
          // CUSTOMER SIDEBAR (Navigation)
          <aside className="hidden lg:flex flex-col gap-5 sticky top-30 h-fit">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
              <h3 className="mt-0 mb-4 text-xl text-gray-800 font-bold text-center">
                Navigation
              </h3>
              <div className="flex flex-col justify-between h-[190px]">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 absolute right-3 top-2 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Categories Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenCategoryMenu(!openCategoryMenu)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-semibold transition text-sm"
                  >
                    {selectedCategory === 'All'
                      ? 'Categories'
                      : selectedCategory}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  {openCategoryMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10 max-h-40 overflow-y-auto scrollbar-thin">
                      {categoriesHierarchy && categoriesHierarchy.length > 0
                        ? categoriesHierarchy.map((cat) => (
                            <div key={cat.name}>
                              <button
                                onClick={() => {
                                  setSelectedCategory(cat.name);
                                  setOpenCategoryMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-200 transition ${selectedCategory === cat.name ? 'bg-brand-200 text-brand-600 font-bold' : 'text-gray-700'}`}
                              >
                                {cat.name}
                              </button>
                              {Array.isArray(cat.subcategories) &&
                                cat.subcategories.map((sub) => (
                                  <button
                                    key={sub}
                                    onClick={() => {
                                      setSelectedCategory(sub);
                                      setOpenCategoryMenu(false);
                                    }}
                                    className={`w-full text-left px-8 py-2 text-sm hover:bg-brand-100 transition ${selectedCategory === sub ? 'bg-brand-100 text-brand-600 font-medium' : 'text-gray-600'}`}
                                  >
                                    {sub}
                                  </button>
                                ))}
                            </div>
                          ))
                        : categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setOpenCategoryMenu(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-200 transition ${selectedCategory === cat ? 'bg-brand-200 text-brand-600 font-bold' : 'text-gray-700'}`}
                            >
                              {cat}
                            </button>
                          ))}
                    </div>
                  )}
                </div>

                {/* Mall Filter - placed after Categories */}
                <div className="relative">
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none"
                      value={selectedMallFilter}
                      onChange={(e) => setSelectedMallFilter(e.target.value)}
                    >
                      <option value="">All malls</option>
                      {malls.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-800">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenSortMenu(!openSortMenu)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 font-semibold transition text-sm"
                  >
                    Sort
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  </button>
                  {openSortMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                      <button
                        onClick={() => {
                          setSortOption('default');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Default
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('name-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Name (A-Z)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('name-desc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Name (Z-A)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('price-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Price (Low to High)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('price-desc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Price (High to Low)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('distance-asc');
                          setOpenSortMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-200 text-gray-700"
                      >
                        Closest to Me
                      </button>
                    </div>
                  )}
                </div>

                {/* Distance Filter Panel */}
                {sortOption === 'distance-asc' && (
                  <div className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-brand-900">
                        Range
                      </span>
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm text-brand-800">
                        {maxDistance} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-800 mt-1">
                      <span>1km</span>
                      <span>100km</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* MAIN FEED */}
        <main className="min-w-0">
          {role === 'business' ? (
            /* BUSINESS HOMEPAGE CONTENT - REVIEWS DASHBOARD */
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-brand-600">
                  Our Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400 text-xl">
                    {'★'.repeat(4)}
                    {'☆'.repeat(1)}
                  </div>
                  <span className="font-bold text-gray-700">
                    3.5 (158 Reviews)
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-6 relative z-20">
                {/* SORT DROPDOWN */}
                <div className="flex-1 relative">
                  <button
                    onClick={() =>
                      setActiveReviewDropdown(
                        activeReviewDropdown === 'sort' ? null : 'sort'
                      )
                    }
                    className="w-full bg-brand-600 text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md focus:outline-none"
                  >
                    {reviewSort} <span className="text-xs">▼</span>
                  </button>

                  {activeReviewDropdown === 'sort' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-brand-900 rounded-lg shadow-xl overflow-hidden z-30">
                      <div className="bg-brand-200 px-4 py-2 border-b border-brand-200 font-bold text-brand-600 flex justify-between items-center">
                        <span>{reviewSort}</span>
                        <span>✓</span>
                      </div>
                      {reviewSortOptions
                        .filter((opt) => opt !== reviewSort)
                        .map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setReviewSort(option);
                              setActiveReviewDropdown(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* RATING FILTER DROPDOWN */}
                <div className="flex-1 relative">
                  <button
                    onClick={() =>
                      setActiveReviewDropdown(
                        activeReviewDropdown === 'filter' ? null : 'filter'
                      )
                    }
                    className="w-full bg-brand-600 text-white py-2 px-4 rounded-lg font-bold flex justify-between items-center shadow-md focus:outline-none"
                  >
                    {typeof reviewRatingFilter === 'string'
                      ? reviewRatingFilter
                      : reviewRatingFilter.label}{' '}
                    <span className="text-xs">▼</span>
                  </button>

                  {activeReviewDropdown === 'filter' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-brand-900 rounded-lg shadow-xl overflow-hidden z-30">
                      {/* Selected Item Header Style per image */}
                      <div className="bg-brand-200 px-4 py-2 border-b border-brand-200 font-bold text-brand-600 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {typeof reviewRatingFilter !== 'string' ? (
                            <>
                              <div className="flex text-yellow-500 text-xs">
                                {'★'.repeat(reviewRatingFilter.stars)}
                                {'☆'.repeat(5 - reviewRatingFilter.stars)}
                              </div>
                              <span className="text-xs">
                                ({reviewRatingFilter.label})
                              </span>
                            </>
                          ) : (
                            <span>{reviewRatingFilter}</span>
                          )}
                        </div>
                        <span>✓</span>
                      </div>

                      {/* Options */}
                      {reviewRatingOptions
                        .filter((opt) =>
                          typeof opt === 'string'
                            ? opt !== reviewRatingFilter
                            : opt.label !== reviewRatingFilter.label
                        )
                        .map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setReviewRatingFilter(option);
                              setActiveReviewDropdown(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            {typeof option === 'string' ? (
                              option
                            ) : (
                              <>
                                <div className="flex text-yellow-400 text-sm">
                                  {'★'.repeat(option.stars)}
                                  <span className="text-gray-300">
                                    {'★'.repeat(5 - option.stars)}
                                  </span>
                                </div>
                                <span className="text-gray-800 text-xs font-semibold">
                                  ({option.label})
                                </span>
                              </>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="flex flex-col gap-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-800">
                    No reviews yet
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">
                          {review.full_name || 'Anonymous'} - Customer
                        </h4>
                        <div className="flex text-yellow-500 text-sm">
                          {'★'.repeat(Math.round(review.rating))}
                          {'☆'.repeat(5 - Math.round(review.rating))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 font-medium leading-relaxed">
                        {review.comment || 'No comment provided'}
                      </p>
                      <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                        <div className="text-xs text-gray-400 font-bold">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (replyingTo === review.id) {
                                setReplyingTo(null);
                                setReplyText('');
                              } else {
                                setReplyingTo(review.id);
                              }
                            }}
                            className="bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg shadow hover:bg-brand-500"
                          >
                            {replyingTo === review.id ? 'Cancel' : 'Reply'}
                          </button>
                        </div>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === review.id && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full h-20 resize-none outline-none text-gray-600 bg-white p-2 rounded border border-gray-300"
                          ></textarea>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReplySubmit(review.id)}
                              className="px-3 py-1.5 text-xs rounded-lg bg-brand-600 text-white hover:bg-brand-500"
                            >
                              Submit Reply
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display Replies */}
                      {reviewReplies[review.id] &&
                        reviewReplies[review.id].length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-brand-200 space-y-3">
                            {reviewReplies[review.id].map((reply) => (
                              <div
                                key={reply.id}
                                className="bg-brand-200 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-sm text-brand-800">
                                    {reply.business_id ? (
                                      <Link
                                        to={`/business/${reply.business_id}`}
                                        className="hover:underline"
                                      >
                                        {reply.business_name}
                                      </Link>
                                    ) : (
                                      reply.business_name
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-800">
                                    {new Date(
                                      reply.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {reply.reply_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* CUSTOMER FEED (Existing Code) */
            <div className="w-full h-full flex flex-col">
              {filteredPromotions.length > 0 ? (
                <div className="grid gap-6 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPromotions.map((shop) => (
                    <div
                      key={shop.id}
                      className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 flex flex-col hover:-translate-y-1 transition-transform duration-300 text-gray-900"
                    >
                      <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
                        {shop.logo_url ? (
                          <button
                            onClick={() => navigate(`/business/${shop.id}`)}
                            className="p-0 bg-transparent border-0 cursor-pointer mr-3"
                          >
                            <img
                              src={shop.logo_url}
                              alt={shop.business_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 mr-3 text-2xl"></div>
                        )}
                        <div className="flex flex-col">
                          <div
                            className="font-bold text-base text-gray-900 leading-tight max-w-[170px] md:max-w-[200px] truncate md:whitespace-normal md:line-clamp-2"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {shop.id ? (
                              <Link
                                to={`/business/${shop.id}`}
                                className="hover:underline text-gray-900"
                              >
                                {shop.business_name}
                              </Link>
                            ) : (
                              shop.business_name
                            )}
                          </div>
                          {shop.mall_name && (
                            <div className="text-sm text-gray-800 mt-0.5">
                              {shop.mall_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {shop.products && shop.products.length > 0 ? (
                        <div className="flex-1 [&_.control-arrow]:opacity-100 [&_.control-arrow]:!bg-transparent [&_.control-prev:before]:!border-r-black [&_.control-next:before]:!border-l-black [&_.control-dots]:-bottom-5">
                          <Carousel
                            showThumbs={false}
                            showStatus={false}
                            showArrows={true}
                            showIndicators={false}
                            infiniteLoop
                            useKeyboardArrows
                            autoPlay
                            interval={5000 + Math.random() * 2000}
                            transitionTime={500}
                            emulateTouch
                            stopOnHover
                          >
                            {shop.products.map((product) => (
                              <div
                                key={product.id}
                                className="text-center px-1 cursor-pointer pb-2 relative"
                                onClick={() => navigate('/marketplace')}
                              >
                                {/* Promotion Badge */}
                                {product.promotion_type && (
                                  <div
                                    className={`absolute top-0 left-0 z-10 px-3 py-1 font-bold text-xs uppercase -rotate-45 shadow-sm transform -translate-x-2 translate-y-2
                                    ${
                                      product.promotion_type === 'Discount'
                                        ? 'bg-yellow-400 text-black'
                                        : product.promotion_type === 'Deal'
                                          ? 'bg-brand-600 text-white'
                                          : 'bg-green-500 text-white'
                                    }`}
                                  >
                                    {product.promotion_type === 'Discount'
                                      ? `${product.discount_percent}% Off`
                                      : product.promotion_type}
                                  </div>
                                )}

                                <div className="relative">
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-[220px] object-contain bg-white rounded-xl mb-3"
                                  />
                                </div>

                                <div className="text-base font-semibold text-gray-900 my-1 truncate">
                                  {product.name}
                                </div>
                                <div className="flex items-center justify-center gap-3 mt-2">
                                  {/* Price Section */}
                                  <span className="line-through text-gray-800 text-sm font-medium">
                                    ${(Number(product.price) * 1.25).toFixed(2)}
                                  </span>
                                  <span className="font-extrabold text-brand-600 text-xl bg-brand-200 px-3 py-1 rounded-lg">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                </div>

                                {/* Footer: Rating & Distance */}
                                <div className="flex items-center justify-between mt-3 px-2 text-sm text-gray-700">
                                  {/* Rating */}
                                  <div className="flex items-center gap-1 font-bold text-yellow-500">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 fill-current"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                    <span className="text-gray-900 font-bold">
                                      {product.average_rating || '4.5'}
                                    </span>
                                  </div>

                                  {/* Distance (clickable -> Google Maps) */}
                                  <div>
                                    {shop.latitude && shop.longitude ? (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-brand-800 hover:underline"
                                      >
                                        {getDistanceFromLatLonInKm(
                                          USER_LAT,
                                          USER_LNG,
                                          shop.latitude,
                                          shop.longitude
                                        )}{' '}
                                        km
                                      </a>
                                    ) : (
                                      <span className="font-medium text-brand-800">
                                        {getDistanceFromLatLonInKm(
                                          USER_LAT,
                                          USER_LNG,
                                          shop.latitude,
                                          shop.longitude
                                        )}{' '}
                                        km
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </Carousel>
                        </div>
                      ) : (
                        <div className="p-5 text-center text-gray-400">
                          No items
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center w-full p-8 bg-white/80 rounded-2xl shadow-sm text-lg text-gray-600">
                  {selectedMallFilter &&
                  !searchTerm &&
                  selectedCategory === 'All'
                    ? 'No deals at the selected mall.'
                    : searchTerm ||
                        selectedCategory !== 'All' ||
                        selectedMallFilter
                      ? 'No items match your search.'
                      : 'Loading great deals...'}
                </p>
              )}
            </div>
          )}
        </main>

        {/* RIGHT DASHBOARD (Optional Helper) */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-30 h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Jobs/Opportunities
              </button>
              <button
                onClick={() => navigate('/network')}
                className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center"
              >
                My Network
              </button>
            </div>
          </div>
        </aside>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
