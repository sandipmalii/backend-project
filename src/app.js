import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express();

app.use(cors({
    origin: process.envv.CORS_ORIGIN ,
    credentials: true,
}))


/*<=============COnfiguration of URL Data like %,=, search, etc.==================>*/

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

/*<============= COOKIES ==================> */
app.use(cookieParser())



export { app }