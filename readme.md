# SkillSync

A skill-sharing platform that connects learners with mentors based on complementary skills and learning goals.

## Features

- User authentication (signup/login)
- Profile management with skills and goals
- Smart matchmaking algorithm
- File upload for profile pictures
- Protected routes

## Tech Stack

**Frontend:**
- React 19 with Vite
- React Router DOM
- Tailwind CSS

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- bcryptjs for password hashing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Set up environment variables in `server/.env`
4. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   cd client && npm run dev
   ```

## API Endpoints

- `POST /api/users/signup` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `POST /api/users/profile/update` - Update profile (protected)
- `GET /api/users/match-suggestions` - Get match suggestions (protected)