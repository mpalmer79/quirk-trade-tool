import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import type { UserRole, Permission, JwtPayload } from '../types/user.js';
import { ROLE_PERMISSIONS } from '../types/user.js';

const log = pino();

/**
 * Type guard to check if we have the minimum user info needed for authorization
 * Works with both full User objects and JwtPayload from tokens
 */
interface AuthorizableUser {
  role: UserRole;
  dealershipIds: string[];
}

export class AuthorizationService {
  /**
   * Check if user has a specific permission
   * Accepts both User and JwtPayload types
   */
  hasPermission(user: AuthorizableUser, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if user can access a specific dealership
   * Accepts both User and JwtPayload types
   */
  canAccessDealership(user: AuthorizableUser, dealershipId: string): boolean {
    if (user.role === 'admin') return true;
    return user.dealershipIds.includes(dealershipId);
  }

  /**
   * Check if user has any of the given permissions
   * Accepts both User and JwtPayload types
   */
  hasAnyPermission(user: AuthorizableUser, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(user, p));
  }

  /**
   * Middleware factory: require a specific permission
   */
  requirePermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      // Type assertion: req.user from JWT middleware has the shape of JwtPayload
      const user = req.user as JwtPayload;

      if (!this.hasPermission(user, permission)) {
        log.warn({
          userId: user.userId,
          requiredPermission: permission,
          userRole: user.role,
          message: 'Permission denied'
        });
        return res.status(403).json({ error: 'insufficient_permissions' });
      }

      next();
    };
  }

  /**
   * Middleware factory: require dealership access
   */
  requireDealershipAccess(dealershipIdParam: string = 'storeId') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      // Type assertion: req.user from JWT middleware has the shape of JwtPayload
      const user = req.user as JwtPayload;

      const dealershipId = req.body[dealershipIdParam] || req.params[dealershipIdParam];

      if (!dealershipId) {
        return res.status(400).json({ error: 'dealership_id_required' });
      }

      if (!this.canAccessDealership(user, dealershipId)) {
        log.warn({
          userId: user.userId,
          requestedDealership: dealershipId,
          accessibleDealerships: user.dealershipIds,
          message: 'Dealership access denied'
        });
        return res.status(403).json({ error: 'dealership_access_denied' });
      }

      next();
    };
  }

  /**
   * Middleware factory: require any of the given roles
   */
  requireRole(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      // Type assertion: req.user from JWT middleware has the shape of JwtPayload
      const user = req.user as JwtPayload;

      if (!roles.includes(user.role)) {
        log.warn({
          userId: user.userId,
          userRole: user.role,
          requiredRoles: roles,
          message: 'Role check failed'
        });
        return res.status(403).json({ error: 'insufficient_role' });
      }

      next();
    };
  }
}

export const authorizationService = new AuthorizationService();
