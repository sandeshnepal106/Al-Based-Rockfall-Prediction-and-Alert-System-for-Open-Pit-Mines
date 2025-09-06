import React, { useState, useCallback } from "react";
import { Activity } from "lucide-react";
import Header from "./components/header";
import FileUpload from "./components/fileupload";
import LocationSearch from "./components/locationsearch";
import ImagePreview from "./components/imagepreview";
import RiskMap from "./components/riskmap";
import "leaflet/dist/leaflet.css";

const App = ()=> {
  // File upload states
  const [fileUploaded, setFileUploaded] = useState(false);
  const [preview, setPreview] = useState(null);
  
  // Location states
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  
  // UI states
  const [showMap, setShowMap] = useState(false);

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Handle file upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Preview handling remains same
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFileUploaded(true);
        setShowMap(false);
      };
      reader.readAsDataURL(file);

      // Upload handling with better error messages
      try {
        const formData = new FormData();
        formData.append('image', file);

        console.log('Attempting to upload to:', `${import.meta.env.VITE_API_URL}/api/upload-image`);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-image`, {
          method: 'POST',
          credentials: 'include', // Add this
          headers: {
              'Accept': 'application/json',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Upload successful:", data);
      } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          console.error("Connection failed. Please check if the server is running");
        }
        console.error("Upload error:", error.message);
      }
    }
  };

  // Fetch suggestions from Nominatim API
  const fetchSuggestions = async (searchText) => {
    if (!searchText.trim() || searchText.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const url = `${import.meta.env.VITE_API_URL}/location/search-location?q=${encodeURIComponent(searchText)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setSuggestions(data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
    } catch (err) {
      console.error("Suggestions error:", err);
    }
  };

  // Debounced suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 300),
    []
  );

  // Handle address input change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    debouncedFetchSuggestions(value);
  };

  // Handle location search
  const handleLocationSearch = async () => {
    if (!address.trim()) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const url = `${import.meta.env.VITE_API_URL}/location/search-location?q=${encodeURIComponent(address)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      } else {
        setCoordinates(null);
        setError("Location not found. Please try a different address.");
      }
    } catch (err) {
      setError("Failed to fetch location data. Please try again.");
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setAddress(suggestion.display_name);
    setCoordinates({
      lat: suggestion.lat,
      lng: suggestion.lng
    });
    setSuggestions([]);
    setError("");
  };

  // Handle prediction
  const handlePredict = () => {
    if (!coordinates) {
      setError("Please search for a location first!");
      return;
    }
    setShowMap(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      
      <main className="container mx-auto px-6 pb-12">
        {/* Introduction */}
        <div className="text-center mb-12">
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload an image and enter a location to assess rockfall risk using AI prediction models
          </p>
        </div>

        {/* File Upload Section */}
        <div className="flex justify-center mb-8">
          <FileUpload onFileChange={handleFileChange} fileUploaded={fileUploaded} />
        </div>

        {/* Location Search Section */}
        {fileUploaded && (
          <div className="flex justify-center">
            <LocationSearch
              address={address}
              onAddressChange={handleAddressChange}
              onSearch={handleLocationSearch}
              suggestions={suggestions}
              onSuggestionSelect={handleSuggestionSelect}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* Image and Map Display Section */}
        {fileUploaded && (
          <section className="mt-12 flex flex-col lg:flex-row gap-8">
            <ImagePreview preview={preview} />
            
            {showMap && coordinates && (
              <RiskMap coordinates={coordinates} locationName={address} />
            )}
          </section>
        )}

        {/* Predict Button */}
        {fileUploaded && coordinates && !showMap && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handlePredict}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 animate-pulse hover:animate-none"
            >
              <Activity className="h-6 w-6" />
              Predict Rockfall Risk
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;