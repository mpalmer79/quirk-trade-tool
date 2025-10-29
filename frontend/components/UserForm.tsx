"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  UserRole,
  CreateUserInput,
  CreateUserSchema,
  getRoleDisplayName
} from "@/app/lib/auth-types";
import { useAuth } from "@/app/lib/auth-context";
import { getAssignableRoles, validateDealershipAssignments } from "@/app/lib/permissions";

interface UserFormProps {
  user?: User; // If provided, form is in edit mode
  dealerships: { id: string; name: string }[];
  onSubmit: (data: CreateUserInput | Partial<User>) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ user, dealerships, onSubmit, onCancel }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const isEditMode = !!user;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || UserRole.SALES_MANAGER,
    dealershipIds: user?.dealershipIds || [],
    isActive: user?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignableRoles = getAssignableRoles(currentUser);

  // Update dealership selection when role changes
  useEffect(() => {
    const validation = validateDealershipAssignments(formData.role, formData.dealershipIds);
    
    // Auto-adjust dealerships based on role requirements
    if (formData.role === UserRole.ADMIN && formData.dealershipIds.length === 0) {
      // Admin typically has all dealerships
      setFormData(prev => ({ ...prev, dealershipIds: dealerships.map(d => d.id) }));
    } else if (
      (formData.role === UserRole.GENERAL_SALES_MANAGER || formData.role === UserRole.SALES_MANAGER) &&
      formData.dealershipIds.length > 1
    ) {
      // These roles should have only one dealership
      setFormData(prev => ({ ...prev, dealershipIds: [prev.dealershipIds[0]] }));
    }
  }, [formData.role, dealerships]);

  const handleDealershipToggle = (dealershipId: string) => {
    setFormData(prev => {
      const isSelected = prev.dealershipIds.includes(dealershipId);
      
      // Handle single-selection roles
      if (prev.role === UserRole.GENERAL_SALES_MANAGER || prev.role === UserRole.SALES_MANAGER) {
        return { ...prev, dealershipIds: isSelected ? [] : [dealershipId] };
      }
      
      // Handle multi-selection roles
      if (isSelected) {
        return { ...prev, dealershipIds: prev.dealershipIds.filter(id => id !== dealershipId) };
      } else {
        return { ...prev, dealershipIds: [...prev.dealershipIds, dealershipId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate dealership assignments
      const dealershipValidation = validateDealershipAssignments(
        formData.role,
        formData.dealershipIds
      );
      
      if (!dealershipValidation.valid) {
        setErrors({ dealerships: dealershipValidation.error! });
        setIsSubmitting(false);
        return;
      }

      // Validate with Zod schema
      if (!isEditMode) {
        const validation = CreateUserSchema.safeParse(formData);
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach(err => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }
      }

      await onSubmit(isEditMode ? { ...formData, id: user.id } : formData);
    } catch (error: any) {
      setErrors({ submit: error.message || "An error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSelectMultipleDealerships = 
    formData.role === UserRole.ADMIN || formData.role === UserRole.GENERAL_MANAGER;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold">
        {isEditMode ? `Edit User: ${user.name}` : "Create New User"}
      </h2>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Password (only for new users) */}
      {!isEditMode && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            minLength={8}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
        </div>
      )}

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role *
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {assignableRoles.map(role => (
            <option key={role} value={role}>
              {getRoleDisplayName(role)}
            </option>
          ))}
        </select>
        {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
      </div>

      {/* Dealerships */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dealerships * {canSelectMultipleDealerships ? "(Select multiple)" : "(Select one)"}
        </label>
        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
          {dealerships.map(dealership => (
            <label key={dealership.id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded">
              <input
                type={canSelectMultipleDealerships ? "checkbox" : "radio"}
                name="dealerships"
                checked={formData.dealershipIds.includes(dealership.id)}
                onChange={() => handleDealershipToggle(dealership.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{dealership.name}</span>
            </label>
          ))}
        </div>
        {errors.dealerships && <p className="mt-1 text-sm text-red-600">{errors.dealerships}</p>}
        {errors.dealershipIds && <p className="mt-1 text-sm text-red-600">{errors.dealershipIds}</p>}
      </div>

      {/* Active Status (edit mode only) */}
      {isEditMode && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active User
          </label>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEditMode ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}
