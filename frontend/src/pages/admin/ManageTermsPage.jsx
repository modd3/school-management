import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTerms, createTerm, updateTerm, deleteTerm } from '../../api/terms'; // Import real API calls

export default function ManageTermsPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTermName, setNewTermName] = useState('');
  const [newTermStartDate, setNewTermStartDate] = useState('');
  const [newTermEndDate, setNewTermEndDate] = useState('');
  const [newTermAcademicYear, setNewTermAcademicYear] = useState('');
  const navigate = useNavigate();

  // Function to load terms from the API
  const loadTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTerms(); // Use the real API call
      setTerms(data.terms || []); // Assuming your backend returns { success: true, terms: [...] }
    } catch (err) {
      console.error("Failed to load terms:", err);
      setError(err.message || 'Failed to load terms.');
    } finally {
      setLoading(false);
    }
  };

  // Load terms on component mount
  useEffect(() => {
    loadTerms();
  }, []);

  const handleAddTerm = async (e) => {
    e.preventDefault();
    if (!newTermName.trim() || !newTermStartDate || !newTermEndDate || !newTermAcademicYear.trim()) {
      setError("Term name, start date, end date, and academic year are required.");
      return;
    }
    try {
      const newTermData = {
        name: newTermName.trim(),
        startDate: newTermStartDate,
        endDate: newTermEndDate,
        academicYear: newTermAcademicYear.trim(),
      };
      const data = await createTerm(newTermData);
      setTerms([...terms, data.term]);
      setNewTermName('');
      setNewTermStartDate('');
      setNewTermEndDate('');
      setNewTermAcademicYear('');
      setError(null);
    } catch (err) {
      console.error("Failed to add term:", err);
      setError(err.message || 'Failed to add term.');
    }
  };

  const handleDeleteTerm = async (termId) => {
    if (window.confirm('Are you sure you want to delete this term? This action might affect associated results and records.')) {
      try {
        await deleteTerm(termId); // Use the real API call
        setTerms(terms.filter(term => term._id !== termId));
      } catch (err) {
        console.error("Failed to delete term:", err);
        setError(err.message || 'Failed to delete term.');
      }
    }
  };

  const handleEditTerm = (termId) => {
    // For editing, you might open a modal or navigate to a dedicated edit page.
    // For simplicity, this example will just log for now.
    // In a real app: navigate(`/admin/terms/edit/${termId}`);
    alert(`Edit functionality for term ID: ${termId} (Not yet implemented as a separate page)`);
    // Example of inline edit (more complex to implement here directly):
    // const termToEdit = terms.find(t => t._id === termId);
    // if (termToEdit) {
    //   const newName = prompt("Enter new term name:", termToEdit.name);
    //   if (newName && newName.trim() !== termToEdit.name) {
    //     try {
    //       const updatedData = await updateTerm(termId, { name: newName.trim() });
    //       setTerms(terms.map(t => t._id === termId ? updatedData.term : t));
    //     } catch (err) {
    //       setError(err.message || 'Failed to update term.');
    //     }
    //   }
    // }
  };


  const filteredTerms = terms.filter(term =>
    (term.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading terms...</p>
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaCalendarAlt className="text-blue-600"/> Manage Terms
          </h1>
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search terms..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
          </div>
        </div>

        <form onSubmit={handleAddTerm} className="mb-8 flex flex-col sm:flex-row gap-4 flex-wrap">
          <input
            type="text"
            placeholder="New Term Name (e.g., Term 1, Q1 2024)"
            value={newTermName}
            onChange={(e) => setNewTermName(e.target.value)}
            className="flex-grow py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            placeholder="Start Date"
            value={newTermStartDate}
            onChange={(e) => setNewTermStartDate(e.target.value)}
            className="py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            placeholder="End Date"
            value={newTermEndDate}
            onChange={(e) => setNewTermEndDate(e.target.value)}
            className="py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Academic Year (e.g., 2024/2025)"
            value={newTermAcademicYear}
            onChange={(e) => setNewTermAcademicYear(e.target.value)}
            className="py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FaPlusCircle /> Add Term
          </button>
        </form>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {filteredTerms.length === 0 ? (
          <p className="text-center text-gray-600">No terms found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTerms.map((term) => (
                  <tr key={term._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditTerm(term._id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit Term"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDeleteTerm(term._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete Term"
                      >
                        <FaTrashAlt size={18}/>
                      </button>
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