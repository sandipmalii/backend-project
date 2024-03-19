import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

/*<=============COnfiguration of URL Data like %,=, search, etc.==================>*/

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

/*<============= COOKIES ==================> */
app.use(cookieParser())

/*<============= Import Routes ==================> */
//const userRouter = express.Router();
//import userRoutes from "./routes/user.routes.js"
import userRouter from './routes/user.routes.js'
 
/*<============= Routes Declaration ==================> */

//app.use("/api/v1/users", userRoutes) 
app.use("/api/v1/users", userRouter)
//export default userRouter;

export default app;