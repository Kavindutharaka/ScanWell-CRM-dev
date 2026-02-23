import { useState, useEffect, useMemo } from "react";
import {
  CircleDollarSign,
  RotateCcw,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { fetchRfq, deleteRfq } from "../../api/RfqApi";
import FilterPanel from "../../components/filters/FilterPanel";
import useFilters from "../../components/filters/useFilters";

export default function RFQSec({ modalOpen, onEdit, onSalesEntry }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rfqItems, setRfqItems] = useState([]);

  // Filters
  const { filters, setFilter, clearAllFilters } = useFilters(['customer', 'rfqStatus']);

  useEffect(() => {
    fetchRfqItems();
  }, []);

  const fetchRfqItems = async () => {
    setLoading(true);
    try {
      const data = await fetchRfq();
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await deleteRfq(id);
      setRfqItems((prev) => prev.filter((item) => item.sysID !== id));
    } catch (error) {
      console.error("Error deleting RFQ:", error);
    }
  };

  // Dynamic customer options from loaded data
  const customerOptions = useMemo(() => {
    const uniqueCustomers = [...new Set(rfqItems.map(item => item.customer).filter(Boolean))].sort();
    return uniqueCustomers.map(c => ({ value: c, label: c }));
  }, [rfqItems]);

  const rfqFilterConfig = [
    { key: 'customer', label: 'Customer', allLabel: 'All Customers', minWidth: '160px', options: customerOptions },
    { key: 'rfqStatus', label: 'Status', allLabel: 'All Statuses', minWidth: '140px', options: [
      { value: 'active', label: 'Active' },
      { value: 'expired', label: 'Expired' }
    ]}
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const validDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validDate.setHours(0, 0, 0, 0);
    return validDate < today;
  };

  const filteredItems = rfqItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const rfqNumber = item.rfq_number?.toLowerCase() || "";
    const customer = item.customer?.toLowerCase() || "";
    const matchSearch = rfqNumber.includes(query) || customer.includes(query);

    // Multi-select customer filter
    const matchCustomer = filters.customer.length === 0 || filters.customer.includes(item.customer);

    // Multi-select status filter (derived from valid_date)
    const expired = isExpired(item.valid_date);
    const itemStatus = expired ? 'expired' : 'active';
    const matchStatus = filters.rfqStatus.length === 0 || filters.rfqStatus.includes(itemStatus);

    return matchSearch && matchCustomer && matchStatus;
  });

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-full">
      <style jsx>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .skeleton {
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
        }
      `}</style>

      <main className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto">
        {/* Page Header */}
        <div
          className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">RFQ</h1>
                <p className="text-sm text-slate-500 mt-1">Request for Quotation Data</p>
              </div>
            </div>
          </div>

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

        {/* Search & Filter Bar */}
        <div
          className={`mb-6 relative z-10 ${!loading ? "animate-fadeInUp" : "opacity-0"}`}
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by RFQ number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white shadow-sm"
            />
            </div>
            <FilterPanel
              filterConfig={rfqFilterConfig}
              filters={filters}
              onFilterChange={setFilter}
              onClearAll={clearAllFilters}
              accentColor="blue"
            />
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${
            !loading ? "animate-fadeInUp" : "opacity-0"
          }`}
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    RFQ Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Valid Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded skeleton w-3/4"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded skeleton w-2/3"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div></td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-slate-200 rounded-lg skeleton"></div>
                            <div className="h-8 w-8 bg-slate-200 rounded-lg skeleton"></div>
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
                        className={`hover:bg-slate-50 transition-colors duration-150 ${
                          expired ? "bg-red-50/50" : ""
                        }`}
                        style={{
                          animation: "fadeInUp 0.4s ease-out",
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: "both",
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
                            <span className={`text-sm ${expired ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                              {formatDate(item.valid_date)}
                            </span>
                            {expired && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium w-fit">
                                <AlertCircle className="w-3 h-3" />
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{item.link}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onSalesEntry(item)}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:text-green-700"
                              title="Sales Entries"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.sysID)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12">
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
              Array(5)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                    <div className="space-y-3">
                      <div className="h-5 bg-slate-200 rounded skeleton w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div>
                      <div className="h-4 bg-slate-200 rounded skeleton w-2/3"></div>
                    </div>
                  </div>
                ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const expired = isExpired(item.valid_date);
                return (
                  <div
                    key={item.sysID}
                    className={`border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      expired ? "border-red-200 bg-red-50/50" : "bg-white"
                    }`}
                    style={{
                      animation: "fadeInUp 0.4s ease-out",
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className={`p-4 border-b ${expired ? "border-red-100 bg-red-100/50" : "border-slate-100 bg-blue-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600">RFQ Number</span>
                        {expired && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{item.rfq_number || "N/A"}</h3>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Customer</span>
                        <span className="text-sm font-medium text-slate-900">{item.customer || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Valid Date</span>
                        <span className={`text-sm font-semibold ${expired ? "text-red-600" : "text-slate-900"}`}>
                          {formatDate(item.valid_date)}
                        </span>
                      </div>
                      {item.link && (
                        <div className="pt-2 border-t border-slate-100">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Link
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => onSalesEntry(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        Sales
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.sysID)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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
            <RotateCcw
              className={`w-5 h-5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-300"}`}
            />
          </button>
        </div>

        <div className="h-8"></div>
      </main>
    </div>
  );
}
