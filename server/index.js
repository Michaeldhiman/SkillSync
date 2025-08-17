import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import connectDb from "./config/db.js";
import UserRoutes from './routes/UserRoutes.js';
import ConnectionRoutes from './routes/ConnectionRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

configDotenv();
connectDb();

const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL   // Vercel frontend URL
      : 'http://localhost:5173', // local dev
    credentials: true
  };
  
  app.use(cors(corsOptions));

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users',UserRoutes);
app.use('/api',ConnectionRoutes);

app.get('/',(req,res)=>{
    res.send('API is running...')
})

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
})