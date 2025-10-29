import { User, UserRole, Permission, ROLE_PERMISSIONS } from "./auth-types";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.isActive) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user can access a specific dealership
 */
export function canAccessDealership(user: User | null, dealershipId: string): boolean {
  if (!user || !user.isActive) return false;
  
  // Admin has access to all dealerships
  if (user.role === UserRole.ADMIN) return true;
  
  // Check if dealership is in user's assigned dealerships
  return user.dealershipIds.includes(dealershipId);
}

/**
 * Get all dealerships a user can access
 */
export function getAccessibleDealerships(user: User | null, allDealershipIds: string[]): string[] {
  if (!user || !user.isActive) return [];
  
  // Admin has access to all
  if (user.role === UserRole.ADMIN) return allDealershipIds;
  
  // Return user's assigned dealerships
  return user.dealershipIds;
}

/**
 * Check if user can manage another user based on roles
 */
export function canManageUser(currentUser: User | null, targetUser: User): boolean {
  if (!currentUser || !currentUser.isActive) return false;
  
  // Admin can manage everyone
  if (currentUser.role === UserRole.ADMIN) return true;
  
  // General Sales Manager can only manage Sales Managers in their dealership
  if (currentUser.role === UserRole.GENERAL_SALES_MANAGER) {
    if (targetUser.role !== UserRole.SALES_MANAGER) return false;
    
    // Check if they share at least one dealership
    return targetUser.dealershipIds.some(id => 
      currentUser.dealershipIds.includes(id)
    );
  }
  
  return false;
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(currentUser: User | null): UserRole[] {
  if (!currentUser || !currentUser.isActive) return [];
  
  switch (currentUser.role) {
    case UserRole.ADMIN:
      return [
        UserRole.ADMIN,
        UserRole.GENERAL_MANAGER,
        UserRole.GENERAL_SALES_MANAGER,
        UserRole.SALES_MANAGER
      ];
    case UserRole.GENERAL_SALES_MANAGER:
      return [UserRole.SALES_MANAGER];
    default:
      return [];
  }
}

/**
 * Validate dealership assignments based on role
 */
export function validateDealershipAssignments(
  role: UserRole,
  dealershipIds: string[]
): { valid: boolean; error?: string } {
  // Admin can have any dealerships (typically all)
  if (role === UserRole.ADMIN) {
    return { valid: true };
  }
  
  // General Manager can have multiple dealerships
  if (role === UserRole.GENERAL_MANAGER) {
    if (dealershipIds.length === 0) {
      return { valid: false, error: "General Manager must be assigned at least one dealership" };
    }
    return { valid: true };
  }
  
  // General Sales Manager and Sales Manager should have exactly one dealership
  if (role === UserRole.GENERAL_SALES_MANAGER || role === UserRole.SALES_MANAGER) {
    if (dealershipIds.length !== 1) {
      return { valid: false, error: `${role} must be assigned to exactly one dealership` };
    }
    return { valid: true };
  }
  
  return { valid: false, error: "Invalid role" };
}

/**
 * Check if user can create users with specific role
 */
export function canCreateRole(currentUser: User | null, targetRole: UserRole): boolean {
  const assignableRoles = getAssignableRoles(currentUser);
  return assignableRoles.includes(targetRole);
}
