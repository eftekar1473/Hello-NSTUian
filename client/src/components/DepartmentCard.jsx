import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ArrowRight, Edit3, Trash2 } from 'lucide-react';

export default function DepartmentCard({ department, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const isIIT = department.department_code === '25' || department.abbreviation === 'IIT';

  const defaultLogo = isIIT ? '/iit-card.jpg' : '/nstu-logo.png';
  const logoSrc = imgError || !department.icon_url ? defaultLogo : department.icon_url;

  return (
    <Link
      to={`/departments/${department.department_code}`}
      className="group relative block rounded-2xl sm:rounded-3xl p-[1px] transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.01]"
    >
      {/* Outer Neon Glow Ring */}
      <div
        className={`absolute -inset-0.5 rounded-2xl sm:rounded-3xl opacity-40 group-hover:opacity-100 blur-md sm:blur-lg transition duration-500 ${
          isIIT
            ? 'bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-500'
            : 'bg-gradient-to-br from-blue-500/60 via-cyan-500/40 to-indigo-600/50'
        }`}
      />

      {/* Main Glassmorphic Container */}
      <div className="relative h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#09132b]/90 backdrop-blur-2xl border border-cyan-400/30 p-2.5 xs:p-3 sm:p-5 md:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden group-hover:border-cyan-300/80 transition-all">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 sm:w-36 sm:h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/25 transition-all" />

        {/* Top Header: Badge, Code & Optional Admin Actions */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="font-mono text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            CODE: {department.department_code}
          </span>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(department);
                  }}
                  className="p-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-400/30 transition-all cursor-pointer"
                  title="Edit Department"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(department);
                  }}
                  className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-400/30 transition-all cursor-pointer"
                  title="Delete Department"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center Crest & Visual */}
        <div className="flex flex-col items-center text-center my-1 sm:my-2">
          <div className="relative w-12 h-12 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-1.5 sm:mb-3 rounded-xl sm:rounded-2xl p-1 sm:p-2 bg-gradient-to-b from-cyan-500/20 via-blue-900/40 to-transparent border border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)] flex items-center justify-center group-hover:border-cyan-300 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] transition-all overflow-hidden flex-shrink-0">
            <img
              src={logoSrc}
              alt={department.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h3 className="font-bold text-[11px] xs:text-xs sm:text-sm md:text-base text-white tracking-wide uppercase leading-tight sm:leading-snug group-hover:text-cyan-200 transition-colors line-clamp-2 min-h-[2.4em] flex items-center justify-center">
            {department.name}
          </h3>

          {department.abbreviation && (
            <span className="text-[9px] sm:text-[11px] font-bold tracking-wider text-cyan-400/90 mt-0.5 sm:mt-1 uppercase">
              ({department.abbreviation})
            </span>
          )}

          {/* Futuristic divider line with center dot */}
          <div className="w-3/4 flex items-center justify-center my-1.5 sm:my-3 opacity-80">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-cyan-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mx-1.5 shadow-[0_0_8px_#38bdf8]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-400/60 to-cyan-400" />
          </div>

          <p className="hidden md:block text-xs text-slate-300/80 line-clamp-2 leading-relaxed px-2">
            {department.description || `Browse past exam questions, continuous tests, and semester finals for ${department.name}.`}
          </p>
        </div>

        {/* Bottom Metadata & Action */}
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-0.5 sm:gap-1" title="Courses">
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>
                {department.total_courses || 0}
                <span className="hidden sm:inline"> Courses</span>
              </span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1" title="Question Papers">
              <FileText className="w-3 h-3 text-blue-400" />
              <span>
                {department.total_questions || 0}
                <span className="hidden sm:inline"> Papers</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
            <span className="hidden xs:inline sm:inline">Explore</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
