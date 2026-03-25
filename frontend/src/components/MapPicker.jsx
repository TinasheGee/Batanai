import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ClickableMap({ selected, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

export default function MapPicker({ initialPosition, onChange }) {
  const defaultPos = initialPosition || { lat: -17.8252, lng: 31.0522 };
  const [marker, setMarker] = useState(defaultPos);

  const handleSelect = (latlng) => {
    setMarker(latlng);
    onChange && onChange(latlng);
  };

  return (
    <div
      style={{
        height: '60vh',
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={[defaultPos.lat, defaultPos.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickableMap selected={marker} onSelect={handleSelect} />
        {marker && <Marker position={[marker.lat, marker.lng]} />}
      </MapContainer>
    </div>
  );
}
