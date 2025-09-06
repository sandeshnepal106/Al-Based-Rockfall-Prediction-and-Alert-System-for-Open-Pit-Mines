import uploadModel from "../models/imageModel.js";

export const uploadImage = async(req, res) => {
    try {
        const imageURL = req.file.path;
        
        if (!imageURL) {
            return res.status(400).json({ message: "Image URL is required" });
        }
        const newUpload = new uploadModel({ imageURL });
        await newUpload.save();

        res.status(201).json({ message: "Image uploaded successfully" });
        console.log("URL uploaded");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}




