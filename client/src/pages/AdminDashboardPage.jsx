import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Users,
  Layers,
  FileText,
  Loader2,
  Lock,
  ArrowRight,
  Plus,
  Upload,
  Sparkles,
  ExternalLink,
  Building,
} from 'lucide-react';
import DepartmentCard from '../components/DepartmentCard';

export default function AdminDashboardPage() {
  const { user, isAdmin, isSuperAdmin, isDeptAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads', 'corrections', 'departments', 'dept-admins', 'audit', 'users'
  const [statsData, setStatsData] = useState(null);
  const [uploadsQueue, setUploadsQueue] = useState([]);
  const [correctionsQueue, setCorrectionsQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptAdmins, setDeptAdmins] = useState([]);

  // Role Assignment State (Super Admin)
  const [targetUserId, setTargetUserId] = useState('');
  const [assignRole, setAssignRole] = useState('DEPARTMENT_ADMIN');
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');

  // Department Creation State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptAbbr, setDeptAbbr] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptLogoFile, setDeptLogoFile] = useState(null);
  const [deptLogoPreview, setDeptLogoPreview] = useState('/nstu-logo.png');
  const [deptMessage, setDeptMessage] = useState('');

  // Super Admin: Set Dept Admin State
  const [newAdminDeptId, setNewAdminDeptId] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRoll, setNewAdminRoll] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [deptAdminMessage, setDeptAdminMessage] = useState('');

  // Change Password State
  const [currPassword, setCurrPassword] = useState('');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (newPasswordVal.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPwdLoading(true);
    try {
      await api.changePassword({
        currentPassword: currPassword,
        newPassword: newPasswordVal,
      });
      setPwdMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrPassword('');
      setNewPasswordVal('');
      setConfirmPasswordVal('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const [dash, ups, cors, logs, depts] = await Promise.all([
        api.getAdminDashboard(),
        api.getReviewableUploads(),
        api.getReviewableCorrections(),
        api.getAuditLogs(),
        api.getDepartments(),
      ]);

      setStatsData(dash);
      setUploadsQueue(ups.uploads || []);
      setCorrectionsQueue(cors.corrections || []);
      setAuditLogs(logs.logs || []);
      setDepartments(depts.departments || []);

      if (depts.departments?.length > 0) {
        setAssignDeptId(depts.departments[0].id);
        setNewAdminDeptId(depts.departments[0].id);
      }

      if (isSuperAdmin) {
        const [usersRes, adminsRes] = await Promise.all([
          api.getAdminUsers(),
          api.getDeptAdmins().catch(() => ({ admins: [] })),
        ]);
        setAdminUsers(usersRes.users || []);
        setDeptAdmins(adminsRes.admins || []);
        if (usersRes.users?.length > 0) {
          setTargetUserId(usersRes.users[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, isSuperAdmin]);

  const handleReviewUpload = async (id, decision) => {
    const reason = decision === 'REJECT' ? prompt('Enter reason for rejecting this upload:') : null;
    if (decision === 'REJECT' && !reason) return;

    setActionLoading(true);
    try {
      await api.reviewUpload(id, { decision, rejectionReason: reason, reviewNotes: 'Admin reviewed' });
      await loadData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewCorrection = async (id, decision) => {
    const notes = prompt(`Enter optional review notes for ${decision.toLowerCase()}ing this correction request:`);
    setActionLoading(true);
    try {
      await api.reviewCorrection(id, { decision, reviewNotes: notes || undefined });
      await loadData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setAssignMessage('');
    try {
      await api.assignRole({
        userId: targetUserId,
        role: assignRole,
        departmentId: assignRole === 'DEPARTMENT_ADMIN' ? assignDeptId : null,
      });
      setAssignMessage('Admin role granted successfully!');
      await loadData();
    } catch (err) {
      setAssignMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Create Department Handler
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setDeptMessage('');
    try {
      const formData = new FormData();
      formData.append('name', deptName.trim());
      formData.append('department_code', deptCode.trim());
      if (deptAbbr) formData.append('abbreviation', deptAbbr.trim());
      if (deptDesc) formData.append('description', deptDesc.trim());
      if (deptLogoFile) {
        formData.append('logo', deptLogoFile);
      } else {
        formData.append('icon_url', '/nstu-logo.png');
      }

      await api.createDepartment(formData);
      setDeptMessage('Department created successfully! Defaulted to university logo if none provided.');
      setDeptName('');
      setDeptCode('');
      setDeptAbbr('');
      setDeptDesc('');
      setDeptLogoFile(null);
      setDeptLogoPreview('/nstu-logo.png');
      await loadData();
    } catch (err) {
      setDeptMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Set Dept Admin Handler (Super Admin)
  const handleSetDeptAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setDeptAdminMessage('');
    try {
      await api.createDeptAdmin({
        departmentId: newAdminDeptId,
        email: newAdminEmail.trim(),
        roll: newAdminRoll.trim(),
        password: newAdminPassword,
        displayName: newAdminName.trim() || undefined,
      });
      setDeptAdminMessage('Department Admin configured! Account is pending verification via their EduMail.');
      setNewAdminEmail('');
      setNewAdminRoll('');
      setNewAdminPassword('');
      setNewAdminName('');
      await loadData();
    } catch (err) {
      setDeptAdminMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Fast verify dept admin (for testing / admin action)
  const handleQuickVerifyAdmin = async (adminEmail, adminRoll) => {
    setActionLoading(true);
    try {
      await api.verifyDeptAdmin({ email: adminEmail, roll: adminRoll });
      alert(`EduMail ${adminEmail} verified successfully! They can now log in with the password given by Super Admin.`);
      await loadData();
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">
          This portal is restricted to authorized Department Administrators and Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                isSuperAdmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isSuperAdmin ? '👑 Super Administrator (Global Scope)' : '🛡️ Department Administrator'}
            </span>
            {statsData?.assignedDepartment && (
              <span className="text-xs text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                Department: {statsData.assignedDepartment.name} ({statsData.assignedDepartment.department_code})
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white">Administration Dashboard</h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'uploads' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flagged Uploads ({uploadsQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'corrections' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Corrections ({correctionsQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'departments' ? 'bg-blue-600 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manage Departments
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('dept-admins')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                activeTab === 'dept-admins' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dept Admin Setup ({deptAdmins.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'audit' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                activeTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'security' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Password
          </button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Questions</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{statsData?.stats?.totalQuestions ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Flagged Submissions</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{statsData?.stats?.flaggedUploadsCount ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Corrections</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{statsData?.stats?.pendingCorrectionsCount ?? 0}</p>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Departments</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">{departments.length}</p>
        </div>
      </div>

      {/* TAB 1: FLAGGED UPLOADS QUEUE */}
      {activeTab === 'uploads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Flagged Submissions Awaiting Approval</span>
            </h2>
            <span className="text-xs text-slate-400">
              {uploadsQueue.length} submissions flagged for duplicate signals
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading review queue...</div>
          ) : uploadsQueue.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-card text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No pending flagged uploads! All valid submissions were auto-published.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadsQueue.map((up) => (
                <div key={up.id} className="p-5 rounded-2xl glass-card space-y-4 border-amber-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300">
                          {up.course?.course_code}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {up.course?.course_title} ({up.exam_type?.name}
                          {up.ct_number ? ` CT-${up.ct_number}` : ''})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Department: {up.department?.name} • Year {up.exam_session?.label} • Filename:{' '}
                        <span className="font-mono text-cyan-300">{up.original_filename}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">
                        Submitted by: {up.submitter?.display_name} ({up.submitter?.email})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <span className="font-bold">Duplicate Warning Signal: </span>
                    <span>{up.rejection_reason || 'Exact course, session, or hash match detected.'}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => handleReviewUpload(up.id, 'REJECT')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold cursor-pointer"
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleReviewUpload(up.id, 'APPROVE')}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Approve & Publish to Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CORRECTIONS QUEUE */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Correction & Replacement Requests</span>
            </h2>
            <span className="text-xs text-slate-400">{correctionsQueue.length} requests pending</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading corrections...</div>
          ) : correctionsQueue.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-card text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No pending correction requests.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {correctionsQueue.map((cor) => (
                <div key={cor.id} className="p-5 rounded-2xl glass-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {cor.question_paper?.course?.course_code}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {cor.question_paper?.title || cor.question_paper?.course?.course_title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Department: {cor.question_paper?.department?.name}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <span>Requester: {cor.requester?.display_name} ({cor.requester?.email})</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-500/30 text-xs text-slate-200">
                    <span className="font-semibold text-cyan-300">Reported Issue: </span>
                    <p className="mt-1">{cor.description}</p>
                    {cor.proposed_filename && (
                      <p className="mt-2 text-cyan-400 font-mono text-[11px]">
                        Attached Replacement: {cor.proposed_filename} ({(cor.proposed_file_size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => handleReviewCorrection(cor.id, 'REJECT')}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold cursor-pointer"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleReviewCorrection(cor.id, 'APPROVE')}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-glass-glow cursor-pointer"
                    >
                      Approve & Create Version N+1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGE DEPARTMENTS (Requirement 2) */}
      {activeTab === 'departments' && (
        <div className="space-y-8">
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-blue-500/30 bg-[#0a142e]/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" />
                  <span>Create / Upload Department</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload the department logo and name to generate a futuristic glassmorphism department card. If no logo is provided, the university logo is automatically used as the default!
                </p>
              </div>
            </div>

            {deptMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  deptMessage.startsWith('Error')
                    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                }`}
              >
                {deptMessage}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Col */}
              <form onSubmit={handleCreateDepartment} className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Department of Physics"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department Code * (2-digit unique code)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Abbreviation / Short Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PHY"
                      value={deptAbbr}
                      onChange={(e) => setDeptAbbr(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department Logo (Optional - defaults to University Logo)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setDeptLogoFile(file || null);
                        if (file) {
                          setDeptLogoPreview(URL.createObjectURL(file));
                        } else {
                          setDeptLogoPreview('/nstu-logo.png');
                        }
                      }}
                      className="w-full p-2 text-xs rounded-xl glass-input text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500/20 file:text-cyan-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description for academic archive..."
                    value={deptDesc}
                    onChange={(e) => setDeptDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glass-glow disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Department & Generate Card</span>
                  </button>
                </div>
              </form>

              {/* Card Live Preview (Matching Image 2) */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-cyan-300 mb-2 uppercase tracking-wider">
                  Live Card Preview (Image 2 Style)
                </span>
                <div className="w-full max-w-[280px]">
                  <DepartmentCard
                    department={{
                      department_code: deptCode || '00',
                      name: deptName || 'Department Name',
                      abbreviation: deptAbbr || 'DEPT',
                      icon_url: deptLogoPreview,
                      description: deptDesc || 'Department archive preview card.',
                      total_courses: 0,
                      total_questions: 0,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Existing Departments Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Current Departments ({departments.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((d) => (
                <DepartmentCard key={d.id} department={d} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPER ADMIN SET DEPT ADMIN (Requirement 12) */}
      {activeTab === 'dept-admins' && isSuperAdmin && (
        <div className="space-y-8">
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-amber-500/40 bg-[#120d2b]/95 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Super Admin: Department Administrator Setup</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure department administrators with their EduMail and Roll. The Department Admin will verify their EduMail and can then log in using the password specified by Super Admin.
              </p>
            </div>

            {deptAdminMessage && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  deptAdminMessage.startsWith('Error')
                    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                }`}
              >
                {deptAdminMessage}
              </div>
            )}

            <form onSubmit={handleSetDeptAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Department *
                </label>
                <select
                  value={newAdminDeptId}
                  onChange={(e) => setNewAdminDeptId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.department_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dept Admin EduMail * (must be @student.nstu.edu.bd)
                </label>
                <input
                  type="email"
                  required
                  placeholder="roll@student.nstu.edu.bd"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Student Roll / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC0011222M"
                  value={newAdminRoll}
                  onChange={(e) => setNewAdminRoll(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password Given by Super Admin *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeptAdmin@2026"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ashraful Islam (IIT Admin)"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  Configure Department Admin
                </button>
              </div>
            </form>
          </div>

          {/* List of Configured Department Admins */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Assigned Department Administrators</h3>
            <div className="rounded-2xl glass-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">EduMail</th>
                    <th className="p-3.5">Roll</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {deptAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-bold text-white">
                        {adm.department?.name} ({adm.department?.department_code})
                      </td>
                      <td className="p-3.5 font-mono text-cyan-300">{adm.email}</td>
                      <td className="p-3.5 font-mono text-slate-300">{adm.roll || 'N/A'}</td>
                      <td className="p-3.5">
                        {adm.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified & Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Pending EduMail Verification</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {!adm.is_verified && (
                          <button
                            onClick={() => handleQuickVerifyAdmin(adm.email, adm.roll)}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold cursor-pointer text-[11px]"
                          >
                            Verify EduMail
                          </button>
                        )}
                        <a
                          href={`/verify-admin?email=${encodeURIComponent(adm.email)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px]"
                        >
                          <span>Verification Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Audit Trail & Historical Actions</span>
          </h2>

          <div className="rounded-2xl glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target Entity</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-cyan-300">{log.action}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.entity_type} ({log.entity_id.substring(0, 8)}...)
                      </td>
                      <td className="p-3.5">{log.actor?.display_name || log.actor?.email || 'System'}</td>
                      <td className="p-3.5">{log.department?.department_code || 'Global'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL ROLE ASSIGNMENT (Super Admin) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-purple-500/40 bg-[#100d28]/90 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Assign Global Administrator Roles</span>
            </h2>
            <p className="text-xs text-slate-400">
              Super Administrators can elevate registered accounts to global Super Admin status or assign scoped roles.
            </p>

            {assignMessage && (
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs">
                {assignMessage}
              </div>
            )}

            <form onSubmit={handleAssignRoleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.display_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Role</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                >
                  <option value="DEPARTMENT_ADMIN" className="bg-slate-900 text-white">
                    Department Admin (Scoped)
                  </option>
                  <option value="SUPER_ADMIN" className="bg-slate-900 text-white">
                    Super Admin (Global Authority)
                  </option>
                </select>
              </div>

              {assignRole === 'DEPARTMENT_ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Department</label>
                  <select
                    value={assignDeptId}
                    onChange={(e) => setAssignDeptId(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.name} ({d.department_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  Confirm Role Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY & CHANGE PASSWORD */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 bg-[#0a1824]/90 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Change Administrator Password
            </h2>
            <p className="text-xs text-slate-400">
              Update your account password. Changes take effect immediately.
            </p>
          </div>

          {pwdMsg.text && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                pwdMsg.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-500/20 border-red-500/30 text-red-200'
              }`}
            >
              {pwdMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs border-white/10 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs border-white/10 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPasswordVal}
                onChange={(e) => setConfirmPasswordVal(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs border-white/10 focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {pwdLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
