import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth-service';
import { AuthorizationService } from '../../src/services/authorization-service';
import type { User } from '../../src/types/user';
import { UserRole as UserRoleEnum, Permission } from '../../src/types/user';

// ============================================================================
// AUTH SERVICE TESTS
// ============================================================================

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('password hashing', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const password = 'mySecurePassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'mySecurePassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should handle same password differently each time (salt)', async () => {
      const password = 'mySecurePassword123!';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await authService.verifyPassword(password, hash1)).toBe(true);
      expect(await authService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('token generation', () => {
    it('should generate access and refresh tokens', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@quirkcars.com',
        name: 'Test User',
        role: UserRoleEnum.SALES_MANAGER,
        dealershipIds: ['quirk-chevy-manchester'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { accessToken, refreshToken } = authService.generateTokens(user);

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(accessToken).not.toBe(refreshToken);
      expect(accessToken.split('.').length).toBe(3);
      expect(refreshToken.split('.').length).toBe(3);
    });

    it('should encode user data in access token', () => {
      const user: User = {
        id: 'user-456',
        email: 'manager@quirkcars.com',
        name: 'Manager User',
        role: UserRoleEnum.GENERAL_MANAGER,
        dealershipIds: ['quirk-chevy-manchester', 'quirk-ford-quincy'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { accessToken } = authService.generateTokens(user);
      const payload = authService.verifyToken(accessToken);

      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(user.id);
      expect(payload!.email).toBe(user.email);
      expect(payload!.role).toBe(user.role);
      expect(payload!.dealershipIds).toEqual(user.dealershipIds);
    });
  });

  describe('token verification', () => {
    it('should verify valid token', () => {
      const user: User = {
        id: 'user-789',
        email: 'admin@quirkcars.com',
        name: 'Test User',
        role: UserRoleEnum.ADMIN,
        dealershipIds: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { accessToken } = authService.generateTokens(user);
      const payload = authService.verifyToken(accessToken);

      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(user.id);
    });

    it('should reject invalid token', () => {
      const payload = authService.verifyToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should reject malformed token', () => {
      const payload = authService.verifyToken('not-a-jwt');
      expect(payload).toBeNull();
    });
  });
});

// ============================================================================
// AUTHORIZATION SERVICE TESTS
// ============================================================================

describe('AuthorizationService', () => {
  let authService: AuthorizationService;

  beforeEach(() => {
    authService = new AuthorizationService();
  });

  describe('permission checking', () => {
    it('should grant admin all permissions', () => {
      const admin: User = {
        id: 'admin-1',
        email: 'admin@quirkcars.com',
        name: 'Admin',
        role: UserRoleEnum.ADMIN,
        dealershipIds: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(authService.hasPermission(admin, Permission.MANAGE_USERS)).toBe(true);
      expect(authService.hasPermission(admin, Permission.CREATE_APPRAISAL)).toBe(true);
      expect(authService.hasPermission(admin, Permission.DELETE_APPRAISAL)).toBe(true);
      expect(authService.hasPermission(admin, Permission.VIEW_ALL_REPORTS)).toBe(true);
    });

    it('should grant sales manager limited permissions', () => {
      const salesMgr: User = {
        id: 'sales-1',
        email: 'sales@quirkcars.com',
        name: 'Sales Manager',
        role: UserRoleEnum.SALES_MANAGER,
        dealershipIds: ['quirk-chevy-manchester'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(authService.hasPermission(salesMgr, Permission.CREATE_APPRAISAL)).toBe(true);
      expect(authService.hasPermission(salesMgr, Permission.VIEW_APPRAISAL_HISTORY)).toBe(true);
      expect(authService.hasPermission(salesMgr, Permission.MANAGE_USERS)).toBe(false);
      expect(authService.hasPermission(salesMgr, Permission.DELETE_APPRAISAL)).toBe(false);
    });

    it('should grant general manager medium permissions', () => {
      const gm: User = {
        id: 'gm-1',
        email: 'gm@quirkcars.com',
        name: 'General Manager',
        role: UserRoleEnum.GENERAL_MANAGER,
        dealershipIds: ['quirk-chevy-manchester', 'quirk-ford-quincy'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(authService.hasPermission(gm, Permission.CREATE_APPRAISAL)).toBe(true);
      expect(authService.hasPermission(gm, Permission.EDIT_APPRAISAL)).toBe(true);
      expect(authService.hasPermission(gm, Permission.VIEW_DEALERSHIP_REPORTS)).toBe(true);
      expect(authService.hasPermission(gm, Permission.MANAGE_USERS)).toBe(false);
    });
  });

  describe('dealership access', () => {
    it('should allow admin access to any dealership', () => {
      const admin: User = {
        id: 'admin-1',
        email: 'admin@quirkcars.com',
        name: 'Admin',
        role: UserRoleEnum.ADMIN,
        dealershipIds: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(authService.canAccessDealership(admin, 'quirk-chevy-manchester')).toBe(true);
      expect(authService.canAccessDealership(admin, 'any-dealership')).toBe(true);
    });

    it('should restrict non-admin to assigned dealerships', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@quirkcars.com',
        name: 'User',
        role: UserRoleEnum.SALES_MANAGER,
        dealershipIds: ['quirk-chevy-manchester', 'quirk-ford-quincy'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(authService.canAccessDealership(user, 'quirk-chevy-manchester')).toBe(true);
      expect(authService.canAccessDealership(user, 'quirk-ford-quincy')).toBe(true);
      expect(authService.canAccessDealership(user, 'quirk-kia-marshfield')).toBe(false);
    });
  });

  describe('multiple permissions', () => {
    it('should check if user has any of given permissions', () => {
      const gm: User = {
        id: 'gm-1',
        email: 'gm@quirkcars.com',
        name: 'General Manager',
        role: UserRoleEnum.GENERAL_MANAGER,
        dealershipIds: ['quirk-chevy-manchester'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(
        authService.hasAnyPermission(gm, [
          Permission.MANAGE_USERS,
          Permission.CREATE_APPRAISAL
        ])
      ).toBe(true);

      expect(
        authService.hasAnyPermission(gm, [
          Permission.MANAGE_USERS,
          Permission.DELETE_APPRAISAL
        ])
      ).toBe(false);
    });
  });
});
