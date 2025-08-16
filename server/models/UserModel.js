import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    skills: [{ type: String }],
    goals: [{ type: String }],
    mode: { 
      type: String, 
      enum: ['Online', 'Offline', 'Hybrid'], 
      default: 'Online' 
    },
    availability: { type: String },
    profilePicture: { type: String },
  },
  { timestamps: true }
)

// 🔹 Pre-save middleware: hash password before saving
userSchema.pre('save', async function (next) {
    // Only run if password is modified or new
    if (!this.isModified('password')) {
      return next()
    }
  
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  })

const User = mongoose.model('User', userSchema)
export default User;
