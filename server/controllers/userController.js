import User from '../models/UserModel.js'
import bcrypt from 'bcryptjs';

import generateToken from '../utils/generateToken.js'

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Register new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' })
  }

  const user = await User.create({ name, email, password })

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills || [],
      goals: user.goals || [],
      mode: user.mode || 'Online',
      availability: user.availability || '',
      profilePicture: user.profilePicture || null,
      token: generateToken(user._id),
    })
  } else {
    res.status(400).json({ message: 'Invalid user data' })
  }
}

// Login user
const authUser = async (req, res) => {
  const { email, password } = req.body

  // Check if user exists
  const user = await User.findOne({ email })

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills || [],
      goals: user.goals || [],
      mode: user.mode || 'Online',
      availability: user.availability || '',
      profilePicture: user.profilePicture || null,
      token: generateToken(user._id),
    })
  } else {
    res.status(401).json({ message: 'Invalid email or password' })
  }
}

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, skills, goals, mode, availability } = req.body;
    
    // Parse skills and goals if they come as JSON strings
    let parsedSkills = skills;
    let parsedGoals = goals;
    
    if (typeof skills === 'string') {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        parsedSkills = [];
      }
    }
    
    if (typeof goals === 'string') {
      try {
        parsedGoals = JSON.parse(goals);
      } catch (e) {
        parsedGoals = [];
      }
    }

    // Prepare update data
    const updateData = {
      name: name || req.user.name,
      skills: parsedSkills || req.user.skills || [],
      goals: parsedGoals || req.user.goals || [],
      mode: mode || req.user.mode || 'Online',
      availability: availability || req.user.availability || '',
    };

    // Add profile picture if uploaded
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        skills: updatedUser.skills,
        goals: updatedUser.goals,
        mode: updatedUser.mode,
        availability: updatedUser.availability,
        profilePicture: updatedUser.profilePicture,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export { getUsers, registerUser, authUser, updateProfile }
