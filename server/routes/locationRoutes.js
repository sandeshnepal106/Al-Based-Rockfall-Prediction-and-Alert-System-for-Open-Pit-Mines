// routes/imageRoutes.js
import express from 'express';
import axios from 'axios'; // Import axios
import { searchLocation } from '../controller/locationController.js';
import { getLatestImageMiddleware } from '../middleware/getImage.js'
import { getLatestInfo } from '../controller/getLatestInfo.js';

// ... (your other imports)

const locationRouter = express.Router();

// ... (your existing /upload-image route)

// NEW ROUTE for location search
locationRouter.get('/locate', getLatestImageMiddleware, searchLocation);
locationRouter.get('/get-latest-info', getLatestImageMiddleware, getLatestInfo);
locationRouter.get('/search-location', async (req, res) => {
  try {
    const address = req.query.q; // Get search text from query parameter

    if (!address) {
      return res.status(400).json({ message: 'Search query "q" is required.' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
    
    // Your server makes the request to the external API
    const apiResponse = await axios.get(url, {
      headers: { 
        'User-Agent': 'RockfallPredictionApp/1.0' // OpenStreetMap requires a User-Agent
      }
    });

    // Your server sends the data back to your frontend
    res.json(apiResponse.data);

  } catch (error) {
    console.error("Error in /search-location route:", error.message);
    res.status(500).json({ message: "Server error while fetching location." });
  }
});



export default locationRouter;