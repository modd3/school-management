export const kcseGradingScale = [
  { range: [0, 29], grade: 'E', points: 1 },
  { range: [30, 34], grade: 'D-', points: 2 },
  { range: [35, 39], grade: 'D', points: 3 },
  { range: [40, 44], grade: 'D+', points: 4 },
  { range: [45, 49], grade: 'C-', points: 5 },
  { range: [50, 54], grade: 'C', points: 6 },
  { range: [55, 59], grade: 'C+', points: 7 },
  { range: [60, 64], grade: 'B-', points: 8 },
  { range: [65, 69], grade: 'B', points: 9 },
  { range: [70, 74], grade: 'B+', points: 10 },
  { range: [75, 79], grade: 'A-', points: 11 },
  { range: [80, 100], grade: 'A', points: 12 }
];

export function calculateGradeAndPoints(marks) {
  for (const entry of kcseGradingScale) {
    const [min, max] = entry.range;
    if (marks >= min && marks <= max) {
      return { grade: entry.grade, points: entry.points };
    }
  }
  return { grade: 'E', points: 1 }; // fallback
}

export function calculateOverallGrade(meanPoints) {
  const rounded = Math.round(meanPoints);
  const match = kcseGradingScale.find(entry => entry.points === rounded);
  return match ? match.grade : 'E';
}
