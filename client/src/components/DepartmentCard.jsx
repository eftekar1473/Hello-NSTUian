import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function DepartmentCard({ department }) {
  const [imgError, setImgError] = useState(false);
  const isIIT = department.department_code === '25' || department.abbreviation === 'IIT';

  const defaultLogo = isIIT ? '/iit-card.jpg' : '/nstu-logo.png';
  const logoSrc = imgError || !department.icon_url ? defaultLogo : department.icon_url;

  return (
    <Link
      to={`/departments/${department.department_code}`}
      className="group relative block rounded-3xl p-[1px] transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]"
    >
      {/* Outer Neon Glow Ring */}
      <div
        className={`absolute -inset-0.5 rounded-3xl opacity-50 group-hover:opacity-100 blur-lg transition duration-500 ${
          isIIT
            ? 'bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-500'
            : 'bg-gradient-to-br from-blue-500/60 via-cyan-500/40 to-indigo-600/50'
        }`}
      />

      {/* Main Glassmorphic Container matching Image 2 */}
      <div className="relative h-full flex flex-col justify-between rounded-3xl bg-[#09132b]/85 backdrop-blur-2xl border border-cyan-400/30 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden group-hover:border-cyan-300/80 transition-all">
        {/* Subtle Ambient Circuit/Glow Overlay */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-400/25 transition-all" />

        {/* Top Header: Badge & Code */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            CODE: {department.department_code}
          </span>
          {isIIT && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Featured
            </span>
          )}
        </div>

        {/* Center Crest & Visual */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="relative w-28 h-28 mb-4 rounded-2xl p-2 bg-gradient-to-b from-cyan-500/20 via-blue-900/40 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center group-hover:border-cyan-300 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] transition-all overflow-hidden">
            <img
              src={logoSrc}
              alt={department.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h3 className="font-bold text-base sm:text-lg text-white tracking-wide uppercase leading-snug group-hover:text-cyan-200 transition-colors">
            {department.name}
          </h3>

          {department.abbreviation && (
            <span className="text-[11px] font-bold tracking-widest text-cyan-400/90 mt-1 uppercase">
              ({department.abbreviation})
            </span>
          )}

          {/* Futuristic divider line with center dot (matches Futuristic IIT Card image) */}
          <div className="w-3/4 flex items-center justify-center my-3.5 opacity-80">
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-cyan-400" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 mx-2 shadow-[0_0_8px_#38bdf8]" />
            <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-cyan-400/60 to-cyan-400" />
          </div>

          <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed px-2">
            {department.description || `Browse past exam questions, continuous tests, and semester finals for ${department.name}.`}
          </p>
        </div>

        {/* Bottom Metadata & Action */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
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
