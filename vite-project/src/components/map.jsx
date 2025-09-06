import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const Map = ({ coordinates, mineName }) => {
  const position = coordinates ? [coordinates.lat, coordinates.lng] : [22.9734, 78.6569];

  return (
    <MapContainer center={position} zoom={6} minZoom={5} maxZoom={15} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {coordinates &&
        <Marker position={position}>
          <Popup>
            {mineName ? mineName : "Selected Mine"}
          </Popup>
        </Marker>
      }
    </MapContainer>
  );
};

export default Map;

