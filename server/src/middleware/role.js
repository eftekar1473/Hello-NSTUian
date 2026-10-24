/**
 * Checks if user has an administrative role (either SUPER_ADMIN or DEPARTMENT_ADMIN)
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.admin_permissions || req.user.admin_permissions.length === 0) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to authorized administrators.',
    });
  }

  // Attach primary admin role and scope for convenient route handling
  const superAdminRole = req.user.admin_permissions.find((p) => p.role === 'SUPER_ADMIN');
  if (superAdminRole) {
    req.adminScope = {
      isSuperAdmin: true,
      departmentId: null,
    };
    return next();
  }

  const deptAdminRole = req.user.admin_permissions.find((p) => p.role === 'DEPARTMENT_ADMIN');
  if (deptAdminRole) {
    req.adminScope = {
      isSuperAdmin: false,
      departmentId: deptAdminRole.department_id,
    };
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'Valid administrator assignment required.',
  });
}

/**
 * Checks if user is a SUPER_ADMIN
 */
export function requireSuperAdmin(req, res, next) {
  const isSuper = req.user?.admin_permissions?.some((p) => p.role === 'SUPER_ADMIN');
  if (!isSuper) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Super Administrator authority required.',
    });
  }
  next();
}

/**
 * Validates department scope:
 * If user is SUPER_ADMIN -> allowed.
 * If user is DEPARTMENT_ADMIN -> target department must match assigned department.
 */
export function validateDepartmentScope(targetDepartmentId, req, res) {
  if (req.adminScope?.isSuperAdmin) {
    return true;
  }

  if (req.adminScope?.departmentId === targetDepartmentId) {
    return true;
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'You are not authorized to modify resources outside of your assigned department.',
  });
  return false;
}
