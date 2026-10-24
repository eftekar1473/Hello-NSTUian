import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, UploadCloud, Shield, LogIn, LogOut, User, Menu, X, BookOpen } from 'lucide-react';

export default function Navbar({ onOpenSearch }) {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 backdrop-blur-xl bg-[#080e22]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden p-0.5 border border-cyan-400/40 shadow-glass-glow flex items-center justify-center bg-blue-950/80 group-hover:border-cyan-300 transition-all">
            <img src="/iit-crest.jpeg" alt="NSTU Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300 group-hover:from-cyan-300 transition-all">
                HELLO
              </span>
              <span className="font-bold text-lg text-white">NSTUian</span>
            </div>
            <p className="text-[10px] text-cyan-300/70 tracking-widest font-mono uppercase">Academic Question Bank</p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/departments"
            className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
              isActive('/departments') ? 'text-cyan-400' : 'text-slate-300'
            }`}
          >
            Departments
          </Link>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-sm text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Search questions, courses...</span>
            <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400">Ctrl+K</kbd>
          </button>

          <Link
            to="/contribute"
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all ${
              isActive('/contribute')
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glass-glow'
                : 'glass-pill text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Contribute</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                isActive('/admin')
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                  : 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSuperAdmin ? 'Super Admin' : 'Dept Admin'}</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.display_name}</span>
                <span className="text-[10px] text-cyan-400 font-mono truncate max-w-[130px]">{user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glass-glow transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-300 hover:text-cyan-400"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-cyan-500/20 px-4 py-4 space-y-3">
          <Link
            to="/departments"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 hover:text-cyan-400"
          >
            Departments
          </Link>
          <Link
            to="/contribute"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-cyan-300 hover:underline"
          >
            Contribute Questions
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-amber-300"
            >
              Admin Dashboard ({isSuperAdmin ? 'Super' : 'Department'})
            </Link>
          )}
          <div className="pt-2 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{user.display_name}</p>
                  <p className="text-xs text-cyan-400 font-mono">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg bg-blue-600 text-white font-medium text-sm"
              >
                Sign In with EduMail
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
