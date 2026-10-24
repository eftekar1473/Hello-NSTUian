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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin, isSuperAdmin, isDeptAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads', 'corrections', 'audit', 'users'
  const [statsData, setStatsData] = useState(null);
  const [uploadsQueue, setUploadsQueue] = useState([]);
  const [correctionsQueue, setCorrectionsQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Role Assignment State (Super Admin)
  const [targetUserId, setTargetUserId] = useState('');
  const [assignRole, setAssignRole] = useState('DEPARTMENT_ADMIN');
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignMessage, setAssignMessage] = useState('');

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

      if (isSuperAdmin) {
        const usersRes = await api.getAdminUsers();
        setAdminUsers(usersRes.users || []);
        if (usersRes.users?.length > 0) {
          setTargetUserId(usersRes.users[0].id);
        }
        if (depts.departments?.length > 0) {
          setAssignDeptId(depts.departments[0].id);
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
              Role Assignments
            </button>
          )}
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
          <p className="text-2xl font-bold text-purple-400 mt-1">{statsData?.stats?.totalDepartments ?? 0}</p>
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

      {/* TAB 3: AUDIT TRAIL */}
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

      {/* TAB 4: SUPER ADMIN ROLE ASSIGNMENT */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-6 border border-purple-500/40 bg-[#100d28]/90 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Assign Administrator Roles</span>
            </h2>
            <p className="text-xs text-slate-400">
              Super Administrators can designate Department Administrators to scoped departments or elevate
              accounts to global Super Admin status.
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
    </div>
  );
}
