"use client";

import React from "react";
import { TrendingUp, DollarSign, BarChart3, AlertCircle } from "lucide-react";
import type { PricingAnalysis, VehicleListing } from "@/hooks/useVehicleListings";

interface WholesalePricingProps {
  pricing?: PricingAnalysis;
  listings?: VehicleListing[];
  loading: boolean;
  error?: string | null;
  vehicleTitle: string;
}

export function WholesalePricing({
  pricing,
  listings,
  loading,
  error,
  vehicleTitle,
}: WholesalePricingProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Pricing Error</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">Analyzing market listings...</p>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Market Analysis Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Market Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Market Price</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(pricing.averagePrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Comparable Listings</p>
            <p className="text-2xl font-bold text-gray-900">
              {pricing.listingCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-gray-600 mb-1">Low</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(pricing.lowestPrice)}
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-gray-600 mb-1">Average</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(pricing.averagePrice)}
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-gray-600 mb-1">High</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(pricing.highestPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Valuation Estimates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wholesale Estimate */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Wholesale Value</h4>
          </div>
          <div className="text-3xl font-bold text-green-700 mb-2">
            {formatCurrency(pricing.wholesaleEstimate)}
          </div>
          <p className="text-xs text-green-700 bg-green-100 rounded px-2 py-1 inline-block">
            15% dealer markup
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Estimated trade-in value for dealership wholesale
          </p>
        </div>

        {/* Trade-In Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Trade-In Value</h4>
          </div>
          <div className="text-3xl font-bold text-blue-700 mb-2">
            {formatCurrency(pricing.tradeInEstimate)}
          </div>
          <p className="text-xs text-blue-700 bg-blue-100 rounded px-2 py-1 inline-block">
            20% dealer markup
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Value for customer trade-in transactions
          </p>
        </div>
      </div>

      {/* Price Range Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Price Distribution</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Price Range</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(pricing.priceRange.min)} -{" "}
              {formatCurrency(pricing.priceRange.max)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
              style={{
                width: "100%",
                marginLeft: 0,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatCurrency(pricing.priceRange.min)}</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(pricing.averagePrice)}
            </span>
            <span>{formatCurrency(pricing.priceRange.max)}</span>
          </div>
        </div>
      </div>

      {/* Comparable Listings Table */}
      {listings && listings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            Comparable Listings ({listings.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Dealer
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Mileage
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Condition
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.slice(0, 10).map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {listing.dealerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {listing.dealerLocation}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {formatCurrency(listing.price)}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {listing.mileage.toLocaleString()} mi
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {listing.condition}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 capitalize">
                      {listing.dealerType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listings.length > 10 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Showing 10 of {listings.length} listings
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
