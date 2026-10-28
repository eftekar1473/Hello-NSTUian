import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  History,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Loader2,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function ContributePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'my-uploads', 'my-corrections'

  // Contributor info (for unauthenticated users)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Form states
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [examType, setExamType] = useState('CT'); // 'CT', 'SEMESTER_FINAL'
  const [ctNumber, setCtNumber] = useState('1');
  const [setName, setSetName] = useState('A');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'warning' | 'error', message, details }

  // User History
  const [myUploads, setMyUploads] = useState([]);
  const [myCorrections, setMyCorrections] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const [deptRes, sessRes] = await Promise.all([
          api.getDepartments(),
          api.getDepartmentSessions('25'),
        ]);
        setDepartments(deptRes.departments || []);
        setSessions(sessRes.sessions || []);
        if (deptRes.departments?.length > 0) {
          const defaultDept = deptRes.departments.find((d) => d.department_code === '25') || deptRes.departments[0];
          setSelectedDeptId(defaultDept.id);
        }
        if (sessRes.sessions?.length > 0) {
          setSelectedSessionId(sessRes.sessions[0].id);
        }
      } catch (err) {
        console.error('Failed to init contribution form:', err);
      }
    }
    initData();
  }, []);

  // Fetch full department details whenever selectedDeptId changes
  useEffect(() => {
    if (!selectedDeptId) return;
    async function fetchDeptDetail() {
      try {
        const res = await api.getDepartmentById(selectedDeptId);
        setSelectedDept(res.department);
        const activeCourses = res.department.programs?.[0]?.semesters?.find(
          (s) => s.semester_number === parseInt(selectedSemester, 10)
        )?.courses;
        if (activeCourses?.length > 0) {
          setSelectedCourseId(activeCourses[0].id);
        } else {
          setSelectedCourseId('');
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDeptDetail();
  }, [selectedDeptId, selectedSemester]);

  // Fetch User History if logged in
  useEffect(() => {
    if (!user) return;
    async function loadUserRecords() {
      setLoadingHistory(true);
      try {
        const [ups, cors] = await Promise.all([api.getMyUploads(), api.getMyCorrections()]);
        setMyUploads(ups.uploads || []);
        setMyCorrections(cors.corrections || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadUserRecords();
  }, [user, activeTab]);

  const activeProgram = selectedDept?.programs?.[0];
  const coursesInSemester =
    activeProgram?.semesters?.find((s) => s.semester_number === parseInt(selectedSemester, 10))
      ?.courses || [];

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setFeedback({ type: 'error', message: 'Please select a question paper file to upload.' });
      return;
    }

    if (!selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select an academic course.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('departmentId', selectedDeptId);
      formData.append('courseId', selectedCourseId);
      if (selectedSessionId) formData.append('universitySessionId', selectedSessionId);
      formData.append('examTypeId', examType);
      if (examType === 'CT') {
        formData.append('ctNumber', ctNumber);
        formData.append('setName', setName);
      }
      formData.append('title', title.trim() || '');
      formData.append('description', description.trim() || '');
      formData.append('file', file);

      if (!user) {
        formData.append('contributorName', guestName.trim() || 'NSTU Student');
        formData.append('contributorEmail', guestEmail.trim() || 'student@student.nstu.edu.bd');
      }

      const res = await api.submitUpload(formData);

      if (res.status === 'published') {
        setFeedback({
          type: 'success',
          message: 'Question paper verified and automatically published!',
          details: 'Your submission passed all duplicate and security checks and is now publicly live in the question bank. Thank you for contributing!',
        });
      } else {
        setFeedback({
          type: 'warning',
          message: 'Submission queued for Review (Duplicate Flagged)',
          details: res.reason || 'A matching question paper or identical file already exists. It will be reviewed to avoid duplication.',
        });
      }

      // Reset file input
      setFile(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit question paper.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4" />
            <span>Open Academic Contribution</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Contribute Question Papers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Any student or teacher can upload questions for any department. No admin account required.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submit Paper
          </button>
          {user && (
            <>
              <button
                onClick={() => setActiveTab('my-uploads')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'my-uploads' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Submissions ({myUploads.length})
              </button>
              <button
                onClick={() => setActiveTab('my-corrections')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'my-corrections' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Corrections ({myCorrections.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: SUBMIT QUESTION PAPER */}
      {activeTab === 'upload' && (
        <div className="rounded-3xl glass-panel border border-cyan-400/30 p-6 sm:p-8 bg-gradient-to-b from-[#0c193b]/90 to-[#070e24]/90 shadow-2xl space-y-6">
          {/* Contributor Notice Badge */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {user ? `Signed in as: ${user.display_name} (${user.email})` : 'Open Contribution: Any User Can Contribute!'}
                </p>
                <p className="text-[11px] text-cyan-300/80">
                  {user
                    ? 'Verified contributor profile linked to your submission.'
                    : 'You do not need to be an admin. Valid new submissions are auto-published to the question bank!'}
                </p>
              </div>
            </div>

            {!user && (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-400/50"
              >
                Sign In with EduMail (Optional)
              </Link>
            )}
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : feedback.type === 'warning'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                  : 'bg-red-500/20 border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {feedback.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {feedback.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {feedback.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                <span>{feedback.message}</span>
              </div>
              {feedback.details && <p className="pl-7 text-slate-300">{feedback.details}</p>}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* If Guest: Contributor details fields */}
            {!user && (
              <div className="p-4 rounded-2xl glass-card grid grid-cols-1 md:grid-cols-2 gap-4 border-cyan-500/20">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name (or Nickname) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NSTUian Student"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Email (NSTU EduMail or Personal) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. roll@student.nstu.edu.bd"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Department *</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.abbreviation || d.department_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Session */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  University Admission Session (Optional)
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  <option value="" className="bg-slate-900">
                    Not Session Specific
                  </option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.session_label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester (1-8) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Semester *</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      Semester {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  {coursesInSemester.length === 0 && (
                    <option value="" className="bg-slate-900">
                      No courses configured for this semester
                    </option>
                  )}
                  {coursesInSemester.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.course_code} - {c.course_title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Examination Type *</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  <option value="CT" className="bg-slate-900 text-white">
                    Class Test (CT)
                  </option>
                  <option value="SEMESTER_FINAL" className="bg-slate-900 text-white">
                    Semester Final Examination
                  </option>
                </select>
              </div>
            </div>

            {/* CT Number & Set Breakdown (Conditional) */}
            {examType === 'CT' && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">Class Test (CT) Number *</label>
                  <select
                    value={ctNumber}
                    onChange={(e) => setCtNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                  >
                    <option value="1" className="bg-slate-900">
                      CT-1
                    </option>
                    <option value="2" className="bg-slate-900">
                      CT-2
                    </option>
                    <option value="3" className="bg-slate-900">
                      CT-3
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">Set Name *</label>
                  <select
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                  >
                    <option value="A" className="bg-slate-900">
                      Set A
                    </option>
                    <option value="B" className="bg-slate-900">
                      Set B
                    </option>
                    <option value="C" className="bg-slate-900">
                      Set C
                    </option>
                    <option value="Standard" className="bg-slate-900">
                      Standard / Common
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Optional Title & Topics */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Title / Covered Topics
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Relational Algebra, ER Modeling, Normalization"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
              />
            </div>

            {/* File Upload Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Attach Question File (PDF, PNG, JPG, DOCX) *
              </label>
              <div className="border-2 border-dashed border-cyan-500/30 rounded-2xl p-6 text-center hover:border-cyan-400 transition-colors bg-blue-950/20">
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <input
                  type="file"
                  id="question-file-input"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="question-file-input"
                  className="inline-block px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold cursor-pointer"
                >
                  {file ? 'Change Selected File' : 'Browse Files'}
                </label>
                {file ? (
                  <p className="mt-2 text-xs font-mono text-emerald-400 font-semibold">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-2">
                    Supported: PDF, Images (PNG, JPG, WebP), Word documents. Max 25 MB.
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-glass-glow disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating & Publishing Question Paper...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Publish Question Paper</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS (FOR LOGGED IN USERS) */}
      {activeTab === 'my-uploads' && user && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Your Question Uploads</h2>
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading submission history...</div>
          ) : myUploads.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-card text-slate-400 text-xs">
              You haven't uploaded any question papers under this account yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myUploads.map((up) => (
                <div key={up.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {up.course?.course_code}
                      </span>
                      <span className="text-xs text-white font-medium">{up.original_filename}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {up.department?.name}
                    </p>
                    {up.rejection_reason && (
                      <p className="text-[11px] text-amber-300 mt-1">Notice: {up.rejection_reason}</p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        up.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : up.status === 'duplicate_flagged'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {up.status === 'published'
                        ? 'Published'
                        : up.status === 'duplicate_flagged'
                        ? 'Under Review'
                        : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY CORRECTIONS (FOR LOGGED IN USERS) */}
      {activeTab === 'my-corrections' && user && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Your Requested Corrections</h2>
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading correction requests...</div>
          ) : myCorrections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-card text-slate-400 text-xs">
              No correction requests found under this account.
            </div>
          ) : (
            <div className="space-y-3">
              {myCorrections.map((cor) => (
                <div key={cor.id} className="p-4 rounded-2xl glass-card flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">
                      Paper: {cor.question_paper?.course?.course_code} - {cor.question_paper?.title || 'Exam'}
                    </p>
                    <p className="text-xs text-slate-300">Reason: {cor.description}</p>
                    {cor.review_notes && (
                      <p className="text-[11px] text-cyan-400">Admin Note: {cor.review_notes}</p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        cor.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : cor.status === 'pending_review'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {cor.status === 'approved'
                        ? 'Approved'
                        : cor.status === 'pending_review'
                        ? 'Pending Review'
                        : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
