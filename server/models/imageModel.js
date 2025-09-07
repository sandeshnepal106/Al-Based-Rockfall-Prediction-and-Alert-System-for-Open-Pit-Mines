import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
    {
        imageURL: {
            type: String,
            required: true
        },
        lat: {
            type: String,
            default: "0"

        },
        lon: {
            type: String,
            default: "0"
        }
    }, {timestamps: true}
)
const uploadModel = mongoose.model("Upload", uploadSchema);
export default uploadModel;