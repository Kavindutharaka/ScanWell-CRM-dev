import React, { useState, useEffect, useContext } from "react";
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
import { AuthContext } from "../../context/AuthContext";


export default function RatesSec({ modalOpen, onEditRate, refreshTrigger }) {
  // Get permission from AuthContext - delete buttons visible to admin or users with RateManageView
  const { permission } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin;
  const canManageRates = isAdmin || permission?.RateManageView;
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

  // Sea Spot Rates state (flat - no sub-modules)
  const [seaSpotRates, setSeaSpotRates] = useState([]);
  const [seaSpotLoading, setSeaSpotLoading] = useState(false);
  const [showSeaSpotUploadModal, setShowSeaSpotUploadModal] = useState(false);
  const [seaSpotExcelFile, setSeaSpotExcelFile] = useState(null);
  const [seaSpotUploadProgress, setSeaSpotUploadProgress] = useState(false);

  // Air Export Rates state
  const [showAirExport, setShowAirExport] = useState(false);
  const [airExportRates, setAirExportRates] = useState([]);
  const [airExportLoading, setAirExportLoading] = useState(false);
  const [showAirExportUploadModal, setShowAirExportUploadModal] = useState(false);
  const [airExportExcelFile, setAirExportExcelFile] = useState(null);
  const [airExportUploadProgress, setAirExportUploadProgress] = useState(false);
  const [editingAirExportRate, setEditingAirExportRate] = useState(null);
  const [showAirExportEditModal, setShowAirExportEditModal] = useState(false);

  // Shipping lines configuration - Linear Header's
  const linearHeaderLines = [
    { code: 'EMC', name: 'EMC', color: 'bg-green-600' },
    { code: 'WAN HAI', name: 'WAN HAI', color: 'bg-sky-600' },
    { code: 'HMM', name: 'HMM', color: 'bg-rose-600' },
    { code: 'COSCO', name: 'COSCO', color: 'bg-blue-700' },
    { code: 'ZIM', name: 'ZIM', color: 'bg-yellow-600' },
    { code: 'SML', name: 'SML', color: 'bg-violet-600' },
    { code: 'AIYER LANKA', name: 'AIYER LANKA', color: 'bg-lime-600' },
  ];

  // Destination Header's configuration
  const destinationHeaderLines = [
    { code: 'USEC/USWC HEADERS', name: 'USEC/USWC HEADERS', color: 'bg-red-700' },
    { code: 'CANADA HEADERS', name: 'CANADA HEADERS', color: 'bg-red-600' },
    { code: 'JEBAL ALI HEADERS', name: 'JEBAL ALI HEADERS', color: 'bg-amber-700' },
    { code: 'EU/UK HEADERS', name: 'EU/UK HEADERS', color: 'bg-blue-800' },
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

  // Load all sea spot rates (flat, no category filter)
  const loadSeaSpotRates = async () => {
    setSeaSpotLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/rates/linear/all-spot`);
      const data = await response.json();
      const transformed = data.map(rate => ({
        id: rate.Id || rate.id,
        liner: rate.Category || rate.category,
        pol: rate.Pol || rate.pol,
        pod: rate.Pod || rate.pod,
        gp20Usd: rate.Gp20Usd || rate.gp20Usd || rate.gp20_usd,
        hq40Usd: rate.Hq40Usd || rate.hq40Usd || rate.hq40_usd,
        ttRouting: rate.TtRouting || rate.ttRouting || rate.tt_routing,
        valid: rate.Valid || rate.valid,
        remark: rate.Remark || rate.remark,
        category: rate.Category || rate.category,
      }));
      setSeaSpotRates(transformed);
    } catch (err) {
      console.error('Error fetching sea spot rates:', err);
      setSeaSpotRates([]);
    } finally {
      setSeaSpotLoading(false);
    }
  };

  // Handle sea spot Excel upload
  const handleSeaSpotExcelUpload = async () => {
    if (!seaSpotExcelFile) {
      window.alert('Please select an Excel file.');
      return;
    }

    setSeaSpotUploadProgress(true);
    try {
      const data = await seaSpotExcelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(sheet);

      if (!excelData || excelData.length === 0) {
        window.alert('Excel file is empty.');
        setSeaSpotUploadProgress(false);
        return;
      }

      const columnHeaders = Object.keys(excelData[0] || {});
      const hasLiner = columnHeaders.some(c => c.toUpperCase() === 'LINER');
      const hasPol = columnHeaders.some(c => c.toUpperCase() === 'POL');
      const hasPod = columnHeaders.some(c => c.toUpperCase() === 'POD');
      const hasRates = columnHeaders.some(c => c.includes('20GP') || c.includes('40HQ'));

      if (!hasLiner || !hasPol || !hasPod || !hasRates) {
        let msg = '❌ Excel format error!\n\nMissing required columns:\n';
        if (!hasLiner) msg += '• LINER\n';
        if (!hasPol) msg += '• POL\n';
        if (!hasPod) msg += '• POD\n';
        if (!hasRates) msg += '• 20GP / 40HQ\n';
        msg += '\n✅ Required: LINER | POL | POD | 20GP | 40HQ | TT/ROUTING | VALID | REMARK';
        window.alert(msg);
        setSeaSpotUploadProgress(false);
        return;
      }

      const parseExcelDate = (value) => {
        if (!value) return null;
        if (typeof value === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + value * 86400000);
          return jsDate.toISOString().split('T')[0];
        } else if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        } else if (typeof value === 'string' && value.includes('/')) {
          const parts = value.split('/');
          if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return value;
      };

      const transformedData = excelData.map(row => {
        const liner = row.LINER || row.Liner || row.liner || null;
        const pol = row.POL || row.pol || null;
        const pod = row.POD || row.pod || null;
        const gp20 = row['20GP'] || row['20GP USD'] || row['20GP-USD'] || null;
        const hq40 = row['40HQ'] || row['40HQ-USD'] || row['40HQ USD'] || null;
        const ttRouting = row['TT/ROUTING'] || row['TT/ROUITNG'] || row['TT/Routing'] || row['TT-Routing'] || null;
        const valid = parseExcelDate(row['VALID'] || row['VALID '] || row.Valid || row.valid);
        const remark = row.REMARK || row.Remark || row.remark || row['REMRAK'] || null;

        return {
          Pol: pol,
          Pod: pod,
          Gp20Usd: gp20 ? parseFloat(gp20) : null,
          Hq40Usd: hq40 ? parseFloat(hq40) : null,
          TtRouting: ttRouting ? String(ttRouting) : null,
          Valid: valid,
          Category: liner,
          LinerType: 'LINER',
          Remark: remark ? String(remark) : null,
        };
      });

      const validRows = transformedData.filter(r => r.Pol && r.Pod && r.Category && (r.Gp20Usd || r.Hq40Usd));

      if (validRows.length === 0) {
        window.alert('❌ No valid rows found. Each row needs LINER, POL, POD, and at least one rate.');
        setSeaSpotUploadProgress(false);
        return;
      }

      if (validRows.length < transformedData.length) {
        const skipped = transformedData.length - validRows.length;
        if (!window.confirm(`⚠️ ${skipped} rows will be skipped (missing required fields).\n\nContinue uploading ${validRows.length} valid rows?`)) {
          setSeaSpotUploadProgress(false);
          return;
        }
      }

      const response = await fetch(`${BASE_URL}/rates/linear/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Rates: validRows }),
      });

      const result = await response.json();
      if (response.ok) {
        window.alert(`✅ Uploaded ${result.successCount} sea spot rates successfully.`);
        setShowSeaSpotUploadModal(false);
        setSeaSpotExcelFile(null);
        loadSeaSpotRates();
      } else {
        window.alert(`❌ Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error uploading sea spot Excel:', err);
      window.alert('❌ Failed to process Excel file. Check format and try again.');
    } finally {
      setSeaSpotUploadProgress(false);
    }
  };

  // Delete all sea spot rates
  const handleDeleteAllSpotRates = async () => {
    if (!window.confirm('⚠️ Delete ALL sea spot rates? This cannot be undone.')) return;
    try {
      const response = await fetch(`${BASE_URL}/rates/linear/all-spot`, { method: 'DELETE' });
      const result = await response.json();
      window.alert(`✅ ${result.message}`);
      loadSeaSpotRates();
    } catch (err) {
      window.alert('❌ Failed to delete rates.');
    }
  };

  // ====== AIR EXPORT RATES FUNCTIONS ======

  const loadAirExportRates = async () => {
    setAirExportLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/rates/air-export`);
      const data = await response.json();
      const transformed = data.map(rate => ({
        id: rate.Id || rate.id,
        country: rate.country || rate.Country,
        commodityType: rate.commodity_type || rate.CommodityType || rate.commodityType,
        airline: rate.airline || rate.Airline,
        rateM: rate.rate_m || rate.RateM || rate.rateM,
        rate45Minus: rate.rate_45_minus || rate.Rate45Minus || rate.rate45Minus,
        rate45: rate.rate_45 || rate.Rate45 || rate.rate45,
        rate100: rate.rate_100 || rate.Rate100 || rate.rate100,
        rate300: rate.rate_300 || rate.Rate300 || rate.rate300,
        rate500: rate.rate_500 || rate.Rate500 || rate.rate500,
        rate1000: rate.rate_1000 || rate.Rate1000 || rate.rate1000,
        surcharges: rate.surcharges || rate.Surcharges,
        transitTime: rate.transit_time || rate.TransitTime || rate.transitTime,
        frequency: rate.frequency || rate.Frequency,
        routing: rate.routing || rate.Routing,
        remarks: rate.remarks || rate.Remarks,
        updatedDate: rate.updated_date || rate.UpdatedDate || rate.updatedDate,
      }));
      setAirExportRates(transformed);
    } catch (err) {
      console.error('Error fetching air export rates:', err);
      setAirExportRates([]);
    } finally {
      setAirExportLoading(false);
    }
  };

  const handleAirExportClick = () => {
    const willShow = !showAirExport;
    setShowAirExport(willShow);
    setShowSeaSpotRates(false);
    setShowLinearHeaders(false);
    setShowDestinationHeaders(false);
    setActiveLiner(null);
    setActiveLinerCategory(null);
    if (willShow) {
      setActiveTab('airexport');
      loadAirExportRates();
    } else {
      setActiveTab('all');
    }
  };

  const handleAirExportExcelUpload = async () => {
    if (!airExportExcelFile) {
      window.alert('Please select an Excel file.');
      return;
    }

    setAirExportUploadProgress(true);
    try {
      const data = await airExportExcelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(sheet);

      if (!excelData || excelData.length === 0) {
        window.alert('Excel file is empty.');
        setAirExportUploadProgress(false);
        return;
      }

      // Parse Excel date helper
      const parseExcelDate = (value) => {
        if (!value) return null;
        if (typeof value === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + value * 86400000);
          return jsDate.toISOString().split('T')[0];
        } else if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        } else if (typeof value === 'string') {
          if (value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
          // Handle "3-Oct", "25-Nov" etc
          const dateParsed = new Date(value);
          if (!isNaN(dateParsed.getTime())) return dateParsed.toISOString().split('T')[0];
        }
        return value;
      };

      // Helper to safely parse number
      const parseNum = (val) => {
        if (val === null || val === undefined || val === '' || val === 'N/A' || val === 'n/a') return null;
        const num = parseFloat(String(val).replace(/[$,]/g, ''));
        return isNaN(num) ? null : num;
      };

      // Extract commodity type from first row if present
      const firstRow = excelData[0];
      const commodityType = firstRow['Comodity Type'] || firstRow['Commodity Type'] || firstRow['COMMODITY TYPE'] || firstRow['commodity_type'] || firstRow['CommodityType'] || null;

      const transformedData = excelData.map(row => {
        const airline = row.AIRLINE || row.Airline || row.airline || null;
        // Skip rows with no airline - they're likely sub-headers or empty
        if (!airline) return null;

        return {
          Country: row.COUNTRY || row.Country || row.country || null,
          CommodityType: row['Comodity Type'] || row['Commodity Type'] || row['COMMODITY TYPE'] || row['commodity_type'] || commodityType,
          Airline: airline,
          RateM: parseNum(row.M || row.m || row['MIN'] || row['Min']),
          Rate45Minus: parseNum(row['-45'] || row['45-'] || row['-45 KG']),
          Rate45: parseNum(row['45'] || row['+45'] || row['45 KG'] || row['+45 KG']),
          Rate100: parseNum(row['100'] || row['+100'] || row['100 KG']),
          Rate300: parseNum(row['300'] || row['+300'] || row['300 KG']),
          Rate500: parseNum(row['500'] || row['+500'] || row['500 KG']),
          Rate1000: parseNum(row['1000'] || row['+1000'] || row['1000 KG']),
          Surcharges: row.SURCHARGES || row.Surcharges || row.surcharges || null,
          TransitTime: row['T/T'] || row['TT'] || row.tt || row['Transit Time'] || null,
          Frequency: row.FREQUENCY || row.Frequency || row.frequency || null,
          Routing: row.ROUTINE || row.ROUTING || row.Routine || row.Routing || row.routing || null,
          Remarks: row.REMARKS || row.Remarks || row.remarks || row.REMARK || row.Remark || null,
          UpdatedDate: parseExcelDate(row['UPDATED DATE'] || row['Updated Date'] || row['updated_date'] || row['DATE']),
        };
      }).filter(Boolean);

      const validRows = transformedData.filter(r => r.Airline);

      if (validRows.length === 0) {
        window.alert('❌ No valid rows found. Each row needs at least an AIRLINE column.');
        setAirExportUploadProgress(false);
        return;
      }

      if (validRows.length < transformedData.length) {
        const skipped = transformedData.length - validRows.length;
        if (!window.confirm(`⚠️ ${skipped} rows will be skipped (missing AIRLINE).\n\nContinue uploading ${validRows.length} valid rows?`)) {
          setAirExportUploadProgress(false);
          return;
        }
      }

      const response = await fetch(`${BASE_URL}/rates/air-export/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CommodityType: commodityType, Rates: validRows }),
      });

      const result = await response.json();
      if (response.ok) {
        window.alert(`✅ Uploaded ${result.successCount} air export rates successfully.`);
        setShowAirExportUploadModal(false);
        setAirExportExcelFile(null);
        loadAirExportRates();
      } else {
        window.alert(`❌ Upload failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error uploading air export Excel:', err);
      window.alert('❌ Failed to process Excel file. Check format and try again.');
    } finally {
      setAirExportUploadProgress(false);
    }
  };

  const handleDeleteAirExportRate = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      const response = await fetch(`${BASE_URL}/rates/air-export/${rateId}`, { method: 'DELETE' });
      if (response.ok) {
        setAirExportRates(prev => prev.filter(r => r.id !== rateId));
      }
    } catch (err) {
      window.alert('❌ Failed to delete rate.');
    }
  };

  const handleDeleteAllAirExportRates = async () => {
    if (!window.confirm('⚠️ Delete ALL air export rates? This cannot be undone.')) return;
    try {
      const response = await fetch(`${BASE_URL}/rates/air-export/all`, { method: 'DELETE' });
      const result = await response.json();
      window.alert(`✅ ${result.message}`);
      loadAirExportRates();
    } catch (err) {
      window.alert('❌ Failed to delete rates.');
    }
  };

  const handleSaveAirExportEdit = async () => {
    if (!editingAirExportRate) return;
    try {
      const payload = {
        Country: editingAirExportRate.country || null,
        CommodityType: editingAirExportRate.commodityType || null,
        Airline: editingAirExportRate.airline || null,
        RateM: editingAirExportRate.rateM ? parseFloat(editingAirExportRate.rateM) : null,
        Rate45Minus: editingAirExportRate.rate45Minus ? parseFloat(editingAirExportRate.rate45Minus) : null,
        Rate45: editingAirExportRate.rate45 ? parseFloat(editingAirExportRate.rate45) : null,
        Rate100: editingAirExportRate.rate100 ? parseFloat(editingAirExportRate.rate100) : null,
        Rate300: editingAirExportRate.rate300 ? parseFloat(editingAirExportRate.rate300) : null,
        Rate500: editingAirExportRate.rate500 ? parseFloat(editingAirExportRate.rate500) : null,
        Rate1000: editingAirExportRate.rate1000 ? parseFloat(editingAirExportRate.rate1000) : null,
        Surcharges: editingAirExportRate.surcharges || null,
        TransitTime: editingAirExportRate.transitTime || null,
        Frequency: editingAirExportRate.frequency || null,
        Routing: editingAirExportRate.routing || null,
        Remarks: editingAirExportRate.remarks || null,
        UpdatedDate: editingAirExportRate.updatedDate || null,
      };
      const response = await fetch(`${BASE_URL}/rates/air-export/${editingAirExportRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setShowAirExportEditModal(false);
        setEditingAirExportRate(null);
        loadAirExportRates();
      } else {
        window.alert('❌ Failed to update rate.');
      }
    } catch (err) {
      window.alert('❌ Failed to update rate.');
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

  // State for showing Sea Spot Rates sub-section
  const [showSeaSpotRates, setShowSeaSpotRates] = useState(false);
  // State for showing Linear Header's sub-section
  const [showLinearHeaders, setShowLinearHeaders] = useState(false);
  // State for showing Destination Header's sub-section
  const [showDestinationHeaders, setShowDestinationHeaders] = useState(false);
  // Track which category the active liner belongs to ('linearheaders' or 'destinationheaders')
  const [activeLinerCategory, setActiveLinerCategory] = useState(null);
  // Destination rates data (separate from liner rates due to different format)
  const [destinationRates, setDestinationRates] = useState([]);
  const [destinationLoading, setDestinationLoading] = useState(false);

  // Load destination rates (different API endpoint and format)
  const loadDestinationRates = async (category) => {
    setDestinationLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/rates/destination?category=${category}`);
      const data = await response.json();

      // Transform backend data to frontend format
      const transformedData = data.map(rate => ({
        id: rate.Id || rate.id,
        destination: rate.Destination || rate.destination,
        liner: rate.Liner || rate.liner,
        gp20: rate.Gp20 || rate.gp20,
        hq40: rate.Hq40 || rate.hq40,
        ttRouting: rate.TtRouting || rate.ttRouting || rate.tt_routing,
        valid: rate.Valid || rate.valid,
        category: rate.Category || rate.category,
        remark: rate.Remark || rate.remark,
        // For display compatibility
        freightType: 'SEA-EXPORT-FCL',
        currency: 'USD'
      }));

      setDestinationRates(transformedData);
    } catch (err) {
      console.error('Error fetching destination rates:', err);
      setDestinationRates([]);
    } finally {
      setDestinationLoading(false);
    }
  };

  // Handle liner tab click for Linear Header's
  const handleLinearHeaderLinerClick = (linerCode) => {
    setActiveLiner(linerCode);
    setActiveLinerCategory('linearheaders');
    setActiveTab('liner');
    setShowSeaSpotRates(false);
    setShowDestinationHeaders(false);
    setShowAirExport(false);
    loadLinerRates(linerCode);
  };

  // Handle liner tab click for Destination Header's
  const handleDestinationHeaderLinerClick = (linerCode) => {
    setActiveLiner(linerCode);
    setActiveLinerCategory('destinationheaders');
    setActiveTab('liner');
    setShowSeaSpotRates(false);
    setShowLinearHeaders(false);
    setShowAirExport(false);
    loadDestinationRates(linerCode);
  };

  // Handle regular tab click
  const handleRegularTabClick = (tab) => {
    setActiveTab(tab);
    setActiveLiner(null);
    setActiveLinerCategory(null);
    setShowSeaSpotRates(false);
    setShowLinearHeaders(false);
    setShowDestinationHeaders(false);
    setShowAirExport(false);
  };

  // Handle Sea Spot Rates button click
  const handleSeaSpotRatesClick = () => {
    const willShow = !showSeaSpotRates;
    setShowSeaSpotRates(willShow);
    setShowLinearHeaders(false);
    setShowDestinationHeaders(false);
    setShowAirExport(false);
    setActiveLiner(null);
    setActiveLinerCategory(null);
    if (willShow) {
      setActiveTab('seaspot');
      loadSeaSpotRates();
    } else {
      setActiveTab('all');
    }
  };

  // Handle Linear Header's button click
  const handleLinearHeadersClick = () => {
    const willShow = !showLinearHeaders;
    setShowLinearHeaders(willShow);
    setShowSeaSpotRates(false);
    setShowDestinationHeaders(false);
    setShowAirExport(false);
    // Reset active liner if closing, or if switching from destination headers
    if (!willShow) {
      if (activeLinerCategory === 'linearheaders') {
        setActiveLiner(null);
        setActiveLinerCategory(null);
      }
    } else {
      // Opening liner headers - clear destination active state
      if (activeLinerCategory === 'destinationheaders') {
        setActiveLiner(null);
        setActiveLinerCategory(null);
      }
    }
  };

  // Handle Destination Header's button click
  const handleDestinationHeadersClick = () => {
    const willShow = !showDestinationHeaders;
    setShowDestinationHeaders(willShow);
    setShowSeaSpotRates(false);
    setShowLinearHeaders(false);
    setShowAirExport(false);
    // Reset active liner if closing, or if switching from liner headers
    if (!willShow) {
      if (activeLinerCategory === 'destinationheaders') {
        setActiveLiner(null);
        setActiveLinerCategory(null);
      }
    } else {
      // Opening destination headers - clear liner active state
      if (activeLinerCategory === 'linearheaders') {
        setActiveLiner(null);
        setActiveLinerCategory(null);
      }
    }
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

    switch (activeTab) {
      case 'air':
        filtered = rates.filter(rate => rate.freightType?.toLowerCase().includes('air'));
        break;
      case 'sea':
        filtered = rates.filter(rate => rate.freightType?.toLowerCase().includes('sea'));
        break;
      case 'liner':
        // Liner tab uses its own data, return empty for regular rates
        return [];
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

  // Filter Air Export rates by search query
  const getFilteredAirExportRates = () => {
    if (!searchQuery.trim()) return airExportRates;
    const q = searchQuery.toLowerCase();
    return airExportRates.filter(rate =>
      rate.country?.toLowerCase().includes(q) ||
      rate.airline?.toLowerCase().includes(q) ||
      rate.commodityType?.toLowerCase().includes(q) ||
      rate.routing?.toLowerCase().includes(q)
    );
  };

  // Filter Sea Spot rates by search query
  const getFilteredSeaSpotRates = () => {
    if (!searchQuery.trim()) return seaSpotRates;
    const q = searchQuery.toLowerCase();
    return seaSpotRates.filter(rate =>
      rate.pol?.toLowerCase().includes(q) ||
      rate.pod?.toLowerCase().includes(q) ||
      rate.carrier?.toLowerCase().includes(q) ||
      rate.liner?.toLowerCase().includes(q) ||
      rate.route?.toLowerCase().includes(q)
    );
  };

  const handleRefresh = () => {
    if (activeTab === 'airexport') {
      loadAirExportRates();
    } else if (activeTab === 'seaspot') {
      loadSeaSpotRates();
    } else if (activeLinerCategory === 'destinationheaders') {
      loadDestinationRates(activeLiner);
    } else if (activeLiner) {
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
      window.alert('Failed to delete rate.');
    }
  };

  // Delete handler for Destination Header's rates
  const handleDeleteDestinationRate = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      const response = await fetch(`${BASE_URL}/rates/destination/${rateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDestinationRates(activeLiner);
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      window.alert('Failed to delete rate.');
    }
  };

  // Excel Upload Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        window.alert('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      setExcelFile(file);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile || !activeLiner) {
      window.alert('Please select an Excel file and ensure a shipping line is selected.');
      return;
    }

    setUploadProgress(true);
    try {
      // Parse Excel file
      console.log('Starting Excel upload for:', activeLiner);
      
      let workbook, excelData;
      
      try {
        const data = await excelFile.arrayBuffer();
        workbook = XLSX.read(data, { type: "array" });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in Excel file');
        }
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        if (!sheet) {
          throw new Error('Cannot read Excel sheet');
        }
        
        const rawData = XLSX.utils.sheet_to_json(sheet);
        // Trim whitespace from column header keys (Excel often has trailing spaces)
        excelData = rawData.map(row => {
          const cleaned = {};
          for (const key of Object.keys(row)) {
            cleaned[key.trim()] = row[key];
          }
          return cleaned;
        });

      } catch (parseError) {
        let errorMsg = '❌ Cannot read Excel file\n\n';
        errorMsg += '📋 Possible reasons:\n';
        errorMsg += '• File is corrupted or damaged\n';
        errorMsg += '• File is not a valid Excel format (.xlsx, .xls)\n';
        errorMsg += '• File is password protected\n';
        errorMsg += '• File is open in another program\n\n';
        errorMsg += `Technical error: ${parseError.message}`;
        
        window.alert(errorMsg);
        setUploadProgress(false);
        return;
      }

      console.log(`Parsed ${excelData.length} rows from Excel`);
      console.log('Sample row:', excelData[0]);
      console.log('Column headers detected:', Object.keys(excelData[0] || {}));

      // Validate that we have data
      if (!excelData || excelData.length === 0) {
        window.alert('Excel file is empty or could not be read. Please check the file format.');
        setUploadProgress(false);
        return;
      }

      // Validate Excel format - check for required columns
      const firstRow = excelData[0];
      const columnHeaders = Object.keys(firstRow || {});

      // Check if this is a Destination Header's format (DESTINATION, LINER columns)
      const isDestinationFormat = activeLinerCategory === 'destinationheaders';

      if (isDestinationFormat) {
        // Destination Header's format: DESTINATION, LINER, 20GP, 40HQ, TT/ROUTING, VALID
        const hasDestinationColumn = columnHeaders.some(col =>
          col.toUpperCase() === 'DESTINATION'
        );
        const hasLinerColumn = columnHeaders.some(col =>
          col.toUpperCase() === 'LINER'
        );
        const hasRateColumns = columnHeaders.some(col =>
          col.includes('20GP') ||
          col.includes('40HQ')
        );

        if (!hasDestinationColumn || !hasLinerColumn || !hasRateColumns) {
          let errorMsg = '❌ Excel file format error!\n\n';
          errorMsg += 'Missing required columns for Destination Header\'s:\n';

          if (!hasDestinationColumn) {
            errorMsg += '• DESTINATION column\n';
          }
          if (!hasLinerColumn) {
            errorMsg += '• LINER column\n';
          }
          if (!hasRateColumns) {
            errorMsg += '• Rate columns (20GP, 40HQ)\n';
          }

          errorMsg += '\n📋 Your Excel file has these columns:\n';
          errorMsg += columnHeaders.join(', ') || 'No columns detected';
          errorMsg += '\n\n✅ Required format for Destination Header\'s:\n';
          errorMsg += '• DESTINATION\n';
          errorMsg += '• LINER\n';
          errorMsg += '• 20GP\n';
          errorMsg += '• 40HQ\n';
          errorMsg += '• TT/ROUTING (optional)\n';
          errorMsg += '• VALID (optional)\n';

          window.alert(errorMsg);
          setUploadProgress(false);
          return;
        }
      } else {
        // Standard linear format: POL, POD, 20GP USD, 40HQ-USD, TT/Routing, Valid
        const hasPolColumn = columnHeaders.some(col =>
          col.toUpperCase() === 'POL' ||
          col.toUpperCase() === 'ORIGIN'
        );
        const hasPodColumn = columnHeaders.some(col =>
          col.toUpperCase() === 'POD' ||
          col.toUpperCase() === 'DESTINATION'
        );
        const hasRateColumns = columnHeaders.some(col =>
          col.includes('20GP') ||
          col.includes('20 GP') ||
          col.includes('40HQ') ||
          col.includes('40 HQ') ||
          col.toUpperCase().includes('GP20') ||
          col.toUpperCase().includes('HQ40')
        );

        if (!hasPolColumn || !hasPodColumn || !hasRateColumns) {
          let errorMsg = '❌ Excel file format error!\n\n';
          errorMsg += 'Missing required columns:\n';

          if (!hasPolColumn) {
            errorMsg += '• POL (Port of Loading) or Origin column\n';
          }
          if (!hasPodColumn) {
            errorMsg += '• POD (Port of Discharge) or Destination column\n';
          }
          if (!hasRateColumns) {
            errorMsg += '• Rate columns (20GP USD, 40HQ-USD, etc.)\n';
          }

          errorMsg += '\n📋 Your Excel file has these columns:\n';
          errorMsg += columnHeaders.join(', ') || 'No columns detected';
          errorMsg += '\n\n✅ Required format:\n';
          errorMsg += '• POL (or Origin)\n';
          errorMsg += '• POD (or Destination)\n';
          errorMsg += '• 20GP USD (or 20GP-USD, 20GP_USD)\n';
          errorMsg += '• 40HQ-USD (or 40HQ USD, 40HQ_USD)\n';
          errorMsg += '• TT/Routing (optional)\n';
          errorMsg += '• VALID (optional)\n';
          errorMsg += '\n💡 Tip: Download the template for the correct format.';

          window.alert(errorMsg);
          setUploadProgress(false);
          return;
        }
      }

      // Helper function to parse Excel date
      const parseExcelDate = (value) => {
        if (!value) return null;
        if (typeof value === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + value * 86400000);
          return jsDate.toISOString().split('T')[0];
        } else if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        } else if (typeof value === 'string' && value.includes('/')) {
          const parts = value.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        return value;
      };

      let transformedData;
      let validRows;
      let apiEndpoint;

      if (isDestinationFormat) {
        // Transform for Destination Header's format
        transformedData = excelData.map((row, index) => {
          const destination = row.DESTINATION || row.Destination || row.destination || null;
          const liner = row.LINER || row.Liner || row.liner || null;
          const gp20 = row['20GP'] || row['20GP USD'] || row['20GP-USD'] || row.gp20 || null;
          const hq40 = row['40HQ'] || row['40HQ-USD'] || row['40HQ USD'] || row.hq40 || null;
          const ttRouting = row['TT/ROUTING'] || row['TT/Routing'] || row['TT-Routing'] || row.ttRouting || null;
          const valid = parseExcelDate(row.VALID || row.Valid || row.valid);

          if (!destination || !liner) {
            console.warn(`Row ${index + 1} missing required fields:`, { destination, liner });
          }

          return {
            Destination: destination,
            Liner: liner,
            Gp20: gp20 ? parseFloat(gp20) : null,
            Hq40: hq40 ? parseFloat(hq40) : null,
            TtRouting: ttRouting ? String(ttRouting) : null,
            Valid: valid,
            Category: activeLiner
          };
        });

        validRows = transformedData.filter(row =>
          row.Destination && row.Liner && (row.Gp20 || row.Hq40)
        );
        apiEndpoint = `${BASE_URL}/rates/destination/bulk`;
      } else {
        // Transform for standard linear format
        transformedData = excelData.map((row, index) => {
          const pol = row.POL || row.pol || row.Origin || row.origin || null;
          const pod = row.POD || row.pod || row.Destination || row.destination || null;
          const gp20Usd = row['20GP USD'] || row['20GP-USD'] || row['20GP_USD'] || row['20GP'] || row.gp20_usd || row.Gp20Usd || null;
          const hq40Usd = row['40HQ-USD'] || row['40HQ USD'] || row['40HQ_USD'] || row['40HQ'] || row.hq40_usd || row.Hq40Usd || null;
          const ttRouting = row['TT/Routing'] || row['TT-Routing'] || row['TT/ROUITNG'] || row.TTRouting || row.tt_routing || row.TtRouting || null;
          const valid = parseExcelDate(row['VALID '] || row.Valid || row.valid || row.validateDate || row.ValidateDate);

          if (!pol || !pod) {
            console.warn(`Row ${index + 1} missing required fields:`, { pol, pod, gp20Usd, hq40Usd });
          }

          return {
            Pol: pol,
            Pod: pod,
            Gp20Usd: gp20Usd ? parseFloat(gp20Usd) : null,
            Hq40Usd: hq40Usd ? parseFloat(hq40Usd) : null,
            TtRouting: ttRouting ? String(ttRouting) : null,
            Valid: valid,
            Category: activeLiner,
            LinerType: 'LINEAR_HEADER'
          };
        });

        validRows = transformedData.filter(row =>
          row.Pol && row.Pod && (row.Gp20Usd || row.Hq40Usd)
        );
        apiEndpoint = `${BASE_URL}/rates/linear/bulk`;
      }

      if (validRows.length === 0) {
        let errorMsg = '❌ No valid data found in Excel file!\n\n';
        errorMsg += '📋 Common issues:\n';
        if (isDestinationFormat) {
          errorMsg += '• DESTINATION/LINER columns are empty\n';
          errorMsg += '• Rate columns (20GP, 40HQ) are empty\n';
        } else {
          errorMsg += '• POL/POD columns are empty\n';
          errorMsg += '• Rate columns (20GP USD, 40HQ-USD) are empty\n';
        }
        errorMsg += '• Data starts from wrong row (should have headers in row 1)\n';
        errorMsg += '\n✅ Each row must have:\n';
        if (isDestinationFormat) {
          errorMsg += '• DESTINATION\n';
          errorMsg += '• LINER\n';
          errorMsg += '• At least one rate value (20GP or 40HQ)\n';
        } else {
          errorMsg += '• POL (Port of Loading)\n';
          errorMsg += '• POD (Port of Discharge)\n';
          errorMsg += '• At least one rate value (20GP USD or 40HQ-USD)\n';
        }
        errorMsg += '\n💡 Tip: Download the template and check your data format.';

        window.alert(errorMsg);
        setUploadProgress(false);
        return;
      }

      if (validRows.length < transformedData.length) {
        const skipped = transformedData.length - validRows.length;
        const percentage = Math.round((skipped / transformedData.length) * 100);

        console.warn(`⚠️ Skipping ${skipped} rows (${percentage}%) with missing required fields or rate values`);

        // Show details of first few skipped rows for debugging
        const skippedRows = isDestinationFormat
          ? transformedData.filter(row => !row.Destination || !row.Liner || (!row.Gp20 && !row.Hq40)).slice(0, 3)
          : transformedData.filter(row => !row.Pol || !row.Pod || (!row.Gp20Usd && !row.Hq40Usd)).slice(0, 3);
        
        console.warn('Sample of skipped rows:', skippedRows);

        // Inform user about skipped rows
        if (skipped > 0) {
          const skipMsg = `⚠️ Warning: ${skipped} out of ${transformedData.length} rows will be skipped because they are missing:\n\n`;
          let reasons = [];

          if (isDestinationFormat) {
            const missingDest = transformedData.filter(row => !row.Destination).length;
            const missingLiner = transformedData.filter(row => !row.Liner).length;
            const missingRates = transformedData.filter(row => !row.Gp20 && !row.Hq40).length;

            if (missingDest > 0) reasons.push(`• ${missingDest} rows: Missing DESTINATION`);
            if (missingLiner > 0) reasons.push(`• ${missingLiner} rows: Missing LINER`);
            if (missingRates > 0) reasons.push(`• ${missingRates} rows: Missing rate values`);
          } else {
            const missingPol = transformedData.filter(row => !row.Pol).length;
            const missingPod = transformedData.filter(row => !row.Pod).length;
            const missingRates = transformedData.filter(row => !row.Gp20Usd && !row.Hq40Usd).length;

            if (missingPol > 0) reasons.push(`• ${missingPol} rows: Missing POL/Origin`);
            if (missingPod > 0) reasons.push(`• ${missingPod} rows: Missing POD/Destination`);
            if (missingRates > 0) reasons.push(`• ${missingRates} rows: Missing rate values`);
          }

          if (!window.confirm(skipMsg + reasons.join('\n') + `\n\n✅ Continue uploading ${validRows.length} valid rows?`)) {
            setUploadProgress(false);
            return;
          }
        }
      }

      // Send to backend
      console.log(`Uploading ${validRows.length} valid rates for ${activeLiner} to ${apiEndpoint}`);
      console.log('Sample transformed data:', validRows[0]);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Rates: validRows }),
      });

      const responseData = await response.json();
      console.log('Backend response:', responseData);

      if (response.ok) {
        let successMsg = '';

        if (responseData.failCount > 0) {
          successMsg = `✅ Upload Complete\n\n`;
          successMsg += `• Successfully uploaded: ${responseData.successCount} rates\n`;
          successMsg += `• Failed: ${responseData.failCount} rates\n\n`;
          successMsg += `⚠️ Some rates failed to upload. Check console for details.`;
        } else {
          successMsg = `✅ Success!\n\nUploaded ${responseData.successCount} rates for ${activeLiner}`;
        }

        window.alert(successMsg);
        setShowLinerModal(false);
        setExcelFile(null);
        // Reload appropriate data based on category
        if (isDestinationFormat) {
          loadDestinationRates(activeLiner);
        } else {
          loadLinerRates(activeLiner);
        }
      } else {
        // Detailed error message based on response
        let errorMsg = '❌ Upload Failed\n\n';
        
        if (responseData.message) {
          errorMsg += `Error: ${responseData.message}\n\n`;
        }
        
        if (response.status === 400) {
          errorMsg += '📋 This usually means:\n';
          errorMsg += '• Invalid data format\n';
          errorMsg += '• Database constraint violation\n';
          errorMsg += '• Missing required fields\n';
        } else if (response.status === 500) {
          errorMsg += '⚠️ Server error occurred.\n';
          errorMsg += 'Please contact your administrator.\n';
        }
        
        errorMsg += '\n💡 Check browser console for more details.';
        
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error uploading Excel:', err);
      
      // Provide user-friendly error message
      let userErrorMsg = '';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        userErrorMsg = '❌ Network Error\n\n';
        userErrorMsg += 'Cannot connect to server.\n';
        userErrorMsg += 'Please check your internet connection.';
      } else if (err.message.startsWith('❌')) {
        // Already formatted error message
        userErrorMsg = err.message;
      } else {
        userErrorMsg = `❌ Upload Failed\n\n${err.message}\n\n`;
        userErrorMsg += '💡 Tips:\n';
        userErrorMsg += '• Check that your Excel file has the correct format\n';
        userErrorMsg += '• Ensure all required columns are filled\n';
        userErrorMsg += '• Try downloading and using the template\n';
        userErrorMsg += '• Check browser console for technical details';
      }
      
      window.alert(userErrorMsg);
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

  // Determine which data to display based on active category
  // Sea Spot & Air Export rates are shown in their own inline sections, not in the card list
  const displayData = (activeTab === 'seaspot' || activeTab === 'airexport')
    ? []
    : activeLinerCategory === 'destinationheaders'
      ? destinationRates
      : activeLiner
        ? linerRates
        : filteredRates;
  const isLoadingData = (activeTab === 'seaspot' || activeTab === 'airexport')
    ? false
    : activeLinerCategory === 'destinationheaders'
      ? destinationLoading
      : activeLiner
        ? linerLoading
        : loading;

  // Get active liner details - check Linear Header's and Destination Header's categories
  const activeLinerDetails = linearHeaderLines.find(liner => liner.code === activeLiner)
    || destinationHeaderLines.find(liner => liner.code === activeLiner);

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
            {activeTab === 'seaspot' || activeTab === 'airexport' ? null : !activeLiner ? (
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

          {/* Tabs & Search - Header Line */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Regular Tabs */}
            <button
              onClick={() => handleRegularTabClick('air')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'air' && !activeLiner ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Plane className="w-4 h-4" /> Air Freight
            </button>

            {/* Air Export Rates Button - next to Air Freight */}
            <button
              onClick={handleAirExportClick}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showAirExport
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" /> Air Export Rates
              <ChevronDown className={`w-4 h-4 transition-transform ${showAirExport ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => handleRegularTabClick('sea')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'sea' && !activeLiner ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Ship className="w-4 h-4" /> Sea Freight
            </button>

            {/* Horizontal Divider */}
            <div className="w-px h-8 bg-slate-300 mx-2"></div>

            {/* Sea Spot Rates Button */}
            <button
              onClick={handleSeaSpotRatesClick}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showSeaSpotRates
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Ship className="w-4 h-4" /> Sea Spot Rates
              <ChevronDown className={`w-4 h-4 transition-transform ${showSeaSpotRates ? 'rotate-180' : ''}`} />
            </button>

            {/* Liner Header's Button */}
            <button
              onClick={handleLinearHeadersClick}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showLinearHeaders || activeLinerCategory === 'linearheaders'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Ship className="w-4 h-4" /> Liner Header's
              <ChevronDown className={`w-4 h-4 transition-transform ${showLinearHeaders || activeLinerCategory === 'linearheaders' ? 'rotate-180' : ''}`} />
            </button>

            {/* Destination Header's Button */}
            <button
              onClick={handleDestinationHeadersClick}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showDestinationHeaders || activeLinerCategory === 'destinationheaders'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" /> Destination Header's
              <ChevronDown className={`w-4 h-4 transition-transform ${showDestinationHeaders || activeLinerCategory === 'destinationheaders' ? 'rotate-180' : ''}`} />
            </button>

            {/* Spacer to push search bar to right */}
            <div className="flex-1"></div>

            {/* Search Bar - Right side of header */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by origin, destination, carrier, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Sea Spot Rates Section - Flat table with upload */}
          {showSeaSpotRates && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">Sea Spot Rates ({seaSpotRates.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSeaSpotUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Excel
                  </button>
                  {isAdmin && seaSpotRates.length > 0 && (
                    <button
                      onClick={handleDeleteAllSpotRates}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {seaSpotLoading ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Loading sea spot rates...</p>
                </div>
              ) : seaSpotRates.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Liner</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">POL</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">POD</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">20GP</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">40HQ</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">TT/Routing</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Valid</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Remark</th>
                        {isAdmin && <th className="px-3 py-2.5 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getFilteredSeaSpotRates().map((rate) => (
                        <tr key={rate.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-indigo-700">{rate.liner || '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{rate.pol || '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{rate.pod || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">{rate.gp20Usd != null ? `$${parseFloat(rate.gp20Usd).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">{rate.hq40Usd != null ? `$${parseFloat(rate.hq40Usd).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{rate.ttRouting || '—'}</td>
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{rate.valid ? new Date(rate.valid).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          <td className="px-3 py-2 text-slate-500 text-xs max-w-[150px] truncate">{rate.remark || '—'}</td>
                          {isAdmin && (
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Delete this rate?')) return;
                                  try {
                                    await fetch(`${BASE_URL}/rates/linear/${rate.id}`, { method: 'DELETE' });
                                    setSeaSpotRates(prev => prev.filter(r => r.id !== rate.id));
                                  } catch (err) { console.error(err); }
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No sea spot rates. Upload an Excel file to get started.
                </div>
              )}
            </div>
          )}

          {/* Sea Spot Upload Modal */}
          {showSeaSpotUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Upload Sea Spot Rates</h3>
                  </div>
                  <button onClick={() => { setShowSeaSpotUploadModal(false); setSeaSpotExcelFile(null); }} className="text-white hover:bg-white/20 rounded-lg p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Upload an Excel file with headers:<br/>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded mt-1 inline-block">LINER | POL | POD | 20GP | 40HQ | TT/ROUTING | VALID | REMARK</code>
                  </p>
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">{seaSpotExcelFile ? seaSpotExcelFile.name : 'Click to select Excel file'}</p>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setSeaSpotExcelFile(e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setShowSeaSpotUploadModal(false); setSeaSpotExcelFile(null); }} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                    <button onClick={handleSeaSpotExcelUpload} disabled={!seaSpotExcelFile || seaSpotUploadProgress} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                      {seaSpotUploadProgress ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Linear Header's Sub-section - Shipping Line Buttons */}
          {(showLinearHeaders || activeLinerCategory === 'linearheaders') && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-xs text-emerald-600 font-medium w-full mb-2">Liner Header's</span>
              {linearHeaderLines.map((liner) => (
                <button
                  key={liner.code}
                  onClick={() => handleLinearHeaderLinerClick(liner.code)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activeLiner === liner.code && activeLinerCategory === 'linearheaders'
                      ? `${liner.color} text-white shadow-md`
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Ship className="w-4 h-4" /> {liner.name}
                </button>
              ))}
            </div>
          )}

          {/* Destination Header's Sub-section - Region Buttons */}
          {(showDestinationHeaders || activeLinerCategory === 'destinationheaders') && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-xs text-red-600 font-medium w-full mb-2">Destination Header's</span>
              {destinationHeaderLines.map((liner) => (
                <button
                  key={liner.code}
                  onClick={() => handleDestinationHeaderLinerClick(liner.code)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activeLiner === liner.code && activeLinerCategory === 'destinationheaders'
                      ? `${liner.color} text-white shadow-md`
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" /> {liner.name}
                </button>
              ))}
            </div>
          )}

          {/* Air Export Rates Section */}
          {showAirExport && (
            <div className="mb-4">
              {/* Header bar */}
              <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-t-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plane className="w-6 h-6" />
                    <div>
                      <h3 className="text-lg font-bold">Air Export Rates</h3>
                      <p className="text-sm opacity-90">
                        {airExportRates.length} rates loaded
                        {airExportRates.length > 0 && airExportRates[0]?.commodityType && (
                          <span> · {airExportRates[0].commodityType}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAirExportUploadModal(true)}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Excel
                    </button>
                    {isAdmin && airExportRates.length > 0 && (
                      <button
                        onClick={handleDeleteAllAirExportRates}
                        className="bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card list */}
              <div className="bg-white rounded-b-xl border border-t-0 border-slate-200">
                {airExportLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading air export rates...</p>
                  </div>
                ) : airExportRates.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {getFilteredAirExportRates().map((rate) => (
                      <div key={rate.id} className="p-4 hover:bg-slate-50 transition-colors">
                        {/* Desktop Grid View */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          {/* Airline Badge - Left */}
                          <div className="col-span-1 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600">
                              <Plane className="w-4 h-4" />
                              <span className="uppercase">{rate.airline || '—'}</span>
                            </div>
                            {rate.commodityType && (
                              <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[100px]">{rate.commodityType}</div>
                            )}
                          </div>

                          {/* Country Badge - Between airline and rates */}
                          <div className="col-span-2 flex items-center justify-center">
                            {rate.country && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-300 bg-white">
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{rate.country}</span>
                              </div>
                            )}
                          </div>

                          {/* Rates Grid - M, -45, 45, 100, 300, 500, 1000 */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {rate.rateM != null && (
                                <div className="bg-sky-50 border border-sky-200 rounded px-2 py-1 text-center min-w-[60px]">
                                  <div className="text-[10px] text-sky-600 font-semibold">M</div>
                                  <div className="text-sm font-bold text-sky-800">${parseFloat(rate.rateM).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate45Minus != null && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-slate-500">-45</div>
                                  <div className="text-sm font-bold text-slate-800">${parseFloat(rate.rate45Minus).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate45 != null && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-indigo-600 font-semibold">45</div>
                                  <div className="text-sm font-bold text-indigo-700">${parseFloat(rate.rate45).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate100 != null && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-slate-500">100</div>
                                  <div className="text-sm font-bold text-slate-800">${parseFloat(rate.rate100).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate300 != null && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-slate-500">300</div>
                                  <div className="text-sm font-bold text-slate-800">${parseFloat(rate.rate300).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate500 != null && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-slate-500">500</div>
                                  <div className="text-sm font-bold text-slate-800">${parseFloat(rate.rate500).toLocaleString()}</div>
                                </div>
                              )}
                              {rate.rate1000 != null && (
                                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center min-w-[55px]">
                                  <div className="text-[10px] text-slate-500">1000</div>
                                  <div className="text-sm font-bold text-slate-800">${parseFloat(rate.rate1000).toLocaleString()}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Routing & Details */}
                          <div className="col-span-3">
                            {rate.routing && (
                              <div className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                {rate.routing}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {rate.transitTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {rate.transitTime}
                                </span>
                              )}
                              {rate.frequency && <span>{rate.frequency}</span>}
                              {rate.surcharges && (
                                <span className="text-orange-600 text-[10px]">{rate.surcharges}</span>
                              )}
                            </div>
                            {rate.remarks && (
                              <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[250px]">{rate.remarks}</div>
                            )}
                          </div>

                          {/* Date & Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            {rate.updatedDate && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                                <Calendar className="w-3 h-3" />
                                {new Date(rate.updatedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            <button
                              onClick={() => { setEditingAirExportRate({...rate}); setShowAirExportEditModal(true); }}
                              className="p-2 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Rate"
                            >
                              <Edit className="w-4 h-4 text-slate-600 hover:text-sky-600" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteAirExportRate(rate.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Rate"
                              >
                                <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              {rate.country && (
                                <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {rate.country}
                                </div>
                              )}
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600">
                                <Plane className="w-4 h-4" />
                                <span className="uppercase">{rate.airline || '—'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingAirExportRate({...rate}); setShowAirExportEditModal(true); }} className="p-2 hover:bg-sky-50 rounded-lg">
                                <Edit className="w-4 h-4 text-slate-600" />
                              </button>
                              {isAdmin && (
                                <button onClick={() => handleDeleteAirExportRate(rate.id)} className="p-2 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rate.rateM != null && <div className="bg-sky-50 border border-sky-200 rounded px-2 py-1 text-center"><div className="text-[10px] text-sky-600">M</div><div className="text-sm font-bold">${parseFloat(rate.rateM).toLocaleString()}</div></div>}
                            {rate.rate45Minus != null && <div className="bg-slate-50 rounded px-2 py-1 text-center"><div className="text-[10px]">-45</div><div className="text-sm font-bold">${parseFloat(rate.rate45Minus).toLocaleString()}</div></div>}
                            {rate.rate45 != null && <div className="bg-indigo-50 rounded px-2 py-1 text-center"><div className="text-[10px] text-indigo-600">45</div><div className="text-sm font-bold">${parseFloat(rate.rate45).toLocaleString()}</div></div>}
                            {rate.rate100 != null && <div className="bg-slate-50 rounded px-2 py-1 text-center"><div className="text-[10px]">100</div><div className="text-sm font-bold">${parseFloat(rate.rate100).toLocaleString()}</div></div>}
                            {rate.rate300 != null && <div className="bg-slate-50 rounded px-2 py-1 text-center"><div className="text-[10px]">300</div><div className="text-sm font-bold">${parseFloat(rate.rate300).toLocaleString()}</div></div>}
                            {rate.rate500 != null && <div className="bg-slate-50 rounded px-2 py-1 text-center"><div className="text-[10px]">500</div><div className="text-sm font-bold">${parseFloat(rate.rate500).toLocaleString()}</div></div>}
                            {rate.rate1000 != null && <div className="bg-slate-50 rounded px-2 py-1 text-center"><div className="text-[10px]">1000</div><div className="text-sm font-bold">${parseFloat(rate.rate1000).toLocaleString()}</div></div>}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              {rate.routing && <span>{rate.routing}</span>}
                              {rate.transitTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rate.transitTime}</span>}
                            </div>
                            {rate.updatedDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(rate.updatedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No air export rates. Upload an Excel file to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Air Export Upload Modal */}
          {showAirExportUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Upload Air Export Rates</h3>
                  </div>
                  <button onClick={() => { setShowAirExportUploadModal(false); setAirExportExcelFile(null); }} className="text-white hover:bg-white/20 rounded-lg p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Upload an Excel file with headers:<br/>
                    <code className="text-[10px] bg-slate-100 px-2 py-1 rounded mt-1 inline-block leading-relaxed">
                      City | Commodity Type | AIRLINE | M | -45 | 45 | 100 | 300 | 500 | 1000 | SURCHARGES | T/T | FREQUENCY | ROUTINE | REMARKS | UPDATED DATE
                    </code>
                  </p>
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                    <p className="text-xs text-sky-700">
                      <strong>Note:</strong> Commodity Type is shared across all rows. Blank cells will be stored as empty. Rows without AIRLINE will be skipped.
                    </p>
                  </div>
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">{airExportExcelFile ? airExportExcelFile.name : 'Click to select Excel file'}</p>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setAirExportExcelFile(e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setShowAirExportUploadModal(false); setAirExportExcelFile(null); }} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                    <button onClick={handleAirExportExcelUpload} disabled={!airExportExcelFile || airExportUploadProgress} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                      {airExportUploadProgress ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Air Export Edit Modal */}
          {showAirExportEditModal && editingAirExportRate && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Edit Air Export Rate</h3>
                  </div>
                  <button onClick={() => { setShowAirExportEditModal(false); setEditingAirExportRate(null); }} className="text-white hover:bg-white/20 rounded-lg p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                      <input type="text" value={editingAirExportRate.country || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, country: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Commodity Type</label>
                      <input type="text" value={editingAirExportRate.commodityType || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, commodityType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Airline</label>
                      <input type="text" value={editingAirExportRate.airline || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, airline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { key: 'rateM', label: 'M (Min)' },
                      { key: 'rate45Minus', label: '-45 kg' },
                      { key: 'rate45', label: '45 kg' },
                      { key: 'rate100', label: '100 kg' },
                      { key: 'rate300', label: '300 kg' },
                      { key: 'rate500', label: '500 kg' },
                      { key: 'rate1000', label: '1000 kg' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <input type="number" step="0.01" value={editingAirExportRate[key] ?? ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, [key]: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="—" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Surcharges</label>
                      <input type="text" value={editingAirExportRate.surcharges || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, surcharges: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">T/T</label>
                      <input type="text" value={editingAirExportRate.transitTime || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, transitTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                      <input type="text" value={editingAirExportRate.frequency || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, frequency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Routing</label>
                      <input type="text" value={editingAirExportRate.routing || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, routing: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                    <input type="text" value={editingAirExportRate.remarks || ''} onChange={(e) => setEditingAirExportRate({...editingAirExportRate, remarks: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setShowAirExportEditModal(false); setEditingAirExportRate(null); }} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                    <button onClick={handleSaveAirExportEdit} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-medium flex items-center gap-2">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                    {activeLinerCategory === 'destinationheaders' ? <MapPin className="w-6 h-6" /> : <Ship className="w-6 h-6" />}
                    <div>
                      <h3 className="text-lg font-bold">{activeLiner} Rates</h3>
                      <p className="text-sm opacity-90">
                        Showing {activeLinerCategory === 'destinationheaders' ? destinationRates.length : linerRates.length} rates for {activeLiner}
                      </p>
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
              const isDestinationRate = activeLinerCategory === 'destinationheaders'; // Destination Header's rate

              return (
                <div key={rate.sysID || rate.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Main Row */}
                  <div className="p-4">
                    {/* Destination Header's Rates Display (Different format: DESTINATION, LINER) */}
                    {isDestinationRate ? (
                      <>
                        {/* Desktop Grid View for Destination Rates */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          {/* Category Badge */}
                          <div className="col-span-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${activeLinerDetails?.color || 'bg-red-700'}`}>
                              <MapPin className="w-4 h-4" />
                              <span className="uppercase text-xs">{activeLiner?.split(' ')[0]}</span>
                            </div>
                          </div>

                          {/* Destination */}
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500">Destination</div>
                            <div className="font-bold text-slate-800">{rate.destination || '-'}</div>
                          </div>

                          {/* Liner */}
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500">Liner</div>
                            <div className="font-semibold text-slate-700">{rate.liner || '-'}</div>
                          </div>

                          {/* 20GP Rate */}
                          <div className="col-span-1">
                            <div className="text-sm font-semibold text-slate-600">20' GP</div>
                            <div className="text-lg font-bold text-indigo-600">
                              {rate.gp20 ? formatCurrency(rate.gp20) : '-'}
                            </div>
                          </div>

                          {/* 40HQ Rate */}
                          <div className="col-span-1">
                            <div className="text-sm font-semibold text-slate-600">40' HQ</div>
                            <div className="text-lg font-bold text-emerald-600">
                              {rate.hq40 ? formatCurrency(rate.hq40) : '-'}
                            </div>
                          </div>

                          {/* TT/Routing */}
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500">TT/Routing</div>
                            <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {rate.ttRouting || '-'}
                            </div>
                          </div>

                          {/* Valid Date */}
                          <div className="col-span-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDate(rate.valid)}
                            </div>
                          </div>

                          {/* Actions - Delete button for admin or users with RateManageView */}
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            {canManageRates && (
                              <button
                                onClick={() => handleDeleteDestinationRate(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Rate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile Card View for Destination Rates */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${activeLinerDetails?.color || 'bg-red-700'}`}>
                              <MapPin className="w-4 h-4" />
                              <span className="uppercase">{activeLiner?.split(' ')[0]}</span>
                            </div>
                            {canManageRates && (
                              <button
                                onClick={() => handleDeleteDestinationRate(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-slate-500">Destination</div>
                                <div className="font-bold">{rate.destination || '-'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Liner</div>
                                <div className="font-semibold">{rate.liner || '-'}</div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-indigo-600 mb-1">20' GP</div>
                              <div className="text-lg font-bold text-indigo-700">
                                {rate.gp20 ? formatCurrency(rate.gp20) : '-'}
                              </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                              <div className="text-xs font-semibold text-emerald-600 mb-1">40' HQ</div>
                              <div className="text-lg font-bold text-emerald-700">
                                {rate.hq40 ? formatCurrency(rate.hq40) : '-'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3 h-3" />
                              {rate.ttRouting || '-'}
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(rate.valid)}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : isLinerRate ? (
                      <>
                        {/* Desktop Grid View for Linear Rates */}
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

                          {/* Actions - Delete button for admin or users with RateManageView */}
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            {canManageRates && (
                              <button
                                onClick={() => handleDelete(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Rate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                            {canManageRates && (
                              <button
                                onClick={() => handleDelete(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Rate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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
                            {isAdmin && (
                              <button onClick={() => handleDelete(rate.sysID || rate.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" /></button>
                            )}
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
                              {isAdmin && (
                                <button onClick={() => handleDelete(rate.sysID || rate.id)} className="p-2 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                                </button>
                              )}
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
        {!isLoadingData && !error && displayData.length === 0 && activeTab !== 'seaspot' && activeTab !== 'airexport' && (
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