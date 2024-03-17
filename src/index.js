//require('dotenv').config();

//import mongoose from "mongoose";

//export {DB_NAME} from "./constants";


import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
});






connectDB()










/*  <=============APPROACH 1 =================>
<=============we used here try and catch,async and await.  =================> 

import express from "express"
const app = express()

 ( async () => {
    try {
        await mongoose.connect('${process.env.MONGODB_URL}/${DB_NAME}')
        app.on("error", (error) => {
            console.error("ERROR:", error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`listening on port ${process.env.PORT}`);
        })   
        
    } catch (error) {
        console.error("ERROR:", error)
throw err
    }
 })
 ()

 */