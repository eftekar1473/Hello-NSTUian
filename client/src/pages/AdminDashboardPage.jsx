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
  Edit3,
  Trash2,
  X,
  Search,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Check,
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
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedAdminId, setCopiedAdminId] = useState(null);

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

  // Department Edit State
  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAbbr, setEditAbbr] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState('/nstu-logo.png');
  const [editMessage, setEditMessage] = useState('');
  const [adminDeptSearch, setAdminDeptSearch] = useState('');

  // Super Admin: Set Dept Admin State
  const [newAdminDeptId, setNewAdminDeptId] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRoll, setNewAdminRoll] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [deptAdminMessage, setDeptAdminMessage] = useState('');

  // Course Management State (Dept Admin & Super Admin)
  const [coursesList, setCoursesList] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseDeptId, setSelectedCourseDeptId] = useState('');
  const [selectedCourseSemester, setSelectedCourseSemester] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseMessage, setCourseMessage] = useState({ type: '', text: '' });

  // New Course Form State
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState('1');
  const [newCourseCredit, setNewCourseCredit] = useState('3.0');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Edit Course Modal State
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseSemester, setEditCourseSemester] = useState('1');
  const [editCourseCredit, setEditCourseCredit] = useState('3.0');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseMessage, setEditCourseMessage] = useState('');

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

  const loadCourses = async (deptId) => {
    if (!deptId) return;
    setCoursesLoading(true);
    try {
      const res = await api.getCourses({ departmentId: deptId });
      setCoursesList(res.courses || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

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

      const allDepts = depts.departments || [];
      const userDeptId = dash.assignedDepartment?.id || user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN')?.department_id;
      const scopedDepts = isSuperAdmin ? allDepts : allDepts.filter((d) => d.id === userDeptId);
      setDepartments(scopedDepts);

      const targetDeptId = isSuperAdmin ? (selectedCourseDeptId || allDepts[0]?.id || '') : (userDeptId || '');
      setSelectedCourseDeptId(targetDeptId);
      if (targetDeptId) {
        await loadCourses(targetDeptId);
      }

      if (isSuperAdmin && allDepts.length > 0) {
        setAssignDeptId(allDepts[0].id);
        setNewAdminDeptId(allDepts[0].id);
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

  // Start Edit Department
  const startEditDepartment = (dept) => {
    setEditingDept(dept);
    setEditName(dept.name || '');
    setEditCode(dept.department_code || '');
    setEditAbbr(dept.abbreviation || '');
    setEditDesc(dept.description || '');
    setEditLogoFile(null);
    setEditLogoPreview(dept.icon_url || '/nstu-logo.png');
    setEditMessage('');
  };

  // Update Department Handler
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    setActionLoading(true);
    setEditMessage('');
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('department_code', editCode.trim());
      if (editAbbr) formData.append('abbreviation', editAbbr.trim());
      if (editDesc) formData.append('description', editDesc.trim());
      if (editLogoFile) {
        formData.append('logo', editLogoFile);
      } else if (editLogoPreview) {
        formData.append('icon_url', editLogoPreview);
      }

      await api.updateDepartment(editingDept.id, formData);
      setEditMessage('Department updated successfully!');
      setTimeout(() => {
        setEditingDept(null);
      }, 1000);
      await loadData();
    } catch (err) {
      setEditMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Department Handler
  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate department: "${dept.name}" (${dept.department_code})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.deleteDepartment(dept.id);
      alert(res.message || 'Department removed successfully.');
      await loadData();
    } catch (err) {
      alert(`Failed to delete department: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Course Management Handlers (Requirements 4 & 5)
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setCourseMessage({ type: '', text: '' });
    try {
      const userDeptId = statsData?.assignedDepartment?.id || user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN')?.department_id;
      const deptToUse = isSuperAdmin ? selectedCourseDeptId : userDeptId;
      if (!deptToUse) {
        throw new Error('Target department is required.');
      }
      await api.createCourse({
        departmentId: deptToUse,
        semesterNumber: parseInt(newCourseSemester, 10),
        courseCode: newCourseCode.trim(),
        courseTitle: newCourseTitle.trim(),
        credit: parseFloat(newCourseCredit) || 3.0,
        description: newCourseDesc.trim() || undefined,
      });
      setCourseMessage({ type: 'success', text: `Course "${newCourseCode}" created successfully!` });
      setNewCourseCode('');
      setNewCourseTitle('');
      setNewCourseDesc('');
      await loadCourses(deptToUse);
      await loadData();
    } catch (err) {
      setCourseMessage({ type: 'error', text: err.message || 'Failed to create course.' });
    } finally {
      setActionLoading(false);
    }
  };

  const startEditCourse = (course) => {
    setEditingCourse(course);
    setEditCourseCode(course.course_code || '');
    setEditCourseTitle(course.course_title || '');
    setEditCourseSemester(course.semester_number?.toString() || '1');
    setEditCourseCredit(course.credit?.toString() || '3.0');
    setEditCourseDesc(course.description || '');
    setEditCourseMessage('');
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setActionLoading(true);
    setEditCourseMessage('');
    try {
      const userDeptId = statsData?.assignedDepartment?.id || user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN')?.department_id;
      const deptToUse = isSuperAdmin ? selectedCourseDeptId : userDeptId;
      await api.updateCourse(editingCourse.id, {
        courseCode: editCourseCode.trim(),
        courseTitle: editCourseTitle.trim(),
        semesterNumber: parseInt(editCourseSemester, 10),
        credit: parseFloat(editCourseCredit) || 3.0,
        description: editCourseDesc.trim() || undefined,
      });
      setEditCourseMessage('Course updated successfully!');
      setTimeout(() => setEditingCourse(null), 800);
      await loadCourses(deptToUse);
      await loadData();
    } catch (err) {
      setEditCourseMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete course "${course.course_code} - ${course.course_title}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const userDeptId = statsData?.assignedDepartment?.id || user?.admin_permissions?.find((p) => p.role === 'DEPARTMENT_ADMIN')?.department_id;
      const deptToUse = isSuperAdmin ? selectedCourseDeptId : userDeptId;
      const res = await api.deleteCourse(course.id);
      alert(res.message || 'Course deleted successfully.');
      await loadCourses(deptToUse);
      await loadData();
    } catch (err) {
      alert(`Failed to delete course: ${err.message}`);
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
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
              activeTab === 'courses' ? 'bg-cyan-500 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manage Courses ({coursesList.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                activeTab === 'departments' ? 'bg-blue-600 text-white shadow-glass-glow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manage Departments
            </button>
          )}
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
          {isSuperAdmin ? (
            <>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Departments</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{departments.length}</p>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Department Courses</span>
              <p className="text-2xl font-bold text-cyan-300 mt-1">{coursesList.length}</p>
            </>
          )}
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
                        Department: {up.department?.name} • Filename:{' '}
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

      {/* TAB 3: MANAGE COURSES (Requirements 4, 5, 6) */}
      {activeTab === 'courses' && (
        <div className="space-y-8">
          {/* Top Panel: Header & Department Selector */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-cyan-500/30 bg-[#0a142e]/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <span>Academic Course Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create, update, or remove academic courses for each semester curriculum.
                </p>
              </div>

              {/* Department Context Badge or Selector */}
              {isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Department:</span>
                  <select
                    value={selectedCourseDeptId}
                    onChange={(e) => {
                      setSelectedCourseDeptId(e.target.value);
                      loadCourses(e.target.value);
                    }}
                    className="p-2 rounded-xl glass-input text-white text-xs bg-slate-900 border border-cyan-400/40"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.name} ({d.abbreviation || d.department_code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    🏛️ {statsData?.assignedDepartment?.name} ({statsData?.assignedDepartment?.department_code})
                  </span>
                </div>
              )}
            </div>

            {/* Course Creation Feedback Alert */}
            {courseMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  courseMessage.type === 'error'
                    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                }`}
              >
                {courseMessage.text}
              </div>
            )}

            {/* Add Course Form */}
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IIT 1101 or CSE 2101"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structured Programming Language"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Academic Semester *
                  </label>
                  <select
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs bg-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Credit Value
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="3.0"
                    value={newCourseCredit}
                    onChange={(e) => setNewCourseCredit(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief curriculum overview or course syllabus notes..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glass-glow disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Course to Curriculum</span>
                </button>
              </div>
            </form>
          </div>

          {/* Courses Directory Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Courses Directory ({coursesList.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a semester or search to manage and edit existing courses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by code or title..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Semester Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              <span className="text-[11px] text-slate-400 uppercase font-mono mr-1">Semester:</span>
              <button
                onClick={() => setSelectedCourseSemester('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedCourseSemester === 'ALL'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'glass-pill text-slate-300 hover:text-white'
                }`}
              >
                All Semesters
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedCourseSemester(s.toString())}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedCourseSemester === s.toString()
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'glass-pill text-slate-300 hover:text-white'
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            {coursesLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <span>Loading courses...</span>
              </div>
            ) : coursesList.filter((c) => {
                if (selectedCourseSemester !== 'ALL' && c.semester_number !== parseInt(selectedCourseSemester, 10)) {
                  return false;
                }
                if (courseSearch) {
                  const q = courseSearch.toLowerCase();
                  const matchCode = c.course_code?.toLowerCase().includes(q);
                  const matchTitle = c.course_title?.toLowerCase().includes(q);
                  if (!matchCode && !matchTitle) return false;
                }
                return true;
              }).length === 0 ? (
              <div className="p-12 text-center rounded-3xl glass-card text-slate-400 text-xs">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <span>No courses found for this criteria. Use the form above to add one.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesList
                  .filter((c) => {
                    if (selectedCourseSemester !== 'ALL' && c.semester_number !== parseInt(selectedCourseSemester, 10)) {
                      return false;
                    }
                    if (courseSearch) {
                      const q = courseSearch.toLowerCase();
                      const matchCode = c.course_code?.toLowerCase().includes(q);
                      const matchTitle = c.course_title?.toLowerCase().includes(q);
                      if (!matchCode && !matchTitle) return false;
                    }
                    return true;
                  })
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl glass-card flex flex-col justify-between hover:border-cyan-400/50 transition-all space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                            {c.course_code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                            Semester {c.semester_number || 'N/A'}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">
                          {c.course_title}
                        </h4>
                        {c.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {c.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <span>{c.credit || 3.0} Credits</span>
                          <span>•</span>
                          <span>{c.total_questions || 0} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditCourse(c)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                            title="Edit Course"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Edit Course Modal */}
          {editingCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 border border-cyan-400/40 bg-[#0a142e]/95 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-cyan-400" />
                    <span>Edit Course: {editingCourse.course_code}</span>
                  </h3>
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editCourseMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs ${
                      editCourseMessage.startsWith('Error')
                        ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                        : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    {editCourseMessage}
                  </div>
                )}

                <form onSubmit={handleUpdateCourse} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCourseCode}
                      onChange={(e) => setEditCourseCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCourseTitle}
                      onChange={(e) => setEditCourseTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Academic Semester *
                      </label>
                      <select
                        value={editCourseSemester}
                        onChange={(e) => setEditCourseSemester(e.target.value)}
                        className="w-full p-2.5 rounded-xl glass-input text-white text-xs bg-slate-900"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s} className="bg-slate-900 text-white">
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Credit Value
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={editCourseCredit}
                        onChange={(e) => setEditCourseCredit(e.target.value)}
                        className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Course Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={editCourseDesc}
                      onChange={(e) => setEditCourseDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCourse(null)}
                      className="px-4 py-2 rounded-xl glass-pill text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glass-glow disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE DEPARTMENTS (Super Admin Only) */}
      {activeTab === 'departments' && isSuperAdmin && (
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

          {/* Existing Departments Grid with Edit / Delete / Search */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Current Departments ({departments.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click the edit or delete icon on any card to update its name, code, or logo.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, code, or abbr..."
                  value={adminDeptSearch}
                  onChange={(e) => setAdminDeptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                />
              </div>
            </div>

            {/* Grid matching mobile responsive (2 cols x 2 rows = 4 in 1 screen) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {departments
                .filter((d) =>
                  `${d.name} ${d.abbreviation || ''} ${d.department_code}`
                    .toLowerCase()
                    .includes(adminDeptSearch.toLowerCase())
                )
                .map((d) => (
                  <DepartmentCard
                    key={d.id}
                    department={d}
                    onEdit={isSuperAdmin ? startEditDepartment : undefined}
                    onDelete={isSuperAdmin ? handleDeleteDepartment : undefined}
                  />
                ))}
            </div>
          </div>

          {/* Edit Department Modal */}
          {editingDept && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="relative w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-8 border border-cyan-400/40 bg-[#0a142e]/95 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-white">
                      Edit Department: {editingDept.name} (Code: {editingDept.department_code})
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingDept(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      editMessage.startsWith('Error')
                        ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                        : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    {editMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Edit Form */}
                  <form onSubmit={handleUpdateDepartment} className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Department Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Department Code * (2-digit unique code)
                        </label>
                        <input
                          type="text"
                          required
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="w-full p-2.5 rounded-xl glass-input text-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Abbreviation / Acronym
                        </label>
                        <input
                          type="text"
                          value={editAbbr}
                          onChange={(e) => setEditAbbr(e.target.value)}
                          className="w-full p-2.5 rounded-xl glass-input text-white text-xs uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Replace Logo (Image File)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setEditLogoFile(file || null);
                          if (file) {
                            setEditLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full p-2 text-xs rounded-xl glass-input text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-500/20 file:text-cyan-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Logo URL (Alternative to file upload)
                      </label>
                      <input
                        type="text"
                        value={editLogoPreview}
                        onChange={(e) => {
                          setEditLogoPreview(e.target.value);
                          setEditLogoFile(null);
                        }}
                        className="w-full p-2 text-xs rounded-xl glass-input text-slate-300 font-mono"
                        placeholder="/nstu-logo.png or https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Department Description
                      </label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-glass-glow disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {actionLoading ? 'Saving...' : 'Save Department Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDept(null)}
                        className="px-4 py-2.5 rounded-xl glass-pill text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  {/* Live Preview */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-cyan-300 mb-2 uppercase tracking-wider">
                      Live Preview
                    </span>
                    <div className="w-full max-w-[240px]">
                      <DepartmentCard
                        department={{
                          department_code: editCode || '00',
                          name: editName || 'Department Name',
                          abbreviation: editAbbr || 'DEPT',
                          icon_url: editLogoPreview,
                          description: editDesc || 'Department archive preview card.',
                          total_courses: editingDept.total_courses || 0,
                          total_questions: editingDept.total_questions || 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                    <th className="p-3.5">Configured Password</th>
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
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-900/60 px-2 py-1 rounded-lg border border-amber-500/20">
                          <span className="text-amber-300 font-bold select-all tracking-wider">
                            {visiblePasswords[adm.id] ? (adm.password || 'NstuAdmin@2026') : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setVisiblePasswords((prev) => ({ ...prev, [adm.id]: !prev[adm.id] }))
                            }
                            title={visiblePasswords[adm.id] ? 'Hide password' : 'Show password'}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {visiblePasswords[adm.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(adm.password || 'NstuAdmin@2026');
                              setCopiedAdminId(adm.id);
                              setTimeout(() => setCopiedAdminId(null), 2000);
                            }}
                            title="Copy password to clipboard"
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedAdminId === adm.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
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
