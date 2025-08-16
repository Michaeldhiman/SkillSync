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
  try {
    const { name, email, password } = req.body

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

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
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// Login user
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

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
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
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

// Helper function to calculate match score between two users
function calculateMatchScore(user, otherUser) {
  let score = 0;
  
  // Ensure arrays exist
  const userSkills = user.skills || [];
  const userGoals = user.goals || [];
  const otherSkills = otherUser.skills || [];
  const otherGoals = otherUser.goals || [];
  
  // Complementary skills (what I can teach them + what they can teach me)
  const teachMe = userGoals.filter(goal => otherSkills.includes(goal));
  const ICanTeach = userSkills.filter(skill => otherGoals.includes(skill));
  score += (teachMe.length + ICanTeach.length) * 50;
  
  // Shared goals (we want to learn the same things)
  const commonGoals = userGoals.filter(goal => otherGoals.includes(goal));
  score += commonGoals.length * 30;
  
  // Common skills (we both know these things)
  const commonSkills = userSkills.filter(skill => otherSkills.includes(skill));
  score += commonSkills.length * 20;
  
  return score;
}

// Get match suggestions for a user
const getMatchSuggestions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Fetch the current user
    const currentUser = await User.findById(userId).select('name email skills goals availability mode');
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Query all other users (excluding current user)
    const otherUsers = await User.find({ 
      _id: { $ne: userId } 
    }).select('name email skills goals availability mode');

    // Calculate match scores and build suggestions array
    const suggestions = otherUsers
      .map(otherUser => {
        const matchScore = calculateMatchScore(currentUser, otherUser);
        
        return {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          skills: otherUser.skills || [],
          goals: otherUser.goals || [],
          availability: otherUser.availability,
          mode: otherUser.mode,
          matchScore
        };
      })
      .filter(suggestion => suggestion.matchScore > 0) // Only include users with some match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by highest score first

    // Handle case when no matches are found
    if (suggestions.length === 0) {
      return res.json({ 
        message: 'No matches found. Try updating your skills and goals to find more connections.',
        suggestions: [] 
      });
    }

    res.json({ 
      message: `Found ${suggestions.length} potential matches`,
      suggestions 
    });

  } catch (error) {
    console.error('Match suggestions error:', error);
    res.status(500).json({ message: 'Failed to get match suggestions' });
  }
}

export { getUsers, registerUser, authUser, updateProfile, getMatchSuggestions }
