/**
 * Fetches the student's class info for a given term.
 * @param {string} studentId - The student's ID.
 * @param {string} termId - The term ID.
 * @returns {Promise<Object>} - Student class info (class, stream, academicYear, etc).
 */
export async function getStudentClassInfo(studentId, termId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    const res = await fetch(`/api/student-class/info?studentId=${studentId}&termId=${termId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });
    if (!res.ok) throw new Error('Failed to fetch student class info');
    return await res.json();
  } catch (err) {
    return {};
  }
}