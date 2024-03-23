import { ApiError } from "../utils/ApiError"; // Importing ApiError from utils/ApiError
import { asyncHandler } from "../utils/asyncHandler"; // Importing asyncHandler from utils/asyncHandler
import jwt from "jsonwebtoken"; // Changed Jwt to jwt for consistency
import { User } from "../models/user.model"; // Importing User from models/user.model

// Middleware function to verify JWT token
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", ""); // Corrected typo in "Authorization"

        if (!token) {
            throw new ApiError(401, "Unauthorized Request");
        }

        // Verifying the token using jwt.verify
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Finding the user by decoded token's _id and selecting only necessary fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        // Assigning user object to req.user for further use
        req.user = user;
        next(); // Passing control to the next middleware
    } catch (error) {
        // If any error occurs, throwing an ApiError with appropriate status code and message
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
