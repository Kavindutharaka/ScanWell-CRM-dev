import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Plane,
  Ship,
  RefreshCw,
  DollarSign,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";
import * as RateAPI from '../../api/rateAPI';

export default function RatesSec({ modalOpen, onEditRate, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rates, setRates] = useState([]);
  const [error, setError] = useState(null);

  // Fetch rates from API
  const loadRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RateAPI.fetchRates();
      // Parse rateDataJson for each rate
      const parsedRates = data.map(rate => {
        let parsedRateData = {};
        if (rate.rateDataJson) {
          try {
            parsedRateData = JSON.parse(rate.rateDataJson);
          } catch (e) {
            console.error('Error parsing rateDataJson:', e);
          }
        }
        return {
          ...rate,
          ...parsedRateData
        };
      });
      setRates(parsedRates);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to load rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load rates on mount and when refreshTrigger changes
  useEffect(() => {
    loadRates();
  }, [refreshTrigger]);

  // Filter rates based on active tab
  const getFilteredRates = () => {
    let filtered = rates;
    
    switch (activeTab) {
      case 'air':
        filtered = rates.filter(rate => 
          rate.freightType?.toLowerCase().includes('air')
        );
        break;
      case 'sea':
        filtered = rates.filter(rate => 
          rate.freightType?.toLowerCase().includes('sea')
        );
        break;
      default:
        filtered = rates;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(rate => 
        rate.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.airline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.liner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.route?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Handle refresh
  const handleRefresh = () => {
    loadRates();
  };

  // Handle delete
  const handleDelete = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      await RateAPI.deleteRate(rateId);
      loadRates(); // Refresh the list
    } catch (err) {
      console.error('Error deleting rate:', err);
      alert('Failed to delete rate. Please try again.');
    }
  };

  // Get freight type color
  const getFreightTypeColor = (type) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType?.includes('air')) return 'bg-sky-500';
    if (normalizedType?.includes('sea')) return 'bg-blue-600';
    return 'bg-slate-500';
  };

  // Get freight type icon
  const FreightTypeIcon = ({ type }) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType?.includes('air')) return <Plane className="w-4 h-4" />;
    if (normalizedType?.includes('sea')) return <Ship className="w-4 h-4" />;
    return null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get rate display value based on freight type
  const getRateDisplay = (rate) => {
    const type = rate.freightType?.toLowerCase();
    
    if (type?.includes('air')) {
      // For air freight, show a sample rate (e.g., rate45Plus or rate100)
      return rate.rate45Plus || rate.rate100 || '-';
    } else if (type?.includes('fcl')) {
      // For FCL, show 20GP rate
      return rate.rate20GP || '-';
    } else if (type?.includes('lcl')) {
      // For LCL, show LCL rate
      return rate.lclRate || '-';
    }
    
    return '-';
  };

  const filteredRates = getFilteredRates();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-indigo-600" />
                Rates Management
              </h1>
              <p className="text-slate-600 mt-1">Manage your freight rates and pricing</p>
            </div>
            
            <button
              onClick={modalOpen}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create New Rate
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All Rates
            </button>
            <button
              onClick={() => setActiveTab('air')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'air'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" />
              Air Freight
            </button>
            <button
              onClick={() => setActiveTab('sea')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'sea'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Ship className="w-4 h-4" />
              Sea Freight
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by origin, destination, airline, liner, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
          {/* Error state */}
          {error && (
            <div className="p-6 bg-red-50 border-l-4 border-red-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error Loading Rates</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="p-8">
              <div className="flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600">Loading rates...</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Freight Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Origin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Carrier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sample Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Valid Until</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white ${getFreightTypeColor(rate.freightType)}`}>
                          <FreightTypeIcon type={rate.freightType} />
                          {rate.freightType}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{rate.origin || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{rate.destination || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {rate.route || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900 font-medium">
                        {rate.airline || rate.liner || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(getRateDisplay(rate))}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(rate.validateDate)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditRate(rate)}
                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                            title="Edit rate"
                          >
                            <Edit className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Delete rate"
                          >
                            <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredRates.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No rates found
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first rate'}
              </p>
              {!searchQuery && (
                <button
                  onClick={modalOpen}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Rate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Rates"
          >
            <RefreshCw 
              className={`w-5 h-5 transition-transform duration-200 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}
            />
          </button>
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}
