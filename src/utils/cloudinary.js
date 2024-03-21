import { v2 as cloudinary } from 'cloudinary'; // Importing Cloudinary library
import fs from "fs"; // Importing the Node.js file system module

// Configure Cloudinary with API credentials
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET // Cloudinary API secret
});

// Define a function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Check if localFilePath is provided
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto" // Auto-detect the resource type (e.g., image, video)
    });

    // File has been uploaded successfully
    console.log("File has been uploaded successfully", response.url);
    //fs.unlinkSync(localFilePath); 
    return response; // Return the Cloudinary response
  } catch (error) {
    // If an error occurs during upload, remove the locally saved file
    fs.unlinkSync(localFilePath); // Remove the locally saved file
    return null; // Return null indicating upload failure
  }
};

// Export the uploadOnCloudinary function to be used in other modules
export { uploadOnCloudinary };
