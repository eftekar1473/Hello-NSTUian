import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, Calendar, ChevronRight, FileText, Sparkles, Layers, ArrowLeft } from 'lucide-react';

export default function DepartmentDetailPage() {
  const { deptId } = useParams();
  const [department, setDepartment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('2022-2023');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [deptRes, sessRes] = await Promise.all([
          api.getDepartmentById(deptId),
          api.getDepartmentSessions(deptId),
        ]);
        setDepartment(deptRes.department);
        setSessions(sessRes.sessions || []);
        if (sessRes.sessions?.length > 0) {
          setSelectedSession(sessRes.sessions[0].session_label);
        }
      } catch (err) {
        console.error('Failed to load department details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [deptId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm mt-3">Loading department syllabus and course structure...</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Department Not Found</h2>
        <p className="text-slate-400 text-sm mt-2">
          The requested department ID or code "{deptId}" does not exist.
        </p>
        <Link
          to="/departments"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Departments</span>
        </Link>
      </div>
    );
  }

  const activeProgram = department.programs?.[0];
  const activeSemester = activeProgram?.semesters?.find((s) => s.semester_number === selectedSemester);
  const currentCourses = activeSemester?.courses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-cyan-300">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link to="/departments" className="hover:text-cyan-300">
          Departments
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-cyan-400 font-medium">{department.name}</span>
      </div>

      {/* Department Hero Card */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-gradient-to-r from-[#0c193b]/90 via-[#0a1532]/90 to-[#070e24]/90 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-2 glass-card border border-cyan-400/40 shadow-glass-glow flex-shrink-0 bg-blue-950/80 flex items-center justify-center">
            <img
              src={department.icon_url || (department.department_code === '25' ? '/iit-card.jpg' : '/nstu-logo.png')}
              alt={department.name}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                DEPT ID: {department.department_code}
              </span>
              {department.abbreviation && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                  {department.abbreviation}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeProgram?.program_name || 'Undergraduate Curriculum'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
              {department.name}
            </h1>

            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              {department.description ||
                `Browse past academic examination questions, continuous tests (CT-1, CT-2, CT-3), and semester finals for ${department.name}.`}
            </p>
          </div>
        </div>

        {/* University Session Selector Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Admission Session Context:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.session_label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSession === s.session_label
                    ? 'bg-cyan-500 text-white shadow-glass-glow'
                    : 'glass-pill text-slate-300 hover:text-white hover:border-cyan-400/50'
                }`}
              >
                {s.session_label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8-Semester Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Academic Semesters (1 to 8)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Selected: Semester {selectedSemester}
          </span>
        </div>

        {/* Semester Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedSemester(num)}
              className={`py-3 px-2 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                selectedSemester === num
                  ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-glass-glow border border-cyan-300/50'
                  : 'glass-card text-slate-300 hover:text-white hover:border-cyan-400/40'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Sem</span>
              <span className="text-xl font-extrabold">{num}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Courses List for Selected Semester */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-semibold text-white">
            Semester {selectedSemester} Courses ({currentCourses.length})
          </h3>
          <span className="text-xs text-slate-400">Click a course to open examination papers</span>
        </div>

        {currentCourses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-card text-slate-400 text-sm">
            No courses listed for Semester {selectedSemester} yet. You can contribute question papers via the
            contribution form.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentCourses.map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.id}?session=${selectedSession}`}
                className="group p-5 rounded-2xl glass-card flex flex-col justify-between hover:border-cyan-400/50 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                      {c.course_code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {c.credit} Credits
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base group-hover:text-cyan-200 transition-colors line-clamp-2">
                    {c.course_title}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c._count?.question_papers || 0} Question Papers</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
