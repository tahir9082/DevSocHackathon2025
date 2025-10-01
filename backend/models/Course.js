// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  course_code: String,
  course_name: String,
  uoc: Number,
  faculty: String,
  school: String,
  campus: String,
  career: String,
  terms: String,
  modes: [String],
});

module.exports = mongoose.model('Course', courseSchema);
