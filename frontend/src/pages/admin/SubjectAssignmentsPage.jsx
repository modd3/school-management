// frontend/src/pages/admin/SubjectAssignmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaFilter, FaChalkboardTeacher, FaBookOpen, FaSearch, FaTimes, FaSave, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
    getAllSubjectAssignments,
    updateSubjectAssignment,
    deleteSubjectAssignment,
    createSubjectAssignment
} from '../../api/subjectAssignments';
import { getClasses } from '../../api/classes';
import { getSubjects } from '../../api/subjects';
import { getTeachers } from '../../api/teachers';
import { getTerms } from '../../api/terms';

const SubjectAssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [showForm, setShowForm] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        classId: '',
        subjectId: '',
        teacherId: '',
        academicYear: new Date().getFullYear().toString(),
        term: ''
    });
    
    // Filter states
    const [filters, setFilters] = useState({
        academicYear: '',
        term: '',
        classId: '',
        subjectId: '',
        teacherId: ''
    });
    
    // Dropdown options
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [terms, setTerms] = useState([]);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAssignments();
    }, [filters]);

    const fetchInitialData = async () => {
        try {
            console.log('🔄 Fetching initial data for Subject Assignments...');
            const [classesRes, subjectsRes, teachersRes, termsRes] = await Promise.all([
                getClasses(),
                getSubjects(),
                getTeachers(),
                getTerms()
            ]);
            
            console.log('📊 Initial data fetched:', {
                classes: classesRes.classes?.length || 0,
                subjects: subjectsRes.subjects?.length || 0,
                teachers: teachersRes.teachers?.length || 0,
                terms: termsRes.terms?.length || 0
            });
            
            setClasses(classesRes.classes || []);
            setSubjects(subjectsRes.subjects || []);
            setTeachers(teachersRes.teachers || []);
            setTerms(termsRes.terms || []);
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
            toast.error('Failed to load initial data');
        }
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching assignments with filters:', filters);
            const response = await getAllSubjectAssignments(filters);
            console.log('📝 Assignments response:', {
                total: response.assignments?.length || 0,
                filters: filters,
                hasTeacherFilter: !!filters.teacherId,
                response: response
            });
            setAssignments(response.assignments || []);
        } catch (error) {
            console.error('❌ Error fetching assignments:', error);
            toast.error('Failed to fetch subject assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment);
        setFormData({
            classId: assignment.class?._id || '',
            subjectId: assignment.subject?._id || '',
            teacherId: assignment.teacher?._id || '',
            academicYear: assignment.academicYear || '',
            term: assignment.term?._id || assignment.term || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                await deleteSubjectAssignment(assignmentId);
                toast.success('Assignment deleted successfully');
                fetchAssignments();
            } catch (error) {
                console.error('Error deleting assignment:', error);
                toast.error(error.message || 'Failed to delete assignment');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.classId || !formData.subjectId || !formData.teacherId || !formData.academicYear) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            if (editingAssignment) {
                await updateSubjectAssignment(editingAssignment._id, formData);
                toast.success('Assignment updated successfully');
            } else {
                await createSubjectAssignment(formData);
                toast.success('Assignment created successfully');
            }
            
            fetchAssignments();
            resetForm();
        } catch (error) {
            console.error('Error saving assignment:', error);
            toast.error(error.message || 'Failed to save assignment');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            classId: '',
            subjectId: '',
            teacherId: '',
            academicYear: new Date().getFullYear().toString(),
            term: ''
        });
        setEditingAssignment(null);
        setShowForm(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            academicYear: '',
            term: '',
            classId: '',
            subjectId: '',
            teacherId: ''
        });
        setSearchTerm('');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredAssignments = assignments.filter(assignment => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            assignment.class?.name?.toLowerCase().includes(searchLower) ||
            assignment.subject?.name?.toLowerCase().includes(searchLower) ||
            assignment.teacher?.firstName?.toLowerCase().includes(searchLower) ||
            assignment.teacher?.lastName?.toLowerCase().includes(searchLower) ||
            assignment.academicYear?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FaChalkboardTeacher className="text-blue-600" />
                    Subject Assignments
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <FaPlus /> New Assignment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <FaFilter className="text-gray-600" />
                    <h3 className="font-semibold text-gray-700">Filters</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <select
                        value={filters.academicYear}
                        onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Years</option>
                        {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                                <option key={year} value={year.toString()}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>

                    <select
                        value={filters.term}
                        onChange={(e) => handleFilterChange('term', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Terms</option>
                        {terms.map(term => (
                            <option key={term._id} value={term._id}>
                                {term.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.classId}
                        onChange={(e) => handleFilterChange('classId', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Classes</option>
                        {classes.map(cls => (
                            <option key={cls._id} value={cls._id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.subjectId}
                        onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.teacherId}
                        onChange={(e) => handleFilterChange('teacherId', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">All Teachers</option>
                        {teachers.map(teacher => (
                            <option key={teacher._id} value={teacher.userId || teacher._id}>
                                {teacher.firstName} {teacher.lastName}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={clearFilters}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm flex items-center gap-1"
                    >
                        <FaTimes /> Clear
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assignments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Class *
                                </label>
                                <select
                                    name="classId"
                                    value={formData.classId}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(cls => (
                                        <option key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject *
                                </label>
                                <select
                                    name="subjectId"
                                    value={formData.subjectId}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name} ({subject.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teacher *
                                </label>
                                <select
                                    name="teacherId"
                                    value={formData.teacherId}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher._id} value={teacher.userId || teacher._id}>
                                            {teacher.firstName} {teacher.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Academic Year *
                                </label>
                                <input
                                    type="text"
                                    name="academicYear"
                                    value={formData.academicYear}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Term
                                </label>
                                <select
                                    name="term"
                                    value={formData.term}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Term</option>
                                    {terms.map(term => (
                                        <option key={term._id} value={term._id}>
                                            {term.name} - {term.academicYear}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaSave />
                                    {loading ? 'Saving...' : (editingAssignment ? 'Update' : 'Create')}
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

            {/* Assignments Table */}
            {loading && !showForm ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading assignments...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Class
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Teacher
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Academic Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Term
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No subject assignments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {assignment.class?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div>
                                                <div className="font-medium">{assignment.subject?.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{assignment.subject?.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {assignment.teacher ? 
                                                `${assignment.teacher.firstName} ${assignment.teacher.lastName}` : 
                                                'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {assignment.academicYear}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {assignment.term?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(assignment)}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="Edit Assignment"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(assignment._id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Delete Assignment"
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

            {/* Summary */}
            <div className="mt-6 text-sm text-gray-600">
                Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
        </div>
    );
};

export default SubjectAssignmentsPage;
