import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  GraduationCap,
  Plus
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form
  const [studentForm, setStudentForm] = useState({
    register_number: '',
    name: '',
    email: '',
    department: 'CSE',
    year: 'IV',
    section: 'A',
    password: ''
  });

  // Bulk Upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search,
        department: selectedDept
      });
      const data = await api.get(`/students?${params.toString()}`);
      setStudents(data.students || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalStudents(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await api.get('/students/departments');
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, selectedDept, page]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', studentForm);
      setShowAddModal(false);
      setStudentForm({
        register_number: '',
        name: '',
        email: '',
        department: 'CSE',
        year: 'IV',
        section: 'A',
        password: ''
      });
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to create student');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${editingStudent.id}`, editingStudent);
      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete candidate ${name}? This action cannot be reversed.`)) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await api.upload('/students/bulk', formData);
      setBulkResult(res);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to process bulk CSV');
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <DashboardLayout currentPath="/admin/students" pageTitle="Candidate Directory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Directory & Enrollment
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage eligible students, configure credentials, and batch import college rosters via CSV
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setBulkResult(null); setBulkFile(null); setShowBulkModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Candidate</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="exam-card p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by register number, student name, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-medium"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-full sm:w-auto font-medium cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Candidate Table */}
        <div className="exam-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Department & Class</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Loading candidate database...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No candidates found matching query.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {student.register_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="font-semibold text-slate-700">{student.department}</span> • Yr {student.year} / Sec {student.section}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {student.email || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditingStudent(student); setShowEditModal(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Candidate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total: <strong>{totalStudents}</strong> candidates registered</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-2 text-slate-600 font-bold">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="exam-card max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Enroll New Candidate
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Register Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 910021104006"
                  value={studentForm.register_number}
                  onChange={(e) => setStudentForm({ ...studentForm, register_number: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dept</label>
                  <input
                    type="text"
                    required
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="text"
                    required
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  placeholder="Set initial password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="exam-card max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Batch Import Candidates from CSV
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload a comma-separated values (.csv) file with columns: <code>register_number, name, email, department, year, section, password</code>
            </p>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
              />

              {bulkResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  Enrolled: {bulkResult.importedCount} candidates successfully!
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {bulkUploading ? 'Importing...' : 'Upload & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
