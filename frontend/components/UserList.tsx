"use client";

import React, { useState } from "react";
import { User, UserRole, getRoleDisplayName } from "@/app/lib/auth-types";
import { useAuth } from "@/app/lib/auth-context";
import { canManageUser, hasPermission } from "@/app/lib/permissions";
import { Permission } from "@/app/lib/auth-types";

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  dealerships: { id: string; name: string }[];
}

export function UserList({ users, onEditUser, onDeleteUser, dealerships }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const canManageUsers = currentUser && hasPermission(currentUser, Permission.MANAGE_USERS);

  const getDealershipNames = (dealershipIds: string[]) => {
    return dealershipIds
      .map(id => dealerships.find(d => d.id === id)?.name || "Unknown")
      .join(", ");
  };

  const filteredUsers = filterRole === "all" 
    ? users 
    : users.filter(u => u.role === filterRole);

  const canManage = (targetUser: User) => {
    return currentUser && canManageUser(currentUser, targetUser);
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="role-filter" className="font-medium">
          Filter by Role:
        </label>
        <select
          id="role-filter"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Roles</option>
          {Object.values(UserRole).map(role => (
            <option key={role} value={role}>
              {getRoleDisplayName(role)}
            </option>
          ))}
        </select>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dealerships
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {canManageUsers && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {getDealershipNames(user.dealershipIds)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {canManageUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {canManage(user) && (
                        <>
                          <button
                            onClick={() => onEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found matching the selected filter.
        </div>
      )}
    </div>
  );
}
