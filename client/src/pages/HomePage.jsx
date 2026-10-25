import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, BookOpen, FileCheck, Shield, UploadCloud, Users, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import DepartmentCard from '../components/DepartmentCard';

export default function HomePage({ onOpenSearch }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function fetchDepts() {
      try {
        const data = await api.getDepartments();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDepts();
  }, []);

  const filteredDepartments = departments.filter((d) =>
    `${d.name} ${d.abbreviation} ${d.department_code}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Target departments: Bangla, Math, English, Physics, Chemistry, IIT
  const targetDeptCodes = ['04', '02', '14', '03', '06', '25'];
  const targetDeptNames = ['bangla', 'math', 'english', 'physics', 'chemistry', 'institute of information technology'];

  const coreDepartments = departments.filter((d) => {
    const codeMatch = targetDeptCodes.includes(d.department_code);
    const nameMatch = targetDeptNames.some(
      (n) => d.name?.toLowerCase().includes(n) || d.abbreviation?.toLowerCase() === n
    );
    return codeMatch || nameMatch;
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-10 text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="ambient-glow bg-cyan-500 top-10 left-1/2 -translate-x-1/2 w-96 h-96 opacity-20" />
        <div className="ambient-glow bg-blue-600 top-40 left-1/4 w-72 h-72 opacity-25" />

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-glass-glow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>making your academic life easier</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find Previous Exam Questions{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              Instantly & Freely.
            </span>
          </h1>

          {/* Quick Search Action Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div
              onClick={onOpenSearch}
              className="flex items-center gap-3 p-3 rounded-2xl glass-input cursor-pointer border-cyan-500/30 hover:border-cyan-400 transition-all shadow-glass group"
            >
              <Search className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-400 text-sm flex-1 text-left">
                Search course codes (e.g. IIT 2101, BAN 1101), topics, departments...
              </span>
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono rounded bg-white/10 text-slate-300 border border-white/10">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Department Card / Design Showcase Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-gradient-to-r from-blue-950/80 via-[#0d1c44]/80 to-indigo-950/80 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Engineering Institute</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
                Institute of Information Technology (IIT)
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Explore continuous assessment papers (CT-1, CT-2, CT-3 Sets A, B, C) and semester final exams for
                BSIT across Semesters 1 to 8. Complete with preview and free downloads.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/departments/25"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glass-glow transition-all"
                >
                  <span>Explore IIT Question Bank</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contribute"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-pill text-slate-200 hover:text-white hover:border-cyan-400/50 text-sm font-medium transition-all"
                >
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <span>Submit an Exam Paper</span>
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative w-48 h-48 rounded-2xl p-2 glass-card border border-cyan-400/50 shadow-glass-hover flex items-center justify-center bg-blue-950/60 overflow-hidden">
                <img
                  src="/iit-card.jpg"
                  alt="IIT NSTU Crest"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Department Cards: Bangla, Math, English, Physics, Chemistry, IIT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Departments</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Department Question Archives</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct access to question papers for Bangla, Mathematics, English, Physics, Chemistry, IIT and more.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl glass-card animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Display core departments first, then others */}
            {(coreDepartments.length > 0 ? coreDepartments : departments.slice(0, 6)).map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        )}
      </section>

      {/* A-Z Department Directory (All Departments) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">All Departments (A–Z)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete alphabetical directory of NSTU academic departments.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Filter departments..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs rounded-xl glass-input text-white placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl glass-card animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        )}
      </section>

      {/* Contributor Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-card p-8 border border-cyan-400/30 text-center space-y-4 bg-gradient-to-b from-[#0f1b3b]/90 to-[#091126]/90">
          <div className="w-12 h-12 rounded-2xl mx-auto bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-glass-glow">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Have recent exam questions? Contribute with your EduMail!
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            NSTU students with valid EduMail (@student.nstu.edu.bd) can contribute new question papers for any department. Valid,
            non-duplicate papers are published automatically!
          </p>
          <div className="pt-2">
            <Link
              to="/contribute"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glass-glow transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit Question Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
