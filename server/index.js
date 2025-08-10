import express from "express";

import cors from "cors";
import { configDotenv } from "dotenv";
import connectDb from "./config/db.js";
configDotenv({debug:true});
connectDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('API is running...')
})

app.listen(PORT,()=>{
    // console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    console.log(`Server is running at http://localhost:${PORT}`);
    
})