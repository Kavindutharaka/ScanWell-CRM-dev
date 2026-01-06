import React, { useState, useEffect } from "react";
import { BASE_URL } from '../../config/apiConfig';
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
  Upload,
  X,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from 'xlsx';
import * as RateAPI from '../../api/rateAPI';


export default function RatesSec({ modalOpen, onEditRate, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rates, setRates] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Shipping Line States
  const [activeLiner, setActiveLiner] = useState(null);
  const [linerRates, setLinerRates] = useState([]);
  const [linerLoading, setLinerLoading] = useState(false);
  const [showLinerModal, setShowLinerModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Shipping lines configuration
  const shippingLines = [
    { code: 'MSC', name: 'MSC', color: 'bg-red-600' },
    { code: 'ONE', name: 'ONE', color: 'bg-purple-600' },
    { code: 'YML', name: 'YML', color: 'bg-orange-600' },
    { code: 'UNIFEEDER', name: 'UNIFEEDER', color: 'bg-teal-600' },
    { code: 'OOCL', name: 'OOCL', color: 'bg-cyan-600' },
    { code: 'RCL', name: 'RCL', color: 'bg-pink-600' },
    { code: 'CMA', name: 'CMA', color: 'bg-amber-600' },
  ];

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
        return { 
          ...rate, 
          ...parsedRateData,
          id: rate.Id || rate.id || rate.sysID || rate.SysId  // Check all possible ID field variants
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

  // Load liner-specific rates
  const loadLinerRates = async (linerCode) => {
    setLinerLoading(true);
    try {
      // Call the new linear rates endpoint
      const response = await fetch(`${BASE_URL}/rates/linear?category=${linerCode}`);
      const data = await response.json();
      
      // Transform backend data (PascalCase) to frontend format (camelCase)
      const transformedData = data.map(rate => ({
        id: rate.Id || rate.id,
        pol: rate.Pol || rate.pol,
        pod: rate.Pod || rate.pod,
        gp20Usd: rate.Gp20Usd || rate.gp20Usd || rate.gp20_usd,
        hq40Usd: rate.Hq40Usd || rate.hq40Usd || rate.hq40_usd,
        ttRouting: rate.TtRouting || rate.ttRouting || rate.tt_routing,
        valid: rate.Valid || rate.valid,
        category: rate.Category || rate.category,
        // Map to display format
        origin: rate.Pol || rate.pol,
        destination: rate.Pod || rate.pod,
        rate20GP: rate.Gp20Usd || rate.gp20Usd || rate.gp20_usd,
        rate40HQ: rate.Hq40Usd || rate.hq40Usd || rate.hq40_usd,
        transitTime: rate.TtRouting || rate.ttRouting || rate.tt_routing,
        validateDate: rate.Valid || rate.valid,
        freightType: 'SEA-EXPORT-FCL',
        liner: rate.Category || rate.category,
        route: `${rate.Pol || rate.pol || ''}-${rate.Pod || rate.pod || ''}`,
        currency: 'USD'
      }));
      
      setLinerRates(transformedData);
    } catch (err) {
      console.error('Error fetching liner rates:', err);
      setLinerRates([]);
    } finally {
      setLinerLoading(false);
    }
  };

  // Download Excel Template
  const downloadExcelTemplate = () => {
    // Create sample data with all columns
    const templateData = [
      {
        freightType: 'SEA-EXPORT-FCL',
        origin: 'COLOMBO',
        destination: 'CHENNAI',
        airline: '',
        liner: activeLiner || 'MSC',
        route: 'CMB-MAA',
        surcharges: 'FSC: $50, THC: $100',
        transitTime: 5,
        transshipmentTime: '',
        frequency: '3x Weekly',
        routingType: 'DIRECT',
        validateDate: '2025-12-31',
        note: 'Sample note',
        remark: '',
        owner: 'John Doe',
        currency: 'USD',
        category: activeLiner || 'MSC',
        rate45Minus: '',
        rate45MinusM: '',
        rate45Plus: '',
        rate100: '',
        rate300: '',
        rate500: '',
        rate1000: '',
        rate20GP: 850,
        rate40GP: 1200,
        rate40HQ: 1300,
        lclRate: '',
      },
      {
        freightType: 'AIR-IMPORT',
        origin: 'DUBAI',
        destination: 'COLOMBO',
        airline: 'EMIRATES',
        liner: '',
        route: 'DXB-CMB',
        surcharges: '',
        transitTime: 1,
        transshipmentTime: '',
        frequency: 'Daily',
        routingType: 'DIRECT',
        validateDate: '2025-06-30',
        note: '',
        remark: 'Contact sales for bulk',
        owner: 'Jane Smith',
        currency: 'USD',
        category: activeLiner || 'MSC',
        rate45Minus: 3.50,
        rate45MinusM: 200,
        rate45Plus: 3.20,
        rate100: 2.80,
        rate300: 2.50,
        rate500: 2.20,
        rate1000: 2.00,
        rate20GP: '',
        rate40GP: '',
        rate40HQ: '',
        lclRate: '',
      },
      {
        freightType: 'SEA-EXPORT-LCL',
        origin: 'COLOMBO',
        destination: 'SINGAPORE',
        airline: '',
        liner: activeLiner || 'MSC',
        route: 'CMB-SIN',
        surcharges: '',
        transitTime: 7,
        transshipmentTime: '2 days',
        frequency: '2x Weekly',
        routingType: 'TRANSSHIPMENT',
        validateDate: '2025-09-30',
        note: '',
        remark: '',
        owner: 'Admin',
        currency: 'USD',
        category: activeLiner || 'MSC',
        rate45Minus: '',
        rate45MinusM: '',
        rate45Plus: '',
        rate100: '',
        rate300: '',
        rate500: '',
        rate1000: '',
        rate20GP: '',
        rate40GP: '',
        rate40HQ: '',
        lclRate: 55,
      },
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 18 }, // freightType
      { wch: 12 }, // origin
      { wch: 12 }, // destination
      { wch: 15 }, // airline
      { wch: 12 }, // liner
      { wch: 12 }, // route
      { wch: 20 }, // surcharges
      { wch: 12 }, // transitTime
      { wch: 15 }, // transshipmentTime
      { wch: 12 }, // frequency
      { wch: 15 }, // routingType
      { wch: 12 }, // validateDate
      { wch: 20 }, // note
      { wch: 20 }, // remark
      { wch: 12 }, // owner
      { wch: 10 }, // currency
      { wch: 10 }, // category
      { wch: 12 }, // rate45Minus
      { wch: 12 }, // rate45MinusM
      { wch: 12 }, // rate45Plus
      { wch: 10 }, // rate100
      { wch: 10 }, // rate300
      { wch: 10 }, // rate500
      { wch: 10 }, // rate1000
      { wch: 10 }, // rate20GP
      { wch: 10 }, // rate40GP
      { wch: 10 }, // rate40HQ
      { wch: 10 }, // lclRate
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rates Template');

    // Download
    XLSX.writeFile(wb, `${activeLiner || 'Liner'}_Rates_Template.xlsx`);
  };

  useEffect(() => {
    loadRates();
  }, [refreshTrigger]);

  // Handle liner tab click
  const handleLinerClick = (linerCode) => {
    setActiveLiner(linerCode);
    setActiveTab('liner'); // Special tab state for liners
    loadLinerRates(linerCode);
  };

  // Handle regular tab click
  const handleRegularTabClick = (tab) => {
    setActiveTab(tab);
    setActiveLiner(null); // Clear liner selection
  };

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

    // Only filter regular rates (not liner rates)
    if (activeTab !== 'liner') {
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
    }

    return filtered;
  };

  const handleRefresh = () => {
    if (activeLiner) {
      loadLinerRates(activeLiner);
    } else {
      loadRates();
    }
  };

  const handleDelete = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      // Use linear endpoint for liner rates, regular endpoint for others
      const endpoint = activeLiner 
        ? `${BASE_URL}/rates/linear/${rateId}`
        : `${BASE_URL}/rates/${rateId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (activeLiner) {
          loadLinerRates(activeLiner);
        } else {
          loadRates();
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      alert('Failed to delete rate.');
    }
  };

  // Excel Upload Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      setExcelFile(file);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile || !activeLiner) {
      alert('Please select an Excel file and ensure a shipping line is selected.');
      return;
    }

    setUploadProgress(true);
    try {
      // Parse Excel file
      console.log('Starting Excel upload for:', activeLiner);
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(sheet);

      console.log(`Parsed ${excelData.length} rows from Excel`);
      console.log('Sample row:', excelData[0]);
      console.log('Column headers detected:', Object.keys(excelData[0] || {}));

      // Validate that we have data
      if (!excelData || excelData.length === 0) {
        alert('Excel file is empty or could not be read. Please check the file format.');
        setUploadProgress(false);
        return;
      }

      // Transform Excel data to match new linear_rates database structure
      // Excel format headers: POL, POD, 20GP USD, 40HQ-USD, TT/Routing, Valid
      // This format is common for MSC, ONE, YML, UNIFEEDER, OOCL, RCL, CMA shipping lines
      const transformedData = excelData.map((row, index) => {
        // Extract POL (Port of Loading)
        const pol = row.POL || row.pol || row.Origin || row.origin || null;
        
        // Extract POD (Port of Discharge)
        const pod = row.POD || row.pod || row.Destination || row.destination || null;
        
        // Extract 20GP USD
        const gp20Usd = row['20GP USD'] || row['20GP-USD'] || row['20GP_USD'] || row['20GP'] || row.gp20_usd || row.Gp20Usd || null;
        
        // Extract 40HQ-USD
        const hq40Usd = row['40HQ-USD'] || row['40HQ USD'] || row['40HQ_USD'] || row['40HQ'] || row.hq40_usd || row.Hq40Usd || null;
        
        // Extract TT/Routing
        const ttRouting = row['TT/Routing'] || row['TT-Routing'] || row['TT/ROUITNG'] || row.TTRouting || row.tt_routing || row.TtRouting || null;
        
        // Extract Valid date - handle Excel date format
        let valid = row['VALID '] || row.Valid || row.valid || row.validateDate || row.ValidateDate || null;
        
        // If valid is an Excel serial number, convert it
        if (typeof valid === 'number') {
          // Excel serial date to JavaScript Date
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + valid * 86400000);
          valid = jsDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        } else if (valid instanceof Date) {
          valid = valid.toISOString().split('T')[0];
        } else if (typeof valid === 'string' && valid.includes('/')) {
          // Handle MM/DD/YYYY or DD/MM/YYYY format
          const parts = valid.split('/');
          if (parts.length === 3) {
            // Assume MM/DD/YYYY format
            valid = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }

        // Log row if any required field is missing
        if (!pol || !pod) {
          console.warn(`Row ${index + 1} missing required fields:`, { pol, pod, gp20Usd, hq40Usd });
        }

        // Return simplified payload matching LinearRate model
        return {
          Pol: pol,
          Pod: pod,
          Gp20Usd: gp20Usd ? parseFloat(gp20Usd) : null,
          Hq40Usd: hq40Usd ? parseFloat(hq40Usd) : null,
          TtRouting: ttRouting ? String(ttRouting) : null,
          Valid: valid,
          Category: activeLiner
        };
      });

      // Filter out rows with missing critical data - require POL, POD, and at least one rate value
      const validRows = transformedData.filter(row => 
        row.Pol && row.Pod && (row.Gp20Usd || row.Hq40Usd)
      );
      
      if (validRows.length === 0) {
        alert('No valid rows found. Please ensure Excel has POL, POD columns filled and at least one rate value (20GP USD or 40HQ-USD).');
        setUploadProgress(false);
        return;
      }

      if (validRows.length < transformedData.length) {
        const skipped = transformedData.length - validRows.length;
        console.warn(`Skipping ${skipped} rows with missing POL, POD, or rate values`);
      }

      // Send to backend
      console.log(`Uploading ${validRows.length} valid rates for ${activeLiner}`);
      console.log('Sample transformed data:', validRows[0]);
      
      const response = await fetch(`${BASE_URL}/rates/linear/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Rates: validRows }),
      });

      const responseData = await response.json();
      console.log('Backend response:', responseData);

      if (response.ok) {
        const successMsg = responseData.failCount > 0 
          ? `Uploaded ${responseData.successCount} rates. ${responseData.failCount} failed.`
          : `Successfully uploaded ${responseData.successCount} rates for ${activeLiner}`;
        alert(successMsg);
        setShowLinerModal(false);
        setExcelFile(null);
        loadLinerRates(activeLiner);
      } else {
        throw new Error(responseData.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading Excel:', err);
      alert(`Failed to upload Excel file: ${err.message}\n\nPlease check the browser console for details.`);
    } finally {
      setUploadProgress(false);
    }
  };

  const getFreightTypeColor = (type) => {
  const t = type?.toUpperCase();
  
  // Air Freight
  if (t?.includes('AIR-IMPORT')) return 'bg-yellow-500';
  if (t?.includes('AIR-EXPORT')) return 'bg-yellow-300';
  
  // Sea FCL
  if (t?.includes('SEA-IMPORT-FCL')) return 'bg-blue-600';
  if (t?.includes('SEA-EXPORT-FCL')) return 'bg-indigo-600';
  
  // Sea LCL
  if (t?.includes('SEA-IMPORT-LCL')) return 'bg-teal-600';
  if (t?.includes('SEA-EXPORT-LCL')) return 'bg-cyan-600';
  
  // Fallback for generic types
  if (t?.includes('AIR')) return 'bg-yellow-500';
  if (t?.includes('SEA')) return 'bg-blue-500';
  
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

  // Determine which data to display
  const displayData = activeLiner ? linerRates : filteredRates;
  const isLoadingData = activeLiner ? linerLoading : loading;

  // Get active liner details
  const activeLinerDetails = shippingLines.find(liner => liner.code === activeLiner);

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
            
            {/* Conditional Button Display */}
            {!activeLiner ? (
              <button 
                onClick={modalOpen} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create New Rate
              </button>
            ) : (
              <button 
                onClick={() => setShowLinerModal(true)} 
                className={`inline-flex items-center gap-2 px-6 py-3 ${activeLinerDetails?.color || 'bg-blue-600'} text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}
              >
                <Upload className="w-5 h-5" />
                Create New Rate for {activeLiner}
              </button>
            )}
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Regular Tabs */}
            <button 
              onClick={() => handleRegularTabClick('all')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              All Rates ({rates.length})
            </button>
            <button 
              onClick={() => handleRegularTabClick('air')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'air' ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Plane className="w-4 h-4" /> Air Freight
            </button>
            <button 
              onClick={() => handleRegularTabClick('sea')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'sea' ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Ship className="w-4 h-4" /> Sea Freight
            </button>

            {/* Divider */}
            <div className="w-px bg-slate-300 mx-2"></div>

            {/* Shipping Line Tabs */}
            {shippingLines.map((liner) => (
              <button 
                key={liner.code}
                onClick={() => handleLinerClick(liner.code)} 
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeLiner === liner.code 
                    ? `${liner.color} text-white shadow-md` 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Ship className="w-4 h-4" /> {liner.name}
              </button>
            ))}
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

        {isLoadingData && !error && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading rates...</p>
          </div>
        )}

        {/* Rates List */}
        {!isLoadingData && !error && (
          <div className="space-y-3">
            {activeLiner && (
              <div className={`${activeLinerDetails?.color || 'bg-blue-600'} text-white rounded-xl p-4 mb-4 shadow-md`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ship className="w-6 h-6" />
                    <div>
                      <h3 className="text-lg font-bold">{activeLiner} Rates</h3>
                      <p className="text-sm opacity-90">Showing {linerRates.length} rates for {activeLiner}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowLinerModal(true)}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Excel
                  </button>
                </div>
              </div>
            )}

            {displayData.map((rate) => {
              const isExpanded = expandedRows.has(rate.sysID || rate.id);
              const isAir = rate.freightType?.toLowerCase().includes('air');
              const isFCL = rate.freightType?.toLowerCase().includes('fcl');
              const isLCL = rate.freightType?.toLowerCase().includes('lcl');
              const isLinerRate = activeLiner && rate.category; // This is a linear rate

              return (
                <div key={rate.sysID || rate.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Main Row */}
                  <div className="p-4">
                    {/* Linear Rates Display (Simplified) */}
                    {isLinerRate ? (
                      <>
                        {/* Desktop Grid View */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          {/* Shipping Line Badge */}
                          <div className="col-span-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${activeLinerDetails?.color || 'bg-blue-600'}`}>
                              <Ship className="w-4 h-4" />
                              <span className="uppercase">{activeLiner}</span>
                            </div>
                          </div>

                          {/* POL → POD Route */}
                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold">{rate.pol || rate.origin || '-'}</span>
                              </div>
                              <div className="flex-1 h-px bg-slate-300 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ArrowRight className="w-4 h-4 text-slate-400 bg-white" />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold">{rate.pod || rate.destination || '-'}</span>
                              </div>
                            </div>
                            {/* Transit Time/Routing */}
                            {(rate.ttRouting || rate.transitTime) && (
                              <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {rate.ttRouting || rate.transitTime}
                              </div>
                            )}
                          </div>

                          {/* 20GP Rate */}
                          <div className="col-span-2">
                            <div className="text-sm font-semibold text-slate-600">20' GP</div>
                            <div className="text-lg font-bold text-indigo-600">
                              {rate.gp20Usd || rate.rate20GP ? formatCurrency(rate.gp20Usd || rate.rate20GP) : '-'}
                            </div>
                          </div>

                          {/* 40HQ Rate */}
                          <div className="col-span-2">
                            <div className="text-sm font-semibold text-slate-600">40' HQ</div>
                            <div className="text-lg font-bold text-emerald-600">
                              {rate.hq40Usd || rate.rate40HQ ? formatCurrency(rate.hq40Usd || rate.rate40HQ) : '-'}
                            </div>
                          </div>

                          {/* Currency */}
                          <div className="col-span-1">
                            <div className="text-sm font-semibold text-slate-700">USD</div>
                            <div className="text-xs text-slate-500">Currency</div>
                          </div>

                          {/* Valid Date */}
                          <div className="col-span-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDate(rate.valid || rate.validateDate)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDelete(rate.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {/* Header with Badge and Actions */}
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${activeLinerDetails?.color || 'bg-blue-600'}`}>
                              <Ship className="w-4 h-4" />
                              <span className="uppercase">{activeLiner}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(rate.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Route */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                              <span className="font-bold text-sm">{rate.pol || rate.origin || '-'}</span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-sm">{rate.pod || rate.destination || '-'}</span>
                            </div>
                            {(rate.ttRouting || rate.transitTime) && (
                              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {rate.ttRouting || rate.transitTime}
                              </div>
                            )}
                          </div>

                          {/* Rates Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-indigo-600 mb-1">20' GP</div>
                              <div className="text-lg font-bold text-indigo-700">
                                {rate.gp20Usd || rate.rate20GP ? formatCurrency(rate.gp20Usd || rate.rate20GP) : '-'}
                              </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-emerald-600 mb-1">40' HQ</div>
                              <div className="text-lg font-bold text-emerald-700">
                                {rate.hq40Usd || rate.rate40HQ ? formatCurrency(rate.hq40Usd || rate.rate40HQ) : '-'}
                              </div>
                            </div>
                          </div>

                          {/* Footer with Currency and Date */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">USD</span>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(rate.valid || rate.validateDate)}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Regular Rates Display (Full) */
                      <>
                        {/* Desktop Grid View */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${getFreightTypeColor(rate.freightType)}`}>
                              <FreightTypeIcon type={rate.freightType} />
                              <span className="uppercase">{rate.freightType?.replace(/-/g, ' ')}</span>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-indigo-600" /><span className="font-bold">{rate.origin || rate.Origin || '-'}</span></div>
                              <div className="flex-1 h-px bg-slate-300 relative"><div className="absolute inset-0 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-slate-400 bg-white" /></div></div>
                              <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-600" /><span className="font-bold">{rate.destination || rate.Destination || '-'}</span></div>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              {getRoutingBadge(rate.routingType || rate.RoutingType)}
                              {(rate.transitTime || rate.TransitTime) > 0 && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{rate.transitTime || rate.TransitTime} days</span>}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="text-sm font-semibold">{rate.airline || rate.liner || rate.Airline || rate.Liner || '-'}</div>
                            {(rate.frequency || rate.Frequency) && <div className="text-xs text-slate-500 mt-0.5">{rate.frequency || rate.Frequency}</div>}
                          </div>

                          <div className="col-span-1">
                            <div className="text-sm font-semibold text-slate-700">{rate.currency || rate.Currency || 'USD'}</div>
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
                            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-slate-400" />{formatDate(rate.validateDate || rate.ValidateDate)}</div>
                          </div>

                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <button onClick={() => onEditRate(rate)} className="p-2 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4 text-slate-600 hover:text-indigo-600" /></button>
                            <button onClick={() => handleDelete(rate.sysID || rate.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" /></button>
                            <button onClick={() => toggleRow(rate.sysID || rate.id)} className="p-2 hover:bg-slate-100 rounded-lg">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {/* Header with Freight Type and Actions */}
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${getFreightTypeColor(rate.freightType)}`}>
                              <FreightTypeIcon type={rate.freightType} />
                              <span className="uppercase">{rate.freightType?.replace(/-/g, ' ')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => onEditRate(rate)} className="p-2 hover:bg-indigo-50 rounded-lg">
                                <Edit className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
                              </button>
                              <button onClick={() => handleDelete(rate.sysID || rate.id)} className="p-2 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                              </button>
                              <button onClick={() => toggleRow(rate.sysID || rate.id)} className="p-2 hover:bg-slate-100 rounded-lg">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                              <span className="font-bold text-sm">{rate.origin || rate.Origin || '-'}</span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-sm">{rate.destination || rate.Destination || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getRoutingBadge(rate.routingType || rate.RoutingType)}
                              {(rate.transitTime || rate.TransitTime) > 0 && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {rate.transitTime || rate.TransitTime} days
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Carrier & Rate Info */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Carrier</div>
                              <div className="text-sm font-semibold">{rate.airline || rate.liner || rate.Airline || rate.Liner || '-'}</div>
                              {(rate.frequency || rate.Frequency) && (
                                <div className="text-xs text-slate-500 mt-1">{rate.frequency || rate.Frequency}</div>
                              )}
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                              <div className="text-xs text-indigo-600 mb-1">
                                {isAir && 'per kg (+45)'}
                                {isFCL && 'per container'}
                                {isLCL && 'per CBM'}
                              </div>
                              <div className="text-lg font-bold text-indigo-700">{formatCurrency(getQuickRate(rate))}</div>
                            </div>
                          </div>

                          {/* Footer with Currency and Date */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">{rate.currency || rate.Currency || 'USD'}</span>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(rate.validateDate || rate.ValidateDate)}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  

                  {/* Expanded Details - Only for Regular Rates */}
                  {!isLinerRate && isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Rate Breakdown */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Rate Breakdown
                          </h4>
                          <div className="bg-white rounded-lg p-5">
                            {/* Air Freight Rates */}
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

                            {/* FCL Rates */}
                            {isFCL && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {rate.rate20GP && (
                                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
                                    <div className="text-xs font-semibold text-blue-700">20' GP</div>
                                    <div className="text-2xl font-bold text-blue-800 mt-1">{formatCurrency(rate.rate20GP)}</div>
                                  </div>
                                )}
                                {rate.rate40GP && (
                                  <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 text-center shadow-sm">
                                    <div className="text-xs font-semibold text-indigo-700">40' GP</div>
                                    <div className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(rate.rate40GP)}</div>
                                  </div>
                                )}
                                {rate.rate40HQ && (
                                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 text-center">
                                    <div className="text-xs font-semibold text-purple-700">40' HQ</div>
                                    <div className="text-2xl font-bold text-purple-800 mt-1">{formatCurrency(rate.rate40HQ)}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* LCL Rates */}
                            {isLCL && rate.lclRate && (
                              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-4 text-center max-w-xs">
                                <div className="text-sm font-semibold text-emerald-700">LCL Rate per CBM</div>
                                <div className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(rate.lclRate)}</div>
                              </div>
                            )}

                            {/* Liner-specific rates - Only show if no standard rates */}
                            {activeLiner && !isAir && !isFCL && !isLCL && (
                              <div className="space-y-2">
                                <p className="text-sm text-slate-600 mb-3">All rate fields from Excel:</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {rate.rate45Minus && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">-45 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate45Minus)}</div>
                                    </div>
                                  )}
                                  {rate.rate45MinusM && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">Min (M)</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate45MinusM)}</div>
                                    </div>
                                  )}
                                  {rate.rate45Plus && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">+45 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate45Plus)}</div>
                                    </div>
                                  )}
                                  {rate.rate100 && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">+100 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate100)}</div>
                                    </div>
                                  )}
                                  {rate.rate300 && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">+300 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate300)}</div>
                                    </div>
                                  )}
                                  {rate.rate500 && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">+500 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate500)}</div>
                                    </div>
                                  )}
                                  {rate.rate1000 && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">+1000 kg</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate1000)}</div>
                                    </div>
                                  )}
                                  {rate.rate20GP && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">20' GP</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate20GP)}</div>
                                    </div>
                                  )}
                                  {rate.rate40GP && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">40' GP</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate40GP)}</div>
                                    </div>
                                  )}
                                  {rate.rate40HQ && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">40' HQ</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.rate40HQ)}</div>
                                    </div>
                                  )}
                                  {rate.lclRate && (
                                    <div className="bg-slate-50 rounded p-3">
                                      <div className="text-xs text-slate-500">LCL per CBM</div>
                                      <div className="text-lg font-bold">{formatCurrency(rate.lclRate)}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
                                <div className="text-sm font-medium">{rate.createdAt ? new Date(rate.createdAt).toLocaleDateString() : '-'}</div>
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
                </div>
              );
            })}
          </div>
        )}

        {/* Empty & Refresh */}
        {!isLoadingData && !error && displayData.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No rates found</h3>
            <p className="text-slate-500 mb-6">
              {activeLiner 
                ? `No rates available for ${activeLiner}. Upload an Excel file to get started.` 
                : searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Create your first rate'
              }
            </p>
            {!searchQuery && !activeLiner && (
              <button onClick={modalOpen} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-5 h-5" />Create New Rate
              </button>
            )}
            {activeLiner && (
              <button 
                onClick={() => setShowLinerModal(true)} 
                className={`inline-flex items-center gap-2 px-6 py-3 ${activeLinerDetails?.color || 'bg-blue-600'} text-white rounded-lg hover:opacity-90`}
              >
                <Upload className="w-5 h-5" />Upload Excel for {activeLiner}
              </button>
            )}
          </div>
        )}

        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={handleRefresh} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg">
            <RefreshCw className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showLinerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`${activeLinerDetails?.color || 'bg-blue-600'} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Upload Rates for {activeLiner}</h2>
                    <p className="text-sm opacity-90 mt-1">Upload an Excel file with your rate data</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowLinerModal(false);
                    setExcelFile(null);
                  }} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-all">
                <input
                  type="file"
                  id="excel-upload"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    {excelFile ? excelFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-slate-500">Excel files (.xlsx, .xls) only</p>
                </label>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Upload Instructions
                  </h4>
                  <button
                    onClick={downloadExcelTemplate}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                  <li>Download the Excel template to see the required format</li>
                  <li>Ensure your Excel file has a header row with column names</li>
                  <li>Include columns like: Origin, Destination, Rate fields, Currency, etc.</li>
                  <li>All rows will be automatically tagged with category: {activeLiner}</li>
                  <li>Rate fields (rate45Plus, rate20GP, etc.) will be stored in rateDataJson</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLinerModal(false);
                    setExcelFile(null);
                  }}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExcelUpload}
                  disabled={!excelFile || uploadProgress}
                  className={`flex-1 px-6 py-3 ${activeLinerDetails?.color || 'bg-blue-600'} text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {uploadProgress ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}