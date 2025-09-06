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

        req.latestImage = latestImage;
        req.latestImageURL = latestImage.imageURL;

        next();

    } catch (error) {
        console.error("Error in getLatestImageMiddleware:", error);
        next(error);
    }
};

