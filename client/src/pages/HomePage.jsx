import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Shield, UploadCloud, Layers } from 'lucide-react';
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
    `${d.name} ${d.abbreviation || ''} ${d.department_code}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-12 pb-6 sm:pb-10 text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="ambient-glow bg-cyan-500 top-10 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 opacity-20" />
        <div className="ambient-glow bg-blue-600 top-40 left-1/4 w-56 sm:w-72 h-56 sm:h-72 opacity-25" />

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 sm:mb-6 shadow-glass-glow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>making your academic life easier</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find Previous Exam Questions{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              Instantly & Freely.
            </span>
          </h1>

          {/* Quick Search Action Bar */}
          <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
            <div
              onClick={onOpenSearch}
              className="flex items-center gap-3 p-3 rounded-2xl glass-input cursor-pointer border-cyan-500/30 hover:border-cyan-400 transition-all shadow-glass group"
            >
              <Search className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-400 text-xs sm:text-sm flex-1 text-left truncate">
                Search course codes (e.g. CSTE, IIT, BAN 1101), topics, departments...
              </span>
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono rounded bg-white/10 text-slate-300 border border-white/10">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </div>
      </section>

      {/* All Departments Directory Section (All 33 Departments) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Academic Departments ({filteredDepartments.length})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">All Departments</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your department to access continuous assessment papers (CTs), midterms, and semester finals.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter departments by name or code..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl glass-input text-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-44 sm:h-64 rounded-2xl sm:rounded-3xl glass-card animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl glass-card">
            <p className="text-slate-300 text-sm">No departments matched "{searchFilter}".</p>
            <button
              onClick={() => setSearchFilter('')}
              className="mt-3 px-3.5 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {filteredDepartments.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        )}
      </section>

      {/* Contributor Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl glass-card p-6 sm:p-8 border border-cyan-400/30 text-center space-y-4 bg-gradient-to-b from-[#0f1b3b]/90 to-[#091126]/90">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl mx-auto bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-glass-glow">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-white">
            Have recent exam questions? Contribute with your EduMail!
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            NSTU students with valid EduMail (@student.nstu.edu.bd) can contribute new question papers for any department. Valid,
            non-duplicate papers are published automatically!
          </p>
          <div className="pt-2">
            <Link
              to="/contribute"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm shadow-glass-glow transition-all"
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
