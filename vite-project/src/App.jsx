import React, { useState } from "react";
import { Upload, Image as ImageIcon, Activity } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./App.css";

function App() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const positions = [[23.7400, 86.4200]]; // Example: Jharia coal mine

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFileUploaded(true);
        setShowMap(false); // reset map if new image uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle prediction
  const handlePredict = () => {
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
          Upload an image to assess potential risk
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

     {/* Image + Map Section (Side by Side, Wider) */}
      {fileUploaded && (
        <section className="mt-12 flex flex-col md:flex-row gap-8 w-full px-8 items-stretch">
          {/* Image Section (smaller) */}
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

          {/* Map Section (larger width + height) */}
          {showMap && (
            <div className="flex-[2] bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300 text-center">
                📍 Risk Map
              </h3>
              <div className="flex-grow">
                <MapContainer
                  center={positions[0]}
                  zoom={12}
                  minZoom={5}
                  maxZoom={16}
                  style={{ height: "500px", width: "100%", borderRadius: "1rem" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  />
                  {positions.map((position, index) => (
                    <Marker key={index} position={position}>
                      <Popup>Predicted Risk Location {index + 1}</Popup>
                    </Marker>
                  ))}
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
