// controllers/imageController.js

export const getLatestInfo = (req, res) => {
  try {
    // 1. Destructure lat, lon, and now imageURL from the object.
    const { lat, lon, imageURL } = req.latestImage;

    // 2. Check if all required properties exist on the document.
    if (lat === undefined || lon === undefined || !imageURL) {
      return res.status(404).json({
        success: false,
        message: "Required data (lat, lon, or imageURL) not found for the latest image."
      });
    }

    // 3. Send all data back, aliasing imageURL as dem_image_url.
    const formattedResults =[
        {
        lat,
        lon,
        imageURL
        }
    ]

    


    res.status(200).json({
    success: true,
    formattedResults: [
        {
        lat,
        lon,
        imageURL
        }
    ]
    });


  } catch (error) {
    console.error("Error in getLatestInfo controller:", error);
    res.status(500).json({ 
        success: false,
        message: "Server error while retrieving image information." 
    });
  }
};