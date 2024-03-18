import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";



const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json(
        { 
            success: true, 
            message: "Ok" 
        }
        )
})


export { registerUser }
