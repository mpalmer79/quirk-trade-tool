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
  role: "admin" | "general_manager" | "general_sales_manager" | "sales_manager";
  status: "active" | "inactive";
  joinDate: string;
}

export default function DealershipUsersPage() {
  const { user: _user } = useAuth();
  const params = useParams();
  const slug = params.slug as string;

  const dealership = DEALERSHIPS.find((d) => {
    const dealershipSlug = d.name.toLowerCase().replace(/\s+/g, "").replace(/[^\w]/g, "");
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

  // Auto-generate email from first initial + full last name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    setFormData({ ...formData, name: fullName });

    // Extract first initial and full last name, then auto-populate email
    if (fullName.trim()) {
      const nameParts = fullName.trim().split(" ");
      if (nameParts.length >= 2) {
        const firstInitial = nameParts[0][0].toLowerCase();
        // Remove apostrophes and hyphens from last name parts
        const lastName = nameParts.slice(1).join("").replace(/['-]/g, "").toLowerCase();
        setFormData((prev) => ({
          ...prev,
          email: `${firstInitial}${lastName}@quirkcars.com`,
        }));
      } else {
        // If only one name, use the full name
        const firstName = nameParts[0].replace(/['-]/g, "").toLowerCase();
        setFormData((prev) => ({
          ...prev,
          email: `${firstName}@quirkcars.com`,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        email: "",
      }));
    }
  };

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sales_manager",
    password: "",
  });

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
          role: "general_manager",
          status: "active",
          joinDate: "2024-02-20",
        },
        {
          id: "3",
          name: "Mike Davis",
          email: "mike.davis@dealership.com",
          role: "general_sales_manager",
          status: "active",
          joinDate: "2024-03-10",
        },
        {
          id: "4",
          name: "Lisa Anderson",
          email: "lisa.anderson@dealership.com",
          role: "sales_manager",
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

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete API call
    setUsers(users.filter((u) => u.id !== userId));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ name: "", email: "", role: "sales_manager", password: "" });
  };

  const handleAddUser = async () => {
    // TODO: Implement add user API call
    if (formData.name && formData.email) {
      const newUser: User = {
        id: String(users.length + 1),
        name: formData.name,
        email: formData.email,
        role: (formData.role as "admin" | "general_manager" | "general_sales_manager" | "sales_manager") || "sales_manager",
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
      };
      setUsers([...users, newUser]);
      handleCloseModal();
    }
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
              <p className="text-gray-600 mb-4">You don&apos;t have permission to manage users.</p>
            </div>
          </div>
        }
      >
        <AdminNav />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dealership Not Found</h2>
            <p className="text-gray-600 mb-4">The dealership you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <Home className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission={Permission.MANAGE_USERS}>
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {getDealershipDisplayName(dealership.name)}
              </h1>
            </div>
            <p className="text-gray-600">User Management</p>
          </div>

          {/* Action Bar */}
          <div className="mb-6 flex justify-end">
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
                            {formatRoleName(u.role)}
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

          {/* Add User Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="john@quirkcars.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-populated from first initial + last name
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="admin">Admin</option>
                      <option value="general_manager">General Manager</option>
                      <option value="general_sales_manager">General Sales Manager</option>
                      <option value="sales_manager">Sales Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="User will be prompted to create"
                    />
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Leave the password field blank. Users will create their own password upon first login with the following requirements: lowercase, uppercase, at least 1 number, and 1 special character.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={!formData.name || !formData.email}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
