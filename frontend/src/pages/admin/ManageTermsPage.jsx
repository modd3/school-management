// frontend/src/pages/admin/ManageTermsPage.jsx
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getTerms, createTerm, updateTerm, deleteTerm } from '../../api/terms';

const ManageTermsPage = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    isCurrent: false
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await getTerms();
      setTerms(response.terms || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast.error('Failed to fetch terms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.academicYear) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      if (editingTerm) {
        await updateTerm(editingTerm._id, formData);
        toast.success('Term updated successfully');
      } else {
        await createTerm(formData);
        toast.success('Term created successfully');
      }
      
      fetchTerms();
      resetForm();
    } catch (error) {
      console.error('Error saving term:', error);
      toast.error(error.message || 'Failed to save term');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      academicYear: term.academicYear,
      startDate: term.startDate.split('T')[0], // Convert to YYYY-MM-DD format
      endDate: term.endDate.split('T')[0],
      isCurrent: term.isCurrent
    });
    setShowForm(true);
  };

  const handleDelete = async (termId) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      try {
        setLoading(true);
        await deleteTerm(termId);
        toast.success('Term deleted successfully');
        fetchTerms();
      } catch (error) {
        console.error('Error deleting term:', error);
        toast.error('Failed to delete term');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academicYear: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      isCurrent: false
    });
    setEditingTerm(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          Manage Terms
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Add New Term
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTerm ? 'Edit Term' : 'Add New Term'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Term 1, First Term"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="e.g., 2024, 2024/2025"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isCurrent"
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="isCurrent" className="text-sm text-gray-700">
                  Set as current term
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Saving...' : (editingTerm ? 'Update Term' : 'Create Term')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms List */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading terms...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {terms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No terms found. Click "Add New Term" to create one.
                  </td>
                </tr>
              ) : (
                terms.map((term) => (
                  <tr key={term._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {term.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {term.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(term.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(term.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {term.isCurrent ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <FaCheck className="mr-1" /> Current
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(term)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(term._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageTermsPage;
