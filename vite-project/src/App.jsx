import React, { useState } from "react";
import { Upload, Image as ImageIcon, Activity, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

// Component to update map view on position change
function MapUpdater({ position }) {
  const map = useMap();
  if (position) {
    map.flyTo(position, 12, { animate: true, duration: 2 });
  }
  return null;
}

function App() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [position, setPosition] = useState(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFileUploaded(true);
        setShowMap(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle location search (Nominatim API)
  const handleSearch = async () => {
    if (!locationName) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationName
        )}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
      } else {
        alert("Location not found!");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      alert("Error fetching location data.");
    }
  };

  // Handle prediction
  const handlePredict = () => {
    if (!position) {
      alert("Please search for a location first!");
      return;
    }
    setShowMap(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center p-6 text-white">
      {/* Header */}
      <header className="w-full text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-wide flex items-center justify-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-lg">
          ⛏ Rockfall AI Prediction
        </h1>
        <p className="text-gray-400 mt-3 text-lg">
          Upload an image and enter a location to assess risk
        </p>
      </header>

      {/* Upload Section */}
      <section className="bg-slate-800/40 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-lg text-center border border-slate-700 hover:border-blue-400 transition transform hover:scale-105 hover:shadow-blue-500/30">
        <label className="flex flex-col items-center gap-4 cursor-pointer">
          <Upload className="h-12 w-12 text-blue-400 drop-shadow" />
          <span className="text-xl font-semibold">Choose an Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-gray-400">Supported: JPG, PNG</p>
        </label>
      </section>

      {/* Location Search Bar */}
      {fileUploaded && (
        <div className="mt-8 flex gap-3 w-full max-w-lg">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Enter location name (e.g., Ravangla, South Sikkim)"
            className="flex-grow px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 rounded-xl shadow-lg flex items-center gap-2 font-semibold transition"
          >
            <Search className="h-5 w-5" /> Search
          </button>
        </div>
      )}

      {/* Image + Map Section */}
      {fileUploaded && (
        <section className="mt-12 flex flex-col md:flex-row gap-8 w-full px-8 items-stretch">
          {/* Image Section */}
          <div className="flex-1 bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-blue-300">
              <ImageIcon className="h-6 w-6 text-blue-400" /> Selected Image
            </h3>
            <div className="flex-grow flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-[400px] w-full object-contain rounded-2xl shadow-lg border border-slate-700"
              />
            </div>
          </div>

          {/* Map Section */}
          {showMap && position && (
            <div className="flex-[2] bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300 text-center">
                📍 Risk Map
              </h3>
              <div className="flex-grow">
                <MapContainer
                  center={position}
                  zoom={12}
                  minZoom={5}
                  maxZoom={16}
                  style={{
                    height: "500px",
                    width: "100%",
                    borderRadius: "1rem",
                  }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  />
                  {position && (
                    <>
                      <Marker position={position}>
                        <Popup>Predicted Risk Location</Popup>
                      </Marker>
                      <MapUpdater position={position} />
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Predict Button */}
      {fileUploaded && !showMap && (
        <button
          onClick={handlePredict}
          className="mt-12 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-3 mx-auto transition transform hover:scale-105 animate-pulse"
        >
          <Activity className="h-6 w-6" /> Predict Risk
        </button>
      )}
    </div>
  );
}

export default App;
