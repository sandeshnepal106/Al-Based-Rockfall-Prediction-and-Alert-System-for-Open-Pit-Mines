// routes/locationRoutes.js
import express from 'express';
import axios from 'axios';
import { getLatestImageMiddleware } from '../middleware/getImage.js';

const locationRouter = express.Router();

// 👇 2. Add the middleware to the route's execution chain
locationRouter.get('/search-location', getLatestImageMiddleware, async (req, res) => {
  try {
    // The middleware has already run and attached this for us!
    const imageURL = req.latestImageURL;

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

    const formattedResults = apiResponse.data.map(location => ({
      displayName: location.display_name,
      lat: location.lat,
      lon: location.lon,
      imageURL: imageURL // Use the URL provided by the middleware
    }));
    res.json(formattedResults);

  } catch (error) {
    console.error("Error in /search-location route:", error.message);
    res.status(500).json({ message: "Server error while fetching location." });
  }
});

export default locationRouter;