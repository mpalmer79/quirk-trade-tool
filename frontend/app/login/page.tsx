"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { UserRole } from "@/app/lib/auth-types";
import { ShieldCheck, User as UserIcon, Lock, LogIn, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Mock test users for development
const TEST_USERS = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@quirk.com",
    password: "admin123",
    role: UserRole.ADMIN,
    dealershipIds: [
      "quirk-buick-gmc-braintree",
      "quirk-buick-gmc-manchester",
      "quirk-chevy-braintree",
      "quirk-chevy-manchester",
      "quirk-chrysler-jeep-braintree",
      "quirk-cdjr-dorchester",
      "quirk-cdjr-marshfield",
      "quirk-ford-quincy",
      "genesis-braintree",
      "quirk-kia-braintree",
      "quirk-kia-manchester",
      "quirk-kia-marshfield",
      "quirk-mazda-quincy",
      "quirk-nissan-quincy",
      "quirk-subaru-braintree",
      "quirk-vw-braintree",
      "quirk-vw-manchester"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "gm-1",
    name: "General Manager",
    email: "gm@quirk.com",
    password: "gm123",
    role: UserRole.GENERAL_MANAGER,
    dealershipIds: [
      "quirk-chevy-braintree",
      "quirk-chevy-manchester",
      "quirk-ford-quincy"
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "gsm-1",
    name: "Sales Manager",
    email: "sales@quirk.com",
    password: "sales123",
    role: UserRole.GENERAL_SALES_MANAGER,
    dealershipIds: ["quirk-chevy-braintree"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to admin
  React.useEffect(() => {
    if (user) {
      router.push("/admin");
    }
  }, [user, router]);

  const handleQuickLogin = (testUser: typeof TEST_USERS[0]) => {
    setIsLoading(true);
    setError("");
    
    // Store user in localStorage (mock auth)
    localStorage.setItem("quirk_user", JSON.stringify(testUser));
    
    // Reload to trigger auth context
    setTimeout(() => {
      window.location.href = "/admin";
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Find matching test user
      const testUser = TEST_USERS.find(
        u => u.email === email && u.password === password
      );

      if (!testUser) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Store user in localStorage (mock auth)
      localStorage.setItem("quirk_user", JSON.stringify(testUser));
      
      // Redirect to admin
      setTimeout(() => {
        window.location.href = "/admin";
      }, 300);
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quirk Trade Tool</h1>
          <p className="text-gray-600 mt-2">Sign in to access the admin panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@quirk.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Login Options */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-gray-700">Quick Test Login</p>
            <p className="text-xs text-gray-500 mt-1">Click to login as different user types</p>
          </div>
          
          <div className="space-y-3">
            {TEST_USERS.map((testUser) => (
              <button
                key={testUser.id}
                onClick={() => handleQuickLogin(testUser)}
                disabled={isLoading}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testUser.name}</p>
                    <p className="text-sm text-gray-600">{testUser.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {testUser.role}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Password: <code className="bg-gray-100 px-1 py-0.5 rounded">{testUser.password}</code>
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Trade Tool
          </Link>
        </div>
      </div>
    </div>
  );
}
