import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
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
  CheckCircle2,
  FileUp,
  Lock
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
    instructions: '1. Fullscreen mode is strictly enforced throughout the exam.\n2. Tab switching or window blur will trigger automatic malpractice strikes.\n3. Exceeding maximum permitted strikes locks the examination session.\n4. Dynamic watermarking identifies candidates to prevent photography.'
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

      await api.upload('/exams', formData);
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

  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Delete exam "${title}"? This will terminate all active candidate sessions.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  return (
    <DashboardLayout currentPath="/admin/exams" pageTitle="Exams & Papers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Examination Schedules & Question Papers
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure proctored exam windows, upload encrypted PDF papers, and adjust anti-cheat tolerances
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Examination</span>
          </button>
        </div>

        {/* Exams Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            Loading examination registry...
          </div>
        ) : exams.length === 0 ? (
          <div className="exam-card p-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-800">No Examinations Configured</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "+ Create Examination" to schedule your first proctored exam paper.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="exam-card p-6 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                      {exam.exam_code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {exam.department}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {exam.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 py-3 border-y border-slate-100 my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-semibold text-slate-800">{exam.duration_minutes} Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Strike Limit:</span>
                      <span className="font-semibold text-amber-600">{exam.max_violations} strikes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Paper Vault:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> PDF Encrypted
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2">
                  <a
                    href={`#/admin/monitor?examId=${exam.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Cockpit</span>
                  </a>
                  <button
                    onClick={() => handleDeleteExam(exam.id, exam.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="exam-card max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Create New Examination
            </h3>

            <form onSubmit={handleCreateExam} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS8591"
                    value={examForm.exam_code}
                    onChange={(e) => setExamForm({ ...examForm, exam_code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={examForm.department}
                    onChange={(e) => setExamForm({ ...examForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks and Cloud Security"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.start_time}
                    onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={examForm.end_time}
                    onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Strikes</label>
                  <input
                    type="number"
                    required
                    value={examForm.max_violations}
                    onChange={(e) => setExamForm({ ...examForm, max_violations: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Paper PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPaperFile(e.target.files[0])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {submitting ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
