import axios from 'axios';
// 👇 1. Import your Mongoose model
import imageModel from '../models/imageModel.js'; // Adjust path if needed

export const searchLocation = async (req, res) => {
  try {
    const imageURL = req.latestImageURL;
    // Assume middleware provides the image's database ID
    const imageId = req.imageId;

    const address = req.query.q;
    if (!address) {
      return res.status(400).json({ message: 'Search query "q" is required.' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
    
    const apiResponse = await axios.get(url, {
      headers: { 
        'User-Agent': 'RockfallPredictionApp/1.0'
      }
    });

    // 👇 2. Check for results and perform the update before sending the response
    if (apiResponse.data && apiResponse.data.length > 0) {
      const firstResult = apiResponse.data[0]; // Get the most relevant location

      // Use the document's ID and the lat/lon from the first result
      await imageModel.findByIdAndUpdate(imageId, { 
        lat: firstResult.lat, 
        lon: firstResult.lon 
      });
    }

    // Map all results for the client-side response
    const formattedResults = apiResponse.data.map(location => ({
      displayName: location.display_name,
      lat: location.lat,
      lon: location.lon,
      imageURL: imageURL
    }));
    
    res.json(formattedResults);

  } catch (error) {
    console.error("Error in searchLocation controller:", error.message);
    res.status(500).json({ message: "Server error while fetching location." });
  }
};