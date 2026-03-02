import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import { useToast } from '../components/ToastContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapUpdater({ products }) {
  const map = useMap();
  useEffect(() => {
    if (products.length > 0) {
      const validPoints = products
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [parseFloat(p.latitude), parseFloat(p.longitude)]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [products, map]);
  return null;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('grid');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [userLocation, setUserLocation] = useState(null);
  const [searchRange, setSearchRange] = useState(50);
  const [malls, setMalls] = useState([]);
  const [selectedMall, setSelectedMall] = useState('');
  const [connectedIds, setConnectedIds] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          fetchProducts(search, sortBy, loc);
        },
        (error) => {
          console.warn('Location access denied or error:', error);
        }
      );
    } else {
      fetchProducts();
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

  const fetchProducts = async (
    searchQuery = '',
    sort = 'created_at',
    locOverride = null
  ) => {
    setLoading(true);
    try {
      const locationToUse = locOverride || userLocation;
      const params = {
        search: searchQuery,
        sort_by: sort,
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
    const val = e.target.value || 'created_at';
    setSortBy(val);
    fetchProducts(search, val);
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

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
      {products.map((p) => (
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
            <div className="flex justify-between items-start text-sm text-gray-500 mb-4">
              <span className="truncate flex-1 mr-2">{p.business_name}</span>
              {p.distance ? (
                <span className="text-blue-600 font-semibold whitespace-nowrap">
                  {parseFloat(p.distance).toFixed(1)} km
                </span>
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
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="flex flex-col gap-4 p-4">
      {products.map((p) => (
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
            <div className="flex justify-between">
              <h4 className="font-bold text-gray-800 text-xl">{p.name}</h4>
              <div className="text-right">
                <div className="font-bold text-xl text-blue-600"></div>
                {p.distance && (
                  <div className="text-xs text-blue-500 font-bold">
                    {' '}
                    {parseFloat(p.distance).toFixed(1)} km
                  </div>
                )}
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMap = () => {
    const mapProducts =
      sortBy === 'closest' && userLocation
        ? products.filter(
            (p) => p.distance && parseFloat(p.distance) <= searchRange
          )
        : products;

    return (
      <div className="h-[600px] w-full rounded-2xl overflow-hidden relative border border-gray-200 shadow-inner">
        <MapContainer
          center={[-19.0154, 29.1549]}
          zoom={7}
          className="h-full w-full z-0"
        >
          <MapUpdater products={mapProducts} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <strong>You are here</strong>
              </Popup>
            </Marker>
          )}
          {mapProducts.map(
            (p) =>
              p.latitude &&
              p.longitude && (
                <Marker
                  key={p.id}
                  position={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-12 h-12 rounded object-cover mx-auto mb-2"
                      />
                      <h5 className="font-bold text-sm m-0">{p.name}</h5>
                      <p className="text-blue-600 font-bold text-sm my-1"></p>
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
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
        {sortBy === 'closest' && userLocation && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-[500]">
            Showing results within {searchRange}km
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <Header title="Marketplace" />

      <div className="max-w-[1600px] mx-auto mt-6 px-4 grid grid-cols-1 lg:grid-cols-[300px_1fr_260px] gap-6 items-start">
        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
            <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Keywords..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mall
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  onChange={handleSortChange}
                  value={sortBy}
                >
                  <option value="created_at">Newest Arrivals</option>
                  <option value="lowest_price">Price: Low to High</option>
                  <option value="highest_price">Price: High to Low</option>
                  <option value="closest">Closest to Me</option>
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
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {sortBy === 'closest' && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <label className="flex justify-between text-sm font-semibold text-blue-800 mb-2">
                  <span>Range</span>
                  <span>{searchRange} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={searchRange}
                  onChange={(e) => setSearchRange(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}

            <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium mt-2 hover:bg-black transition-colors shadow-lg shadow-gray-200">
              Create Listing
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 flex gap-20 w-full justify-center">
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

        {/* RIGHT SIDEBAR (DASHBOARD) */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-28">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold border-b-2 border-gray-100 pb-2">
              Dashboard
            </h3>
            <div className="flex flex-col gap-3">
              <button
                disabled
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed text-left text-sm font-medium"
              >
                Looking For
              </button>
              <button
                disabled
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed text-left text-sm font-medium"
              >
                Selling
              </button>
              <button
                disabled
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed text-left text-sm font-medium"
              >
                Jobs
              </button>
              <button
                onClick={() => navigate('/network')}
                className="w-full p-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left text-sm font-semibold flex justify-between items-center"
              >
                <span>My Network</span>
                <span></span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
