import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./configs/db.js"
import billingRouter from "./routes/billing.route.js"

dotenv.config()

const app = express()
app.use(express.json())

const PORT = Number(process.env.PORT) || 8005

app.get("/",(req,res)=>{
    res.send("Hello from Billing-service")
})

app.use("/",billingRouter)

app.listen(PORT, "0.0.0.0", ()=>{
    console.log(`✅ Billing-service Started on ${PORT}`)
    connectDB()
})
