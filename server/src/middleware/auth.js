import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.js';

/**
 * Verify JWT and attach authenticated user to request
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please provide a valid bearer authorization token.',
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        admin_permissions: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User account not found.' });
    }

    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Account is currently ${user.account_status.toLowerCase()}. Please contact administration.`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token', message: 'Session expired or invalid token.' });
  }
}

/**
 * Ensures user has verified their official NSTU EduMail
 */
export function requireEduMail(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Please sign in first.' });
  }

  if (!req.user.email_verified_at) {
    return res.status(403).json({
      error: 'Unverified EduMail',
      message: 'You must verify your eligible NSTU EduMail account before submitting or requesting changes.',
    });
  }

  const domain = req.user.email.split('@')[1]?.toLowerCase();
  const isEligibleDomain = config.allowedEduMailDomains.some((d) => domain === d || domain?.endsWith(`.${d}`));

  if (!isEligibleDomain) {
    return res.status(403).json({
      error: 'Institutional Verification Required',
      message: `Your email must belong to an authorized NSTU institutional domain (${config.allowedEduMailDomains.join(', ')}).`,
    });
  }

  next();
}

/**
 * Optional token extraction (for public endpoints that can personalize if signed in)
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { admin_permissions: true },
    });
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}
