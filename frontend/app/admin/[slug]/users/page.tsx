"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdminNav } from "@/components/AdminNav";
import { Permission } from "@/app/lib/auth-types";
import { DEALERSHIPS } from "@/app/dealerships";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Home,
  Mail,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  status: "active" | "inactive";
  joinDate: string;
}

export default function DealershipUsersPage() {
  const { user } = useAuth();
  const params = useParams();
  const slug = params.slug as string;

  const dealership = DEALERSHIPS.find((d) => {
    const dealershipSlug = d.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w]/g, "");
    return dealershipSlug === slug;
  });

  // Extract dealership display name (Brand + State, without city)
  const getDealershipDisplayName = (name: string) => {
    const parts = name.split("–");
    if (parts.length > 1) {
      const brand = parts[0].trim();
      const location = parts[1].trim();
      const stateMatch = location.match(/([A-Z]{2})$/);
      const state = stateMatch ? stateMatch[1] : "";
      return `${brand} ${state}`.trim();
    }
    return name;
  };

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call to fetch users for this dealership
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setUsers([
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@dealership.com",
          role: "admin",
          status: "active",
          joinDate: "2024-01-15",
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah.johnson@dealership.com",
          role: "manager",
          status: "active",
          joinDate: "2024-02-20",
        },
        {
          id: "3",
          name: "Mike Davis",
          email: "mike.davis@dealership.com",
          role: "user",
          status: "active",
          joinDate: "2024-03-10",
        },
        {
          id: "4",
          name: "Lisa Anderson",
          email: "lisa.anderson@dealership.com",
          role: "user",
          status: "inactive",
          joinDate: "2024-01-05",
        },
      ]);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete API call
    setUsers(users.filter((u) => u.id !== userId));
  };

  if (!dealership) {
    return (
      <PermissionGuard
        permission={Permission.MANAGE_USERS}
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access the admin panel.</p>
            </div>
          </div>
        }
      >
        <AdminNav />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dealership Not Found</h2>
            <p className="text-gray-600 mb-4">The dealership you're looking for doesn't exist.</p>
            <Link href="/admin">
              <button className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                <Home className="mr-2 h-4 w-4" />
                Back to Admin Home
              </button>
            </Link>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard
      permission={Permission.MANAGE_USERS}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
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
                  <h1 className="text-3xl font-bold text-gray-900">
                    Manage Users - {getDealershipDisplayName(dealership.name)}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Add, edit, and remove user accounts and permissions
                  </p>
                </div>
                <Link href="/admin">
                  <button className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition">
                    Admin HOME
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add User Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add User
            </button>
          </div>

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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p>No users found</p>
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
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full mr-1.5 ${
                                u.status === "active" ? "bg-green-600" : "bg-gray-400"
                              }`}
                            ></span>
                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(u.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs font-medium"
                              title="Edit user"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-medium"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Modal (Placeholder) */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                      <option>User</option>
                      <option>Manager</option>
                      <option>Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
