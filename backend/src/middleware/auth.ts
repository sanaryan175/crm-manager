import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../config/db';

// Augment Express Request globally
declare global {
  namespace Express {
    interface Request {
      user?:        TokenPayload;
      permissions?: Set<string>;
    }
  }
}

export interface AuthenticatedRequest extends Request {}

// ─── authenticate ─────────────────────────────────────────────────────────────
// Verifies JWT and attaches user payload + live permissions to req.
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  let decoded: TokenPayload;

  try {
    decoded = verifyToken(token);
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  // Verify the user still exists and is active in this organization
  const user = await prisma.user.findFirst({
    where: {
      id:             decoded.userId,
      organizationId: decoded.organizationId,
      isActive:       true,
    },
  });

  if (!user) {
    return next(new UnauthorizedError('User not found or deactivated'));
  }

  // Load live permissions from DB (always fresh — never cache in JWT)
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: decoded.roleId },
    include: { permission: { select: { name: true } } },
  });

  req.user = decoded;
  req.permissions = new Set(rolePermissions.map((rp) => rp.permission.name));
  next();
};

// ─── requirePermission ────────────────────────────────────────────────────────
// Usage: router.post('/', authenticate, requirePermission('deal.create'), handler)
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (!req.permissions?.has(permission)) {
      return next(
        new ForbiddenError(`Missing permission: ${permission}`)
      );
    }
    next();
  };
};

// ─── requireRole ──────────────────────────────────────────────────────────────
// Usage: requireRole('owner') — for hard ownership checks like org deletion
export const requireRole = (...roleNames: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (!roleNames.includes(req.user.roleName)) {
      return next(new ForbiddenError('Insufficient role for this action'));
    }
    next();
  };
};

// ─── requireOwner ─────────────────────────────────────────────────────────────
// Restricts to the organization owner only
export const requireOwner = requireRole('owner');
