const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // now works with CommonJS
const { authenticateToken } = require('./auth'); // if needed

// GET /api/courses?query=COMP
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const query = req.query.query || '';
    const courses = await Course.find({
      $or: [
        { course_code: { $regex: query, $options: 'i' } },
        { course_name: { $regex: query, $options: 'i' } },
      ],
    })
      .sort({ course_code: 1 })
      .limit(10);

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
