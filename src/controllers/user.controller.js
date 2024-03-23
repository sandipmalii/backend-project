// Import necessary modules and functions
import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; // Importing ApiError class
import { User } from "../models/user.model.js"; // Importing User model
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async(userID) => {
    try{
          const user = await User.findById(userID)
          const accessToken = user.generateAccessToken()
          const refreshToken = user.generateRefreshToken()

          user.refreshToken = refreshToken
          user.save({validateBeforeSave: false})

          return {accessToken, refreshToken}
    }
    catch(error){
       throw new ApiError(500, "Something went wrong while generating refresh and access token " );
    }
    
}


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

const loginUser = asyncHandler(async (req, res) => {
    // Extracting email, username, and password from request body
    const { email, username, password } = req.body;

    // Checking if email or username is provided
    if (!email || !username) {
        throw new ApiError(400, "Username or email is required");
    }

    // Finding the user by email or username
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    // If user not found, throw an error
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Checking if the provided password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect");
    }

    // Generating access token and refresh token
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    // Fetching logged in user details while excluding password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Options for setting cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Sending response with cookies and user details
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    // Clearing refresh token for the logged out user
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    }, { new: true });

    // Options for clearing cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Sending response with cleared cookies
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});



// Export the registerUser function
export { registerUser, loginUser, logoutUser };
