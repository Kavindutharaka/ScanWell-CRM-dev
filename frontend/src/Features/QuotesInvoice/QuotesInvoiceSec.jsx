// QuotesInvoiceSec.jsx - MINIMAL CHANGES - Only outcome fixes + Warehouse Quotes
import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, Plane, Ship, Package, Container, Truck, Route as RouteIcon, Layers, MapPin, Calendar, User, DollarSign, ArrowRight, Award, CheckCircle, XCircle, AlertCircle, Warehouse, Send, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { fetchQuotesPaged, fetchQuoteCounts, deleteQuote, fetchWareQuote, getSp, updateQuoteStatus, deleteWareQuote } from '../../api/QuoteApi';
import { fetchOutComeById, saveQuoteOutCome, updateWonDetails } from '../../api/QuotesOutComeApi';
import { AuthContext } from '../../context/AuthContext';
import FilterPanel from '../../components/filters/FilterPanel';
import useFilters from '../../components/filters/useFilters';

export default function QuotesInvoiceSec({ modalOpen }) {
  const navigate = useNavigate();
  const { user, permission } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin;
  // Granular permissions. QuotesView gives read-only access; explicit Add/Edit
  // are required to create or modify. Submitted quotes are locked for non-admins.
  const canAddQuotes = isAdmin || permission?.QuotesAdd;
  const canEditQuotes = isAdmin || permission?.QuotesEdit;
  const canDeleteQuotes = isAdmin; // delete = destructive, admin only

  // Submitted quotes are locked for non-admins (admin can still edit).
  const isQuoteLocked = (quote) => {
    if (isAdmin) return false;
    const status = (quote?.status || '').toLowerCase();
    return status === 'submitted' || status === 'won' || status === 'lost';
  };
  const [quotes, setQuotes] = useState([]);
  const [warehouseQuotes, setWarehouseQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { filters, setFilter, clearAllFilters, getApiParams, hasActiveFilters } = useFilters(['category', 'type', 'status']);
  const [deleteModal, setDeleteModal] = useState({ show: false, quoteId: null, quoteNumber: '' });
  const [submitModal, setSubmitModal] = useState({ show: false, quoteId: null, quoteNumber: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef(null);

  // Stats counts (loaded once, refreshed on data changes)
  const [statsCounts, setStatsCounts] = useState({ total: 0, air: 0, sea: 0, multimodal: 0, warehouse: 0 });

  const [winModalShow, setWinModalShow] = useState(false);
  const [lostModalShow, setLostModalShow] = useState(false);
  
  // NEW: Outcome states
  const [currentQuote, setCurrentQuote] = useState(null);
  const [quoteOutcomes, setQuoteOutcomes] = useState({});
  const [winForm, setWinForm] = useState({ wonAmount: '' });
  const [lostForm, setLostForm] = useState({ lostReason: '', lostNote: '' });

  // Won details modal state (Admin only)
  const [wonDetailsModalShow, setWonDetailsModalShow] = useState(false);
  const [wonDetailsQuote, setWonDetailsQuote] = useState(null);
  const [wonDetailsForm, setWonDetailsForm] = useState({ invoiceNumber: '', cost: '', salesValue: '', currency: 'LKR', dollarAmount: '', dollarRate: '' });

  const lostReasons = [
    'High Prices',
    'Late Submissions',
    'Poor Transit Times',
    'Destination free time',
    'Flight cancelation',
    'Others'
  ];

  // NEW: Load outcome for a quote
  const loadQuoteOutcome = async (quoteId) => {
    try {
      const outcome = await fetchOutComeById(quoteId);
      setQuoteOutcomes(prev => ({ ...prev, [quoteId]: outcome }));
    } catch (error) {
      setQuoteOutcomes(prev => ({ ...prev, [quoteId]: null }));
    }
  };

  // Sales person lookup per row.
  // Hardened to:
  //  - guard against missing customer name (no spurious request)
  //  - avoid stale state writes when the row unmounts mid-request
  //  - render '-' instead of loading text when there's no name to look up
function SalesPerson({ customerName }) {
  const [salesPerson, setSalesPerson] = useState('-');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerName || !customerName.trim()) {
      setSalesPerson('-');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSp(customerName)
      .then((res) => {
        if (cancelled) return;
        const name = Array.isArray(res) && res[0]?.salesPerson ? res[0].salesPerson : '-';
        setSalesPerson(name);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load SP for', customerName, err);
        setSalesPerson('-');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [customerName]);

  if (loading) return <span className="text-gray-400">…</span>;

  return <span className="text-gray-700">{salesPerson}</span>;
}

  // FIXED: getOutcomeBadge function
  const getOutcomeBadge = (quoteId) => {
    const outcome = quoteOutcomes[quoteId];

    // No outcome yet - show Win/Lost buttons only for submitted quotes
    if (!outcome) {
      const quote = allQuotes.find(q => q.quoteId === quoteId);
      const status = (quote?.status || '').toLowerCase();

      // Only show Win/Lost for submitted quotes
      if (status !== 'submitted') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
            {status || 'draft'}
          </span>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await saveQuoteOutCome({
                  quoteId: quote.quoteId,
                  outcomeStatus: 'won'
                });
                await loadQuoteOutcome(quote.quoteId);
              } catch (error) {
                console.error('Error saving win outcome:', error);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <CheckCircle size={14} />
            Won
          </button>
          <button
            onClick={async () => {
              try {
                await saveQuoteOutCome({
                  quoteId: quote.quoteId,
                  outcomeStatus: 'lost'
                });
                await loadQuoteOutcome(quote.quoteId);
              } catch (error) {
                console.error('Error saving lost outcome:', error);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <XCircle size={14} />
            Lost
          </button>
        </div>
      );
    }

    if (outcome.outcomeStatus === 'won') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Award size={14} />
          Won
        </span>
      );
    }

    if (outcome.outcomeStatus === 'lost') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle size={14} />
          Lost
        </span>
      );
    }

    return null;
  };

  // NEW: Save win handler
  const handleSaveWin = async () => {
    if (!winForm.wonAmount || parseFloat(winForm.wonAmount) <= 0) {
      alert('Please enter a valid won amount');
      return;
    }

    try {
      const payload = {
        quoteId: currentQuote.quoteId,
        outcomeStatus: 'won',
        wonAmount: parseFloat(winForm.wonAmount),
        lostReason: null,
        lostNote: null
      };

      await saveQuoteOutCome(payload);
      await loadQuoteOutcome(currentQuote.quoteId);
      setWinModalShow(false);
      setCurrentQuote(null);
      alert('Quote marked as won successfully!');
    } catch (error) {
      console.error('Error saving win outcome:', error);
      alert('Failed to save win outcome');
    }
  };

  // NEW: Save lost handler
  const handleSaveLost = async () => {
    if (!lostForm.lostReason) {
      alert('Please select a reason');
      return;
    }

    if (lostForm.lostReason === 'Others' && !lostForm.lostNote) {
      alert('Please provide a note');
      return;
    }

    try {
      const payload = {
        quoteId: currentQuote.quoteId,
        outcomeStatus: 'lost',
        wonAmount: 0,
        lostReason: lostForm.lostReason,
        lostNote: lostForm.lostReason === 'Others' ? lostForm.lostNote : null
      };

      await saveQuoteOutCome(payload);
      await loadQuoteOutcome(currentQuote.quoteId);
      setLostModalShow(false);
      setCurrentQuote(null);
      alert('Quote marked as lost successfully!');
    } catch (error) {
      console.error('Error saving lost outcome:', error);
      alert('Failed to save lost outcome');
    }
  };

  // Save won details handler (Admin only)
  const handleSaveWonDetails = async () => {
    try {
      let computedSalesValue;
      if (wonDetailsForm.currency === 'USD') {
        const dollarAmt = parseFloat(wonDetailsForm.dollarAmount) || 0;
        const rate = parseFloat(wonDetailsForm.dollarRate) || 0;
        computedSalesValue = dollarAmt * rate;
        if (computedSalesValue <= 0) {
          alert('Please enter valid Dollar Amount and Exchange Rate');
          return;
        }
      } else {
        computedSalesValue = wonDetailsForm.salesValue ? parseFloat(wonDetailsForm.salesValue) : null;
      }

      const payload = {
        quoteId: wonDetailsQuote.quoteId,
        invoiceNumber: wonDetailsForm.invoiceNumber || null,
        cost: wonDetailsForm.cost ? parseFloat(wonDetailsForm.cost) : null,
        salesValue: computedSalesValue
      };

      await updateWonDetails(payload);
      await loadQuoteOutcome(wonDetailsQuote.quoteId);
      setWonDetailsModalShow(false);
      setWonDetailsQuote(null);
      alert('Won details updated successfully!');
    } catch (error) {
      console.error('Error updating won details:', error);
      alert('Failed to update won details');
    }
  };

  // Open won details modal for a quote
  const openWonDetailsModal = (quoteId) => {
    const quote = allQuotes.find(q => q.quoteId === quoteId);
    const outcome = quoteOutcomes[quoteId];
    setWonDetailsQuote(quote);
    setWonDetailsForm({
      invoiceNumber: outcome?.invoiceNumber || '',
      cost: outcome?.cost || '',
      salesValue: outcome?.salesValue || ''
    });
    setWonDetailsModalShow(true);
  };

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Load quotes when page, filters, debounced search, or permission changes.
  // Guard: do NOT fetch until permission has resolved from the server.
  // Without this guard the effect fires on mount while permission is still null,
  // returning ALL quotes briefly — a visible flash of wrong data for non-admins.
  useEffect(() => {
    if (permission === null || permission === undefined) return;
    loadQuotes();
  }, [currentPage, pageSize, debouncedSearch, filters, isAdmin, permission?.EmployeeId]);

  // Filter configuration for Quotes
  const quoteFilterConfig = [
    { key: 'category', label: 'Category', allLabel: 'All Categories', minWidth: '160px', options: [
      { value: 'air', label: 'Air' },
      { value: 'sea', label: 'Sea' },
      { value: 'multimodal', label: 'MultiModal' },
      { value: 'warehouse', label: 'Warehouse' }
    ]},
    { key: 'type', label: 'Type', allLabel: 'All Types', minWidth: '140px', options: [
      { value: 'direct', label: 'Direct' },
      { value: 'transit', label: 'Transit' },
      { value: 'multimodal', label: 'MultiModal' },
      { value: 'warehouse', label: 'Warehouse' }
    ]},
    { key: 'status', label: 'Status', allLabel: 'All Statuses', minWidth: '150px', options: [
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' }
    ]}
  ];

  // Load warehouse quotes once on mount; reload stats when permission changes
  useEffect(() => {
    loadWarehouseQuotes();
  }, []);

  useEffect(() => {
    if (permission === null || permission === undefined) return;
    loadStatsCounts();
  }, [isAdmin, permission?.EmployeeId]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const apiFilters = getApiParams();
      const categoryParam = apiFilters.category || 'all';
      const typeParam = apiFilters.type || 'all';
      // Non-admin users only see quotes they created.
      // permission.EmployeeId matches q.CreatedBy (emp_reg.SysID) in the backend.
      if (!isAdmin && permission?.EmployeeId) {
        apiFilters.createdBy = permission.EmployeeId;
      }
      const result = await fetchQuotesPaged(currentPage, pageSize, debouncedSearch, categoryParam, typeParam, apiFilters);
      setQuotes(result.data || []);
      setTotalCount(result.totalCount || 0);

      // Load outcomes for current page quotes
      (result.data || []).forEach(quote => {
        loadQuoteOutcome(quote.quoteId);
      });
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Load warehouse quotes
  const loadWarehouseQuotes = async () => {
    try {
      const warehouseData = await fetchWareQuote();
      // const warehouseData = response.data;
      
      // Transform warehouse quotes to match freight quote structure
      const transformedWarehouse = warehouseData.map(wq => ({
        quoteId: `WH-${wq.sysId}`,
        quoteNumber: wq.quoteNumber,
        customer: wq.customerName,
        freightCategory: 'warehouse',
        freightType: 'warehouse',
        freightMode: 'storage',
        portOfLoading: null,
        portOfDischarge: null,
        createdDate: wq.createdAt,
        rateValidity: wq.validityDate,
        status: wq.status?.toLowerCase() || 'active',
        fullName: wq.fullName, // Creator's name
        warehouseData: wq, // Store original warehouse data
        isWarehouse: true
      }));
      
      setWarehouseQuotes(transformedWarehouse);
    } catch (error) {
      console.error('Error loading warehouse quotes:', error);
    }
  };

  const loadStatsCounts = async () => {
    try {
      // Non-admin users only see counts for their own quotes
      const createdByFilter = (!isAdmin && permission?.EmployeeId)
        ? String(permission.EmployeeId)
        : '';
      const counts = await fetchQuoteCounts(createdByFilter);
      setStatsCounts(prev => ({
        ...prev,
        total: (counts.total || 0) + warehouseQuotes.length,
        air: counts.air || 0,
        sea: counts.sea || 0,
        multimodal: counts.multimodal || 0,
        warehouse: warehouseQuotes.length
      }));
    } catch (error) {
      console.error('Error loading stats counts:', error);
    }
  };

  // Update stats warehouse count when warehouse quotes load
  useEffect(() => {
    setStatsCounts(prev => ({
      ...prev,
      total: (prev.total - prev.warehouse) + warehouseQuotes.length,
      warehouse: warehouseQuotes.length
    }));
  }, [warehouseQuotes]);

  // Combine all quotes - quotes are already paginated/filtered from server
  const allQuotes = [...quotes, ...warehouseQuotes];

  const handleView = (quote) => {
    if (quote.isWarehouse) {
      // Navigate to warehouse quote view
      navigate(`/warehouse-quotes/${quote.warehouseData.sysId}`);
      return;
    }
    
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
    if (!canEditQuotes) {
      alert('You do not have permission to edit quotes.');
      return;
    }
    if (isQuoteLocked(quote)) {
      alert('This quote has been submitted and is locked. Contact an administrator to make changes.');
      return;
    }

    if (quote.isWarehouse) {
      // Navigate to warehouse quote edit
      navigate(`/warehouse-quotes/${quote.warehouseData.sysId}?edit=true`);
      return;
    }

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
      quoteNumber: quote.quoteNumber,
      isWarehouse: quote.isWarehouse || false
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteModal.isWarehouse) {
        // Delete warehouse quote
        const warehouseId = deleteModal.quoteId.replace('WH-', '');
        await deleteWareQuote(warehouseId);
        loadWarehouseQuotes();
      } else {
        // Delete freight quote
        await deleteQuote(deleteModal.quoteId);
        loadQuotes();
        loadStatsCounts();
      }

      setDeleteModal({ show: false, quoteId: null, quoteNumber: '', isWarehouse: false });
      alert('Quote deleted successfully!');
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const confirmSubmit = (quote) => {
    setSubmitModal({
      show: true,
      quoteId: quote.quoteId,
      quoteNumber: quote.quoteNumber
    });
  };

  const handleSubmitStatus = async () => {
    try {
      await updateQuoteStatus(submitModal.quoteId, 'submitted');
      setSubmitModal({ show: false, quoteId: null, quoteNumber: '' });
      loadQuotes();
      alert('Quote submitted successfully!');
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote');
    }
  };

  const getFreightIcon = (category, mode) => {
    if (category === 'warehouse') return { icon: Warehouse, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' };
    if (category === 'air' && mode === 'import') return { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' };
    if (category === 'air' && mode === 'export') return { icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' };
    if (category === 'sea' && (mode === 'import' || mode === 'fcl' || mode === 'lcl')) return { icon: Container, color: 'text-teal-600', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-800' };
    if (category === 'sea' && mode === 'export') return { icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' };
    if (category === 'multimodal') return { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' };
    return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' };
  };

  const getTypeIcon = (type) => {
    if (type === 'warehouse') return { icon: Warehouse, color: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' };
    if (type === 'direct') return { icon: RouteIcon, color: 'text-green-600', badge: 'bg-green-100 text-green-800' };
    if (type === 'transit') return { icon: Layers, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' };
    if (type === 'multimodal') return { icon: Truck, color: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' };
    return { icon: RouteIcon, color: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' }
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

  // Updated to calculate total across all segments for multimodal and warehouse
  const calculateTotalAmount = (quote) => {
    try {
      let total = 0;

      // Warehouse quote calculation
      if (quote.isWarehouse && quote.warehouseData) {
        const lineItems = quote.warehouseData.lineItems || [];
        total = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        return total.toFixed(2);
      }

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

  // Freight quotes are already filtered/paginated from server
  // Only client-filter warehouse quotes to match current filters
  const filteredWarehouse = warehouseQuotes.filter(quote => {
    const matchesSearch = !debouncedSearch ||
      quote.quoteNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      quote.customer?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesTypeFilter = filters.type.length === 0 || filters.type.includes(quote.freightType);
    const matchesCategoryFilter = filters.category.length === 0 || filters.category.includes(quote.freightCategory);
    return matchesSearch && matchesTypeFilter && matchesCategoryFilter;
  });

  // Combine freight quotes with warehouse quotes and sort by date descending
  // On page 1, merge warehouse quotes in date order. On other pages, only freight quotes.
  const filteredQuotes = currentPage === 1
    ? [...quotes, ...filteredWarehouse].sort((a, b) => {
        const dateA = new Date(a.createdDate || 0);
        const dateB = new Date(b.createdDate || 0);
        return dateB - dateA; // Newest first
      })
    : [...quotes];

  // Total pages based on freight quote count from server (warehouse added to page 1)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Freight Quotes</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your freight quotations</p>
        </div>
        {canAddQuotes && (
          <button
            onClick={() => modalOpen('quote')}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all"
          >
            <Plus size={20} />
            Create Quote
          </button>
        )}
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
          <FilterPanel
            filterConfig={quoteFilterConfig}
            filters={filters}
            onFilterChange={setFilter}
            onClearAll={clearAllFilters}
            accentColor="teal"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-800">{statsCounts.total}</p>
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
                {statsCounts.air}
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
                {statsCounts.sea}
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
                {statsCounts.multimodal}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Truck className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warehouse</p>
              <p className="text-2xl font-bold text-gray-800">
                {statsCounts.warehouse}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Warehouse className="text-amber-600" size={24} />
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
            {searchTerm || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Create your first quote to get started'}
          </p>
          {!searchTerm && !hasActiveFilters && canAddQuotes && (
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
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[11%]" />
                  <col className="w-[9%]" />
                  <col className="w-[8%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quote Details
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Freight
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Sales Person
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
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
                    const outcomeStatus = quoteOutcomes[quote.quoteId]?.outcomeStatus;
                    const rowBg = outcomeStatus === 'won' ? 'bg-green-50 hover:bg-green-100' : outcomeStatus === 'lost' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50';

                    return (
                      <tr key={quote.quoteId} className={`${rowBg} transition-colors`}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${freightIcon.bg} ${freightIcon.color} flex items-center justify-center flex-shrink-0`}>
                              <FreightIconComponent size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">{quote.quoteNumber}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <TypeIconComponent size={12} className={typeIcon.color} />
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeIcon.badge} capitalize`}>
                                  {quote.freightType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${freightIcon.badge} capitalize`}>
                              {quote.freightCategory}
                            </span>
                            <div className="text-xs text-gray-500 mt-1 capitalize">{quote.freightMode}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{quote.customer || '-'}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs"><SalesPerson customerName={quote.customer} /></span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {quote.isWarehouse ? (
                            <span className="text-xs text-gray-500 italic">Warehouse</span>
                          ) : quote.freightType === 'multimodal' ? (
                            <div className="max-w-full overflow-hidden">
                              {getMultiModalRouteDisplay(quote)}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-xs text-gray-700">
                                <MapPin size={12} className="text-green-500 flex-shrink-0" />
                                <span className="truncate">{quote.portOfLoading || '-'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-700">
                                <MapPin size={12} className="text-red-500 flex-shrink-0" />
                                <span className="truncate">{quote.portOfDischarge || '-'}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar size={12} className="text-gray-400 flex-shrink-0" />
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
                                Till: {new Date(quote.rateValidity).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          {getStatusBadge(quote.status)}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{quote.fullName || '-'}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-col gap-1">
                            {!quote.isWarehouse && getOutcomeBadge(quote.quoteId)}
                            {isAdmin && !quote.isWarehouse && quoteOutcomes[quote.quoteId]?.outcomeStatus === 'won' && (
                              <button
                                onClick={() => openWonDetailsModal(quote.quoteId)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium hover:bg-blue-100 transition-colors mt-1"
                                title="Update Won Details"
                              >
                                <FileText size={10} />
                                Update Details
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canEditQuotes && !quote.isWarehouse && (!quote.status || quote.status === 'draft') && (
                              <button
                                onClick={() => confirmSubmit(quote)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Submit Quote"
                              >
                                <Send size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => handleView(quote)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={15} />
                            </button>
                            {canEditQuotes && !isQuoteLocked(quote) && (
                              <button
                                onClick={() => handleEdit(quote)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDeleteQuotes && (
                              <button
                                onClick={() => confirmDelete(quote)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuotes.map((quote) => {
              const freightIcon = getFreightIcon(quote.freightCategory, quote.freightMode);
              const typeIcon = getTypeIcon(quote.freightType);
              const FreightIconComponent = freightIcon.icon;
              const TypeIconComponent = typeIcon.icon;
              const mobileOutcomeStatus = quoteOutcomes[quote.quoteId]?.outcomeStatus;
              const mobileBg = mobileOutcomeStatus === 'won' ? 'bg-green-50 border-green-200' : mobileOutcomeStatus === 'lost' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';

              return (
                <div key={quote.quoteId} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${mobileBg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${freightIcon.bg} ${freightIcon.color} flex items-center justify-center flex-shrink-0`}>
                        <FreightIconComponent size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{quote.quoteNumber}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <TypeIconComponent size={12} className={typeIcon.color} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeIcon.badge} capitalize`}>
                            {quote.freightType}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-700">{quote.customer || '-'}</span>
                    </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <SalesPerson customerName={quote.customer} />
                      </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-blue-400" />
                      <span className="text-gray-600">Created by: {quote.fullName || '-'}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${freightIcon.badge} capitalize`}>
                      {quote.freightCategory} - {quote.freightMode}
                    </span>
                    {quote.isWarehouse ? (
                      <span className="block text-xs text-gray-500 italic mt-2">Warehouse Services</span>
                    ) : quote.freightType === 'multimodal' ? (
                      <div className="mt-2">
                        {getMultiModalRouteDisplay(quote)}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={14} className="text-green-500" />
                          <span className="truncate">{quote.portOfLoading || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={14} className="text-red-500" />
                          <span className="truncate">{quote.portOfDischarge || '-'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(quote.createdDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    {!quote.isWarehouse && getOutcomeBadge(quote.quoteId)}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3">
                    {canEditQuotes && !isQuoteLocked(quote) && (
                      <button
                        onClick={() => handleEdit(quote)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                    )}
                    {canDeleteQuotes && (
                      <button
                        onClick={() => confirmDelete(quote)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} freight quotes
                  {filteredWarehouse.length > 0 && currentPage === 1 && ` (+${filteredWarehouse.length} warehouse)`}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    const pages = [];
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(totalPages, start + 4);
                    if (end - start < 4) start = Math.max(1, end - 4);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            i === currentPage
                              ? 'bg-teal-600 text-white font-medium'
                              : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
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
                onClick={() => setDeleteModal({ show: false, quoteId: null, quoteNumber: '', isWarehouse: false })}
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
      
      {/* Submit Confirmation Modal */}
      {submitModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Send className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit Quote</h3>
                <p className="text-sm text-gray-500">Change status from Draft to Submitted</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to submit quote <span className="font-semibold">{submitModal.quoteNumber}</span>?
              The status will be changed to <span className="font-semibold text-blue-600">Submitted</span>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSubmitModal({ show: false, quoteId: null, quoteNumber: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitStatus}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Submit Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal removed - now saves directly on button click */}

      {/* Won Details Modal (Admin Only) */}
      {wonDetailsModalShow && wonDetailsQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Won Details</h3>
                <p className="text-sm text-gray-500">Quote: {wonDetailsQuote.quoteNumber}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={wonDetailsForm.invoiceNumber}
                  onChange={(e) => setWonDetailsForm({ ...wonDetailsForm, invoiceNumber: e.target.value })}
                  placeholder="Enter invoice number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">LKR</span>
                  <input
                    type="number"
                    value={wonDetailsForm.cost}
                    onChange={(e) => setWonDetailsForm({ ...wonDetailsForm, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Value Currency
                </label>
                <div className="flex gap-2 mb-3">
                  {['LKR', 'USD'].map(c => (
                    <button key={c}
                      type="button"
                      onClick={() => setWonDetailsForm({ ...wonDetailsForm, currency: c })}
                      className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        wonDetailsForm.currency === c
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>

                {wonDetailsForm.currency === 'LKR' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sales Value (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">LKR</span>
                      <input
                        type="number"
                        value={wonDetailsForm.salesValue}
                        onChange={(e) => setWonDetailsForm({ ...wonDetailsForm, salesValue: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Dollar Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={wonDetailsForm.dollarAmount}
                          onChange={(e) => setWonDetailsForm({ ...wonDetailsForm, dollarAmount: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Exchange Rate (1 USD = ? LKR)</label>
                      <input
                        type="number"
                        value={wonDetailsForm.dollarRate}
                        onChange={(e) => setWonDetailsForm({ ...wonDetailsForm, dollarRate: e.target.value })}
                        placeholder="e.g. 320.50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {wonDetailsForm.dollarAmount && wonDetailsForm.dollarRate && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-xs text-blue-600 font-medium">Converted Sales Value: </span>
                        <span className="text-sm font-bold text-blue-800">
                          LKR {((parseFloat(wonDetailsForm.dollarAmount) || 0) * (parseFloat(wonDetailsForm.dollarRate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setWonDetailsModalShow(false);
                  setWonDetailsQuote(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWonDetails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal removed - outcome saved directly on button click */}
    </div>
  );
}