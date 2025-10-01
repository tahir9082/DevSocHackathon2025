const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  completedCourses: {
    type: [
      {
        courseId: { type: String, required: true }
      }
    ]
  },
  flagCompletedInit: { type: Boolean, default: false },
  degree: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema, 'users');
