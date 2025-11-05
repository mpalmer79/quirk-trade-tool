"use client";

import React, { useState } from "react";
import { Upload, CheckCircle, XCircle, AlertCircle, FileText, Download } from "lucide-react";

interface ImportResult {
  success: boolean;
  batchId: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    imported: number;
  };
  errors?: Array<{
    row: number;
    vin: string;
    error: string;
  }>;
  message: string;
}

interface QaaStats {
  auctionData: {
    total_records: string;
    unique_vins: string;
    unique_makes: string;
    earliest_sale: string;
    latest_sale: string;
    avg_sale_price: string;
  };
  imports: {
    total_imports: string;
    total_imported: string;
    total_failed: string;
    last_import: string;
  };
}

export function QaaCsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QaaStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load stats on component mount
  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qaa/stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qaa/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload stats
        loadStats();
      } else {
        setError(data.message || 'Failed to import CSV file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleData = `date,vin,sale_price
2024-11-01,1HGCV41JXMN109186,12500
2024-11-01,2HGFG12857H543210,15300
2024-11-02,3VWFE21C04M000001,9800`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qaa_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quincy Auto Auction Data Import</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload weekly CSV files with auction wholesale values
          </p>
        </div>
        <button
          onClick={downloadSampleCsv}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          <Download className="h-4 w-4" />
          Download Sample CSV
        </button>
      </div>

      {/* Statistics */}
      {stats && !loadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Records</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {parseInt(stats.auctionData.total_records).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Unique Vehicles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {parseInt(stats.auctionData.unique_vins).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Sale Price</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${parseFloat(stats.auctionData.avg_sale_price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* CSV Format Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Required columns:</strong> date, vin, sale_price</li>
              <li>• <strong>Date formats:</strong> YYYY-MM-DD or MM/DD/YYYY</li>
              <li>• <strong>Price formats:</strong> Numbers only, or with $ and commas (e.g., $12,500)</li>
              <li>• <strong>VIN:</strong> 11-17 characters, will be automatically validated and decoded</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label
          htmlFor="csv-file-input"
          className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 cursor-pointer"
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="font-medium text-gray-600">
              {file ? file.name : 'Click to upload CSV file'}
            </span>
            <span className="text-xs text-gray-500">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or drag and drop'}
            </span>
          </div>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
          file && !isUploading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing CSV...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            Import Auction Data
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Import Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Import Successful!</h3>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
              
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-green-600 font-medium">Total Rows</p>
                  <p className="text-lg font-bold text-green-900">{result.summary.total}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Successful</p>
                  <p className="text-lg font-bold text-green-900">{result.summary.successful}</p>
                </div>
                <div>
                  <p className="text-xs text-red-600 font-medium">Failed</p>
                  <p className="text-lg font-bold text-red-900">{result.summary.failed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-900">
                    {result.errors.length} Row{result.errors.length > 1 ? 's' : ''} Failed
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {result.errors.length > 20 ? 'Showing first 20 errors' : 'Review errors below'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="text-sm bg-white p-2 rounded border border-yellow-200">
                    <span className="font-medium text-gray-900">Row {err.row}</span>
                    <span className="text-gray-500 mx-2">•</span>
                    <span className="text-gray-700">{err.vin}</span>
                    <p className="text-red-600 mt-1">{err.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
