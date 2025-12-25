// QuotesInvoiceSec.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2, Plane, Ship, Package, Container, Truck, Route as RouteIcon, Layers, MapPin, Calendar, User, DollarSign, ArrowRight } from 'lucide-react';
import { fetchQuotes, deleteQuote } from '../../api/QuoteApi';

export default function QuotesInvoiceSec({ modalOpen }) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, quoteId: null, quoteNumber: '' });

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const data = await fetchQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (quote) => {
    if (quote.freightType === 'multimodal') {
      navigate(`/quotes?type=multimodal&id=${quote.quoteId}`);
    } else {
      const params = new URLSearchParams({
        category: quote.freightCategory,
        type: quote.freightType,
        mode: quote.freightMode,
        id: quote.quoteId
      });
      navigate(`/quotes?${params.toString()}`);
    }
  };

  const handleEdit = (quote) => {
    if (quote.freightType === 'multimodal') {
      navigate(`/quotes?type=multimodal&id=${quote.quoteId}&edit=true`);
    } else {
      const params = new URLSearchParams({
        category: quote.freightCategory,
        type: quote.freightType,
        mode: quote.freightMode,
        id: quote.quoteId,
        edit: 'true'
      });
      navigate(`/quotes?${params.toString()}`);
    }
  };

  const confirmDelete = (quote) => {
    setDeleteModal({
      show: true,
      quoteId: quote.quoteId,
      quoteNumber: quote.quoteNumber
    });
  };

  const handleDelete = async () => {
    try {
      await deleteQuote(deleteModal.quoteId);
      setDeleteModal({ show: false, quoteId: null, quoteNumber: '' });
      loadQuotes();
      alert('Quote deleted successfully!');
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const getFreightIcon = (category, mode) => {
    if (category === 'air' && mode === 'import') return { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' };
    if (category === 'air' && mode === 'export') return { icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' };
    if (category === 'sea' && (mode === 'import' || mode === 'fcl' || mode === 'lcl')) return { icon: Container, color: 'text-teal-600', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-800' };
    if (category === 'sea' && mode === 'export') return { icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' };
    if (category === 'multimodal') return { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' };
    return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' };
  };

  const getTypeIcon = (type) => {
    if (type === 'direct') return { icon: RouteIcon, color: 'text-green-600', badge: 'bg-green-100 text-green-800' };
    if (type === 'transit') return { icon: Layers, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' };
    if (type === 'multimodal') return { icon: Truck, color: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' };
    return { icon: RouteIcon, color: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Updated to handle multimodal structure
 // QuotesInvoiceSec.jsx - Update getMultiModalRouteDisplay function
const getMultiModalRouteDisplay = (quote) => {
  try {
    if (quote.freightType !== 'multimodal' || !quote.routes) {
      return null;
    }

    const routeOptions = JSON.parse(quote.routes);
    if (!routeOptions || !routeOptions[0] || !routeOptions[0].routes) {
      return null;
    }

    const segments = routeOptions[0].routes;
    
    const getModeIcon = (mode) => {
      if (mode === 'air') return '✈️';
      if (mode === 'sea') return '🚢';
      if (mode === 'trucking') return '🚛';
      return '📦';
    };
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {idx > 0 && <ArrowRight size={12} className="text-gray-400" />}
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded flex items-center gap-1">
              {getModeIcon(segment.mode)}
              <span className="font-medium">{segment.origin || 'N/A'}</span>
            </span>
          </div>
        ))}
        <ArrowRight size={12} className="text-gray-400" />
        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded font-medium">
          {segments[segments.length - 1]?.destination || 'N/A'}
        </span>
      </div>
    );
  } catch (error) {
    console.error('Error parsing multimodal route:', error);
    return <span className="text-xs text-gray-500">Multi-segment route</span>;
  }
};

  // Updated to calculate total across all segments for multimodal
  const calculateTotalAmount = (quote) => {
    try {
      let total = 0;
      
      if (quote.freightType === 'multimodal' && quote.routes) {
        const routeOptions = JSON.parse(quote.routes);
        
        routeOptions.forEach(option => {
          if (option.routes && Array.isArray(option.routes)) {
            option.routes.forEach(segment => {
              // Freight charges
              if (segment.freightChargesTables) {
                segment.freightChargesTables.forEach(table => {
                  const weight = parseFloat(table.chargeableWeight) || 0;
                  const charge = parseFloat(table.charge) || 0;
                  total += weight * charge;
                });
              }
              
              // Origin handling
              if (segment.originHandling && Array.isArray(segment.originHandling)) {
                segment.originHandling.forEach(charge => {
                  total += parseFloat(charge.total) || 0;
                });
              }
              
              // Destination handling
              if (segment.destinationHandling && Array.isArray(segment.destinationHandling)) {
                segment.destinationHandling.forEach(charge => {
                  total += parseFloat(charge.total) || 0;
                });
              }
            });
          }
        });
        
        return total.toFixed(2);
      }
      
      // For direct and transit quotes
      if (quote.freightCharges) {
        const charges = JSON.parse(quote.freightCharges);
        if (Array.isArray(charges)) {
          total += charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
        }
      }
      
      if (quote.destinationCharges) {
        const charges = JSON.parse(quote.destinationCharges);
        if (Array.isArray(charges)) {
          total += charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
        }
      }
      
      if (quote.originHandling) {
        const charges = JSON.parse(quote.originHandling);
        if (Array.isArray(charges)) {
          total += charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
        }
      }
      
      if (quote.destinationHandling) {
        const charges = JSON.parse(quote.destinationHandling);
        if (Array.isArray(charges)) {
          total += charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
        }
      }
      
      return total.toFixed(2);
    } catch (error) {
      console.error('Error calculating total:', error);
      return '0.00';
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTypeFilter = filterType === 'all' || quote.freightType === filterType;
    const matchesCategoryFilter = filterCategory === 'all' || quote.freightCategory === filterCategory;
    return matchesSearch && matchesTypeFilter && matchesCategoryFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Freight Quotes</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your freight quotations</p>
        </div>
        <button
          onClick={() => modalOpen('quote')}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all"
        >
          <Plus size={20} />
          Create Quote
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by quote number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
              <option value="multimodal">MultiModal</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct</option>
              <option value="transit">Transit</option>
              <option value="multimodal">MultiModal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-800">{quotes.length}</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
              <Package className="text-teal-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Air Freight</p>
              <p className="text-2xl font-bold text-gray-800">
                {quotes.filter(q => q.freightCategory === 'air').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Plane className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sea Freight</p>
              <p className="text-2xl font-bold text-gray-800">
                {quotes.filter(q => q.freightCategory === 'sea').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
              <Ship className="text-teal-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MultiModal</p>
              <p className="text-2xl font-bold text-gray-800">
                {quotes.filter(q => q.freightCategory === 'multimodal').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Truck className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Table/Cards */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No quotes found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first quote to get started'}
          </p>
          {!searchTerm && filterType === 'all' && filterCategory === 'all' && (
            <button
              onClick={() => modalOpen('quote')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={20} />
              Create Quote
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quote Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Freight Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => {
                    const freightIcon = getFreightIcon(quote.freightCategory, quote.freightMode);
                    const typeIcon = getTypeIcon(quote.freightType);
                    const FreightIconComponent = freightIcon.icon;
                    const TypeIconComponent = typeIcon.icon;

                    return (
                      <tr key={quote.quoteId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${freightIcon.bg} ${freightIcon.color} flex items-center justify-center flex-shrink-0`}>
                              <FreightIconComponent size={20} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{quote.quoteNumber}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <TypeIconComponent size={14} className={typeIcon.color} />
                                <span className={`text-xs px-2 py-0.5 rounded-full ${typeIcon.badge}`}>
                                  {quote.freightType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${freightIcon.badge} capitalize`}>
                              {quote.freightCategory}
                            </span>
                            <div className="text-xs text-gray-500 mt-1 capitalize">{quote.freightMode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{quote.customer || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {quote.freightType === 'multimodal' ? (
                            <div className="max-w-xs">
                              {getMultiModalRouteDisplay(quote)}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin size={14} className="text-green-500" />
                                <span className="truncate max-w-[150px]">{quote.portOfLoading || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <MapPin size={14} className="text-red-500" />
                                <span className="truncate max-w-[150px]">{quote.portOfDischarge || '-'}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-700">
                                {new Date(quote.createdDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                            {quote.rateValidity && (
                              <div className="text-xs text-gray-500">
                                Valid till: {new Date(quote.rateValidity).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-green-600" />
                            <span className="font-semibold text-gray-900">
                              {calculateTotalAmount(quote)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(quote.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* <button
                              onClick={() => handleView(quote)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Quote"
                            >
                              <Eye size={18} />
                            </button> */}
                            <button
                              onClick={() => handleEdit(quote)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Quote"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => confirmDelete(quote)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Quote"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {filteredQuotes.map((quote) => {
              const freightIcon = getFreightIcon(quote.freightCategory, quote.freightMode);
              const typeIcon = getTypeIcon(quote.freightType);
              const FreightIconComponent = freightIcon.icon;
              const TypeIconComponent = typeIcon.icon;

              return (
                <div key={quote.quoteId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${freightIcon.bg} ${freightIcon.color} flex items-center justify-center`}>
                        <FreightIconComponent size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{quote.quoteNumber}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${freightIcon.badge} capitalize`}>
                            {quote.freightCategory}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeIcon.badge} capitalize`}>
                            {quote.freightType}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    {quote.customer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-700">{quote.customer}</span>
                      </div>
                    )}
                    
                    {quote.freightType === 'multimodal' ? (
                      <div className="text-sm">
                        {getMultiModalRouteDisplay(quote)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-green-500" />
                          <span className="text-gray-700">{quote.portOfLoading || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-red-500" />
                          <span className="text-gray-700">{quote.portOfDischarge || 'N/A'}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(quote.createdDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-gray-900">
                        <DollarSign size={16} className="text-green-600" />
                        {calculateTotalAmount(quote)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleView(quote)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(quote)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(quote)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete quote <span className="font-semibold">{deleteModal.quoteNumber}</span>? 
              All associated data will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, quoteId: null, quoteNumber: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}