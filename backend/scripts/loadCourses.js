// scripts/loadCourses.js
import mongoose from 'mongoose';
import 'dotenv/config';
import Course from '../models/Course.js'; // make sure path is correct

const MONGO_URI = process.env.MONGO_URI;
const HASURA_URL = 'https://graphql.csesoc.app/v1/graphql';

// Connect to MongoDB
await mongoose.connect(MONGO_URI);
console.log('Connected to MongoDB');

// GraphQL fetch helper
async function fetchGraphQL(query, variables = {}) {
  try {
    const res = await fetch(HASURA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }
    return data.data;
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}

// GraphQL query to get all courses
const query = `
  query MyQuery {
    courses {
      course_code
      course_name
      uoc
      faculty
      school
      campus
      career
      terms
      modes
    }
  }
`;

async function loadCourses() {
  const data = await fetchGraphQL(query);
  if (!data) return;

  const courses = data.courses;

  if (!courses || courses.length === 0) {
    console.log('No courses returned from GraphQL');
    return;
  }

  // Insert courses into MongoDB
  for (const course of courses) {
    await Course.updateOne(
      { course_code: course.course_code },
      { $set: course },
      { upsert: true } // insert if not exists
    );
  }

  console.log(`Loaded ${courses.length} courses into MongoDB`);
  mongoose.disconnect();
}

loadCourses();
