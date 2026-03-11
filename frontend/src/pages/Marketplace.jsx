import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import { useToast } from '../components/ToastContext';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ReviewModal from '../components/ReviewModal';
import ViewReviewsModal from '../components/ViewReviewsModal';
import { toast, Toaster } from 'react-hot-toast';

// Distance calculation helper functions
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

// Fix for default Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create a blue icon for the user's location marker
const blueIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create a red icon for business markers
const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ products, userLocation }) {
  const map = useMap();
  useEffect(() => {
    // Always center on user location if available
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    } else if (products.length > 0) {
      // Fallback to fitting product bounds if no user location
      const validPoints = products
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [parseFloat(p.latitude), parseFloat(p.longitude)]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [products, userLocation, map]);
  return null;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('grid');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [userLocation, setUserLocation] = useState(null);
  const [searchRange, setSearchRange] = useState(500);
  const [malls, setMalls] = useState([]);
  const [selectedMall, setSelectedMall] = useState('');
  const [connectedIds, setConnectedIds] = useState([]);
  const { addToast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 39;

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] =
    useState(null);
  const [selectedBusinessForReview, setSelectedBusinessForReview] =
    useState(null);
  const [reviewType, setReviewType] = useState(null); // 'product' or 'business'

  // View reviews modal state
  const [isViewReviewsModalOpen, setIsViewReviewsModalOpen] = useState(false);
  const [selectedProductForViewReviews, setSelectedProductForViewReviews] =
    useState(null);
  const [selectedBusinessForViewReviews, setSelectedBusinessForViewReviews] =
    useState(null);
  const [viewReviewsType, setViewReviewsType] = useState(null);

  useEffect(() => {
    // Default to Harare coordinates for Zimbabwe marketplace
    const DEFAULT_ZIMBABWE_LOCATION = {
      lat: -17.8252,
      lng: 31.0522,
      name: 'Harare, Zimbabwe',
    };

    if (navigator.geolocation) {
      // Request high-accuracy GPS location
      const geoOptions = {
        enableHighAccuracy: true, // Use GPS instead of network/IP location
        timeout: 10000, // Wait up to 10 seconds for location
        maximumAge: 0, // Don't use cached location
      };

      console.log('📡 Requesting high-accuracy GPS location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Log detected coordinates for debugging
          console.log('🌍 Browser detected coordinates:', loc);
          console.log('📍 Accuracy:', position.coords.accuracy, 'meters');

          // Check if user is within reasonable distance of Zimbabwe
          // Zimbabwe roughly: lat -15 to -23, lng 25 to 34
          const isInZimbabwe =
            loc.lat >= -23 && loc.lat <= -15 && loc.lng >= 25 && loc.lng <= 34;

          if (isInZimbabwe) {
            console.log(
              '✅ Location is in Zimbabwe, using detected coordinates'
            );
            setUserLocation(loc);
            fetchProducts(search, sortBy, loc);
          } else {
            // User is outside Zimbabwe, use default Harare location
            console.warn('❌ Browser location outside Zimbabwe bounds:', loc);
            console.warn('🔄 Defaulting to Harare, Zimbabwe');
            setUserLocation(DEFAULT_ZIMBABWE_LOCATION);
            fetchProducts(search, sortBy, DEFAULT_ZIMBABWE_LOCATION);
          }
        },
        (error) => {
          console.warn('Location access denied or error:', error);
          console.warn('Error code:', error.code, 'Message:', error.message);
          // Use default Zimbabwe location
          setUserLocation(DEFAULT_ZIMBABWE_LOCATION);
          fetchProducts(search, sortBy, DEFAULT_ZIMBABWE_LOCATION);
        },
        geoOptions
      );
    } else {
      // Browser doesn't support geolocation, use default Zimbabwe location
      const DEFAULT_ZIMBABWE_LOCATION = {
        lat: -17.8252,
        lng: 31.0522,
        name: 'Harare, Zimbabwe',
      };
      setUserLocation(DEFAULT_ZIMBABWE_LOCATION);
      fetchProducts(search, sortBy, DEFAULT_ZIMBABWE_LOCATION);
    }

    // fetch malls for filters
    (async () => {
      try {
        const res = await api.get('/malls');
        setMalls(res.data || []);
      } catch (err) {
        console.warn('Could not fetch malls', err?.message || err);
      }
      // fetch user's followed companies so Connect state persists
      try {
        const net = await api.get('/network');
        const followed = net.data?.following || [];
        setConnectedIds(followed.map((b) => b.id));
      } catch (e) {
        // ignore if not authenticated or error
      }
    })();
  }, []);

  // Re-fetch followed companies when route changes to /marketplace
  useEffect(() => {
    if (location?.pathname === '/marketplace') {
      (async () => {
        try {
          const net = await api.get('/network');
          const followed = net.data?.following || [];
          setConnectedIds(followed.map((b) => b.id));
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [location]);

  // Reset to page 1 when products change (due to filtering/sorting)
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, search, sortBy, selectedMall, selectedCategory]);

  const fetchProducts = async (
    searchQuery = '',
    sort = 'default',
    locOverride = null
  ) => {
    setLoading(true);
    try {
      const locationToUse = locOverride || userLocation;
      const params = {
        search: searchQuery,
      };
      if (selectedMall) params.mall_id = selectedMall;
      if (locationToUse) {
        params.user_lat = locationToUse.lat;
        params.user_lng = locationToUse.lng;
      }
      const res = await api.get('/products/search', { params });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchProducts(val, sortBy);
  };

  const handleSortChange = (e) => {
    const val = e.target.value || 'default';
    setSortBy(val);
  };

  const handleMallChange = (e) => {
    const m = e.target.value;
    setSelectedMall(m);
    fetchProducts(search, sortBy);
  };

  const handleMessageBusiness = (product) => {
    navigate('/messaging', {
      state: {
        startChatWith: {
          owner_id: product.owner_id,
          business_name: product.business_name,
          logo_url: product.logo_url,
        },
      },
    });
  };

  const handleConnect = async (product) => {
    const businessId = product.business_id || product.businessId;
    if (!businessId) return;
    if (connectedIds.includes(businessId)) return;
    try {
      await api.post(`/network/follow/${businessId}`);
      setConnectedIds((s) => [...s, businessId]);
      // Notify other parts of the app (e.g., Network page) that a follow occurred
      const business = {
        id: businessId,
        name: product.business_name || product.business || 'Company',
        logo_url: product.logo_url || product.logo || null,
        category: product.category || null,
        latitude: product.latitude || null,
        longitude: product.longitude || null,
        followed_at: new Date().toISOString(),
      };
      try {
        window.dispatchEvent(
          new CustomEvent('network:follow', { detail: business })
        );
      } catch (e) {
        // ignore if dispatch fails in some environments
      }
      addToast({ type: 'success', message: 'Connected to company' });
    } catch (err) {
      console.error('Failed to connect to business', err);
      addToast({ type: 'error', message: 'Failed to connect to business' });
    }
  };

  const handleUnfollow = async (product) => {
    const businessId = product.business_id || product.businessId;
    if (!businessId) return;
    try {
      await api.delete(`/network/follow/${businessId}`);
      setConnectedIds((s) =>
        s.filter((id) => String(id) !== String(businessId))
      );
      try {
        window.dispatchEvent(
          new CustomEvent('network:unfollow', { detail: { id: businessId } })
        );
      } catch (e) {}
      addToast({ type: 'success', message: 'Unfollowed company' });
    } catch (err) {
      console.error('Failed to unfollow business', err);
      addToast({ type: 'error', message: 'Failed to unfollow company' });
    }
    // success
    if (businessId) {
      addToast({ type: 'success', message: 'Unfollowed company' });
    }
  };

  const handleOpenReviewModal = (product) => {
    setSelectedProductForReview(product);
    setReviewType('product');
    setIsReviewModalOpen(true);
  };

  const handleOpenBusinessReviewModal = (product) => {
    setSelectedBusinessForReview({
      id: product.business_id || product.businessId,
      name: product.business_name,
    });
    setReviewType('business');
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedProductForReview(null);
    setSelectedBusinessForReview(null);
    setReviewType(null);
  };

  const handleReviewSuccess = () => {
    // Optionally refresh products to update ratings
    fetchProducts(search, sortBy);
  };

  const handleOpenViewReviews = (product, type) => {
    if (type === 'product') {
      setSelectedProductForViewReviews(product);
      setSelectedBusinessForViewReviews(null);
    } else {
      setSelectedBusinessForViewReviews({
        id: product.business_id || product.businessId,
        name: product.business_name,
      });
      setSelectedProductForViewReviews(null);
    }
    setViewReviewsType(type);
    setIsViewReviewsModalOpen(true);
  };

  const handleCloseViewReviews = () => {
    setIsViewReviewsModalOpen(false);
    setSelectedProductForViewReviews(null);
    setSelectedBusinessForViewReviews(null);
    setViewReviewsType(null);
  };

  // Calculate paginated products
  // First, derive unique categories from all products
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  // Filter products by selected category
  let filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // If the distance filter slider is visible, filter by searchRange
  const isDistanceFilterActive = sortBy === 'distance-asc' && userLocation;
  if (isDistanceFilterActive) {
    filteredProducts = filteredProducts.filter((p) => {
      // If product has no distance (no coordinates), include it by default
      if (!p.distance) return true;
      // Otherwise, check if within range
      return parseFloat(p.distance) <= searchRange;
    });
  }

  // Apply sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'name-desc') {
      return (b.name || '').localeCompare(a.name || '');
    } else if (sortBy === 'price-asc') {
      return Number(a.price || 0) - Number(b.price || 0);
    } else if (sortBy === 'price-desc') {
      return Number(b.price || 0) - Number(a.price || 0);
    } else if (sortBy === 'distance-asc') {
      if (!userLocation) return 0;
      const distA = Number(
        getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          a.latitude,
          a.longitude
        )
      );
      const distB = Number(
        getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          b.latitude,
          b.longitude
        )
      );
      return distA - distB;
    }
    return 0; // default order
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8 mb-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === number
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-gray-400">...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  const renderGrid = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
        {currentProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col overflow-hidden"
          >
            <div className="h-48 w-full bg-gray-100 relative">
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm"></div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h4 className="font-bold text-gray-800 text-lg mb-1 truncate">
                {p.name}
              </h4>
              {/* Price display */}
              <div className="text-lg font-bold text-green-700 mb-1">
                {p.price ? `$${Number(p.price).toLocaleString()}` : ''}
              </div>
              <div className="flex justify-between items-start text-sm text-gray-500 mb-4">
                <span className="truncate flex-1 mr-2">{p.business_name}</span>
                {p.distance ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold whitespace-nowrap hover:text-blue-800 hover:underline cursor-pointer"
                    title="Get directions on Google Maps"
                  >
                    {parseFloat(p.distance).toFixed(1)} km
                  </a>
                ) : userLocation && p.latitude && p.longitude ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold whitespace-nowrap hover:text-blue-800 hover:underline cursor-pointer"
                    title="Get directions on Google Maps"
                  >
                    {getDistanceFromLatLonInKm(
                      userLocation.lat,
                      userLocation.lng,
                      p.latitude,
                      p.longitude
                    )}{' '}
                    km
                  </a>
                ) : (
                  <span>{p.location}</span>
                )}
              </div>
              {p.mall_name && (
                <div className="text-xs text-gray-500 mb-3">{p.mall_name}</div>
              )}
              <div className="mt-auto w-full flex gap-3">
                <button
                  onClick={() => handleMessageBusiness(p)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Message
                </button>
                {connectedIds.includes(p.business_id || p.businessId) ? (
                  <button
                    onClick={() => handleUnfollow(p)}
                    className="flex-1 py-2 rounded-lg font-medium bg-white border border-red-600 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(p)}
                    className="flex-1 py-2 rounded-lg font-medium transition-colors bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Connect
                  </button>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleOpenReviewModal(p)}
                  className="flex-1 py-2 rounded-lg font-medium transition-colors bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Product
                </button>
                <button
                  onClick={() => handleOpenBusinessReviewModal(p)}
                  className="flex-1 py-2 rounded-lg font-medium transition-colors bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Business
                </button>
              </div>
              <button
                onClick={() => handleOpenViewReviews(p, 'product')}
                className="w-full mt-2 py-2 rounded-lg font-medium transition-colors bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 flex items-center justify-center gap-2 text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Reviews {p.review_count > 0 && `(${p.review_count})`}
              </button>
            </div>
          </div>
        ))}
      </div>
      {renderPagination()}
    </>
  );

  const renderList = () => (
    <>
      <div className="flex flex-col gap-4 p-4">
        {currentProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow"
          >
            <img
              src={p.image_url}
              alt={p.name}
              className="w-32 h-32 object-contain bg-gray-50 rounded-lg"
            />
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800 text-xl mb-0">
                    {p.name}
                  </h4>
                  <div className="text-lg font-bold text-green-700">
                    {p.price ? `$${Number(p.price).toLocaleString()}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  {p.distance ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 font-bold hover:text-blue-700 hover:underline cursor-pointer"
                      title="Get directions on Google Maps"
                    >
                      {parseFloat(p.distance).toFixed(1)} km
                    </a>
                  ) : userLocation && p.latitude && p.longitude ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 font-bold hover:text-blue-700 hover:underline cursor-pointer"
                      title="Get directions on Google Maps"
                    >
                      {getDistanceFromLatLonInKm(
                        userLocation.lat,
                        userLocation.lng,
                        p.latitude,
                        p.longitude
                      )}{' '}
                      km
                    </a>
                  ) : null}
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {p.description}
              </p>
              <p className="text-gray-500 text-xs mt-2">{p.business_name}</p>
              {p.mall_name && (
                <p className="text-gray-400 text-xs mt-1">{p.mall_name}</p>
              )}

              <div className="mt-auto pt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleMessageBusiness(p)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Message
                </button>
                {connectedIds.includes(p.business_id || p.businessId) ? (
                  <button
                    onClick={() => handleUnfollow(p)}
                    className="px-4 py-2 text-sm rounded-lg font-medium bg-white border border-red-600 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(p)}
                    className="px-4 py-2 text-sm rounded-lg font-medium transition-colors bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Connect
                  </button>
                )}
                <button
                  onClick={() => handleOpenReviewModal(p)}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Product
                </button>
                <button
                  onClick={() => handleOpenBusinessReviewModal(p)}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Business
                </button>
                <button
                  onClick={() => handleOpenViewReviews(p, 'product')}
                  className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-green-50 border border-green-300 text-green-700 hover:bg-green-100 flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {p.review_count > 0
                    ? `Reviews (${p.review_count})`
                    : 'Reviews'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {renderPagination()}
    </>
  );

  const renderMap = () => {
    const mapProducts =
      sortBy === 'closest' && userLocation
        ? products.filter(
            (p) => p.distance && parseFloat(p.distance) <= searchRange
          )
        : products;

    // Use user location as center if available, otherwise use default Zimbabwe center
    const mapCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [-19.0154, 29.1549];
    const mapZoom = userLocation ? 12 : 7;

    return (
      <div className="h-[600px] w-full rounded-2xl overflow-hidden relative border border-gray-200 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full z-0"
        >
          <MapUpdater products={mapProducts} userLocation={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={blueIcon}
            >
              <Tooltip permanent direction="top" offset={[0, -40]}>
                <strong>You're here</strong>
              </Tooltip>
            </Marker>
          )}
          {/* Show business markers when user has searched for products */}
          {search?.trim() &&
            mapProducts.map(
              (p) =>
                p.latitude &&
                p.longitude && (
                  <Marker
                    key={p.id}
                    position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                    icon={redIcon}
                  >
                    <Popup>
                      <div className="text-center p-1">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded object-cover mx-auto mb-2"
                        />
                        <h5 className="font-bold text-sm m-0">{p.name}</h5>
                        {/* Price display */}
                        <div className="text-green-700 font-bold text-sm my-1">
                          {p.price
                            ? `$${Number(p.price).toLocaleString()}`
                            : ''}
                        </div>
                        {/* Distance display */}
                        {p.distance ? (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 font-semibold mb-1 hover:text-blue-800 hover:underline cursor-pointer block"
                            title="Get directions on Google Maps"
                          >
                            {parseFloat(p.distance).toFixed(1)} km away
                          </a>
                        ) : userLocation && p.latitude && p.longitude ? (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 font-semibold mb-1 hover:text-blue-800 hover:underline cursor-pointer block"
                            title="Get directions on Google Maps"
                          >
                            {getDistanceFromLatLonInKm(
                              userLocation.lat,
                              userLocation.lng,
                              p.latitude,
                              p.longitude
                            )}{' '}
                            km away
                          </a>
                        ) : null}
                        <p className="text-xs text-gray-500 mb-2">
                          {p.business_name}
                        </p>
                        {p.mall_name && (
                          <p className="text-xs text-gray-500 mb-2">
                            {p.mall_name}
                          </p>
                        )}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleMessageBusiness(p)}
                            className="w-full bg-blue-500 text-white text-xs py-1 rounded"
                          >
                            Message
                          </button>
                          {connectedIds.includes(
                            p.business_id || p.businessId
                          ) ? (
                            <button
                              onClick={() => handleUnfollow(p)}
                              className="w-full text-xs py-1 rounded bg-white border border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Unfollow
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConnect(p)}
                              className="w-full text-xs py-1 rounded bg-white border border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              Connect
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenReviewModal(p)}
                            className="w-full text-xs py-1 rounded bg-amber-50 border border-amber-400 text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Product
                          </button>
                          <button
                            onClick={() => handleOpenBusinessReviewModal(p)}
                            className="w-full text-xs py-1 rounded bg-blue-50 border border-blue-400 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Business
                          </button>
                          <button
                            onClick={() => handleOpenViewReviews(p, 'product')}
                            className="w-full text-xs py-1 rounded bg-green-50 border border-green-400 text-green-700 hover:bg-green-100"
                          >
                            Reviews{' '}
                            {p.review_count > 0 && `(${p.review_count})`}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
        </MapContainer>
        {/* Info overlay when no search */}
        {!search?.trim() && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-6 py-3 rounded-full text-sm z-[500] shadow-lg">
            🔍 Search for products to see business locations on the map
          </div>
        )}
        {sortBy === 'closest' && userLocation && search?.trim() && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-[500]">
            Showing results within {searchRange}km
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Marketplace" />

      {/* MOBILE FILTERS - Visible only on mobile */}
      <div className="lg:hidden max-w-[1600px] mx-auto mt-4 px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={handleSearchChange}
                className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute right-3 top-2 text-gray-500"
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

            {/* Row with Category, Mall, and Sort */}
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setOpenCategoryMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition ${selectedCategory === cat ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none cursor-pointer truncate"
                  onChange={handleSortChange}
                  value={sortBy}
                >
                  <option value="default">Default</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="distance-asc">Closest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
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
            </div>

            {/* Mall Filter */}
            <div className="relative">
              <select
                className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-3 py-2 text-xs focus:outline-none"
                value={selectedMall}
                onChange={handleMallChange}
              >
                <option value="">All malls</option>
                {malls.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
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
            {sortBy === 'distance-asc' && (
              <div className="bg-gray-100 rounded-xl px-3 py-2 border border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-900">Range</span>
                  <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm text-blue-800">
                    {searchRange} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={searchRange}
                  onChange={(e) => setSearchRange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1km</span>
                  <span>500km</span>
                </div>
              </div>
            )}

            {/* View Toggle for Mobile */}
            <div className="flex gap-2 justify-center pt-2">
              {['grid', 'list', 'map'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    view === mode
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-6 px-4 grid grid-cols-1 lg:grid-cols-[300px_1fr_260px] gap-6 items-start">
        {/* LEFT SIDEBAR - NAVIGATION */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-28 h-fit">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/50">
            <h3 className="mt-0 mb-4 text-xl text-gray-800 font-bold text-center">
              Navigation
            </h3>
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute right-3 top-2 text-gray-500"
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
                  {selectedCategory === 'All' ? 'Categories' : selectedCategory}
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setOpenCategoryMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition ${selectedCategory === cat ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mall Filter */}
              <div className="relative mt-3">
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none"
                    value={selectedMall}
                    onChange={handleMallChange}
                  >
                    <option value="">All malls</option>
                    {malls.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
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
                <select
                  className="w-full appearance-none bg-gray-100 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none cursor-pointer"
                  onChange={handleSortChange}
                  value={sortBy}
                >
                  <option value="default">Default</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="distance-asc">Closest to Me</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
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

              {/* Distance Filter Panel */}
              {sortBy === 'distance-asc' && (
                <div className="bg-gray-100 rounded-xl px-4 py-3 border border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-blue-900">
                      Range
                    </span>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm text-blue-800">
                      {searchRange} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={searchRange}
                    onChange={(e) => setSearchRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>1km</span>
                    <span>500km</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0">
          {/* Product Count Display */}
          {products.length > 0 && (
            <div className="mb-4 text-sm text-gray-600 font-medium px-2">
              Showing {indexOfFirstProduct + 1}-
              {Math.min(indexOfLastProduct, products.length)} of{' '}
              {products.length} products
            </div>
          )}

          {/* View Toggle - Desktop only */}
          <div className="hidden lg:flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 gap-20 w-full justify-center">
            {['grid', 'list', 'map'].map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  view === mode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)} View
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[500px] overflow-hidden">
            {!loading ? (
              <>
                {view === 'grid' && renderGrid()}
                {view === 'list' && renderList()}
                {view === 'map' && renderMap()}
                {products.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <div className="text-4xl mb-4"></div>
                    <p>No products found matching your criteria.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <div className="inline-flex items-center gap-3">
                  <svg
                    className="animate-spin h-6 w-6 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span className="text-gray-600">Loading marketplace...</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT DASHBOARD (Helper) */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-28 h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
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

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        productId={
          reviewType === 'product' ? selectedProductForReview?.id : null
        }
        productName={
          reviewType === 'product' ? selectedProductForReview?.name : ''
        }
        businessId={
          reviewType === 'business' ? selectedBusinessForReview?.id : null
        }
        businessName={
          reviewType === 'business' ? selectedBusinessForReview?.name : ''
        }
        onSuccess={handleReviewSuccess}
      />

      {/* View Reviews Modal */}
      <ViewReviewsModal
        isOpen={isViewReviewsModalOpen}
        onClose={handleCloseViewReviews}
        productId={
          viewReviewsType === 'product'
            ? selectedProductForViewReviews?.id
            : null
        }
        productName={
          viewReviewsType === 'product'
            ? selectedProductForViewReviews?.name
            : ''
        }
        businessId={
          viewReviewsType === 'business'
            ? selectedBusinessForViewReviews?.id
            : null
        }
        businessName={
          viewReviewsType === 'business'
            ? selectedBusinessForViewReviews?.name
            : ''
        }
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
