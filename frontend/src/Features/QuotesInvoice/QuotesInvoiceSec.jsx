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
import * as QuotesInvoiceAPI from '../../api//QuotesInvoiceAPI';
import PdfGenerator from '../../components/PdfGenerator';
import SeaImport from '../../AirImport';
import AirExport from "../../AirExport";
import SeaImportLcl from "../../SeaImportLcl";
import SeaImportFcl from "../../SeaImportFcl";
import SeaExportFcl from "../../SeaExportFcl";
import SeaExportLcl from "../../SeaExportLcl";

export default function QuotesInvoiceSec({ modalOpen, onEditDocument, refreshTrigger, openRateModal }) {
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [selectQuotes, setSelectQuotes] = useState({});
  const [importCopy, setImportCopy] = useState(false);
  const [exportCopy, setExportCopy] = useState(false);
   const [seaImportFCLCopy, setSeaImportFCLCopy] = useState(false);
  const [seaImportLCLCopy, setSeaImportLCLCopy] = useState(false);
    const [seaExportFclCopy, setSeaExportFclCopy] = useState(false);
    const [seaExportLclCopy, setSeaExportLclCopy] = useState(false);

  // Fetch documents from API
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      // const data = await QuotesInvoiceAPI.fetchDocuments();
      // setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
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
        doc.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.status?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Handle download PDF
  const handleCopy = async (doc) => {
    setSelectQuotes(doc);
    if(doc.freightType === "air-import"){
      console.log("air import trigger!!!");
      setImportCopy(true);
    }else if(doc.freightType === "air-export"){
      console.log("air export trigger!!!");
      setExportCopy(true);
    }else if(doc.freightType === "sea-import-fcl"){
      console.log("Sea import fcl trigger!!!");
      setSeaImportFCLCopy(true);
    }else if(doc.freightType === "sea-import-lcl"){
      console.log("Sea import lcl trigger!!!");
      setSeaImportLCLCopy(true);
    }else if(doc.freightType === "sea-export-fcl"){
      console.log("Sea export fcl trigger!!!");
      setSeaExportFclCopy(true);
    }else if(doc.freightType === "sea-export-lcl"){
      console.log("Sea export lcl trigger!!!");
      setSeaExportLclCopy(true);
    }
    console.log("this is data",doc.rateData);
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
    if (normalizedType === 'air-import') return 'bg-amber-500';
    if (normalizedType === 'air-export') return 'bg-emerald-500';
    if (normalizedType === 'sea-import-fcl' || normalizedType === 'sea-import-lcl') return 'bg-yellow-500';
    if (normalizedType === 'sea-export-fcl' || normalizedType === 'sea-export-fcl') return 'bg-green-500';
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
      {status}
    </div>
  );

  // Type badge component
  const TypeBadge = ({ type, color }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      {type}
    </div>
  );

  // Avatar component
  const Avatar = ({ name, color = "bg-slate-600" }) => (
    <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm`}>
      <span className="text-xs font-semibold">{name}</span>
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

        {/* Category Tabs */}
        {/* <div className={`flex gap-1 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'main'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Main Table
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'quotes'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quotes
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'invoices'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Invoices
          </button>
        </div> */}

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
              {/* <button 
                onClick={() => createRates()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Create Rates</span>
              </button> */}
            </div>
             <button 
                onClick={() => manageRates()}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <DollarSign className="w-5 h-5" />
                <span>Manage Rates</span>
              </button>     
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">FreightType</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Recipient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Issue Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {doc.documentNumber}
                      </td>
                      <td className="px-4 py-4">
                        <TypeBadge type={doc.freightType} color={getTypeColor(doc.freightType)} />
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(doc.amount || 0)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {doc.recipient}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={doc.status} color={getStatusColor(doc.status)} />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(doc.issueDate)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">              
                          <button 
                            onClick={() => handleEdit(doc)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Edit document"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button 
                            onClick={() => handleCopy(doc)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Copy Invoice"
                          >
                            <Clipboard className="w-4 h-4 text-slate-600" />
                          </button>                         
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Avatar name={'CS'|| 'NA'} color="bg-teal-600" />
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
      <div className="hidden">
                <SeaImport
                name={selectQuotes.recipient}
                origin={selectQuotes.recipientAddress}
                rateData={selectQuotes.rateData}
                additionalCharges={selectQuotes.additionalCharges}
                remarks={selectQuotes.remarksList}
                autoCopy={importCopy}
                />
            </div>
             <div className="hidden">
                      <AirExport
                      name={selectQuotes.recipient}
                      origin={selectQuotes.recipientAddress}
                      rateData={selectQuotes.rateData}
                      additionalCharges={selectQuotes.additionalCharges}
                      remarks={selectQuotes.remarksList}
                      autoCopy={exportCopy}
                      currency="USD"
                      />
                  </div>
             <div className="hidden">
                      <SeaImportFcl
                      name={selectQuotes.recipient}
                      origin={selectQuotes.recipientAddress}
                      rateData={selectQuotes.rateData}
                      additionalCharges={selectQuotes.additionalCharges}
                      remarks={selectQuotes.remarksList}
                      autoCopy={seaImportFCLCopy}
                      currency="USD"
                      />
                  </div>
             <div className="hidden">
                      <SeaImportLcl
                      name={selectQuotes.recipient}
                      origin={selectQuotes.recipientAddress}
                      rateData={selectQuotes.rateData}
                      additionalCharges={selectQuotes.additionalCharges}
                      remarks={selectQuotes.remarksList}
                      autoCopy={seaImportLCLCopy}
                      currency="USD"
                      />
                  </div>
                   <div className="hidden">
                            <SeaExportFcl
                            name={selectQuotes.recipient}
                      origin={selectQuotes.recipientAddress}
                      rateData={selectQuotes.rateData}
                      additionalCharges={selectQuotes.additionalCharges}
                      remarks={selectQuotes.remarksList}
                      autoCopy={seaExportFclCopy}
                      currency="USD"
                            />
                        </div>
                   <div className="hidden">
                            <SeaExportLcl
                            name={selectQuotes.recipient}
                      origin={selectQuotes.recipientAddress}
                      rateData={selectQuotes.rateData}
                      additionalCharges={selectQuotes.additionalCharges}
                      remarks={selectQuotes.remarksList}
                      autoCopy={seaExportLclCopy}
                      currency="USD"
                            />
                        </div>
    </div>
  );
}