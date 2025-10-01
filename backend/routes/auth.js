const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      completedCourses: [],
      flagCompletedInit: false,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, flagCompletedInit: newUser.flagCompletedInit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, flagCompletedInit: user.flagCompletedInit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/complete-init
router.post('/complete-init', authenticateToken, async (req, res) => {
  const { completedCourses, flagCompletedInit } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.flagCompletedInit) return res.status(400).json({ message: "Initialisation already completed" });

    user.completedCourses = completedCourses;
    user.flagCompletedInit = flagCompletedInit;
    await user.save();

    res.json({ message: "Initialisation completed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, authenticateToken };
