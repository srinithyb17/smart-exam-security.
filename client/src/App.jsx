import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamScreen from './pages/student/ExamScreen';
import ExamCompleted from './pages/student/ExamCompleted';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import ExamManagement from './pages/admin/ExamManagement';
import LiveExamMonitor from './pages/admin/LiveExamMonitor';
import SecurityLogs from './pages/admin/SecurityLogs';
import ResetRequests from './pages/admin/ResetRequests';
import ExamReports from './pages/admin/ExamReports';

function AppRouter() {
  const { user, loading, isAdmin, isStudent } = useAuth();
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono text-slate-400">Loading Smart Exam Security...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Parse path and query
  const rawPath = currentHash.replace(/^#/, '');
  const [path, queryString] = rawPath.split('?');

  // Exam Screen route: /exam/:id
  if (path.startsWith('/exam/')) {
    const examId = path.split('/')[2];
    if (examId) {
      return <ExamScreen examId={examId} />;
    }
  }

  // Student Routes
  if (path === '/completed') return <ExamCompleted />;
  if (path === '/student' || (isStudent && (path === '/' || path === '' || path === '/login'))) {
    return <StudentDashboard />;
  }

  // Admin Routes
  if (isAdmin) {
    if (path === '/admin/students') return <StudentManagement />;
    if (path === '/admin/exams') return <ExamManagement />;
    if (path === '/admin/monitor') return <LiveExamMonitor />;
    if (path === '/admin/security') return <SecurityLogs />;
    if (path === '/admin/resets') return <ResetRequests />;
    if (path === '/admin/reports') return <ExamReports />;
    if (path === '/admin' || path === '/' || path === '' || path === '/login') {
      return <AdminDashboard />;
    }
  }

  // Default Fallbacks
  if (isAdmin) return <AdminDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
