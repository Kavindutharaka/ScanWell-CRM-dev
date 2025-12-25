import React, { useState, useEffect } from "react";
import {
  CircleDollarSign,
  RotateCcw,
  Search,
  Plus,
  Eye,
  Download,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { fetchRfq } from "../../api/RfqApi";
import RfqDataModal from "./RfqDataModal";

export default function InfoAndUpdatesSec({ modalOpen, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rfqItems, setRfqItems] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  useEffect(() => {
    fetchRfqItems();
  }, []);

  const fetchRfqItems = async () => {
    setLoading(true);
    try {
      const data = await fetchRfq();
      console.log("Fetched RFQ data:", data);
      setRfqItems(data);
    } catch (error) {
      console.error("Error fetching RFQ items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRfqItems();
  };

  const handleView = (sysID) => {
    setSelectedRfqId(sysID);
    setViewModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this RFQ?")) {
      // Implement delete functionality
      setRfqItems(rfqItems.filter(item => item.sysID !== id));
    }
  };

  const handleDownload = async (item) => {
    // Implement download functionality if needed
    console.log("Download RFQ:", item);
  };

  const filteredItems = rfqItems.filter(item => {
    const query = searchQuery.toLowerCase();
    const rfqNumber = item.rfq_number?.toLowerCase() || "";
    const customer = item.customer?.toLowerCase() || "";
    return rfqNumber.includes(query) || customer.includes(query);
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const validDate = new Date(dateString);
    const today = new Date();
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    validDate.setHours(0, 0, 0, 0);
    return validDate < today;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-full">
      <style jsx>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
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
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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

        .table-row-hover:hover {
          background-color: rgba(59, 130, 246, 0.02);
        }

        .expired-row {
          background-color: rgba(239, 68, 68, 0.05);
        }

        .expired-row:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }

        .expired-date {
          color: #dc2626;
          font-weight: 600;
        }

        .expired-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background-color: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>

      <main className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto">
        {/* Page Header */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                  RFQ
                </h1>
                <p className="text-sm text-slate-500 mt-1">Request for Quotation Data</p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New RFQ</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by RFQ number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className={`flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-slate-700 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">RFQ Number</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Customer</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Valid Date</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  // Loading skeletons
                  Array(5)
                    .fill(0)
                    .map((_, idx) => (
                      <tr key={idx} className="table-row-hover">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-40"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-28"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-slate-200 rounded skeleton"></div>
                            <div className="h-8 w-8 bg-slate-200 rounded skeleton"></div>
                            <div className="h-8 w-8 bg-slate-200 rounded skeleton"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => {
                    const expired = isExpired(item.valid_date);
                    return (
                      <tr 
                        key={item.sysID} 
                        className={`table-row-hover transition-colors duration-150 ${expired ? 'expired-row' : ''}`}
                        style={{ 
                          animation: 'fadeInUp 0.4s ease-out',
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {item.rfq_number || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.customer || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm ${expired ? 'expired-date' : 'text-slate-600'}`}>
                              {formatDate(item.valid_date)}
                            </span>
                            {expired && (
                              <span className="expired-badge">
                                <AlertCircle className="w-3 h-3" />
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(item.sysID)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors duration-150 text-blue-600 hover:text-blue-700"
                              title="View Data"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(item)}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors duration-150 text-green-600 hover:text-green-700"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <CircleDollarSign className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No RFQ found</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {searchQuery ? "Try adjusting your search" : "Start by adding a new RFQ"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {loading ? (
              // Loading skeletons for mobile
              Array(5)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <div className="space-y-3">
                      <div className="h-5 bg-slate-200 rounded skeleton w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div>
                      <div className="h-4 bg-slate-200 rounded skeleton w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-9 bg-slate-200 rounded skeleton flex-1"></div>
                        <div className="h-9 bg-slate-200 rounded skeleton flex-1"></div>
                      </div>
                    </div>
                  </div>
                ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const expired = isExpired(item.valid_date);
                return (
                  <div 
                    key={item.sysID} 
                    className={`border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${expired ? 'border-red-200 bg-red-50/50' : 'bg-white'}`}
                    style={{ 
                      animation: 'fadeInUp 0.4s ease-out',
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    {/* Card Header */}
                    <div className={`p-4 border-b ${expired ? 'border-red-100 bg-red-100/50' : 'border-slate-100 bg-blue-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600">RFQ Number</span>
                        {expired && (
                          <span className="expired-badge">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.rfq_number || "N/A"}
                      </h3>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Customer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Customer</span>
                        <span className="text-sm font-medium text-slate-900">
                          {item.customer || "N/A"}
                        </span>
                      </div>

                      {/* Valid Date */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Valid Date</span>
                        <span className={`text-sm font-semibold ${expired ? 'expired-date' : 'text-slate-900'}`}>
                          {formatDate(item.valid_date)}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleView(item.sysID)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Data
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CircleDollarSign className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No RFQ found</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {searchQuery ? "Try adjusting your search" : "Start by adding a new RFQ"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Refresh Button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
          </button>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </main>

      {/* RFQ Data Modal */}
      {viewModalOpen && (
        <RfqDataModal
          rfqId={selectedRfqId}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedRfqId(null);
          }}
        />
      )}
    </div>
  );
}