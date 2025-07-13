import React, { useEffect, useState } from 'react';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../../api/subjects';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';

const CATEGORY_OPTIONS = ['Core', 'Elective'];
const DEFAULT_GROUPS = ['Group I', 'Group II', 'Group III', 'Group IV', 'Group V'];

const ManageSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: '',
    group: '',
    creditHours: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await getSubjects();
      const activeSubjects = (res.subjects || []).filter((s) => s.isActive);
      setSubjects(activeSubjects);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const { name, code, category, group, creditHours } = form;

    if (!name || !code || !category || !creditHours) {
      return toast.error('All required fields must be filled.');
    }

    if (category === 'Elective' && !group) {
      return toast.error('Elective subjects must have a group.');
    }

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        creditHours: Number(creditHours),
        ...(category === 'Elective' ? { group } : {}),
      };

      const newSubject = await createSubject(payload);
      toast.success('Subject created');
      setSubjects((prev) => [...prev, newSubject.subject]);
      setForm({ name: '', code: '', category: '', group: '', creditHours: 1 });
    } catch (err) {
      toast.error(err.message || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await deleteSubject(id);
      toast.success('Subject deleted');
      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setEditForm({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      group: subject.group || '',
      creditHours: subject.creditHours || 1,
      isActive: subject.isActive ?? true,
    });
  };

  const handleSave = async (id) => {
    try {
      const updated = await updateSubject(id, editForm);
      toast.success('Subject updated');
      setEditingId(null);
      setSubjects((prev) =>
        prev.map((s) => (s._id === id ? updated.subject : s))
      );
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Manage Subjects</h2>

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="grid md:grid-cols-5 gap-4 items-end bg-white p-4 rounded shadow mb-6"
      >
        <input
          type="text"
          placeholder="Subject Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Subject Code (e.g. ENG)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {form.category === 'Elective' && (
          <select
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Select Group</option>
            {DEFAULT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}

        <input
          type="number"
          min="1"
          placeholder="Credit Hours"
          value={form.creditHours}
          onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 col-span-full md:col-span-1"
        >
          <FaPlus /> Add
        </button>
      </form>

      {/* Subject Table */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full table-auto">
          <thead className="bg-blue-100 text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Code</th>
              <th className="p-2">Category</th>
              <th className="p-2">Group</th>
              <th className="p-2">Credit Hours</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    s.code
                  )}
                </td>
                <td className="p-2">
                  {editingId === s._id ? (
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="border p-1 rounded w-full"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    s.category
                  )}
                </td>
                <td className="p-2">
                  {editingId === s._id ? (
                    <select
                      value={editForm.group}
                      onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                      className="border p-1 rounded w-full"
                    >
                      <option value="">None</option>
                      {DEFAULT_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    s.group || '—'
                  )}
                </td>
                <td className="p-2 text-center">
                  {editingId === s._id ? (
                    <input
                      type="number"
                      min="1"
                      value={editForm.creditHours}
                      onChange={(e) => setEditForm({ ...editForm, creditHours: e.target.value })}
                      className="border p-1 rounded w-16 text-center"
                    />
                  ) : (
                    s.creditHours || 1
                  )}
                </td>
                <td className="p-2 text-center">
                  {editingId === s._id ? (
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                  ) : (
                    s.isActive ? '✅' : '❌'
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  {editingId === s._id ? (
                    <button
                      onClick={() => handleSave(s._id)}
                      className="text-green-600 hover:underline flex items-center gap-1"
                    >
                      <FaSave /> Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No subjects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageSubjectsPage;
