// Import necessary modules and functions
import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; // Importing ApiError class
import { User } from "../models/user.model.js"; // Importing User model
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Define the registerUser function to handle user registration
const registerUser = asyncHandler(async (req, res) => {
    // Destructure user details from the request body
    const { fullName, username, email, password } = req.body;

    // Check if any of the required fields are empty
    if ([fullName, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required"); // Throw an error if any field is empty
    }

    // Check if the username already exists in the database
    const existedUser = await User.findOne({ username });

    if (existedUser) {
        throw new ApiError(409, "User already exists"); // Throw an error if the username already exists
    }

    //console.log(req.files);   

    // Retrieve paths of avatar and cover image from the request files
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    
    // Check if avatar path exists
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required"); // Throw an error if avatar path doesn't exist
    }

    // Upload avatar and cover image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Check if avatar upload failed
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed"); // Throw an error if avatar upload fails
    }

    // Create a new user in the database
    const newUser = await User.create({
        fullName,
        username: username.toLowerCase(), // Convert username to lowercase
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "" // Use cover image URL if available, otherwise use empty string
    });

    // Check if user creation failed
    if (!newUser) {
        throw new ApiError(500, "Something went wrong while registering the user"); // Throw an error if user creation fails
    }

    // Retrieve the created user from the database
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    // Check if user retrieval failed
    if (!createdUser) {
        throw new ApiError(500, "User creation failed"); // Throw an error if user retrieval fails
    }

    // Return success response with created user details
    return res.status(201).json(
        new ApiResponse(200, "User created successfully", createdUser)
    );
});



// Export the registerUser function
export { registerUser };
