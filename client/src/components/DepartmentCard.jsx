import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function DepartmentCard({ department }) {
  const isIIT = department.department_code === '25' || department.abbreviation === 'IIT';

  return (
    <Link
      to={`/departments/${department.department_code}`}
      className="group relative block rounded-3xl p-[1px] transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]"
    >
      {/* Outer Neon Glow Ring */}
      <div
        className={`absolute -inset-0.5 rounded-3xl opacity-40 group-hover:opacity-100 blur-lg transition duration-500 ${
          isIIT
            ? 'bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-500'
            : 'bg-gradient-to-br from-blue-500/50 via-slate-500/20 to-cyan-500/40'
        }`}
      />

      {/* Main Glassmorphic Container */}
      <div className="relative h-full flex flex-col justify-between rounded-3xl bg-[#0c1633]/80 backdrop-blur-2xl border border-white/20 p-6 shadow-2xl overflow-hidden group-hover:border-cyan-300/60 transition-all">
        {/* Subtle Ambient Circuit/Glow Overlay */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/20 transition-all" />

        {/* Top Header: Badge & Code */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            CODE: {department.department_code}
          </span>
          {isIIT && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Featured
            </span>
          )}
        </div>

        {/* Center Crest & Visual */}
        <div className="flex flex-col items-center text-center my-3">
          <div className="relative w-24 h-24 mb-4 rounded-2xl p-1 bg-gradient-to-b from-blue-500/30 to-transparent border border-cyan-400/40 shadow-glass-glow flex items-center justify-center group-hover:border-cyan-300 group-hover:shadow-glass-hover transition-all">
            <img
              src={department.icon_url || (isIIT ? '/iit-crest.jpeg' : '/iit-crest.jpeg')}
              alt={department.name}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            />
          </div>

          <h3 className="font-bold text-lg sm:text-xl text-white tracking-wide uppercase leading-snug group-hover:text-cyan-200 transition-colors">
            {department.name}
          </h3>

          {department.abbreviation && (
            <span className="text-xs font-semibold tracking-widest text-cyan-400/90 mt-1 uppercase">
              ({department.abbreviation})
            </span>
          )}

          {/* Futuristic divider line with center dot (matches Futuristic IIT Card image) */}
          <div className="w-full flex items-center justify-center my-4 opacity-70">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-cyan-400" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 mx-2 shadow-[0_0_8px_#38bdf8]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-400/50 to-cyan-400" />
          </div>

          <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed px-2">
            {department.description || `Browse past exam questions, continuous tests, and semester finals for ${department.name}.`}
          </p>
        </div>

        {/* Bottom Metadata & Action */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Courses">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{department.total_courses || 0} Courses</span>
            </div>
            <div className="flex items-center gap-1" title="Question Papers">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{department.total_questions || 0} Papers</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
