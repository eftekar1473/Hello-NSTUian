import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api, getDownloadUrl } from '../services/api';
import {
  FileText,
  Download,
  Eye,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import QuestionViewerModal from '../components/QuestionViewerModal';
import CorrectionModal from '../components/CorrectionModal';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionFilter = searchParams.get('session');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, CT, SEMESTER_FINAL
  const [selectedCT, setSelectedCT] = useState('ALL'); // ALL, 1, 2, 3

  // Modals
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [correctionQuestion, setCorrectionQuestion] = useState(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await api.getQuestionsByCourse(courseId);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [courseId]);

  const courseInfo = questions[0]?.course || null;
  const deptInfo = questions[0]?.department || null;

  // Filter questions
  const filtered = questions.filter((q) => {
    if (selectedType !== 'ALL' && q.exam_type?.code !== selectedType) return false;
    if (selectedType === 'CT' && selectedCT !== 'ALL' && q.ct_number !== parseInt(selectedCT, 10)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-cyan-300">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link to="/departments" className="hover:text-cyan-300">
          Departments
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        {deptInfo && (
          <>
            <Link to={`/departments/${deptInfo.department_code}`} className="hover:text-cyan-300">
              {deptInfo.abbreviation || deptInfo.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </>
        )}
        <span className="text-cyan-400 font-medium">Course Questions</span>
      </div>

      {/* Course Banner */}
      <div className="rounded-3xl glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-gradient-to-r from-[#0c183a]/90 to-[#070e24]/90 shadow-2xl">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
              {courseInfo?.course_code || 'COURSE'}
            </span>
            {courseInfo?.credit && (
              <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {courseInfo.credit} Credits
              </span>
            )}
            {sessionFilter && (
              <span className="text-xs text-cyan-400/90 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Session: {sessionFilter}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {courseInfo?.course_title || 'Academic Course Examination Papers'}
          </h1>

          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Access previous Class Test (CT) papers, set variants (Set A, Set B, Set C), and semester
            final exams. All questions are publicly accessible and verified.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Exam Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-cyan-400" />
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                selectedType === 'ALL'
                  ? 'bg-cyan-500 text-white shadow-glass-glow'
                  : 'glass-pill text-slate-300 hover:text-white hover:border-cyan-400/50'
              }`}
            >
              All Types ({questions.length})
            </button>
            <button
              onClick={() => setSelectedType('CT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                selectedType === 'CT'
                  ? 'bg-cyan-500 text-white shadow-glass-glow'
                  : 'glass-pill text-slate-300 hover:text-white hover:border-cyan-400/50'
              }`}
            >
              Class Tests (CT)
            </button>
            <button
              onClick={() => setSelectedType('SEMESTER_FINAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                selectedType === 'SEMESTER_FINAL'
                  ? 'bg-cyan-500 text-white shadow-glass-glow'
                  : 'glass-pill text-slate-300 hover:text-white hover:border-cyan-400/50'
              }`}
            >
              Semester Finals
            </button>
          </div>

          {/* Sub-Filter for CT Number (CT-1, CT-2, CT-3) */}
          {selectedType === 'CT' && (
            <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400 px-2 font-mono uppercase">Filter CT:</span>
              {['ALL', '1', '2', '3'].map((ct) => (
                <button
                  key={ct}
                  onClick={() => setSelectedCT(ct)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                    selectedCT === ct ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ct === 'ALL' ? 'All Sets' : `CT-${ct}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl glass-card animate-pulse bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Question Papers Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            No approved question papers match the selected criteria. If you have this question paper, you can
            contribute it with your NSTU EduMail!
          </p>
          <Link
            to="/contribute"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold mt-2"
          >
            <span>Contribute Paper</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((q) => {
            const latestVersion = q.versions?.[0];
            const isCT = q.exam_type?.code === 'CT';

            return (
              <div
                key={q.id}
                className="rounded-2xl glass-card p-5 flex flex-col justify-between hover:border-cyan-400/50 transition-all space-y-4"
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                        isCT
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isCT ? `CT-${q.ct_number || '1'} Set ${q.set_name || 'A'}` : 'Semester Final'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                    {q.title || `${q.exam_type?.name}`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {q.description || `Official question paper for ${q.course?.course_title || 'this course'}.`}
                  </p>
                </div>

                {/* Footer Controls & Version */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Version {latestVersion?.version_number || 1}</span>
                    <button
                      onClick={() => setCorrectionQuestion(q)}
                      className="text-amber-400/90 hover:text-amber-300 underline font-medium cursor-pointer"
                    >
                      Request Correction
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl glass-pill text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-400/40 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={getDownloadUrl(q.id)}
                      download
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white shadow-glass-glow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {previewQuestion && (
        <QuestionViewerModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} />
      )}

      {correctionQuestion && (
        <CorrectionModal
          question={correctionQuestion}
          onClose={() => setCorrectionQuestion(null)}
          onSuccess={() => {
            setCorrectionQuestion(null);
            alert('Correction request submitted! An administrator will review your proposed changes.');
          }}
        />
      )}
    </div>
  );
}
