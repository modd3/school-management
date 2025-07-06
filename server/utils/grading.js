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
  console.log(`🧮 Grading percentage: ${percentage}`);
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

module.exports = {
  kcseGradingScale,
  calculateGradeAndPoints,
  calculateOverallGrade
};
// This module provides functions to calculate grades and points based on KCSE grading scale.