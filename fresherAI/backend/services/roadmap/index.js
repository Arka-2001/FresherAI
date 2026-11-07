import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./configs/db.js"
import roadmapRouter from "./routes/roadmap.route.js"
dotenv.config()

const app = express()
app.use(express.json())

const PORT = Number(process.env.PORT) || 8004

app.use("/",roadmapRouter)

app.listen(PORT, "0.0.0.0", ()=>{
    console.log(`✅ Roadmap-service Started on ${PORT}`)
    connectDB()
})
