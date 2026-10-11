import mongoose from "mongoose";

export const connectDB=async () => {
    try {
        const mongoUrl = new URL(process.env.MONGODB_URL)
        if (mongoUrl.pathname.startsWith("//")) {
            mongoUrl.pathname = `/${mongoUrl.pathname.replace(/^\/+/, "")}`
        }

        await mongoose.connect(mongoUrl.toString())
        console.log("Connected DB")
    } catch (error) {
        console.log("MongoDb error",error)
    }
    
}