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
  AlertCircle,
} from "lucide-react";
import API from '../../api/QuotesInvoiceAPI';
import PreviewModal from './PreviewModal';
// Import jsPDF and AutoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import Logo
import logo from '../../assets/images/logo.png';

export default function QuotesInvoiceSec({ modalOpen, onEditDocument, refreshTrigger, openRateModal }) {
  const [activeTab, setActiveTab] = useState('main');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  
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

  // --- 1. Data Transformation Logic (Parses your Backend JSON) ---
  const transformQuoteToPDFData = (quote) => {
    try {
      // 1. Parse JSON strings safely
      const safeParse = (str, fallback) => {
        try {
          return str ? JSON.parse(str) : fallback;
        } catch (e) {
          console.error("JSON Parse error", e);
          return fallback;
        }
      };

      const directRoute = safeParse(quote.directRoute, {});
      const transitRoute = safeParse(quote.transitRoute, {});
      const freightChargesRaw = safeParse(quote.freightCharges, { origin: [], destination: [] });
      const handlingChargesRaw = safeParse(quote.handlingCharges, { origin: [], destination: [] });
      const termsRaw = safeParse(quote.termsConditions, []);
      const customTermsRaw = safeParse(quote.customTerms, []);

      // 2. Determine Route Data (Direct vs Transit)
      const isTransit = quote.freightCategory === 'transit';
      const activeRoute = isTransit ? transitRoute : directRoute;
      const options = activeRoute.options || [];
      const selectedOption = options.length > 0 ? options[0] : {}; // Default to Option 1

      // 3. Map Shipment Details
      const fmt = (num) => num ? parseFloat(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00";

      // 4. Map Freight Charges (Combine Origin + Destination)
      const combinedFreight = [...(freightChargesRaw.origin || []), ...(freightChargesRaw.destination || [])];
      
      // 5. Map Handling Charges to LKR/USD Lists
      const lkrCharges = [];
      const usdCharges = [];
      let lkrTotal = 0;
      let usdTotal = 0;

      const processHandling = (list) => {
        if (!list) return;
        list.forEach(c => {
          const amount = parseFloat(c.chargeAmount) || 0;
          const item = {
            name: c.chargeName,
            amount: amount,
            unit: c.uom ? `per ${c.uom}` : 'per Shipment'
          };
          if (c.currency === 'LKR') {
            lkrCharges.push(item);
            lkrTotal += amount;
          } else {
            usdCharges.push(item);
            usdTotal += amount;
          }
        });
      };

      processHandling(handlingChargesRaw.origin);
      processHandling(handlingChargesRaw.destination);

      return {
        company: {
          name: "Scanwell Logistics Colombo (Pvt) Ltd.",
          address: "67/1 Hudson Road Colombo 3 Sri Lanka.",
          phone: "+94 11 2426600/4766400"
        },
        meta: {
          quoteNumber: quote.quoteId || 'N/A',
          serviceType: quote.freightMode || 'Freight Service',
          terms: 'Credit Terms' // You might want to map creditTermsId to a label if you have the list
        },
        customer: {
          name: quote.customerName || quote.clientName || 'N/A',
          address: '' // Address isn't in the root object, might need to be fetched or stored
        },
        shipment: {
          pickupAddress: '', // Not in root object
          deliveryAddress: '', // Not in root object
          pol: activeRoute.portOfLoading || '-',
          pod: activeRoute.portOfDischarge || '-',
          deliveryTerms: selectedOption.incoterm || '-',
          pcs: selectedOption.totalPieces || '0',
          volume: fmt(selectedOption.cbm),
          grossWeight: fmt(selectedOption.grossWeight),
          chargeableWeight: fmt(selectedOption.chargeableWeight)
        },
        // Map to Table Format
        freightTable: combinedFreight.map(fc => ({
          carrier: selectedOption.carrier || "TBA",
          equip: selectedOption.equipment || "",
          containers: selectedOption.units || "0",
          rate: `${fmt(fc.chargeAmount)} per ${fc.uom || 'Unit'}`,
          currency: fc.currency || 'USD',
          surcharge: "",
          tt: "10", 
          freq: "WEEKLY",
          route: quote.freightCategory ? quote.freightCategory.toUpperCase() : "DIRECT",
          comments: ""
        })),
        otherCharges: {
          lkr: { items: lkrCharges, total: lkrTotal },
          usd: { items: usdCharges, total: usdTotal }
        },
        terms: [...termsRaw, ...customTermsRaw],
        generatedBy: quote.createdBy || 'System'
      };
    } catch (error) {
      console.error('Error transforming quote data:', error);
      throw new Error('Failed to transform quote data');
    }
  };

  // --- 2. PDF Generation Logic (The Scanwell Layout) ---
  const generatePDF = (data, filename) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    doc.addImage(logo, 'PNG', 15, 10, 45, 12); // Logo

    doc.setTextColor(50, 80, 120);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(data.company.name, pageWidth - 15, 20, { align: 'right' });
    
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(data.company.address, pageWidth - 15, 25, { align: 'right' });
    doc.text(`Office #${data.company.phone}`, pageWidth - 15, 29, { align: 'right' });

    // Title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("QUOTATION", pageWidth / 2, 40, { align: 'center' });

    // --- Meta ---
    let currentY = 55;
    doc.setFontSize(9);
    doc.text(data.meta.quoteNumber, 15, currentY);
    doc.text(data.meta.serviceType, pageWidth - 15, currentY, { align: 'right' });
    doc.text(data.meta.terms, pageWidth - 15, currentY + 4, { align: 'right' });

    // --- Customer ---
    currentY += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("Customer", 15, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(data.customer.name, 15, currentY + 5);
    const addressLines = doc.splitTextToSize(data.customer.address, 120);
    doc.text(addressLines, 15, currentY + 9);
    currentY += 9 + (addressLines.length * 4);

    // --- Addresses ---
    currentY += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Pickup Address", 15, currentY);
    doc.text("Delivery Address", pageWidth - 15, currentY, { align: 'right' });
    currentY += 4;
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);

    // --- Shipment Grid ---
    currentY += 5;
    autoTable(doc, {
      startY: currentY,
      head: [['Port of Loading', 'Port of Discharge']],
      body: [[data.shipment.pol, data.shipment.pod]],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: 0 },
      headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 0 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
      margin: { left: 15 }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 2,
      head: [['Delivery Terms', 'Pcs', 'Volume', 'Gross Weight', 'Chargable Weight']],
      body: [[
        data.shipment.deliveryTerms,
        data.shipment.pcs,
        data.shipment.volume,
        data.shipment.grossWeight,
        data.shipment.chargeableWeight
      ]],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: 0 },
      headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 0 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 20 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } },
      margin: { left: 15 }
    });

    // --- Freight Charges ---
    currentY = doc.lastAutoTable.finalY + 5;
    doc.setFont(undefined, 'bold');
    doc.text("Freight Charges", 15, currentY);
    doc.setLineWidth(0.1);
    doc.line(15, currentY + 1, 38, currentY + 1);

    const freightBody = data.freightTable.length > 0 ? data.freightTable.map(row => [
      row.carrier, row.equip, row.containers, row.rate, row.currency, row.surcharge, row.tt, row.freq, row.route, row.comments
    ]) : [['TBA', '', '0', '0.00', 'USD', '', '', '', 'DIRECT', '']];

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Carrier', 'Equip.', 'No of Containers', 'Rate Per', 'Cur', 'Surcharge', 'TT', 'Freq', 'Route', 'Comments']],
      body: freightBody,
      theme: 'grid',
      styles: { fontSize: 7, textColor: 0, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: false, textColor: 0, fontStyle: 'bold', lineWidth: 0.1 },
      margin: { left: 15, right: 15 }
    });

    // --- Other Charges ---
    currentY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("OTHER CHARGES", 15, currentY);
    doc.line(15, currentY + 1, 40, currentY + 1);
    currentY += 6;

    // LKR
    if (data.otherCharges.lkr.items.length > 0) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text("LKR", 15, currentY);
      doc.line(15, currentY + 1, 20, currentY + 1);
      
      autoTable(doc, {
          startY: currentY + 2,
          body: data.otherCharges.lkr.items.map(i => [i.name, 'LKR', `${parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ${i.unit}`, parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})]),
          theme: 'plain',
          styles: { fontSize: 8, textColor: 0, cellPadding: 1 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 20 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
          margin: { left: 15 }
      });

      let finalY = doc.lastAutoTable.finalY;
      doc.setLineDash([1, 1], 0);
      doc.line(15, finalY, pageWidth - 15, finalY);
      doc.setLineDash([]);
      doc.setFont(undefined, 'bold');
      doc.text("TOTAL", 15, finalY + 4);
      doc.text(parseFloat(data.otherCharges.lkr.total).toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - 15, finalY + 4, { align: 'right' });
      doc.setLineWidth(0.3);
      doc.line(15, finalY + 5, pageWidth - 15, finalY + 5);
      currentY = finalY + 10;
    }

    // USD
    if (data.otherCharges.usd.items.length > 0) {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text("USD", 15, currentY);
      doc.setLineWidth(0.1);
      doc.line(15, currentY + 1, 20, currentY + 1);

       autoTable(doc, {
          startY: currentY + 2,
          body: data.otherCharges.usd.items.map(i => [i.name, 'USD', `${parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ${i.unit}`, parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})]),
          theme: 'plain',
          styles: { fontSize: 8, textColor: 0, cellPadding: 1 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 20 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
          margin: { left: 15 }
      });

      let finalY = doc.lastAutoTable.finalY;
      doc.setLineDash([1, 1], 0);
      doc.line(15, finalY, pageWidth - 15, finalY);
      doc.setLineDash([]);
      doc.setFont(undefined, 'bold');
      doc.text("TOTAL", 15, finalY + 4);
      doc.text(parseFloat(data.otherCharges.usd.total).toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - 15, finalY + 4, { align: 'right' });
      doc.setLineWidth(0.3);
      doc.line(15, finalY + 5, pageWidth - 15, finalY + 5);
      currentY = finalY + 15;
    }

    // --- Terms ---
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 5;

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    if (data.terms && data.terms.length > 0) {
        data.terms.forEach(term => {
            const lines = doc.splitTextToSize(`- ${term}`, pageWidth - 30);
            doc.text(lines, 15, currentY);
            currentY += (lines.length * 3) + 1;
        });
    }

    // --- Footer ---
    currentY += 10;
    doc.text(`Quotation generated by - ${data.generatedBy}`, 15, currentY);
    currentY += 4;
    doc.setFont(undefined, 'italic');
    doc.text("This is a Computer generated Document and no Signature required.", 15, currentY);

    doc.save(filename);
  };

  // Handle PDF Preview (Just sets state, component handles view)
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

  // Handle Direct PDF Download (Uses generatePDF)
  const handleDirectDownload = (quote) => {
    setIsGeneratingPDF(true);
    try {
      const transformedData = transformQuoteToPDFData(quote);
      const filename = `${quote.quoteId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      generatePDF(transformedData, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]);

  // Filter documents
  const getFilteredDocuments = () => {
    let filtered = documents;
    
    switch (activeTab) {
      case 'quotes':
        filtered = documents.filter(doc => doc.type?.toLowerCase() === 'quote');
        break;
      case 'invoices':
        filtered = documents.filter(doc => doc.type?.toLowerCase() === 'invoice');
        break;
      default:
        filtered = documents;
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.quoteId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.freightMode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const handleRefresh = () => loadDocuments();
  const manageRates =()=> openRateModal();
  const handleEdit = (doc) => onEditDocument && onEditDocument(doc);
  const createQutoes =()=> modalOpen('quote');

  const getTypeColor = (type) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType?.includes('air') && normalizedType?.includes('import')) return 'bg-amber-500';
    if (normalizedType?.includes('air') && normalizedType?.includes('export')) return 'bg-emerald-500';
    if (normalizedType?.includes('sea') && normalizedType?.includes('import')) return 'bg-yellow-500';
    if (normalizedType?.includes('sea') && normalizedType?.includes('export')) return 'bg-green-500';
    return 'bg-slate-500';
  };

  // Close dropdown logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateDropdown && !event.target.closest('.create-dropdown-container')) {
        setShowCreateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCreateDropdown]);

  const Avatar = ({ name, color = "bg-slate-600" }) => (
    <div className={`${color} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm`}>
      <span className="text-xs font-semibold">{name || 'NA'}</span>
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TypeBadge = ({ type, color }) => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
      {type || 'N/A'}
    </div>
  );

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-teal-50/30 min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Header Section */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Quotes</h1>
            </div>
          </div>
          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm group">
              <MessageCircleHeart className="w-4 h-4 text-pink-500 group-hover:text-pink-600" />
              <span className="hidden sm:inline">Feedback</span>
            </button>
            <button className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm group">
              <MessageCircle className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm group">
                <Users className="w-4 h-4 text-teal-500 group-hover:text-teal-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all shadow-sm group">
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="create-dropdown-container relative z-50">
              <button onClick={() => createQutoes()} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all shadow-sm">
                <Plus className="w-5 h-5" />
                <span>Create New</span>
              </button>
            </div>   
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={loadDocuments} className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">Retry</button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="animate-pulse p-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
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
                    <tr key={doc.sysID} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{doc.quoteId || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{doc.customerName || doc.clientName || 'N/A'}</td>
                      <td className="px-4 py-4"><TypeBadge type={doc.freightMode} color={getTypeColor(doc.freightMode)} /></td>
                      <td className="px-4 py-4"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{doc.freightCategory || 'N/A'}</span></td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(doc.createdDate)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* <button onClick={() => handlePreview(doc)} className="p-1 hover:bg-teal-50 rounded transition-colors" title="Preview Quotation"><Eye className="w-4 h-4 text-teal-600" /></button> */}
                          <button onClick={() => handleDirectDownload(doc)} disabled={isGeneratingPDF} className="p-1 hover:bg-blue-50 rounded transition-colors disabled:opacity-50" title="Download PDF">
                            <Download className={`w-4 h-4 text-blue-600 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                          </button>
                          {/* <button onClick={() => handleEdit(doc)} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Edit"><Edit className="w-4 h-4 text-slate-600" /></button> */}
                        </div>
                      </td>
                      <td className="px-4 py-4"><Avatar name={doc.createdBy?.substring(0, 2).toUpperCase() || 'SU'} color="bg-teal-600" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
              <p className="text-slate-500 mb-4">Get started by creating your first quote.</p>
            </div>
          )}
        </div>

        {/* Floating Refresh */}
        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={handleRefresh} className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all group" title="Refresh">
            <svg className={`w-5 h-5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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