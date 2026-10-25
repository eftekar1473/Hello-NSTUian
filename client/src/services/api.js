const API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${API_URL}/api/v1`;

export function getDownloadUrl(questionId) {
  return `${API_BASE}/questions/${questionId}/download`;
}

export function getAuthToken() {
  return localStorage.getItem('hello_nstu_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('hello_nstu_token', token);
  } else {
    localStorage.removeItem('hello_nstu_token');
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem('hello_nstu_user');
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('hello_nstu_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('hello_nstu_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to JSON if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP error ${res.status}`);
  }

  return data;
}

export const api = {
  // Public
  getDepartments: () => request('/departments'),
  getDepartmentById: (id) => request(`/departments/${id}`),
  getDepartmentSessions: (id) => request(`/departments/${id}/sessions`),
  getQuestionsByCourse: (courseId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/courses/${courseId}/questions${qs ? `?${qs}` : ''}`);
  },
  getQuestionById: (id) => request(`/questions/${id}`),
  search: (q, params = {}) => {
    const qs = new URLSearchParams({ q, ...params }).toString();
    return request(`/search?${qs}`);
  },

  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),

  // Contributions
  submitUpload: (formData) => request('/uploads', { method: 'POST', body: formData }),
  getMyUploads: () => request('/uploads/my'),
  submitCorrection: (formData) => request('/correction-requests', { method: 'POST', body: formData }),
  getMyCorrections: () => request('/correction-requests/my'),

  // Department Management (Admin)
  createDepartment: (formData) => request('/departments', { method: 'POST', body: formData }),
  updateDepartment: (id, formData) => request(`/departments/${id}`, { method: 'PATCH', body: formData }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getReviewableUploads: () => request('/admin/uploads'),
  reviewUpload: (id, body) => request(`/admin/uploads/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
  getReviewableCorrections: () => request('/admin/correction-requests'),
  reviewCorrection: (id, body) => request(`/admin/correction-requests/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
  archiveQuestion: (id) => request(`/admin/questions/${id}/archive`, { method: 'POST' }),
  getAuditLogs: () => request('/admin/audit-logs'),
  getAdminUsers: () => request('/admin/users'),
  assignRole: (body) => request('/admin/assign-role', { method: 'POST', body: JSON.stringify(body) }),

  // Department Admin Management (Super Admin)
  createDeptAdmin: (body) => request('/admin/dept-admins', { method: 'POST', body: JSON.stringify(body) }),
  getDeptAdmins: () => request('/admin/dept-admins'),
  verifyDeptAdmin: (body) => request('/admin/verify-dept-admin', { method: 'POST', body: JSON.stringify(body) }),
};
