import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";
import imageRouter from "./routes/imageRoutes.js";
import locationRouter from "./routes/locationRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

const allowedOrigins = ["http://localhost:5173", "*"];

app.use(express.json());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})

app.get("/", (req, res) => res.send("API working...."));
app.use("/api", imageRouter);
app.use("/location", locationRouter);
