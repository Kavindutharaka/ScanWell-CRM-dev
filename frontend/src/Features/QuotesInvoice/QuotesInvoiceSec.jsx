import React, { useState, useEffect } from "react";
import {
  MessageCircleHeart,
  MessageCircle,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Plus,
  Users,
  Share2,
  FileText,
  Download,
  Send,
  AlertCircle,
  Clipboard,
  DollarSign,
} from "lucide-react";
import API from '../../api/QuotesInvoiceAPI';
import PreviewModal from './PreviewModal';
import { generatePDF } from './QuotationTemplate';

export default function QuotesInvoiceSec({ modalOpen, onEditDocument, refreshTrigger, openRateModal }) {
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [selectQuotes, setSelectQuotes] = useState({});
  
  // PDF Preview & Generation States
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch documents from API
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.fetchQuotes();
      console.log('Fetched quotes:', data);
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Transform quote data to PDF format
  const transformQuoteToPDFData = (quote) => {
    try {
      const directRoute = quote.directRouteJson ? JSON.parse(quote.directRouteJson) : {};
      const transitRoute = quote.transitRouteJson ? JSON.parse(quote.transitRouteJson) : {};
      const routePlan = quote.routePlanJson ? JSON.parse(quote.routePlanJson) : {};
      const freightCharges = quote.freightChargesJson ? JSON.parse(quote.freightChargesJson) : [];
      const additionalCharges = quote.additionalChargesJson ? JSON.parse(quote.additionalChargesJson) : [];
      const customTerms = quote.customTermsJson ? JSON.parse(quote.customTermsJson) : [];

      const activeRoute = quote.freightCategory === 'transit' ? transitRoute : directRoute;
      const pol = activeRoute?.portOfLoading?.portId || routePlan?.origin?.airportPortCode || '-';
      const pod = activeRoute?.portOfDischarge?.portId || routePlan?.destination?.airportPortCode || '-';
      const deliveryTerms = activeRoute?.portOfDischarge?.incoterm || activeRoute?.portOfLoading?.incoterm || '-';

      const transformedFreightCharges = freightCharges.map(charge => ({
        carrier: charge.carrier || activeRoute?.portOfLoading?.carrier || '-',
        equip: charge.equipment || charge.uom || routePlan?.origin?.equipment || '-',
        containers: charge.containers || charge.units || 0,
        rate: charge.rate || charge.origin || 0,
        rateUnit: charge.rateUnit || 'per unit',
        currency: charge.currency || activeRoute?.portOfLoading?.currency || 'USD',
        surcharge: charge.surcharge || '-',
        tt: charge.transitTime || routePlan?.transitTime || '-',
        freq: charge.frequency || 'WEEKLY',
        route: quote.freightCategory?.toUpperCase() || 'DIRECT',
        comments: charge.comments || charge.chargeName || ''
      }));

      const groupedCharges = additionalCharges.reduce((acc, charge) => {
        const currency = charge.currency || 'USD';
        if (!acc[currency]) {
          acc[currency] = { items: [], total: 0 };
        }
        const quantity = parseFloat(charge.quantity) || 1;
        const rate = parseFloat(charge.rate) || 0;
        const amount = charge.amount || (quantity * rate);
        acc[currency].items.push({
          name: charge.name || 'Additional Charge',
          amount: amount,
          unit: charge.unit || 'per Shipment'
        });
        acc[currency].total += amount;
        return acc;
      }, {});

      const otherCharges = {
        lkr: groupedCharges.LKR || { items: [], total: 0 },
        usd: groupedCharges.USD || { items: [], total: 0 }
      };

      const defaultTerms = [
        'RATES ARE VALID TILL <> - SUBJECT TO SURCHARGE FLUCTUATIONS AS PER THE CARRIER',
        'RATES ARE SUBJECT TO INWARD LOCAL HANDLING CHARGES OF LKR.18000.00 + VAT (SVAT)',
        'RATES ARE QUOTED ON FOB/EXW BASIS',
        'RATES ARE NOT APPLICABLE FOR DANGEROUS GOODS OR PERISHABLE CARGO',
        'DUE TO THE CURRENT MARITIME CONSTRAINTS',
        'VESSELS ARE SUBJECT TO BLANK SAILINGS/OMITTING COLOMBO PORT, ROLL OVERS WITH OR WITHOUT PRIOR NOTICE'
      ];

      const customerDisplayName = quote.customerName || quote.clientName || 'N/A';

      return {
        company: {
          logoUrl: "",
          name: "Scanwell Logistics Colombo (Pvt) Ltd.",
          address: "67/1 Hudson Road Colombo 3 Sri Lanka.",
          phone: "+94 11 2426600/4766400"
        },
        meta: {
          quoteNumber: quote.quoteId || 'N/A',
          serviceType: quote.freightMode || 'Freight Service',
          terms: 'Credit Terms'
        },
        customer: {
          name: customerDisplayName,
          address: 'N/A'
        },
        shipment: {
          pickupAddress: '',
          deliveryAddress: '',
          pol: pol,
          pod: pod,
          deliveryTerms: deliveryTerms,
          pcs: parseInt(routePlan?.origin?.totalPieces) || 0,
          volume: parseFloat(routePlan?.origin?.cbm) || 0,
          grossWeight: parseFloat(routePlan?.origin?.grossWeight) || 0,
          chargeableWeight: parseFloat(routePlan?.origin?.chargeableWeight) || 0
        },
        freightCharges: transformedFreightCharges,
        otherCharges: otherCharges,
        termsAndConditions: [...defaultTerms, ...customTerms.filter(t => t && t.trim())],
        generatedBy: quote.createdBy || 'System'
      };
    } catch (error) {
      console.error('Error transforming quote data:', error);
      throw new Error('Failed to transform quote data for PDF generation');
    }
  };

  // Handle PDF Preview
  const handlePreview = (quote) => {
    try {
      const transformedData = transformQuoteToPDFData(quote);
      setPreviewData(transformedData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error preparing preview:', error);
      alert('Failed to prepare quotation preview.');
    }
  };

  // Handle Direct PDF Download
  const handleDirectDownload = async (quote) => {
    setIsGeneratingPDF(true);
    try {
      const transformedData = transformQuoteToPDFData(quote);
      setPreviewData(transformedData);
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const filename = `${quote.quoteId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const result = await generatePDF(transformedData, filename);
      if (result.success) {
        alert('PDF generated successfully!');
      }
      setShowPreview(false);
      setPreviewData(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Load documents on mount and when refreshTrigger changes
  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  // Filter documents based on active tab
  const getFilteredDocuments = () => {
    let filtered = documents;
    
    switch (activeTab) {
      case 'quotes':
        filtered = documents.filter(doc => 
          doc.type?.toLowerCase() === 'quote'
        );
        break;
      case 'invoices':
        filtered = documents.filter(doc => 
          doc.type?.toLowerCase() === 'invoice'
        );
        break;
      default:
        filtered = documents;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.quoteId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.freightMode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Handle refresh
  const handleRefresh = () => {
    loadDocuments();
  };

  const manageRates =()=>{
    openRateModal();
  };

  // Handle view/edit document
  const handleEdit = (doc) => {
    if (onEditDocument) {
      onEditDocument(doc);
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType?.includes('air') && normalizedType?.includes('import')) return 'bg-amber-500';
    if (normalizedType?.includes('air') && normalizedType?.includes('export')) return 'bg-emerald-500';
    if (normalizedType?.includes('sea') && normalizedType?.includes('import')) return 'bg-yellow-500';
    if (normalizedType?.includes('sea') && normalizedType?.includes('export')) return 'bg-green-500';
    return 'bg-slate-500';
  };

  // Get status color
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'approved': return 'bg-purple-500';
      case 'sent': return 'bg-cyan-500';
      case 'draft': return 'bg-slate-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateDropdown && !event.target.closest('.create-dropdown-container')) {
        setShowCreateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCreateDropdown]);

  // Status badge component
  const StatusBadge = ({ status, color }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      {status || 'Draft'}
    </div>
  );

  // Type badge component
  const TypeBadge = ({ type, color }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      {type || 'N/A'}
    </div>
  );

  // Avatar component
  const Avatar = ({ name, color = "bg-slate-600" }) => (
    <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm`}>
      <span className="text-xs font-semibold">{name || 'NA'}</span>
    </div>
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const createQutoes =()=>{
    modalOpen('quote');
  };

  const createRates =()=>{
    
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-teal-50/30 min-h-full">
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
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Page Header */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Quotes
              </h1>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Provide feedback"
            >
              <MessageCircleHeart className="w-4 h-4 text-pink-500 group-hover:text-pink-600" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            <button 
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Invite team members"
              >
                <Users className="w-4 h-4 text-teal-500 group-hover:text-teal-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button 
                className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Share documents"
              >
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex  items-center gap-3">
            {/* Create New Dropdown */}
            <div className="create-dropdown-container relative z-50">
              <button 
                onClick={() => createQutoes()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Create New</span>
              </button>
            </div>   
            {/* Filter Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm"
              title="Filter documents"
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={loadDocuments}
                  className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="animate-pulse p-8">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Quote ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Freight Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {doc.quoteId || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {doc.customerName || doc.clientName || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <TypeBadge type={doc.freightMode} color={getTypeColor(doc.freightMode)} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.freightCategory || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(doc.createdDate)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handlePreview(doc)}
                            className="p-1 hover:bg-teal-50 rounded transition-colors"
                            title="Preview Quotation"
                          >
                            <Eye className="w-4 h-4 text-teal-600" />
                          </button>
                          <button 
                            onClick={() => handleDirectDownload(doc)}
                            disabled={isGeneratingPDF}
                            className="p-1 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            <Download className={`w-4 h-4 text-blue-600 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                          </button>
                          <button 
                            onClick={() => handleEdit(doc)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Edit document"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Avatar name={doc.createdBy?.substring(0, 2).toUpperCase() || 'SU'} color="bg-teal-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No {activeTab === 'main' ? 'documents' : activeTab} yet
              </h3>
              <p className="text-slate-500 mb-4">
                Get started by creating your first {activeTab === 'main' ? 'quote or invoice' : activeTab.slice(0, -1)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => modalOpen('quote')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Quote
                </button>
                <button 
                  onClick={() => modalOpen('invoice')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Invoice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Documents"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="h-8"></div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewData(null);
          }}
          quotationData={previewData}
        />
      )}
    </div>
  );
}