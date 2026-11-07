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

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8001"
const RESUME_SERVICE_URL = process.env.RESUME_SERVICE_URL || "http://127.0.0.1:8002"
const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || "http://127.0.0.1:8003"
const ROADMAP_SERVICE_URL = process.env.ROADMAP_SERVICE_URL || "http://127.0.0.1:8004"
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "http://127.0.0.1:8005"

app.get("/" , (req,res)=>{
    res.send("Hello from Gateway")
})

const handleProxyError = (serviceName) => (err, res, next) => {
    console.error(`❌ [GATEWAY] Failed to connect to ${serviceName}:`, err.message)
    res.status(502).json({
        success: false,
        message: `${serviceName} service unavailable: ${err.message}`
    })
}

app.use("/api/auth" , proxy(AUTH_SERVICE_URL, {
    proxyErrorHandler: handleProxyError("Auth")
}))

app.use("/api/resume" ,isAuth, proxyWithHeaders(RESUME_SERVICE_URL, { 
    parseReqBody: false,
    proxyErrorHandler: handleProxyError("Resume")
}))

app.use("/api/interview",isAuth ,proxyWithHeaders(INTERVIEW_SERVICE_URL, {
    proxyErrorHandler: handleProxyError("Interview")
}))

app.use("/api/roadmap",isAuth ,proxyWithHeaders(ROADMAP_SERVICE_URL, {
    proxyErrorHandler: handleProxyError("Roadmap")
}))

app.use("/api/billing",isAuth ,proxyWithHeaders(BILLING_SERVICE_URL, {
    proxyErrorHandler: handleProxyError("Billing")
}))

app.use("/api/me",isAuth,getCurrentUser)

app.listen(PORT , ()=>{
    console.log(`Gateway Started on ${PORT}`)
})
