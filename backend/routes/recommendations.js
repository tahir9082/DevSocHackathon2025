// routes/recommendations.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

function tokens(str = '') {
  return Array.from(
    new Set(
      (str || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
    )
  );
}

function jaccard(aStr, bStr) {
  const a = tokens(aStr);
  const b = tokens(bStr);
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const v of setA) if (setB.has(v)) inter++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

function facultySimilarity(facA, facB) {
  if (!facA || !facB) return 0;
  if (facA.trim().toLowerCase() === facB.trim().toLowerCase()) return 1.0;
  return jaccard(facA, facB);
}

function careerSimilarity(careerA, careerB) {
  if (!careerA || !careerB) return 0;
  return careerA.trim().toLowerCase() === careerB.trim().toLowerCase() ? 1.0 : 0;
}

// Score candidate proportional to number of matching completed courses
function scoreCandidate(candidate, userCourses) {
  let totalScore = 0;

  for (const completed of userCourses) {
    // Weighted contributions
    const schoolScore = (candidate.school && completed.school && candidate.school.toLowerCase() === completed.school.toLowerCase()) ? 0.4 : 0;
    const facultyScore = facultySimilarity(candidate.faculty, completed.faculty) * 0.25;
    const careerScore = careerSimilarity(candidate.career, completed.career) * 0.15;
    const nameScore = jaccard(candidate.course_name || '', completed.course_name || '') * 0.2;

    totalScore += schoolScore + facultyScore + careerScore + nameScore;
  }

  // Normalize by number of completed courses to scale between 0..1
  const normalized = userCourses.length ? totalScore / userCourses.length : 0;
  return Math.min(normalized, 1.0);
}

router.post('/', async (req, res) => {
  try {
    const { completedCourses } = req.body;
    if (!Array.isArray(completedCourses) || completedCourses.length === 0) {
      return res.status(400).json({ error: 'completedCourses must be a non-empty array' });
    }

    // fetch completed courses
    const userCompleted = await Course.find({ course_code: { $in: completedCourses } }).lean();
    if (!userCompleted || userCompleted.length === 0) {
      return res.status(400).json({ error: 'No matching completed courses found in DB' });
    }

    const completedNames = new Set(userCompleted.map(c => (c.course_name || '').toLowerCase()));

    let candidates = await Course.find({ course_code: { $nin: completedCourses } }).lean();
    candidates = candidates.filter(c => !completedNames.has((c.course_name || '').toLowerCase()));

    // Score candidates
    const scored = candidates.map(c => {
      const s = scoreCandidate(c, userCompleted);
      return { ...c, score: Number(s.toFixed(4)) };
    });

    scored.sort((a, b) => b.score - a.score);

    const strongThreshold = 0.6;
    const moderateThreshold = 0.4;
    const strong = scored.filter(c => c.score >= strongThreshold).slice(0, 5);
    const moderate = scored.filter(c => c.score < strongThreshold && c.score >= moderateThreshold).slice(0, 5);
    const weak = scored.filter(c => c.score < moderateThreshold && c.score >= 0.2).slice(0, 5);

    const pickFields = (c) => ({
      course_code: c.course_code,
      course_name: c.course_name,
      faculty: c.faculty,
      school: c.school,
      campus: c.campus,
      career: c.career,
      score: c.score,
    });

    res.json({
      strong: strong.map(pickFields),
      moderate: moderate.map(pickFields),
      weak: weak.map(pickFields),
      meta: {
        candidatesConsidered: candidates.length,
      }
    });

  } catch (err) {
    console.error("Recommendation generation failed:", err);
    res.status(500).json({ error: "Recommendation generation failed" });
  }
});

module.exports = router;
