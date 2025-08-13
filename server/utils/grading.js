const kcseGradingScale = [
  { range: [0, 29.99], grade: 'E', points: 1 },
  { range: [30, 34.99], grade: 'D-', points: 2 },
  { range: [35, 39.99], grade: 'D', points: 3 },
  { range: [40, 44.99], grade: 'D+', points: 4 },
  { range: [45, 49.99], grade: 'C-', points: 5 },
  { range: [50, 54.99], grade: 'C', points: 6 },
  { range: [55, 59.99], grade: 'C+', points: 7 },
  { range: [60, 64.99], grade: 'B-', points: 8 },
  { range: [65, 69.99], grade: 'B', points: 9 },
  { range: [70, 74.99], grade: 'B+', points: 10 },
  { range: [75, 79.99], grade: 'A-', points: 11 },
  { range: [80, 100], grade: 'A', points: 12 }
];

function calculateGradeAndPoints(percentage) {
  for (const { range, grade, points } of kcseGradingScale) {
    const [min, max] = range;
    if (percentage >= min && percentage <= max) {
      return { grade, points, comment: generateComment(grade) };
    }
  }
  return { grade: 'E', points: 1, comment: 'Try harder!' }; // Fallback
}

function calculateOverallGrade(meanPoints) {
  const rounded = Math.round(meanPoints);
  const match = kcseGradingScale.find(entry => entry.points === rounded);
  return match ? match.grade : 'E';
}

// Optional: You can customize these messages as needed
function generateComment(grade) {
  const feedback = {
    'A': 'Excellent!',
    'A-': 'Very good!',
    'B+': 'Great work!',
    'B': 'Well done!',
    'B-': 'Nice effort!',
    'C+': 'Satisfactory!',
    'C': 'Fair, can improve!',
    'C-': 'Keep working!',
    'D+': 'Below average!',
    'D': 'Need improvement!',
    'D-': 'Work harder!',
    'E': 'Try harder!'
  };
  return feedback[grade] || 'Keep going!';
}

/**
 * Calculate KCSE final grade and points for a student.
 * @param {Array} subjectResults - Array of { subject, percentage, points, grade, name }
 * @returns {Object} - { selectedSubjects, totalPoints, meanPoints, meanGrade }
 */
function calculateKCSEFinal(subjectResults) {
  if (!Array.isArray(subjectResults)) return { selectedSubjects: [], totalPoints: 0, meanPoints: 0, meanGrade: 'E' };

  // 1. Find Mathematics
  const math = subjectResults.find(s => s.name.toLowerCase().includes('math'));

  // 2. Find best language (English, Kiswahili, Kenyan Sign Language)
  const languages = subjectResults.filter(s =>
    ['english', 'kiswahili', 'kenyan sign language'].includes(s.name.toLowerCase())
  );
  const bestLanguage = languages.sort((a, b) => b.points - a.points)[0];

  // 3. Exclude mandatory subjects and get remaining subjects
  const mandatoryIds = [math?.subject, bestLanguage?.subject].filter(Boolean);
  const remaining = subjectResults.filter(s => !mandatoryIds.includes(s.subject));

  // 4. Pick 5 best-performing remaining subjects
  const bestFive = remaining.sort((a, b) => b.points - a.points).slice(0, 5);

  // 5. Collect selected subjects
  const selectedSubjects = [
    ...(math ? [math] : []),
    ...(bestLanguage ? [bestLanguage] : []),
    ...bestFive
  ];

  // 6. Calculate total and mean points
  const totalPoints = selectedSubjects.reduce((sum, s) => sum + (s.points || 0), 0);
  const meanPoints = selectedSubjects.length ? totalPoints / selectedSubjects.length : 0;
  const meanGrade = calculateOverallGrade(meanPoints);

  return {
    selectedSubjects,
    totalPoints,
    meanPoints: Number(meanPoints).toFixed(2),
    meanGrade
  };
}

module.exports = {
  kcseGradingScale,
  calculateGradeAndPoints,
  calculateOverallGrade,
  calculateKCSEFinal // <-- Export the new function
};
// This module provides functions to calculate grades and points based on KCSE grading scale.