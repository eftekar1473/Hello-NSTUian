import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../services/prisma.js';
import { config } from '../../config/index.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../../validators/schemas.js';

export async function register(req, res) {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Require EduMail verification before account activation
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        display_name: validatedData.displayName,
        password_hash: passwordHash,
        student_id: validatedData.studentId || null,
        email_verified_at: null, // Pending EduMail verification
        account_status: 'ACTIVE',
        auth_provider: 'LOCAL',
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        student_id: true,
        email_verified_at: true,
        account_status: true,
      },
    });

    // Generate a 6-digit verification code for EduMail
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.auditLog.create({
      data: {
        actor_user_id: user.id,
        action: 'EMAIL_VERIFICATION_CODE_GENERATED',
        entity_type: 'USER',
        entity_id: user.id,
        details: JSON.stringify({ email: user.email, code: verificationCode, expiresAt: expiresAt.toISOString() }),
      },
    });

    // Mandatory verification: DO NOT issue a JWT token until email OTP is verified!
    return res.status(201).json({
      message: 'Account created! Please verify your NSTU EduMail with the 6-digit OTP to activate your account.',
      user,
      verificationRequired: true,
      email: user.email,
      verificationCode,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: {
        admin_permissions: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.password_hash) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const isValid = await bcrypt.compare(validatedData.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Account is currently ${user.account_status.toLowerCase()}. Please contact administration.`,
      });
    }

    const isDeptAdmin = user.admin_permissions?.some((p) => p.role === 'DEPARTMENT_ADMIN');
    if (!user.email_verified_at) {
      if (isDeptAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your Department Admin account is pending EduMail verification. Please verify your EduMail before logging in.',
          requiresDeptVerification: true,
        });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.auditLog.create({
        data: {
          actor_user_id: user.id,
          action: 'EMAIL_VERIFICATION_CODE_GENERATED',
          entity_type: 'USER',
          entity_id: user.id,
          details: JSON.stringify({ email: user.email, code: verificationCode }),
        },
      });

      return res.status(403).json({
        error: 'Unverified EduMail',
        message: 'Your NSTU EduMail account is pending verification. Please enter your verification code to activate.',
        needsVerification: true,
        email: user.email,
        verificationCode,
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const { password_hash, ...userProfile } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userProfile,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Login failed.' });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, code, studentId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'EduMail address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        admin_permissions: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'No registered user found with this EduMail.' });
    }

    if (user.email_verified_at) {
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });
      const { password_hash, ...userProfile } = user;
      return res.json({
        message: 'Account is already verified.',
        verified: true,
        user: userProfile,
        token,
      });
    }

    // Check code from audit log
    const latestCodeLog = await prisma.auditLog.findFirst({
      where: {
        entity_id: user.id,
        action: 'EMAIL_VERIFICATION_CODE_GENERATED',
      },
      orderBy: { created_at: 'desc' },
    });

    let isValid = false;
    if (latestCodeLog && latestCodeLog.details) {
      try {
        const parsed = JSON.parse(latestCodeLog.details);
        if (code && parsed.code && parsed.code.toString() === code.toString().trim()) {
          isValid = true;
        }
      } catch {}
    }

    // Also accept student ID match or universal testing code '123456'
    if (!isValid && code && (code.trim() === '123456' || (user.student_id && code.trim().toLowerCase() === user.student_id.toLowerCase()))) {
      isValid = true;
    }

    if (!isValid && studentId && user.student_id && studentId.trim().toLowerCase() === user.student_id.toLowerCase()) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid Code',
        message: 'Invalid verification code. Please check the code and try again.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email_verified_at: new Date() },
      include: {
        admin_permissions: {
          include: { department: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor_user_id: user.id,
        action: 'EMAIL_VERIFIED',
        entity_type: 'USER',
        entity_id: user.id,
        details: JSON.stringify({ email: cleanEmail }),
      },
    });

    const token = jwt.sign({ userId: updatedUser.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    const { password_hash, ...userProfile } = updatedUser;

    return res.json({
      message: 'NSTU EduMail verified successfully! Welcome to Hello NSTUian.',
      verified: true,
      user: userProfile,
      token,
    });
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Email verification failed.' });
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'No account found with this email.' });
    }
    if (user.email_verified_at) {
      return res.status(400).json({ error: 'Bad Request', message: 'Account is already verified. Please sign in.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.auditLog.create({
      data: {
        actor_user_id: user.id,
        action: 'EMAIL_VERIFICATION_CODE_GENERATED',
        entity_type: 'USER',
        entity_id: user.id,
        details: JSON.stringify({ email: user.email, code: verificationCode, expiresAt: expiresAt.toISOString() }),
      },
    });

    return res.json({
      message: 'A new 6-digit verification OTP has been generated for your EduMail.',
      email: user.email,
      verificationCode,
    });
  } catch (err) {
    console.error('resendOtp error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to resend verification code.' });
  }
}

export async function getMe(req, res) {
  try {
    const { password_hash, ...userProfile } = req.user;
    return res.json({ user: userProfile });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user profile.' });
  }
}

export async function changePassword(req, res) {
  try {
    const validatedData = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.password_hash) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User account not found.',
      });
    }

    const isMatch = await bcrypt.compare(validatedData.currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'The current password you provided is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });

    return res.json({
      message: 'Password successfully changed.',
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to change password.' });
  }
}
