import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import type { User, UserRole, Permission } from '../types/user.js';
import { ROLE_PERMISSIONS } from '../types/user.js';

const log = pino();

export class AuthorizationService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if user can access a specific dealership
   */
  canAccessDealership(user: User, dealershipId: string): boolean {
    if (user.role === 'admin') return true;
    return user.dealershipIds.includes(dealershipId);
  }

  /**
   * Check if user has any of the given permissions
   */
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
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

      if (!this.hasPermission(req.user, permission)) {
        log.warn({
          userId: req.user.userId,
          requiredPermission: permission,
          userRole: req.user.role,
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

      const dealershipId = req.body[dealershipIdParam] || req.params[dealershipIdParam];

      if (!dealershipId) {
        return res.status(400).json({ error: 'dealership_id_required' });
      }

      if (!this.canAccessDealership(req.user, dealershipId)) {
        log.warn({
          userId: req.user.userId,
          requestedDealership: dealershipId,
          accessibleDealerships: req.user.dealershipIds,
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

      if (!roles.includes(req.user.role)) {
        log.warn({
          userId: req.user.userId,
          userRole: req.user.role,
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
