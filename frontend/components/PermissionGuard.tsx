"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { hasPermission, hasAnyPermission, canAccessDealership } from "@/app/lib/permissions";
import { Permission } from "@/app/lib/auth-types";

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have all permissions. If false, any permission is enough.
  dealershipId?: string; // If provided, also checks dealership access
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  dealershipId,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { user } = useAuth();

  // Build permissions array
  const permsToCheck = permission ? [permission, ...permissions] : permissions;

  if (permsToCheck.length === 0) {
    console.warn("PermissionGuard: No permissions specified");
    return <>{children}</>;
  }

  // Check permissions
  let hasAccess = false;
  if (requireAll) {
    hasAccess = permsToCheck.every(perm => hasPermission(user, perm));
  } else {
    hasAccess = hasAnyPermission(user, permsToCheck);
  }

  // Also check dealership access if provided
  if (hasAccess && dealershipId) {
    hasAccess = canAccessDealership(user, dealershipId);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface DealershipGuardProps {
  dealershipId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on dealership access
 */
export function DealershipGuard({ dealershipId, fallback = null, children }: DealershipGuardProps) {
  const { user } = useAuth();

  const hasAccess = canAccessDealership(user, dealershipId);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard({ allowedRoles, fallback = null, children }: RoleGuardProps) {
  const { user } = useAuth();

  const hasAccess = user && allowedRoles.includes(user.role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook to check permission in component logic
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

/**
 * Hook to check dealership access in component logic
 */
export function useDealershipAccess(dealershipId: string): boolean {
  const { user } = useAuth();
  return canAccessDealership(user, dealershipId);
}
