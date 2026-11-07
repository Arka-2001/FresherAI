import express from "express"
import dotenv from "dotenv"
dotenv.config()
import proxy from "express-http-proxy"
import cors from "cors"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import { isAuth } from "./middleware/isAuth.js"
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js"

const app = express()

// Trust Render reverse proxy for HTTPS cookies
app.set("trust proxy", 1)

app.use(express.json())

const configuredFrontend = process.env.FRONTEND_URL?.replace(/\/+$/, "")

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server) or from allowed frontends
        if (
            !origin ||
            origin === configuredFrontend ||
            origin === "http://localhost:5173" ||
            origin.endsWith(".vercel.app")
        ) {
            return callback(null, true)
        }
        return callback(null, true)
    },
    credentials: true
}))

app.use(morgan("dev"))
app.use(cookieParser())

const PORT = process.env.PORT || 6000

app.get("/" , (req,res)=>{
    res.send("Hello from Gateway")
})

app.use("/api/auth" , proxy(process.env.AUTH_SERVICE_URL))
app.use("/api/resume" ,isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL, { parseReqBody: false }))
app.use("/api/interview",isAuth ,proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL))
app.use("/api/roadmap",isAuth ,proxyWithHeaders(process.env.ROADMAP_SERVICE_URL))
app.use("/api/billing",isAuth ,proxyWithHeaders(process.env.BILLING_SERVICE_URL))
app.use("/api/me",isAuth,getCurrentUser)

app.listen(PORT , ()=>{
    console.log(`Gateway Started on ${PORT}`)
})
