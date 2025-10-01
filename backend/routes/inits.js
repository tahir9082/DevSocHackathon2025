const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');

// --- Search courses endpoint ---
router.get('/courses/search', async (req, res) => {
  try {
    const q = req.query.q || '';

    // Find courses where code or name matches query, case-insensitive
    const courses = await Course.find({
      $or: [
        { course_code: { $regex: q, $options: 'i' } },
        { course_name: { $regex: q, $options: 'i' } },
      ]
    })
      .sort({ course_code: 1 }) // alphabetical by course_code
      .limit(5);

    res.json(
      courses.map(c => ({
        value: c.course_code,
        label: `${c.course_code}: ${c.course_name}`
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// --- Save completed courses endpoint ---
router.post('/user/:id/completed-courses', async (req, res) => {
  try {
    const { id } = req.params;
    const { courses } = req.body; // array of { courseId: 'COMP1511' }

    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: 'Invalid courses format' });
    }

    const formattedCourses = courses.map(c => ({ courseId: c }));

    const user = await User.findByIdAndUpdate(
      id,
      { completedCourses: formattedCourses, flagCompletedInit: true },
      { new: true }
    );

    res.json({ message: 'Courses saved successfully', completedCourses: user.completedCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save courses' });
  }
});

module.exports = router;
