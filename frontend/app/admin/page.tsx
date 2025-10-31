"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdminNav } from "@/components/AdminNav";
import { Permission } from "@/app/lib/auth-types";
import { DEALERSHIPS } from "@/app/dealerships";
import Link from "next/link";
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Settings,
  ShieldCheck,
  BarChart3,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDealerships: number;
  recentActivity: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDealerships: DEALERSHIPS.length,
    recentActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulate loading stats
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setStats({
        totalUsers: 12,
        activeUsers: 10,
        totalDealerships: DEALERSHIPS.length,
        recentActivity: 45,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDealershipSlug = (dealership: typeof DEALERSHIPS[0]) => {
    return dealership.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w]/g, "");
  };

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
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Welcome back, {user?.name}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="blue"
              isLoading={isLoading}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={Activity}
              color="green"
              isLoading={isLoading}
            />
            <StatCard
              title="Dealerships"
              value={stats.totalDealerships}
              icon={Building2}
              color="purple"
              isLoading={isLoading}
            />
            <StatCard
              title="Recent Activity"
              value={stats.recentActivity}
              icon={TrendingUp}
              color="orange"
              isLoading={isLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ActionCard
                title="Manage Users"
                description="Add, edit, or remove user accounts and permissions"
                icon={Users}
                href="/users"
                color="blue"
              />
              <ActionCard
                title="View Reports"
                description="Access trade valuation reports and analytics"
                icon={BarChart3}
                href="/reports"
                color="green"
                disabled
              />
              <ActionCard
                title="System Settings"
                description="Configure system-wide settings and preferences"
                icon={Settings}
                href="/settings"
                color="purple"
                disabled
              />
            </div>
          </div>

          {/* Dealership Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Dealership Network</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEALERSHIPS.map((dealership) => {
                  const slug = getDealershipSlug(dealership);
                  return (
                    <Link
                      key={dealership.id}
                      href={`/admin/${slug}`}
                    >
                      <div
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer border border-transparent"
                      >
                        <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {dealership.name}
                          </p>
                          <p className="text-xs text-gray-500">{dealership.brand}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity (Placeholder) */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm">Activity logs will appear here</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
  isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: "blue" | "green" | "purple";
  disabled?: boolean;
}

function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  disabled = false,
}: ActionCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    green: "bg-green-50 text-green-600 group-hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  };

  const content = (
    <div
      className={`group bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:border-gray-300 cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {!disabled && (
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      {disabled && (
        <span className="mt-3 inline-block text-xs text-gray-500 font-medium">
          Coming Soon
        </span>
      )}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
