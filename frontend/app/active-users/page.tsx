"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdminNav } from "@/components/AdminNav";
import { Permission } from "@/app/lib/auth-types";
import {
  Users,
  AlertCircle,
  Mail,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "general_manager" | "general_sales_manager" | "sales_manager";
  dealership: string;
  lastActive: string;
}

export default function ActiveUsersPage() {
  const { user: _user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveUsers();
  }, []);

  const loadActiveUsers = async () => {
    try {
      // TODO: Replace with actual API call to fetch active users
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setUsers([
        {
          id: "1",
          name: "John Smith",
          email: "jsmith@quirkcars.com",
          role: "admin",
          dealership: "Quirk Buick GMC – Manchester, NH",
          lastActive: "2024-10-31T14:30:00",
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sjohnson@quirkcars.com",
          role: "general_manager",
          dealership: "Quirk Chevrolet – Braintree, MA",
          lastActive: "2024-10-31T13:45:00",
        },
        {
          id: "3",
          name: "Mike Davis",
          email: "mdavis@quirkcars.com",
          role: "general_sales_manager",
          dealership: "Quirk Buick GMC – Manchester, NH",
          lastActive: "2024-10-31T12:15:00",
        },
        {
          id: "4",
          name: "Lisa Anderson",
          email: "landerson@quirkcars.com",
          role: "sales_manager",
          dealership: "Quirk Chevrolet – Manchester, NH",
          lastActive: "2024-10-31T11:20:00",
        },
        {
          id: "5",
          name: "Steve O'Brien",
          email: "sobrien@quirkcars.com",
          role: "sales_manager",
          dealership: "Quirk Buick GMC – Braintree, MA",
          lastActive: "2024-10-31T10:05:00",
        },
        {
          id: "6",
          name: "Jessica Martinez",
          email: "jmartinez@quirkcars.com",
          role: "general_sales_manager",
          dealership: "Quirk Chrysler Jeep – Braintree, MA",
          lastActive: "2024-10-31T09:30:00",
        },
      ]);
    } catch (error) {
      console.error("Failed to load active users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format role name for display
  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Admin",
      general_manager: "General Manager",
      general_sales_manager: "General Sales Manager",
      sales_manager: "Sales Manager",
    };
    return roleMap[role] || role;
  };

  // Format last active time
  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <PermissionGuard
      permission={Permission.MANAGE_USERS}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      }
    >
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Active Users</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Viewing all currently active users across dealerships
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Dealership
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading active users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p>No active users found</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {u.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Shield className="h-3 w-3 mr-1" />
                            {formatRoleName(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.dealership}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="h-2 w-2 rounded-full bg-green-600 mr-1.5"></span>
                            {formatLastActive(u.lastActive)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          {!isLoading && users.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Showing {users.length} active users</p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
