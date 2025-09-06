import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
    {
        imageURL: {
            type: String,
            required: true
        }
    }, {timestamps: true}
)
const uploadModel = mongoose.model("Upload", uploadSchema);
export default uploadModel;