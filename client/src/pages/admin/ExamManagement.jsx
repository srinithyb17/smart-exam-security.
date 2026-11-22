import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Navbar from '../../components/Navbar';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  ShieldAlert,
  X,
  Eye,
  Upload,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Form State
  const [examForm, setExamForm] = useState({
    exam_code: '',
    title: '',
    subject: '',
    department: 'CSE',
    start_time: '',
    end_time: '',
    duration_minutes: 180,
    max_violations: 3,
    instructions: '1. Fullscreen mode is mandatory.\n2. Tab switching will trigger malpractice alerts.\n3. Dynamic watermarks protect question papers.'
  });
  const [paperFile, setPaperFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await api.get('/exams');
      setExams(data.exams || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(examForm).forEach((key) => {
        formData.append(key, examForm[key]);
      });
      if (paperFile) {
        formData.append('paper', paperFile);
      }

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('smart_exam_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create exam');

      setShowCreateModal(false);
      setPaperFile(null);
      setExamForm({
        exam_code: '',
        title: '',
        subject: '',
        department: 'CSE',
        start_time: '',
        end_time: '',
        duration_minutes: 180,
        max_violations: 3,
        instructions: ''
      });
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', editingExam.title);
      formData.append('subject', editingExam.subject);
      formData.append('department', editingExam.department || '');
      formData.append('start_time', editingExam.start_time);
      formData.append('end_time', editingExam.end_time);
      formData.append('duration_minutes', editingExam.duration_minutes);
      formData.append('max_violations', editingExam.max_violations);
      formData.append('instructions', editingExam.instructions || '');
      if (paperFile) {
        formData.append('paper', paperFile);
      }

      const res = await fetch(`/api/exams/${editingExam.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('smart_exam_token')}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update exam');

      setShowEditModal(false);
      setEditingExam(null);
      setPaperFile(null);
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to update exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete exam "${title}"? All student sessions and logs for this exam will also be deleted.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentPath="/admin/exams" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-extrabold text-white">Exam Scheduling & Question Papers</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                {exams.length} exams
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Upload secure PDF question papers, configure release timers, and set violation thresholds
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Schedule Exam</span>
          </button>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              Loading examinations...
            </div>
          ) : exams.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h3 className="text-base font-semibold text-white mb-1">No Exams Scheduled</h3>
              <p className="text-xs text-slate-500 mb-4">Click below to create your first secure online examination.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-semibold text-white"
              >
                Create Exam
              </button>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      {exam.exam_code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {exam.department || 'All'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{exam.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{exam.subject}</p>

                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs font-mono text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Start Time:</span>
                      <span className="text-slate-200">
                        {new Date(exam.start_time).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span className="text-emerald-400 font-bold">{exam.duration_minutes} Mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Violations Limit:</span>
                      <span className="text-amber-400 font-bold">{exam.max_violations} strikes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paper PDF:</span>
                      <span className="text-blue-400 font-sans truncate max-w-[130px]">
                        {exam.paper_original_name || 'No file attached'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <a
                    href={`#/admin/monitor?examId=${exam.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Monitor</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingExam(exam); setShowEditModal(true); }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="Edit Exam"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="p-1.5 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 rounded-lg transition"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                Schedule New Examination
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Exam Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS8591"
                    value={examForm.exam_code}
                    onChange={(e) => setExamForm({ ...examForm, exam_code: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={examForm.department}
                    onChange={(e) => setExamForm({ ...examForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks Semester Examination"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks"
                  value={examForm.subject}
                  onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.start_time}
                    onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.end_time}
                    onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Max Violations Allowed *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={examForm.max_violations}
                    onChange={(e) => setExamForm({ ...examForm, max_violations: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* PDF Question Paper Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Upload Question Paper (PDF Format) *
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-4 bg-slate-950/60 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => setPaperFile(e.target.files[0])}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Stored securely outside public access. Decrypted and streamed only to authorized students.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Examination Instructions
                </label>
                <textarea
                  rows={3}
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {submitting ? 'Creating Exam...' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && editingExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Edit Exam ({editingExam.exam_code})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={editingExam.subject}
                  onChange={(e) => setEditingExam({ ...editingExam, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingExam.start_time ? editingExam.start_time.slice(0, 16) : ''}
                    onChange={(e) => setEditingExam({ ...editingExam, start_time: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingExam.end_time ? editingExam.end_time.slice(0, 16) : ''}
                    onChange={(e) => setEditingExam({ ...editingExam, end_time: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={editingExam.duration_minutes}
                    onChange={(e) => setEditingExam({ ...editingExam, duration_minutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Max Violations Allowed
                  </label>
                  <input
                    type="number"
                    value={editingExam.max_violations}
                    onChange={(e) => setEditingExam({ ...editingExam, max_violations: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Replace Question Paper PDF (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPaperFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-500/25"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
