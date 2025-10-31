"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdminNav } from "@/components/AdminNav";
import { Permission } from "@/app/lib/auth-types";
import { DEALERSHIPS } from "@/lib/dealerships";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Mail,
  Shield,
} from "lucide-react";

type Role =
  | "admin"
  | "general_manager"
  | "general_sales_manager"
  | "sales_manager";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  dealershipIds: string[];      // store dealership IDs for non-global users
  isGlobalAdmin?: boolean;      // true only if Admin with global access
  status: "active" | "inactive";
  joinDate: string;
}

const GLOBAL_ADMIN_ID = "GLOBAL_ADMIN";

export default function GlobalUsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: Role;
    password: string;
    dealershipIds: string[];
    isGlobalAdmin: boolean;     // tracks “Global Admin (All Dealerships)”
  }>({
    name: "",
    email: "",
    role: "sales_manager",
    password: "",
    dealershipIds: [],
    isGlobalAdmin: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const byName = (name: string) =>
    DEALERSHIPS.find((d) => d.name === name)?.id ?? "";

  const loadUsers = async () => {
    try {
      const savedUsers = localStorage.getItem("quirk_users");
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUsers([
          {
            id: "1",
            name: "John Admin",
            email: "jadmin@quirkcars.com",
            role: "admin",
            dealershipIds: [],
            isGlobalAdmin: true, // demo global admin
            status: "active",
            joinDate: "2024-01-15",
          },
          {
            id: "2",
            name: "Sarah Manager",
            email: "smanager@quirkcars.com",
            role: "general_manager",
            dealershipIds: [
              byName("Quirk Chevrolet – Braintree, MA"),
              byName("Quirk Buick GMC – Braintree, MA (Braintree, MA)"),
            ].filter(Boolean),
            status: "active",
            joinDate: "2024-02-20",
          },
          {
            id: "3",
            name: "Mike Sales",
            email: "msales@quirkcars.com",
            role: "general_sales_manager",
            dealershipIds: [byName("Quirk Chevrolet – Braintree, MA")].filter(
              Boolean
            ),
            status: "active",
            joinDate: "2024-03-10",
          },
          {
            id: "4",
            name: "Lisa Anderson",
            email: "landerson@quirkcars.com",
            role: "sales_manager",
            dealershipIds: [byName("Quirk Buick GMC – Manchester, NH")].filter(
              Boolean
            ),
            status: "inactive",
            joinDate: "2024-01-05",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate email from first initial + last name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    setFormData((prev) => ({ ...prev, name: fullName }));

    if (fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        const firstInitial = parts[0][0].toLowerCase();
        const lastName = parts.slice(1).join("").toLowerCase();
        setFormData((prev) => ({
          ...prev,
          email: `${firstInitial}${lastName}@quirkcars.com`,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          email: `${parts[0].toLowerCase()}@quirkcars.com`,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, email: "" }));
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem("quirk_users", JSON.stringify(updated));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      name: "",
      email: "",
      role: "sales_manager",
      password: "",
      dealershipIds: [],
      isGlobalAdmin: false,
    });
  };

  const handleAddUser = async () => {
    // Validation:
    // GM: >=1 dealership
    // Admin: global OR exactly one dealership
    // Others: exactly one dealership
    const roleIsGM = formData.role === "general_manager";
    const roleIsAdmin = formData.role === "admin";

    const hasDealershipRequirement =
      roleIsGM
        ? formData.dealershipIds.length > 0
        : roleIsAdmin
        ? formData.isGlobalAdmin || formData.dealershipIds.length === 1
        : formData.dealershipIds.length === 1;

    if (!formData.name || !formData.email || !hasDealershipRequirement) return;

    const newUser: User = {
      id: String(users.length + 1),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      dealershipIds: formData.isGlobalAdmin ? [] : formData.dealershipIds,
      isGlobalAdmin: roleIsAdmin ? formData.isGlobalAdmin : false,
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem("quirk_users", JSON.stringify(updated));
    handleCloseModal();
  };

  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Admin",
      general_manager: "General Manager",
      general_sales_manager: "General Sales Manager",
      sales_manager: "Sales Manager",
    };
    return roleMap[role] || role;
  };

  const roleIsGM = formData.role === "general_manager";
  const roleIsAdmin = formData.role === "admin";

  const canSubmit = Boolean(
    formData.name &&
      formData.email &&
      (roleIsGM
        ? formData.dealershipIds.length > 0
        : roleIsAdmin
        ? formData.isGlobalAdmin || formData.dealershipIds.length === 1
        : formData.dealershipIds.length === 1)
  );

  const filteredUsers =
    filterRole === "all"
      ? users
      : users.filter((u) => u.role === (filterRole as Role));

  const namesFromIds = (ids: string[]) =>
    ids
      .map((id) => DEALERSHIPS.find((d) => d.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const displayDealerships = (u: User) =>
    u.isGlobalAdmin ? "All Dealerships (Global Admin)" : namesFromIds(u.dealershipIds);

  return (
    <PermissionGuard
      permission={Permission.MANAGE_USERS}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access the admin panel.
            </p>
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
                    User Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Add, edit, and remove user accounts and permissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter + Add */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Role:
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="general_manager">General Manager</option>
                <option value="general_sales_manager">
                  General Sales Manager
                </option>
                <option value="sales_manager">Sales Manager</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New User
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
                      Dealerships
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
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
                          <span className="ml-2 text-gray-600">
                            Loading users...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p>No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {u.name}
                        </td>
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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {displayDealerships(u)}
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
                                u.status === "active"
                                  ? "bg-green-600"
                                  : "bg-gray-400"
                              }`}
                            />
                            {u.status.charAt(0).toUpperCase() +
                              u.status.slice(1)}
                          </span>
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
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Add New User
                </h2>

                <div className="space-y-4 mb-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="jsmith@quirkcars.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-populated from first initial + last name
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: e.target.value as Role,
                          dealershipIds: [],
                          isGlobalAdmin: false,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="admin">Admin</option>
                      <option value="general_manager">General Manager</option>
                      <option value="general_sales_manager">
                        General Sales Manager
                      </option>
                      <option value="sales_manager">Sales Manager</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {roleIsGM
                        ? "General Managers can be assigned to multiple dealerships."
                        : roleIsAdmin
                        ? "Admins can be Global Admin or tied to a single dealership."
                        : "Select the user’s primary dealership."}
                    </p>
                  </div>

                  {/* Dealership(s) - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dealership{roleIsGM ? "s" : ""} *
                    </label>

                    {roleIsGM ? (
                      // GM: multi-select (checkboxes)
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto rounded border p-3">
                        {DEALERSHIPS.map((d) => {
                          const checked = formData.dealershipIds.includes(d.id);
                          return (
                            <label
                              key={d.id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setFormData((prev) => {
                                    const set = new Set(prev.dealershipIds);
                                    if (checked) set.delete(d.id);
                                    else set.add(d.id);
                                    return {
                                      ...prev,
                                      dealershipIds: Array.from(set),
                                    };
                                  })
                                }
                                className="h-4 w-4"
                              />
                              <span>{d.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      // Others (Admin & non-GM roles): single-select
                      <select
                        value={
                          formData.isGlobalAdmin
                            ? GLOBAL_ADMIN_ID
                            : formData.dealershipIds[0] ?? ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === GLOBAL_ADMIN_ID) {
                            setFormData((prev) => ({
                              ...prev,
                              isGlobalAdmin: true,
                              dealershipIds: [],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              isGlobalAdmin: false,
                              dealershipIds: val ? [val] : [],
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Select a dealership</option>
                        {/* Only show Global Admin option when Role = Admin */}
                        {roleIsAdmin && (
                          <option value={GLOBAL_ADMIN_ID}>
                            Global Admin (All Dealerships)
                          </option>
                        )}
                        {DEALERSHIPS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Password (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="User will be prompted to create"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Leave the password field blank. Users
                    will create their own password upon first login with the
                    following requirements: lowercase, uppercase, at least 1
                    number, and 1 special character.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={!canSubmit}
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
