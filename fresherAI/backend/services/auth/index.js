import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = Number(process.env.PORT) || 8001;

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "auth" });
});

app.use("/", authRouter);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Auth Service Started on port ${PORT}`);
    connectDb();
});
