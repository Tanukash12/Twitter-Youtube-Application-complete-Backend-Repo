import dotenv from "dotenv"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: "./.env"
})


connectDB()
.then(() => {
    app.on("error", (error) => {
        console.error("Server error:", error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
})