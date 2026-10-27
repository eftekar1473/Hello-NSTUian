import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DepartmentCard from '../components/DepartmentCard';
import { Search, Layers } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('ALL');

  useEffect(() => {
    async function loadDepts() {
      try {
        const data = await api.getDepartments();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDepts();
  }, []);

  const letters = ['ALL', ...new Set(departments.map((d) => d.name[0]?.toUpperCase()).filter(Boolean))].sort();

  const filtered = departments.filter((d) => {
    const matchesQuery = `${d.name} ${d.abbreviation || ''} ${d.department_code}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesLetter = activeLetter === 'ALL' || d.name[0]?.toUpperCase() === activeLetter;
    return matchesQuery && matchesLetter;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            <span>Academic Directory ({departments.length} Departments)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">NSTU Departments</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Browse question banks across all faculties and institutes of Noakhali Science & Technology University.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code or acronym..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-white text-xs sm:text-sm placeholder-slate-400"
          />
        </div>
      </div>

      {/* Alphabetical Quick Jump Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {letters.map((char) => (
          <button
            key={char}
            onClick={() => setActiveLetter(char)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeLetter === char
                ? 'bg-cyan-500 text-white shadow-glass-glow'
                : 'glass-pill text-slate-300 hover:text-white hover:border-cyan-400/50'
            }`}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Grid of Department Cards - 4 in 1 screen on mobile (2 cols x 2 rows) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-44 sm:h-64 rounded-2xl sm:rounded-3xl glass-card animate-pulse bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl glass-card">
          <p className="text-slate-300 font-medium">No departments matched your filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setActiveLetter('ALL');
            }}
            className="mt-3 px-4 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {filtered.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} />
          ))}
        </div>
      )}
    </div>
  );
}
