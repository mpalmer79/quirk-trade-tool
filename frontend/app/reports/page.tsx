"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AdminNav } from "@/components/AdminNav";
import { Permission } from "@/app/lib/auth-types";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "valuation" | "analytics" | "activity";
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "valuation" | "analytics" | "activity">("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // TODO: Replace with actual API call to fetch reports
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setReports([
        {
          id: "1",
          title: "Monthly Trade Valuations Report",
          description: "Comprehensive trade-in valuations for the current month",
          date: "2024-10-31",
          type: "valuation",
        },
        {
          id: "2",
          title: "Sales Performance Analytics",
          description: "Detailed analytics on sales metrics and dealership performance",
          date: "2024-10-30",
          type: "analytics",
        },
        {
          id: "3",
          title: "User Activity Report",
          description: "System activity and user engagement tracking",
          date: "2024-10-29",
          type: "activity",
        },
        {
          id: "4",
          title: "Quarterly Business Review",
          description: "High-level overview of business metrics and trends",
          date: "2024-10-15",
          type: "analytics",
        },
        {
          id: "5",
          title: "Trade Valuation Summary",
          description: "Summary of all trade valuations processed",
          date: "2024-10-10",
          type: "valuation",
        },
      ]);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = filterType === "all" ? reports : reports.filter((r) => r.type === filterType);

  const getReportIcon = (type: string) => {
    switch (type) {
      case "valuation":
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
      case "analytics":
        return <BarChart3 className="h-5 w-5 text-green-600" />;
      case "activity":
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getReportBadgeColor = (type: string) => {
    switch (type) {
      case "valuation":
        return "bg-blue-100 text-blue-800";
      case "analytics":
        return "bg-green-100 text-green-800";
      case "activity":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <PermissionGuard
      permission={Permission.MANAGE_USERS}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access reports.</p>
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
                  <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Access trade valuation reports and analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Buttons */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilterType("valuation")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === "valuation"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Valuations
            </button>
            <button
              onClick={() => setFilterType("analytics")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === "analytics"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setFilterType("activity")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === "activity"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Activity
            </button>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading reports...</span>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600">No reports available</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{getReportIcon(report.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getReportBadgeColor(
                              report.type
                            )}`}
                          >
                            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(report.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="ml-4 p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
