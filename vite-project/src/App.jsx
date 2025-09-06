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
  const positions = [[23.7400, 86.4200]]; // Example: Jharia coal mine

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
    <div className="container">
      <div className="logos">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App
