import express from "express";
import { uploadImage } from "../controller/imageController.js";
import upload from "../middleware/multer.js";

const imageRouter = express.Router();

imageRouter.post('/upload-image', upload.single('image'), uploadImage, );

export default imageRouter;