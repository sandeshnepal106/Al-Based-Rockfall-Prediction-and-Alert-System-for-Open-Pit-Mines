import React from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

// Map updater component
const MapUpdater = ({ position }) => {
  const map = useMap();
  if (position) {
    map.flyTo(position, 12, { animate: true, duration: 2 });
  }
  return null;
};

const RiskMap = ({ coordinates, locationName }) => {
  if (!coordinates) return null;

  const position = [coordinates.lat, coordinates.lng];

  return (
    <div className="flex-[2] bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-cyan-300 text-center flex items-center justify-center gap-2">
        <MapPin className="h-6 w-6" />
        Risk Assessment Map
      </h3>
      <div className="h-[500px] rounded-2xl overflow-hidden border border-slate-600">
        <MapContainer
          center={position}
          zoom={12}
          minZoom={5}
          maxZoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={position}>
            <Popup>
              <div className="text-center">
                <strong>Risk Location</strong>
                <br />
                {locationName || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
              </div>
            </Popup>
          </Marker>
          <MapUpdater position={position} />
        </MapContainer>
      </div>
      
      {/* Coordinates Display */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-xl text-center">
        <p className="text-green-400 text-sm">
          📍 Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </p>
      </div>
    </div>
  );
};

export default RiskMap;