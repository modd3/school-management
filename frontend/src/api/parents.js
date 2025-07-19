const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
});

// Get all parents
export const getAllParents = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/parents`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch parents');
  return res.json();
};

// Get a single parent by ID
export const getParentById = async (parentId) => {
  const res = await fetch(`${API_BASE_URL}/admin/parents/${parentId}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch parent');
  return res.json();
};

// Edit/update a parent
export const updateParent = async (parentId, parentData) => {
  const res = await fetch(`${API_BASE_URL}/admin/parents/${parentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(parentData),
  });
  if (!res.ok) throw new Error('Failed to update parent');
  return res.json();
};

// Delete a parent
export const deleteParent = async (parentId) => {
  const res = await fetch(`${API_BASE_URL}/admin/parents/${parentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete parent');
  return res.json();
};