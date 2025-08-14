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

// Matchmaking: find users with overlapping skills and goals (supports partial matches like "learn typescript" ~ "typescript")
const getMatchSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('skills goals')

    const normalize = (s) => (s ? String(s).toLowerCase().trim() : '')
    const tokenize = (s) => normalize(s).split(/[^a-z0-9+#]+/).filter(Boolean)
    const STOP_WORDS = new Set(['learn', 'learning', 'to', 'the', 'and', 'a', 'an', 'for', 'with', 'in', 'on', 'of', 'about', 'become', 'build', 'improve', 'master'])
    const TWO_LETTER_TECH = new Set(['go', 'js', 'ai', 'ml', 'ui', 'ux', 'db', 'c'])
    const filterToken = (t) => t && !STOP_WORDS.has(t) && (t.length >= 3 || TWO_LETTER_TECH.has(t))
    const SYNONYMS = {
      golang: ['go'],
      go: ['golang'],
      javascript: ['js'],
      js: ['javascript'],
      typescript: ['ts'],
      ts: ['typescript'],
    }
    const addSynonyms = (tokensSet) => {
      const expanded = new Set(tokensSet)
      for (const t of tokensSet) {
        const syns = SYNONYMS[t]
        if (syns) syns.forEach((s) => expanded.add(s))
      }
      return expanded
    }
    const extractTokensAndJoins = (phrases) => {
      const tokens = []
      for (const p of phrases) {
        const parts = tokenize(p).filter(filterToken)
        tokens.push(...parts)
        if (parts.length >= 2) {
          const joined = parts.join('') // e.g., "go"+"lang" -> "golang"
          if (filterToken(joined)) tokens.push(joined)
        }
      }
      return addSynonyms(new Set(tokens))
    }
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const currentSkills = Array.isArray(currentUser?.skills) ? currentUser.skills : []
    const currentGoals = Array.isArray(currentUser?.goals) ? currentUser.goals : []

    // Build token set from current user's phrases (includes joined forms like "golang")
    const currentTokens = extractTokensAndJoins([...currentSkills, ...currentGoals])

    if (currentTokens.size === 0 && currentSkills.length === 0 && currentGoals.length === 0) {
      return res.json({ suggestions: [] })
    }

    // Use regex to find partial matches by token in skills/goals
    const tokenRegexes = Array.from(currentTokens).map((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i'))

    const candidates = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { skills: { $in: tokenRegexes } },
        { goals: { $in: tokenRegexes } },
        // Fallback to exact phrase overlap if tokens didn't exist
        { skills: { $in: currentSkills } },
        { goals: { $in: currentGoals } },
      ],
    }).select('_id name email skills goals mode availability profilePicture')

    const suggestions = candidates
      .map((candidate) => {
        const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : []
        const candidateGoals = Array.isArray(candidate.goals) ? candidate.goals : []

        const candidateSkillTokens = extractTokensAndJoins(candidateSkills)
        const candidateGoalTokens = extractTokensAndJoins(candidateGoals)

        // Token overlap
        const overlappingSkillTokens = Array.from(currentTokens).filter((t) => candidateSkillTokens.has(t))
        const overlappingGoalTokens = Array.from(currentTokens).filter((t) => candidateGoalTokens.has(t))

        // Exact phrase overlap (bonus)
        const exactOverlappingSkills = candidateSkills.filter((s) => currentSkills.includes(s))
        const exactOverlappingGoals = candidateGoals.filter((g) => currentGoals.includes(g))

        const score = overlappingSkillTokens.length * 2 + overlappingGoalTokens.length + exactOverlappingSkills.length * 1 + exactOverlappingGoals.length * 1

        return {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          mode: candidate.mode,
          availability: candidate.availability,
          profilePicture: candidate.profilePicture,
          // Expose overlapping tokens for UI display
          overlappingSkills: overlappingSkillTokens,
          overlappingGoals: overlappingGoalTokens,
          score,
        }
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    res.json({ suggestions })
  } catch (error) {
    console.error('Match suggestions error:', error)
    res.status(500).json({ message: 'Failed to get match suggestions' })
  }
}

export { getUsers, registerUser, authUser, updateProfile, getMatchSuggestions }
