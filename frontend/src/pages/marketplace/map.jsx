import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import '../../styles/marketplace/map.css';
import logo from '../../styles/images/logo.png';

export default function MarketplaceMap() {
  const navigate = useNavigate();

  useEffect(() => {
    const map = L.map('map').setView([-17.8292, 31.0522], 13);

    L.tileLayer(
      'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; OpenStreetMap & CartoDB' }
    ).addTo(map);

    const items = [
      { lat: -17.8292, lng: 31.0522, title: 'Laptop', price: '$450' },
      { lat: -17.835, lng: 31.04, title: 'Phone', price: '$200' },
      { lat: -17.82, lng: 31.06, title: 'Bike', price: '$120' },
    ];

    items.forEach((item) => {
      L.marker([item.lat, item.lng])
        .addTo(map)
        .bindPopup(`<strong>${item.title}</strong><br/>${item.price}`);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="homepage-business-page">
      {/* TOP ROW */}
      <div className="top-left">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </div>

      <div className="top-center">
        <h2 className="main-heading">Marketplace – Map View</h2>
      </div>

      <div className="top-right">
        <div className="button-stack">
          <button className="nav-btn">Profile</button>
          <button className="nav-btn">Settings</button>
        </div>
      </div>

      {/* LEFT FILTERS */}
      <aside className="sidebar-left card button-stack">
        <h3>Search and Sort</h3>
        <input type="text" placeholder="Search marketplace…" />
        <button className="primary">Search</button>
        <button className="primary">Sort & Filter</button>
      </aside>

      {/* MAP */}
      <main className="main-feed">
        <div className="view-toggle">
          <button onClick={() => navigate('/marketplace/grid')}>Grid</button>
          <button onClick={() => navigate('/marketplace/list')}>List</button>
          <button className="active">Map</button>
        </div>

        <div id="map" />
      </main>

      {/* RIGHT DASHBOARD */}
      <aside className="sidebar-right card">
        <h3>Dashboard</h3>

        <div className="button-stack disabled">
          <button disabled>Saved</button>
          <button disabled>Favorites</button>
          <button disabled>Viewed</button>
        </div>
      </aside>
    </div>
  );
}
