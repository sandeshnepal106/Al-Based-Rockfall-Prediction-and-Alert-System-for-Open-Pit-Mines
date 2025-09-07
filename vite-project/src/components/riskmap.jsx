import React from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

// Map updater component
const MapUpdater = ({ position }) => {
  const map = useMap();
  if (position) {
    map.flyTo(position, 12, { animate: true, duration: 2 });
  }
  return null;
};

// Helper to get color based on risk (0-1)
const getRiskColor = (risk) => {
  if (risk < 0.33) return "#22c55e"; // green
  if (risk < 0.66) return "#eab308"; // yellow
  return "#ef4444"; // red
};

const RiskMap = ({ coordinates, locationName, risk_probability }) => {
  if (!coordinates) return null;
  
  const position = [coordinates.lat, coordinates.lng];
  const risk = Number(risk_probability) || 0;
  const color = getRiskColor(risk);
  
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
          <CircleMarker
            center={position}
            radius={Math.max(10, risk * 50)} // Dynamic radius based on risk
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: Math.max(0.3, risk), // Ensure minimum visibility
              weight: 3,
              opacity: 0.8
            }}
          >
            <Popup>
              <div className="text-center">
                <strong>Risk Location</strong>
                <br />
                {locationName || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
                <br />
                <span style={{ color, fontWeight: 'bold' }}>
                  {`Risk: ${(risk * 100).toFixed(1)}%`}
                </span>
              </div>
            </Popup>
          </CircleMarker>
          <MapUpdater position={position} />
        </MapContainer>
      </div>
      
      {/* Risk Legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-green-400">Low (0-33%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-yellow-400">Medium (33-66%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-red-400">High (66-100%)</span>
        </div>
      </div>
      
      {/* Coordinates Display */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-xl text-center">
        <p className="text-green-400 text-sm">
          📍 Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </p>
        <p className="text-cyan-400 text-sm mt-1">
          🎯 Risk Level: {(risk * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default RiskMap;