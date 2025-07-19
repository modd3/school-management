import React, { useState, useEffect } from 'react';
import { FaUsers, FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '../../api/users';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Function to load users from the API
  const loadUsers = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const data = await getUsers();
      // Assuming the backend returns an object like { success: true, users: [...] }
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []); // Empty dependency array means this runs once on mount

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId); // Use the real API call
        setUsers(users.filter(user => user._id !== userId)); // Optimistically update UI
        // You might want to display a success message here, e.g., with a toast library
      } catch (err) {
        console.error("Failed to delete user:", err);
        setError(err.message || 'Failed to delete user.');
      }
    }
  };

  const handleEditUser = (userId) => {
    // Navigate to an edit user page. You would need to implement this page/route.
    navigate(`/admin/users/edit/${userId}`);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (user.role?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-xl text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUsers className="text-blue-600"/> Manage Users
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{user.role?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditUser(user._id)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                          title="Edit User"
                        >
                          <FaEdit size={18}/>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                          title="Delete User"
                        >
                          <FaTrashAlt size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}