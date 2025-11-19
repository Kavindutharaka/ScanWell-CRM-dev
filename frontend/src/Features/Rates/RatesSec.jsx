import React, { useState, useEffect } from "react";
import {
  Search,
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
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Package,
  Info,
} from "lucide-react";
import * as RateAPI from '../../api/rateAPI';

export default function RatesSec({ modalOpen, onEditRate, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rates, setRates] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const loadRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await RateAPI.fetchRates();
      const parsedRates = data.map(rate => {
        let parsedRateData = {};
        if (rate.rateDataJson) {
          try {
            parsedRateData = JSON.parse(rate.rateDataJson);
          } catch (e) {
            console.error('Error parsing rateDataJson:', e);
          }
        }
        return { ...rate, ...parsedRateData };
      });
      setRates(parsedRates);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to load rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, [refreshTrigger]);

  const toggleRow = (rateId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rateId)) {
      newExpanded.delete(rateId);
    } else {
      newExpanded.add(rateId);
    }
    setExpandedRows(newExpanded);
  };

  const getFilteredRates = () => {
    let filtered = rates;

    switch (activeTab) {
      case 'air':
        filtered = rates.filter(rate => rate.freightType?.toLowerCase().includes('air'));
        break;
      case 'sea':
        filtered = rates.filter(rate => rate.freightType?.toLowerCase().includes('sea'));
        break;
      default:
        filtered = rates;
    }

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

  const handleRefresh = () => loadRates();

  const handleDelete = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      await RateAPI.deleteRate(rateId);
      loadRates();
    } catch (err) {
      alert('Failed to delete rate.');
    }
  };

  const getFreightTypeColor = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('air')) return 'bg-sky-500';
    if (t?.includes('sea')) return 'bg-blue-600';
    return 'bg-slate-500';
  };

  const FreightTypeIcon = ({ type }) => {
    const t = type?.toLowerCase();
    if (t?.includes('air')) return <Plane className="w-4 h-4" />;
    if (t?.includes('sea')) return <Ship className="w-4 h-4" />;
    return null;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    if (daysUntil < 0) return <span className="text-red-600 font-medium">{formatted} (Expired)</span>;
    if (daysUntil <= 7) return <span className="text-orange-600 font-medium">{formatted} ({daysUntil}d left)</span>;
    return formatted;
  };

  const getQuickRate = (rate) => {
    if (rate.freightType?.toLowerCase().includes('air')) {
      return rate.rate45Plus ?? rate.rate45MinusM ?? rate.rate45Minus ?? rate.rate100 ?? rate.rateM ?? '-';
    } else if (rate.freightType?.toLowerCase().includes('fcl')) {
      return rate.rate20GP ?? rate.rate40GP ?? rate.rate40HQ ?? '-';
    } else if (rate.freightType?.toLowerCase().includes('lcl')) {
      return rate.lclRate ?? '-';
    }
    return '-';
  };

  const getRoutingBadge = (type) => {
    if (!type) return null;
    const isDirect = type?.toUpperCase() === 'DIRECT';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isDirect ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
        <ArrowRight className="w-3 h-3" />
        {isDirect ? 'Direct' : 'Transshipment'}
      </span>
    );
  };

  const filteredRates = getFilteredRates();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-indigo-600" />
                Rates Management
              </h1>
              <p className="text-slate-600 mt-1">Manage and compare freight rates across routes</p>
            </div>
            <button onClick={modalOpen} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
              <Plus className="w-5 h-5" />
              Create New Rate
            </button>
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              All Rates ({rates.length})
            </button>
            <button onClick={() => setActiveTab('air')} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'air' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              <Plane className="w-4 h-4" /> Air Freight
            </button>
            <button onClick={() => setActiveTab('sea')} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'sea' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              <Ship className="w-4 h-4" /> Sea Freight
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by origin, destination, carrier, or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* States */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error Loading Rates</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button onClick={handleRefresh} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Try Again</button>
              </div>
            </div>
          </div>
        )}

        {loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading rates...</p>
          </div>
        )}

        {/* Rates List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredRates.map((rate) => {
              const isExpanded = expandedRows.has(rate.sysID);
              const isAir = rate.freightType?.toLowerCase().includes('air');
              const isFCL = rate.freightType?.toLowerCase().includes('fcl');
              const isLCL = rate.freightType?.toLowerCase().includes('lcl');

              return (
                <div key={rate.sysID} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Main Row */}
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${getFreightTypeColor(rate.freightType)}`}>
                          <FreightTypeIcon type={rate.freightType} />
                          <span className="uppercase">{rate.freightType?.replace(/-/g, ' ')}</span>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-indigo-600" /><span className="font-bold">{rate.origin}</span></div>
                          <div className="flex-1 h-px bg-slate-300 relative"><div className="absolute inset-0 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-slate-400 bg-white" /></div></div>
                          <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-600" /><span className="font-bold">{rate.destination}</span></div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {getRoutingBadge(rate.routingType)}
                          {rate.transitTime > 0 && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{rate.transitTime} days</span>}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm font-semibold">{rate.airline || rate.liner || '-'}</div>
                        {rate.frequency && <div className="text-xs text-slate-500 mt-0.5">{rate.frequency}</div>}
                      </div>

                      <div className="col-span-1">
                        <div className="text-sm font-semibold text-slate-700">{rate.currency || 'USD'}</div>
                        <div className="text-xs text-slate-500">Currency</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-lg font-bold text-indigo-600">{formatCurrency(getQuickRate(rate))}</div>
                        <div className="text-xs text-slate-500">
                          {isAir && 'per kg (+45)'}
                          {isFCL && 'per container'}
                          {isLCL && 'per CBM'}
                        </div>
                      </div>

                      <div className="col-span-1">
                        <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(rate.validateDate)}</div>
                      </div>

                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => onEditRate(rate)} className="p-2 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4 text-slate-600 hover:text-indigo-600" /></button>
                        <button onClick={() => handleDelete(rate.sysID)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" /></button>
                        <button onClick={() => toggleRow(rate.sysID)} className="p-2 hover:bg-slate-100 rounded-lg">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details - FULLY FIXED */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Rate Breakdown */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Rate Breakdown
                          </h4>
                          <div className="bg-white rounded-lg p-5">
                            {isAir && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Minimum (M) */}
                                {rate.rate45MinusM != null && rate.rate45MinusM !== '' && (
                                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-center">
                                    <div className="text-xs font-semibold text-amber-700">Minimum (M)</div>
                                    <div className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(rate.rate45MinusM)}</div>
                                  </div>
                                )}

                                {/* -45 kg */}
                                {rate.rate45Minus != null && rate.rate45Minus !== '' && (
                                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                                    <div className="text-xs text-slate-600">-45 kg</div>
                                    <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(rate.rate45Minus)}</div>
                                  </div>
                                )}

                                {/* +45 kg - Highlighted */}
                                {rate.rate45Plus != null && rate.rate45Plus !== '' && (
                                  <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 text-center shadow-sm">
                                    <div className="text-sm font-bold text-indigo-700">+45 kg</div>
                                    <div className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(rate.rate45Plus)}</div>
                                  </div>
                                )}

                                {rate.rate100 && <div className="bg-slate-50 rounded-lg p-4 text-center"><div className="text-xs text-slate-600">+100 kg</div><div className="text-xl font-bold mt-1">{formatCurrency(rate.rate100)}</div></div>}
                                {rate.rate300 && <div className="bg-slate-50 rounded-lg p-4 text-center"><div className="text-xs text-slate-600">+300 kg</div><div className="text-xl font-bold mt-1">{formatCurrency(rate.rate300)}</div></div>}
                                {rate.rate500 && <div className="bg-slate-50 rounded-lg p-4 text-center"><div className="text-xs text-slate-600">+500 kg</div><div className="text-xl font-bold mt-1">{formatCurrency(rate.rate500)}</div></div>}
                                {rate.rate1000 && <div className="bg-slate-50 rounded-lg p-4 text-center"><div className="text-xs text-slate-600">+1000 kg</div><div className="text-xl font-bold mt-1">{formatCurrency(rate.rate1000)}</div></div>}
                              </div>
                            )}

                            {/* Keep your existing FCL / LCL blocks here if needed */}
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Additional Information
                          </h4>
                          <div className="bg-white rounded-lg p-5 space-y-4">
                            {rate.routing && (
                              <div><div className="text-xs text-slate-500">Routing</div><div className="text-sm font-medium">{rate.routing}</div></div>
                            )}
                            {rate.surcharges && (
                              <div><div className="text-xs text-slate-500">Surcharges</div><div className="text-sm font-medium">{rate.surcharges}</div></div>
                            )}
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                              <div>
                                <div className="text-xs text-slate-500">Created</div>
                                <div className="text-sm font-medium">{new Date(rate.createdAt).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Owner</div>
                                <div className="text-sm font-medium">{rate.owner || '—'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty & Refresh */}
        {!loading && !error && filteredRates.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No rates found</h3>
            <p className="text-slate-500 mb-6">{searchQuery ? 'Try adjusting your search' : 'Create your first rate'}</p>
            {!searchQuery && <button onClick={modalOpen} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-5 h-5" />Create New Rate</button>}
          </div>
        )}

        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={handleRefresh} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}