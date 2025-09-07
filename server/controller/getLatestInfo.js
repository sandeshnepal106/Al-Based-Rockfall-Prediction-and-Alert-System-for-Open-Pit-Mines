// controllers/imageController.js
import path from "path";
import { spawn } from "child_process";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    const pythonScriptPath = path.join(
        __dirname,
        "../../python_service/predict_rockfall.py"
    );
    const pythonProcess = spawn("python3", [pythonScriptPath]);

    let pythonOutput = "";
    let pythonError = "";

    // Handle Python output
    pythonProcess.stdout.on("data", (data) => {
        pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        pythonError += data.toString();
    });

    pythonProcess.on("close", (code) => {
        if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            console.error("Python error:", pythonError);
            return res.status(500).json({
                message: "Error processing data with Python service",
                error: pythonError,
            });
        }

        try {
            // Parse Python output if it returns JSON
            const pythonResult = pythonOutput.trim()
                ? JSON.parse(pythonOutput)
                : null;

            console.log(pythonResult)
            // Return combined results
            console.log("Python raw output:", pythonOutput);
            console.log("Parsed Python result:", pythonResult);


            return res.json({
                locations: formattedResults,
                analysis: pythonResult,
            });


        } catch (parseError) {
            console.error("Error parsing Python output:", parseError);
            res.json({
                locations: formattedResults,
                analysis: pythonOutput.trim(),
            });
        }
    });

    

    // Send JSON data to Python stdin
    pythonProcess.stdin.write(JSON.stringify(formattedResults));
    pythonProcess.stdin.end();




    


    // res.status(200).json({
    // success: true,
    // formattedResults: [
    //     {
    //     lat,
    //     lon,
    //     imageURL
    //     }
    // ]
    // });


  } catch (error) {
    console.error("Error in getLatestInfo controller:", error);
    res.status(500).json({ 
        success: false,
        message: "Server error while retrieving image information." 
    });
  }
};