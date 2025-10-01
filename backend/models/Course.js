import mongoose from 'mongoose';

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

export default mongoose.model('Course', courseSchema);
