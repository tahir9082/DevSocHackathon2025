const express = require('express');
const router = express.Router();

router.get('/courses', async (req, res) => {
  res.json([
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Math' }
  ]);
});

module.exports = router;
