"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { hasPermission } from "@/app/lib/permissions";
import { Permission } from "@/app/lib/auth-types";
import { Home, LayoutDashboard, Users, LogOut } from "lucide-react";
import { navigateWithBasePath } from "@/utils/basePath";

export function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      navigateWithBasePath("/login");
    }
  }, [user]);

  const canAccessAdmin = user && hasPermission(user, Permission.MANAGE_USERS);

  const handleLogout = async () => {
    await logout();
    navigateWithBasePath("/login");
  };

  const navItems = [
    {
      name: "Trade Tool",
      href: "/",
      icon: Home,
      show: true,
    },
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      show: canAccessAdmin,
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      show: canAccessAdmin,
    },
  ];

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                Quirk Trade Tool
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map(
              (item) =>
                item.show && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.name}</span>
                  </Link>
                )
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
