import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Layers, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ departments: [], courses: [], questions: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ departments: [], courses: [], questions: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // toggle trigger
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ departments: [], courses: [], questions: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    results.departments?.length > 0 || results.courses?.length > 0 || results.questions?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-cyan-400/30 shadow-2xl overflow-hidden bg-[#0a1226]/95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, course codes (e.g. IIT 2101), topics..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-base focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>Type to search past question papers across NSTU.</p>
              <p className="text-xs text-slate-500 mt-1">Try searching "IIT", "Database", "DBMS", or "Discrete".</p>
            </div>
          )}

          {query && !loading && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No matching records found for "{query}".
            </div>
          )}

          {/* Departments */}
          {results.departments?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Departments</span>
              </div>
              <div className="space-y-1.5">
                {results.departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/departments/${d.department_code}`)}
                    className="w-full text-left p-2.5 rounded-xl glass-card flex items-center justify-between hover:border-cyan-400/50 group"
                  >
                    <div>
                      <span className="font-semibold text-white group-hover:text-cyan-300">
                        {d.name} ({d.abbreviation || d.department_code})
                      </span>
                      <p className="text-xs text-slate-400">Department Code: {d.department_code}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {results.courses?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Courses</span>
              </div>
              <div className="space-y-1.5">
                {results.courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/courses/${c.id}`)}
                    className="w-full text-left p-2.5 rounded-xl glass-card flex items-center justify-between hover:border-blue-400/50 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                          {c.course_code}
                        </span>
                        <span className="font-medium text-white group-hover:text-blue-300">
                          {c.course_title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.program?.department?.name} • Semester {c.semester?.semester_number}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Papers */}
          {results.questions?.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Question Papers</span>
              </div>
              <div className="space-y-1.5">
                {results.questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelect(`/questions/${q.id}`)}
                    className="w-full text-left p-2.5 rounded-xl glass-card flex items-center justify-between hover:border-amber-400/50 group"
                  >
                    <div>
                      <span className="font-medium text-white group-hover:text-amber-300">
                        {q.title || `${q.course?.course_code} - ${q.exam_type?.name}`}
                      </span>
                      <p className="text-xs text-slate-400">
                        {q.department?.name}
                        {q.ct_number ? ` • CT ${q.ct_number} (${q.set_name || 'Standard'})` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
