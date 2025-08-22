import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import connectDb from "./config/db.js";
import UserRoutes from './routes/UserRoutes.js';
import ConnectionRoutes from './routes/ConnectionRoutes.js';
import StudyRoutes from './routes/StudyRoutes.js';
import MessageRoutes from './routes/MessageRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Message from './models/MessageModel.js';
import authMiddleware from './middleware/authMiddleware.js';

configDotenv();
connectDb();

const app = express();
const server = createServer(app);
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

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions
});

// Store online users
const onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online status
    socket.broadcast.emit('user_online', userId);
    console.log(`User ${userId} joined room and is now online`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      
      // Save message to database
      const message = new Message({
        senderId,
        receiverId,
        text
      });
      
      await message.save();
      
      // Populate sender info
      await message.populate('senderId', 'name profilePicture');
      
      // Send message to receiver
      io.to(receiverId).emit('receive_message', message);
      
      // Send confirmation to sender
      socket.emit('message_sent', message);
      
    } catch (error) {
      socket.emit('message_error', { error: error.message });
    }
  });

  // Handle marking messages as read
  socket.on('mark_read', async (data) => {
    try {
      const { messageIds } = data;
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { isRead: true }
      );
      socket.emit('messages_marked_read', { messageIds });
    } catch (error) {
      socket.emit('mark_read_error', { error: error.message });
    }
  });

  // Handle getting online users
  socket.on('get_online_users', () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users', onlineUserIds);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', socket.userId);
      console.log(`User ${socket.userId} is now offline`);
    }
  });
});

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users',UserRoutes);
app.use('/api',ConnectionRoutes);
app.use('/api/study', StudyRoutes);
app.use('/api/messages', MessageRoutes);

app.get('/',(req,res)=>{
    res.send('API is running...')
})

server.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`);
})