// import { Router } from "express";
// import { registerUser } from "../controllers/user.controller.js";
// import {upload} from "../middlewares/multer.middleware.js"
// const router = Router()
// router.route("/register").post(
//     upload.fields([
//         upload.fields([
//             {
//                 name: "avatar",
//                 maxCount: 1
//             },
//             {
// name : "coverImage",
// maxCount : 1
//             }
//         ])
//     ]),
//     registerUser
//     )
// export default router


// Importing necessary modules and functions
import express from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

// Assuming verifyJWT middleware is defined in a separate file, import it
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Adjust the path as per your actual file structure

// Creating an instance of the Express Router
const { Router } = express;
const router = Router();

// Route for user registration
router.post("/register",
  // Using multer middleware to handle file uploads for avatar and cover image
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  // Calling the registerUser function from the user controller to handle registration
  registerUser
);

// Route for user login
router.route("/login").post(loginUser);

// Secured route for user logout
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

// Exporting the router to be used by the application
export default router
