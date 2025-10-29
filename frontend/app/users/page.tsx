"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { User, CreateUserInput, Permission } from "@/app/lib/auth-types";
import { PermissionGuard } from "@/components/PermissionGuard";
import { UserList } from "@/components/UserList";
import { UserForm } from "@/components/UserForm";
import { DEALERSHIPS } from "@/app/dealerships";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      // For demo purposes, load mock data
      setUsers(getMockUsers());
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (data: CreateUserInput) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to create user");

      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to update user");

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(undefined);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission={Permission.MANAGE_USERS}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-600">
            You don't have permission to access this page.
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          {!showForm && (
            <button
              onClick={() => {
                setEditingUser(undefined);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add New User
            </button>
          )}
        </div>

        {showForm ? (
          <UserForm
            user={editingUser}
            dealerships={DEALERSHIPS}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            onCancel={handleCancelForm}
          />
        ) : (
          <UserList
            users={users}
            dealerships={DEALERSHIPS}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

// Mock data for demo purposes
function getMockUsers(): User[] {
  return [
    {
      id: "1",
      email: "admin@quirkauto.com",
      name: "John Admin",
      role: "admin" as any,
      dealershipIds: DEALERSHIPS.map(d => d.id),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      isActive: true
    },
    {
      id: "2",
      email: "gm@quirkauto.com",
      name: "Sarah Manager",
      role: "general_manager" as any,
      dealershipIds: ["quirk-chevy-braintree", "quirk-chevy-manchester"],
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      isActive: true
    },
    {
      id: "3",
      email: "gsm@quirkauto.com",
      name: "Mike Sales",
      role: "general_sales_manager" as any,
      dealershipIds: ["quirk-chevy-braintree"],
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date("2024-03-01"),
      isActive: true
    }
  ];
}
