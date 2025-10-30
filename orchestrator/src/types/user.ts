import { z } from 'zod';

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  GENERAL_MANAGER = 'general_manager',
  GENERAL_SALES_MANAGER = 'general_sales_manager',
  SALES_MANAGER = 'sales_manager'
}

// Permissions
export enum Permission {
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ALL_DEALERSHIPS = 'manage_all_dealerships',
  VIEW_SYSTEM_SETTINGS = 'view_system_settings',
  
  // Dealership access
  VIEW_MULTIPLE_DEALERSHIPS = 'view_multiple_dealerships',
  VIEW_SINGLE_DEALERSHIP = 'view_single_dealership',
  
  // User management
  ADD_SALES_MANAGERS = 'add_sales_managers',
  REMOVE_SALES_MANAGERS = 'remove_sales_managers',
  
  // Trade appraisal
  CREATE_APPRAISAL = 'create_appraisal',
  VIEW_APPRAISAL_HISTORY = 'view_appraisal_history',
  EDIT_APPRAISAL = 'edit_appraisal',
  DELETE_APPRAISAL = 'delete_appraisal',
  
  // Reports
  VIEW_DEALERSHIP_REPORTS = 'view_dealership_reports',
  VIEW_ALL_REPORTS = 'view_all_reports'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ALL_DEALERSHIPS,
    Permission.VIEW_SYSTEM_SETTINGS,
    Permission.VIEW_MULTIPLE_DEALERSHIPS,
    Permission.ADD_SALES_MANAGERS,
    Permission.REMOVE_SALES_MANAGERS,
    Permission.CREATE_APPRAISAL,
    Permission.VIEW_APPRAISAL_HISTORY,
    Permission.EDIT_APPRAISAL,
    Permission.DELETE_APPRAISAL,
    Permission.VIEW_ALL_REPORTS,
    Permission.VIEW_DEALERSHIP_REPORTS
  ],
  [UserRole.GENERAL_MANAGER]: [
    Permission.VIEW_MULTIPLE_DEALERSHIPS,
    Permission.CREATE_APPRAISAL,
    Permission.VIEW_APPRAISAL_HISTORY,
    Permission.EDIT_APPRAISAL,
    Permission.VIEW_DEALERSHIP_REPORTS
  ],
  [UserRole.GENERAL_SALES_MANAGER]: [
    Permission.VIEW_SINGLE_DEALERSHIP,
    Permission.ADD_SALES_MANAGERS,
    Permission.REMOVE_SALES_MANAGERS,
    Permission.CREATE_APPRAISAL,
    Permission.VIEW_APPRAISAL_HISTORY,
    Permission.EDIT_APPRAISAL,
    Permission.VIEW_DEALERSHIP_REPORTS
  ],
  [UserRole.SALES_MANAGER]: [
    Permission.VIEW_SINGLE_DEALERSHIP,
    Permission.CREATE_APPRAISAL,
    Permission.VIEW_APPRAISAL_HISTORY
  ]
};

// User Type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  dealershipIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  dealershipIds: string[];
  iat?: number;
  exp?: number;
}

// Zod Schemas
export const UserRoleSchema = z.nativeEnum(UserRole);

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: UserRoleSchema,
  dealershipIds: z.array(z.string()).min(1, 'At least one dealership required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const UpdateUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  role: UserRoleSchema.optional(),
  dealershipIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
