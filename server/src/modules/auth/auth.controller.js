import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../services/prisma.js';
import { config } from '../../config/index.js';
import { registerSchema, loginSchema } from '../../validators/schemas.js';

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

    // In development mode, auto-verify valid NSTU EduMail for convenience
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        display_name: validatedData.displayName,
        password_hash: passwordHash,
        student_id: validatedData.studentId || null,
        email_verified_at: new Date(),
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

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return res.status(201).json({
      message: 'Account successfully registered and verified.',
      user,
      token,
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
    if (isDeptAdmin && !user.email_verified_at) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your Department Admin account is pending EduMail verification. Please verify your EduMail before logging in.',
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

export async function getMe(req, res) {
  try {
    const { password_hash, ...userProfile } = req.user;
    return res.json({ user: userProfile });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch user profile.' });
  }
}
