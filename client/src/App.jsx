import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';

import HomePage from './pages/HomePage';
import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ContributePage from './pages/ContributePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import VerifyAdminPage from './pages/VerifyAdminPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="relative min-h-screen flex flex-col bg-[#070d1e] text-slate-100 overflow-x-hidden">
          {/* Ambient Lighting Blurs in Background */}
          <div className="ambient-glow bg-cyan-600/30 top-[-100px] left-[-100px] w-[500px] h-[500px]" />
          <div className="ambient-glow bg-blue-700/20 top-[30%] right-[-150px] w-[600px] h-[600px]" />
          <div className="ambient-glow bg-indigo-900/30 bottom-[-100px] left-[20%] w-[700px] h-[700px]" />

          {/* Navigation */}
          <Navbar onOpenSearch={() => setSearchOpen(true)} />

          {/* Main Route Content */}
          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<HomePage onOpenSearch={() => setSearchOpen(true)} />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/departments/:deptId" element={<DepartmentDetailPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/contribute" element={<ContributePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/verify-admin" element={<VerifyAdminPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Routes>
          </main>

          {/* Universal Search Modal (Ctrl+K) */}
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
