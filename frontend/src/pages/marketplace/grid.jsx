import React from 'react';
import { useNavigate } from 'react-router-dom';

import '../../styles/marketplace/grid.css';
import logo from '../../styles/images/logo.png';

export default function MarketplaceGrid() {
  const navigate = useNavigate();

  const items = [
    {
      id: 1,
      title: 'MacBook Pro 14"',
      price: '$1,250',
      location: 'Harare CBD',
      description: 'Excellent condition, lightly used, box included.',
    },
    {
      id: 2,
      title: 'iPhone 13',
      price: '$620',
      location: 'Avondale',
      description: 'Unlocked, 128GB, battery health 92%.',
    },
    {
      id: 3,
      title: 'Mountain Bike',
      price: '$180',
      location: 'Borrowdale',
      description: 'Recently serviced, aluminum frame.',
    },
  ];

  return (
    <div className="homepage-business-page">
      {/* TOP BAR */}
      <div className="top-left">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </div>

      <div className="top-center">
        <h2 className="main-heading">Marketplace – Grid View</h2>
      </div>

      <div className="top-right">
        <div className="button-stack">
          <button>Profile</button>
          <button>Settings</button>
        </div>
      </div>

      {/* LEFT SIDEBAR */}
      <aside className="sidebar-left card">
        <h3>Search & Filter</h3>

        <div className="button-stack">
          <input type="text" placeholder="Search marketplace…" />
          <button className="primary">Search</button>
          <button className="primary">Sort & Filter</button>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="main-feed">
        <div className="view-toggle">
          <button className="active">Grid</button>
          <button onClick={() => navigate('/marketplace/list')}>List</button>
          <button onClick={() => navigate('/marketplace/map')}>Map</button>
        </div>

        <div className="grid-container">
          {items.map((item) => (
            <div key={item.id} className="grid-item">
              <div className="item-image">
                <img
                  src={`https://source.unsplash.com/300x200/?${item.title}`}
                  alt={item.title}
                />
              </div>

              <div className="item-details">
                <h4>{item.title}</h4>
                <p className="description">{item.description}</p>
                <span className="location">{item.location}</span>

                <div className="item-meta">
                  <span className="price">{item.price}</span>
                  <button>View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
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
