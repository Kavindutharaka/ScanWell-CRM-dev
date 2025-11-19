import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, Download, Loader2, AlertCircle } from "lucide-react";
import { getDataObj } from "../../api/RfqApi";

export default function RfqDataModal({ rfqId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchRfqData();
  }, [rfqId]);

  const fetchRfqData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getDataObj(rfqId);
      console.log("Raw response:", response);
      
      // Parse the JSON string if it's a string
      let parsedData;
      if (typeof response === 'string') {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      
      console.log("Parsed data:", parsedData);
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Extract column names from the first object's keys
        const cols = Object.keys(parsedData[0]);
        setColumns(cols);
        setData(parsedData);
      } else {
        setError("No data available for this RFQ");
      }
    } catch (err) {
      console.error("Error fetching RFQ data:", err);
      setError("Failed to load RFQ data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        // Handle values with commas by wrapping in quotes
        if (value && value.toString().includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rfq_${rfqId}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          
          .skeleton {
            animation: shimmer 2s infinite;
            background: linear-gradient(
              90deg,
              #f0f0f0 25%,
              #e0e0e0 50%,
              #f0f0f0 75%
            );
            background-size: 1000px 100%;
          }

          .data-table {
            font-size: 0.875rem;
          }

          .data-table th {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #f8fafc;
          }

          .data-table tbody tr:hover {
            background-color: rgba(59, 130, 246, 0.03);
          }
        `}</style>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">RFQ Data</h2>
              <p className="text-blue-100 text-sm">
                {loading ? "Loading data..." : `${data.length} rows`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && !error && data.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            // Loading State
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-3">
                {Array(5).fill(0).map((_, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="h-4 bg-slate-200 rounded skeleton flex-1"></div>
                    <div className="h-4 bg-slate-200 rounded skeleton flex-1"></div>
                    <div className="h-4 bg-slate-200 rounded skeleton flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-slate-700 font-medium mb-2">Error Loading Data</p>
              <p className="text-slate-500 text-sm">{error}</p>
              <button
                onClick={fetchRfqData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No data available</p>
              <p className="text-slate-400 text-sm mt-1">This RFQ has no associated data</p>
            </div>
          ) : (
            // Data Table
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full data-table border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                          {rowIndex + 1}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                          >
                            {row[col] !== null && row[col] !== undefined && row[col] !== '' 
                              ? row[col].toString() 
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && data.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div>
                Showing <span className="font-medium text-slate-800">{data.length}</span> rows
                {columns.length > 0 && (
                  <span className="ml-2">
                    with <span className="font-medium text-slate-800">{columns.length}</span> columns
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}