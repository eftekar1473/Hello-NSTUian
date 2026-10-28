import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-cyan-500/20 bg-[#060a17]/90 text-slate-400 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Col 1: Platform Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-cyan-400/40 p-0.5 bg-blue-950 flex items-center justify-center">
              <img src="/nstu-logo.png" alt="NSTU Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg text-white">Hello NSTUian</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hello NSTUian is a student-friendly platform designed to make previous years’ question papers easily accessible to NSTU students. Our goal is to simplify exam preparation by organizing questions in one place, helping students save time, study more efficiently, and prepare with confidence. We believe that easy access to academic resources can make learning more effective for everyone.
          </p>
        </div>

        {/* Col 2: Academic & Administrative Navigation */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">Academic Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/departments" className="hover:text-cyan-300 transition-colors">
                All Departments (A–Z)
              </Link>
            </li>
            <li>
              <Link to="/departments/25" className="hover:text-cyan-300 transition-colors">
                Institute of Information Technology (IIT)
              </Link>
            </li>
            <li>
              <Link to="/contribute" className="hover:text-cyan-300 transition-colors">
                Contribute Exam Papers
              </Link>
            </li>
            <li className="pt-2 border-t border-white/5">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login (Portal)</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: University Affiliation */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">University Affiliation</h4>
          <p className="text-xs text-slate-400">
            Noakhali Science and Technology University
            <br />
            Noakhali-3814, Bangladesh.
          </p>
          <p className="text-[11px] text-slate-500 mt-4">
            Designed for students, maintained with <Heart className="w-3 h-3 inline text-red-400" /> by your well wisher.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Hello NSTUian Academic Bank. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-mono text-[10px]">Version 1.0</p>
      </div>
    </footer>
  );
}
