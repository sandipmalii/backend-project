// Import necessary modules and functions
import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; // Importing ApiError class
import { User } from "../models/user.model.js"; // Importing User model
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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


/*===================part 2==================
===================== **** ==================*/

const loginUser = asyncHandler(async (req, res) => {
    // Extracting email, username, and password from request body
    const {email, username, password} = req.body
    console.log(email);

    // Checking if email or username is provided
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Finding the user by email or username
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    // If user not found, throw an error
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Checking if the provided password is correct
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
     throw new ApiError(401, "Invalid user credentials")
     }

    // Generating access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // Fetching logged in user details while excluding password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // Options for setting cookies
    const options = {
        httpOnly: true,
        secure: true,
    }

    // Sending response with cookies and user details
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    // Clearing refresh token for the logged out user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    );

    // Options for clearing cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Clearing cookies
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);

    // Sending response with cleared cookies
    return res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    // Extracting refresh token from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken ){
        throw new ApiError(401, "unauthorized request")
    }

    // Verifying refresh token
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET, 
     )
     const user = await User.findById(decodedToken?._id)
     if( !user ){
         throw new ApiError(401, "Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used")
     }
 
     const options={
         httpOnly: true,
         secure: true,
     }
 
     const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id) 
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(200,
          {accessToken, newRefreshToken}, 
          "Access token refreshed successfully"))
 
 
   } catch (error) {
     throw new ApiError(401, error?.message, "Invalid refresh token")
   }
    
   })


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword, /*confPassword */ } = req.body
    
   // if(newPassword === confPassword){}

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})   

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Created User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const{fullName, email} = req.body 

    if(!fullName || !email){
        throw new ApiError(400, "Please provide full name and email")
    }

   const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true})
        .select("-password")
        return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath) 

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }
   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const CoverImageLocalPath = req.file?.path

    if(!CoverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }
    const CoverImage = await uploadOnCloudinary(CoverImageLocalPath)

    if(!CoverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                CoverImage: CoverImage.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))

})

// Export the registerUser function
export {
    registerUser,
    loginUser,
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
 };
