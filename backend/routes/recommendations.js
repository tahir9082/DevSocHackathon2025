// routes/recommendations.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User'); // not strictly required but left if you want auth checks

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

// Jaccard similarity of token sets
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

// Faculty similarity: 1.0 if identical, else Jaccard on faculty strings
function facultySimilarity(facA, facB) {
  if (!facA || !facB) return 0;
  if (facA.trim().toLowerCase() === facB.trim().toLowerCase()) return 1.0;
  return jaccard(facA, facB); // between 0 and 1
}

// Compute mode (most frequent) in array; returns null if empty
function mode(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const counts = {};
  for (const v of arr) {
    const k = (v || '').toString();
    counts[k] = (counts[k] || 0) + 1;
  }
  let best = null;
  let bestCount = -1;
  for (const k of Object.keys(counts)) {
    if (counts[k] > bestCount) {
      best = k;
      bestCount = counts[k];
    }
  }
  return best;
}

// Score a candidate course given user's faculties, schools, and course name tokens.
// Returns numeric score (higher = better)
function scoreCandidate(candidate, userFaculties, userSchools, userNameTokens) {
  const facScores = userFaculties.map((uf) => facultySimilarity(uf, candidate.faculty));
  const maxFacSim = facScores.length ? Math.max(...facScores) : 0;

  // small bonus if school matches any user school
  const schoolBonus = userSchools.some((s) => (s || '').toLowerCase() === (candidate.school || '').toLowerCase()) ? 0.12 : 0;

  // name token overlap bonus (Jaccard with course_name)
  const nameSim = jaccard(candidate.course_name || '', userNameTokens.join(' '));
  const nameBonus = Math.min(nameSim * 0.25, 0.25); // scale down

  // final score (clamped 0..1.5 approx)
  const raw = maxFacSim + schoolBonus + nameBonus;
  return Math.min(raw, 1.0); // normalize to 0..1 for easier tiering
}

/**
 * POST /
 * body: {
 *   completedCourses: ["COMP1111", "COMP3333", ...]  // course_code strings
 *   // optional: userId - if you prefer not to infer from token
 * }
 *
 * Response:
 * {
 *   strong: [{ course_code, course_name, faculty, school, campus, career, score }, ... ],
 *   moderate: [...],
 *   weak: [...]
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { completedCourses } = req.body;
    if (!Array.isArray(completedCourses) || completedCourses.length === 0) {
      return res.status(400).json({ error: 'completedCourses must be a non-empty array' });
    }

    // 1) Load the user's completed course docs from DB
    const userCompleted = await Course.find({ course_code: { $in: completedCourses } }).lean();
    if (!userCompleted || userCompleted.length === 0) {
      return res.status(400).json({ error: 'No matching completed courses found in DB' });
    }

    // 2) Gather features used for filtering/scoring
    const userCampuses = userCompleted.map(c => c.campus).filter(Boolean);
    const userCareers = userCompleted.map(c => c.career).filter(Boolean);
    const userFaculties = userCompleted.map(c => c.faculty).filter(Boolean);
    const userSchools = userCompleted.map(c => c.school).filter(Boolean);
    const userNameTokens = tokens(userCompleted.map(c => c.course_name || '').join(' '));

    // Most frequent campus & career (dominant)
    const dominantCampus = mode(userCampuses);
    const dominantCareer = mode(userCareers);

    // 3) Candidate fetching strategy
    // We'll try increasingly relaxed filters until we get a decent candidate pool.
    // priorityFilters: [ { campus, career }, { campus, career: {$exists:false or any} }, { campus: any }, { career: any }, {} ]
    // Simpler: try exact campus+career, then campus only, then career only, then any.
    const triedSets = [];
    const candidateLimit = 200; // cap to keep scoring fast
    let candidates = [];

    const tryFetch = async (filter) => {
      const key = JSON.stringify(filter);
      if (triedSets.includes(key)) return [];
      triedSets.push(key);
      const docs = await Course.find({
        ...filter,
        course_code: { $nin: completedCourses }, // exclude already-completed
      })
        .lean()
        .limit(candidateLimit);
      return docs || [];
    };

    // 3.a exact campus & career
    if (dominantCampus && dominantCareer) {
      candidates = await tryFetch({ campus: dominantCampus, career: dominantCareer });
    }

    // 3.b if insufficient, relax: campus only
    if (candidates.length < 50 && dominantCampus) {
      candidates = candidates.concat(await tryFetch({ campus: dominantCampus }));
    }

    // 3.c if still insufficient, relax: career only
    if (candidates.length < 50 && dominantCareer) {
      candidates = candidates.concat(await tryFetch({ career: dominantCareer }));
    }

    // 3.d final fallback: any course except completed
    if (candidates.length < 50) {
      candidates = candidates.concat(await tryFetch({}));
    }

    // dedupe by course_code
    const byCode = {};
    candidates.forEach(c => { if (c && c.course_code) byCode[c.course_code] = c; });
    candidates = Object.values(byCode);

    // 4) Score candidates
    const scored = candidates.map(c => {
      const s = scoreCandidate(c, userFaculties, userSchools, userNameTokens);
      return { ...c, score: Number(s.toFixed(4)) };
    });

    // sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // 5) Bucket into tiers (thresholds can be tuned)
    const strongThreshold = 0.70;
    const moderateThreshold = 0.45;
    // Weak: >= moderateLower (else discard)
    const strong = scored.filter(c => c.score >= strongThreshold).slice(0, 5);
    const moderate = scored.filter(c => c.score < strongThreshold && c.score >= moderateThreshold).slice(0, 5);
    const weak = scored.filter(c => c.score < moderateThreshold && c.score >= 0.2).slice(0, 5);

    // If any tier has <5, optionally fill from next best lower tier to reach up to 5 (behavior chosen here: do fill)
    const fillTier = (target, source, max) => {
      const out = [...target];
      let i = 0;
      while (out.length < max && i < source.length) {
        const candidate = source[i++];
        if (!out.find(x => x.course_code === candidate.course_code)) out.push(candidate);
      }
      return out;
    };

    // Attempt to fill strong from moderate/weak, moderate from weak
    const strongFilled = fillTier(strong, [...moderate, ...weak], 5);
    const moderateFilled = fillTier(moderate, [...weak, ...scored.filter(s=>!strongFilled.includes(s) && !moderate.includes(s))], 5);
    const weakFilled = weak.slice(0, 5); // weak left unchanged

    // 6) Return only required fields
    const pickFields = (c) => ({
      course_code: c.course_code,
      course_name: c.course_name,
      faculty: c.faculty,
      school: c.school,
      campus: c.campus,
      career: c.career,
      score: c.score,
    });

    return res.json({
      strong: strongFilled.map(pickFields),
      moderate: moderateFilled.map(pickFields),
      weak: weakFilled.map(pickFields),
      meta: {
        dominantCampus,
        dominantCareer,
        userFaculties,
        userSchools,
        candidatesConsidered: candidates.length,
      }
    });
  } catch (err) {
    console.error('Recommendation error', err);
    return res.status(500).json({ error: 'Recommendation generation failed' });
  }
});

module.exports = router;
