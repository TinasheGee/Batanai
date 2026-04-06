import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
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

export default function MyNetwork() {
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [followedBy, setFollowedBy] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetwork();
    // Listen for follow events from other pages (Marketplace) so we can update immediately
    const onFollow = (e) => {
      const biz = e.detail;
      if (!biz || !biz.id) return;
      setFollowing((prev) => {
        // avoid duplicates
        const exists = prev.find((p) => String(p.id) === String(biz.id));
        if (exists) return prev;
        return [
          {
            id: biz.id,
            name: biz.name,
            logo_url: biz.logo_url,
            category: biz.category,
            latitude: biz.latitude,
            longitude: biz.longitude,
            followed_at: biz.followed_at,
          },
          ...prev,
        ];
      });
    };
    window.addEventListener('network:follow', onFollow);
    const onUnfollow = (e) => {
      const id = e.detail?.id;
      if (!id) return;
      setFollowing((prev) => prev.filter((p) => String(p.id) !== String(id)));
    };
    window.addEventListener('network:unfollow', onUnfollow);

    return () => {
      window.removeEventListener('network:follow', onFollow);
      window.removeEventListener('network:unfollow', onUnfollow);
    };
  }, []);

  const fetchNetwork = async () => {
    try {
      const res = await api.get('/network');
      setFollowing(res.data.following);
      setFollowedBy(res.data.followedBy || []);
      setSuggestions(res.data.suggestions);
      setPeople(res.data.people);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleFollow = async (id) => {
    try {
      await api.post(`/network/follow/${id}`);
      const business = suggestions.find((b) => b.id === id);
      setSuggestions(suggestions.filter((b) => b.id !== id));
      setFollowing([business, ...following]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async (id) => {
    try {
      await api.delete(`/network/follow/${id}`);
      const business = following.find((b) => b.id === id);
      setFollowing(following.filter((b) => b.id !== id));
      setSuggestions([...suggestions, business]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-black">
        Loading network...
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Connect With Sellers & Discuss Better Deals" />

      {/* Main Content Area: Left lists, Center map, Right suggestions/dashboard */}
      <div className="max-w-[1600px] mx-auto mt-6 px-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6 items-start">
        {/* LEFT: Companies + Customers stacked */}
        <aside className="flex flex-col gap-6">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-5 w-[320px]">
            <h3 className="font-bold text-black text-lg mb-4 flex items-center gap-2">
              <span>Companies</span>
              <span className="bg-gray-100 text-black px-2 py-0.5 rounded-full text-xs">
                {following.length}
              </span>
            </h3>
            <div className="flex flex-col gap-1">
              {following.length === 0 && (
                <p className="text-black text-sm">
                  You are not following any businesses yet.
                </p>
              )}
              {following.map((biz) => (
                <div
                  key={biz.id}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img
                    src={biz.logo_url || 'https://via.placeholder.com/50'}
                    alt={biz.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-black text-sm truncate">
                      {biz.name}
                    </h4>
                    <small className="text-black text-xs truncate block">
                      {biz.category}
                    </small>
                  </div>
                  <button
                    onClick={() => handleUnfollow(biz.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-5 w-[320px]">
            <h3 className="font-bold text-black text-lg mb-4 flex items-center gap-2">
              <span>Customers</span>
              <span className="bg-gray-100 text-black px-2 py-0.5 rounded-full text-xs">
                {followedBy.length}
              </span>
            </h3>
            <div className="flex flex-col gap-1">
              {followedBy.length === 0 && (
                <p className="text-black text-sm">No followers yet.</p>
              )}
              {followedBy.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img
                    src={user.profile_image}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-black text-sm truncate">
                      {user.full_name}
                    </h4>
                    <small className="text-black text-xs block">
                      {user.role}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: Suggestions + People (replacing the map) */}
        <main className="flex flex-col gap-6">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="font-bold text-black text-lg mb-4">
              Suggested for you
            </h3>
            <div className="flex flex-col gap-1">
              {suggestions.length === 0 && (
                <p className="text-black text-sm">No suggestions right now.</p>
              )}
              {suggestions.map((biz) => (
                <div
                  key={biz.id}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img
                    src={biz.logo_url || 'https://via.placeholder.com/50'}
                    alt={biz.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-black text-sm truncate">
                      {biz.name}
                    </h4>
                    <small className="text-black text-xs truncate block">
                      {biz.category}
                    </small>
                  </div>
                  <button
                    onClick={() => handleFollow(biz.id)}
                    className="px-3 py-1 bg-brand-200 text-brand-600 text-xs font-semibold rounded-lg hover:bg-brand-200 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="font-bold text-black text-lg mb-1">
              People like you
            </h3>
            <p className="text-xs text-black mb-4">Based on your interests</p>
            <div className="flex flex-col gap-1">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img
                    src={person.profile_image}
                    alt={person.full_name}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-black text-sm truncate">
                      {person.full_name}
                    </h4>
                    <small className="text-black text-xs block">Customer</small>
                  </div>
                </div>
              ))}
              {people.length === 0 && (
                <p className="text-black text-sm">
                  No recommendations yet. Update your interests!
                </p>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT: Dashboard menu */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-30 h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-black font-bold pb-2 text-center">
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
    </div>
  );
}
