import uploadModel from "../models/imageModel.js";

export const getLatestImageMiddleware = async (req, res, next) => {
    try {
        const latestImage = await uploadModel
            .findOne()
            .sort({ createdAt: -1 });

        if (!latestImage) {
            return res.status(404).json({
                success: false,
                message: "No images found in the database."
            });
        }

        // Attach the full document and the URL as before
        req.latestImage = latestImage;
        req.latestImageURL = latestImage.imageURL;

        // 👇 Key Addition: Attach the document's unique ID
        req.imageId = latestImage._id;

        next();

    } catch (error) {
        console.error("Error in getLatestImageMiddleware:", error);
        // Pass the error to Express's central error handler
        next(error);
    }
};