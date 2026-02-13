import React, { useState, useEffect, useRef } from "react";
import { BASE_URL } from "../../config/apiConfig";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  FileText, Download, Printer, Filter, Calendar, ChevronDown,
  Users, Building2, Plane, Ship, BarChart3, RefreshCw, X,
  CheckCircle2, XCircle, Clock, TrendingUp, Briefcase, FileSpreadsheet
} from "lucide-react";

export default function ReportsSec() {
  const [activeReport, setActiveReport] = useState("quotation");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [generated, setGenerated] = useState(false);
  const printRef = useRef(null);

  // Filter options (loaded from backend)
  const [salespersons, setSalespersons] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);

  // Quotation filters
  const [qDateFrom, setQDateFrom] = useState("");
  const [qDateTo, setQDateTo] = useState("");
  const [qFreightCategory, setQFreightCategory] = useState("all");
  const [qFreightModes, setQFreightModes] = useState([]);
  const [qCountry, setQCountry] = useState("");
  const [qSalesPerson, setQSalesPerson] = useState("all");
  const [qDepartment, setQDepartment] = useState("all");

  // Sales Activity filters
  const [saDateFrom, setSaDateFrom] = useState("");
  const [saDateTo, setSaDateTo] = useState("");
  const [saSalesPerson, setSaSalesPerson] = useState("all");

  // Customer List filter
  const [clSalesPerson, setClSalesPerson] = useState("all");

  // Freight mode options
  const freightModeOptions = [
    { value: "air-import", label: "Air Import" },
    { value: "air-export", label: "Air Export" },
    { value: "sea-import", label: "Sea Import" },
    { value: "sea-export", label: "Sea Export" },
    { value: "sea-fcl", label: "Sea FCL" },
    { value: "sea-lcl", label: "Sea LCL" },
    { value: "multimodal-mixed", label: "Multimodal" },
  ];

  // Load filter data on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [spRes, deptRes, countryRes] = await Promise.all([
          fetch(`${BASE_URL}/report/filter/salespersons`),
          fetch(`${BASE_URL}/report/filter/departments`),
          fetch(`${BASE_URL}/report/filter/countries`),
        ]);
        const spData = await spRes.json();
        const deptData = await deptRes.json();
        const countryData = await countryRes.json();
        setSalespersons(spData.map(s => s.name || s.Name).filter(Boolean));
        setDepartments(deptData.map(d => d.d_name || d.dName || d.DName || d.dname).filter(Boolean));
        setCountries(countryData.map(c => c.country || c.Country).filter(Boolean));
      } catch (err) {
        console.error("Failed to load filter data:", err);
      }
    };
    loadFilters();
  }, []);

  // Reset filters when switching reports
  useEffect(() => {
    setReportData([]);
    setGenerated(false);
  }, [activeReport]);

  const toggleFreightMode = (mode) => {
    setQFreightModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  // ====== GENERATE REPORT ======
  const generateReport = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      let url = "";
      const params = new URLSearchParams();

      switch (activeReport) {
        case "quotation":
          url = `${BASE_URL}/report/quotation`;
          if (qDateFrom) params.append("dateFrom", qDateFrom);
          if (qDateTo) params.append("dateTo", qDateTo);
          if (qFreightCategory !== "all") params.append("freightCategory", qFreightCategory);
          if (qFreightModes.length > 0) params.append("freightMode", qFreightModes.join(","));
          if (qCountry) params.append("country", qCountry);
          if (qSalesPerson !== "all") params.append("salesPerson", qSalesPerson);
          if (qDepartment !== "all") params.append("department", qDepartment);
          break;
        case "sales-activity":
          url = `${BASE_URL}/report/sales-activity`;
          if (saDateFrom) params.append("dateFrom", saDateFrom);
          if (saDateTo) params.append("dateTo", saDateTo);
          if (saSalesPerson !== "all") params.append("salesPerson", saSalesPerson);
          break;
        case "user-list":
          url = `${BASE_URL}/report/user-list`;
          break;
        case "customer-list":
          url = `${BASE_URL}/report/customer-list`;
          if (clSalesPerson !== "all") params.append("salesPerson", clSalesPerson);
          break;
      }

      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const response = await fetch(fullUrl);
      const data = await response.json();
      setReportData(data);
      setGenerated(true);
    } catch (err) {
      console.error("Error generating report:", err);
      window.alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  // ====== PRINT ======
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${reportTitles[activeReport]} - ScanWell CRM</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; white-space: nowrap; }
        td { padding: 6px 10px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .won { color: #16a34a; font-weight: 600; }
        .lost { color: #dc2626; font-weight: 600; }
        .scheduled { color: #2563eb; }
        .completed { color: #16a34a; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .badge-won { background: #dcfce7; color: #166534; }
        .badge-lost { background: #fee2e2; color: #991b1b; }
        .badge-scheduled { background: #dbeafe; color: #1e40af; }
        .badge-completed { background: #dcfce7; color: #166534; }
        .summary { margin-bottom: 16px; display: flex; gap: 20px; flex-wrap: wrap; }
        .summary-item { background: #f1f5f9; padding: 8px 14px; border-radius: 6px; font-size: 12px; }
        .summary-item strong { display: block; font-size: 18px; color: #1e293b; }
        .filter-info { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
        @media print { body { padding: 10px; } }
      </style>
    </head><body>${printContent}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ====== FORMAT DATE FOR EXPORT (match UI format dd/MM/yyyy) ======
  const formatDateForExport = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateTimeForExport = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  // Prepare export data with formatted dates matching UI
  const getExportData = () => {
    return reportData.map((row, i) => {
      switch (activeReport) {
        case "quotation":
          return {
            '#': i + 1,
            'Quote No': row.QuoteNumber || row.quoteNumber || '—',
            'Date': formatDateForExport(row.CreatedDate || row.createdDate),
            'Customer': row.Customer || row.customer || '—',
            'Category': (row.FreightCategory || row.freightCategory || '—').toUpperCase(),
            'Mode': (row.FreightMode || row.freightMode || '—').toUpperCase(),
            'POL': row.PortOfLoading || row.portOfLoading || '—',
            'POD': row.PortOfDischarge || row.portOfDischarge || '—',
            'Sales Person': row.SalesPerson || row.salesPerson || '—',
            'Department': row.Department || row.department || '—',
            'Status': (row.Status || row.status || 'draft').charAt(0).toUpperCase() + (row.Status || row.status || 'draft').slice(1)
          };
        case "sales-activity":
          return {
            '#': i + 1,
            'Activity': row.ActivityName || row.activityName || row.activity_name || '—',
            'Type': row.ActivityType || row.activityType || row.activity_type || '—',
            'Sales Person': row.SalesPerson || row.salesPerson || row.owner_name || '—',
            'Start': formatDateTimeForExport(row.StartTime || row.startTime || row.start_time),
            'End': formatDateTimeForExport(row.EndTime || row.endTime || row.end_time),
            'Status': (row.Status || row.status || '—').toUpperCase(),
            'Account': row.RelatedAccount || row.relatedAccount || row.related_account || '—',
            'Comment': row.LatestComment || row.latestComment || '—'
          };
        case "user-list":
          return {
            '#': i + 1,
            'Name': row.FullName || row.fullName || `${row.FirstName || row.firstName || row.fname || ""} ${row.LastName || row.lastName || row.lname || ""}`.trim() || '—',
            'Position': row.Position || row.position || '—',
            'Department': row.Department || row.department || '—',
            'Email': row.Email || row.email || '—',
            'Phone': row.Phone || row.phone || row.tp || '—',
            'Location': row.WorkLocation || row.workLocation || row.w_location || '—'
          };
        case "customer-list":
          return {
            '#': i + 1,
            'Account Name': row.AccountName || row.accountName || '—',
            'Type': (row.AccountType || row.accountType || '—').toUpperCase(),
            'Industry': row.Industry || row.industry || '—',
            'Location': row.Location || row.location || '—',
            'Sales Person': row.SalesPerson || row.salesPerson || '—',
            'Primary Contact': row.PrimaryContact || row.primaryContact || '—',
            'Email': row.PrimaryEmail || row.primaryEmail || '—',
            'Phone': row.Phone || row.phone || row.tp || '—'
          };
        default:
          return row;
      }
    });
  };

  // ====== EXPORT EXCEL ======
  const handleExportExcel = () => {
    if (reportData.length === 0) return;
    const exportData = getExportData();
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportTitles[activeReport]);

    // Auto-size columns
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => String(row[key] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `${activeReport}_report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ====== EXPORT PDF ======
  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    const exportData = getExportData();
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape

    // Title
    doc.setFontSize(16);
    doc.text(reportTitles[activeReport], 14, 15);

    // Subtitle
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${getFilterDescription()} | Generated ${new Date().toLocaleString()}`, 14, 22);

    // Table
    const headers = Object.keys(exportData[0]);
    const rows = exportData.map(row => headers.map(h => row[h]));

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${activeReport}_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const reportTitles = {
    quotation: "Quotation Report",
    "sales-activity": "Sales Activity Report",
    "user-list": "User List Report",
    "customer-list": "Customer List Report",
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  // ====== SUMMARY STATS ======
  const getSummaryStats = () => {
    if (reportData.length === 0) return null;
    switch (activeReport) {
      case "quotation": {
        const total = reportData.length;
        const statusCounts = {};
        reportData.forEach(r => {
          const s = (r.Status || r.status || "draft").toLowerCase();
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        return (
          <div className="summary">
            <div className="summary-item"><strong>{total}</strong>Total Quotations</div>
            {Object.entries(statusCounts).map(([s, count]) => (
              <div key={s} className="summary-item">
                <strong style={{ color: s === "approved" ? "#16a34a" : s === "draft" ? "#2563eb" : s === "sent" ? "#7c3aed" : "#64748b" }}>{count}</strong>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>
        );
      }
      case "sales-activity": {
        const total = reportData.length;
        const scheduled = reportData.filter(r => (r.Status || r.status || "").toLowerCase() === "scheduled").length;
        const completed = reportData.filter(r => (r.Status || r.status || "").toLowerCase() === "completed").length;
        return (
          <div className="summary">
            <div className="summary-item"><strong>{total}</strong>Total Activities</div>
            <div className="summary-item"><strong style={{ color: "#2563eb" }}>{scheduled}</strong>Scheduled</div>
            <div className="summary-item"><strong style={{ color: "#16a34a" }}>{completed}</strong>Completed</div>
          </div>
        );
      }
      case "user-list":
        return (
          <div className="summary">
            <div className="summary-item"><strong>{reportData.length}</strong>Total Employees</div>
          </div>
        );
      case "customer-list":
        return (
          <div className="summary">
            <div className="summary-item"><strong>{reportData.length}</strong>Total Customers</div>
          </div>
        );
      default:
        return null;
    }
  };

  // ====== FILTER DESCRIPTION ======
  const getFilterDescription = () => {
    const parts = [];
    switch (activeReport) {
      case "quotation":
        if (qDateFrom || qDateTo) parts.push(`Date: ${qDateFrom || "start"} to ${qDateTo || "now"}`);
        if (qFreightCategory !== "all") parts.push(`Category: ${qFreightCategory}`);
        if (qFreightModes.length > 0) parts.push(`Mode: ${qFreightModes.join(", ")}`);
        if (qCountry) parts.push(`Country: ${qCountry}`);
        if (qSalesPerson !== "all") parts.push(`Sales Person: ${qSalesPerson}`);
        if (qDepartment !== "all") parts.push(`Department: ${qDepartment}`);
        break;
      case "sales-activity":
        if (saDateFrom || saDateTo) parts.push(`Date: ${saDateFrom || "start"} to ${saDateTo || "now"}`);
        if (saSalesPerson !== "all") parts.push(`Sales Person: ${saSalesPerson}`);
        break;
      case "customer-list":
        if (clSalesPerson !== "all") parts.push(`Sales Person: ${clSalesPerson}`);
        break;
    }
    return parts.length > 0 ? parts.join(" | ") : "All records (no filters applied)";
  };

  // ====== RENDER ======
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-violet-600" />
            Reports
          </h1>
          <p className="text-slate-600 mt-1">Generate and export CRM reports</p>
        </div>

        {/* Report Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "quotation", label: "Quotation Report", icon: FileText, color: "violet" },
            { key: "sales-activity", label: "Sales Activity", icon: TrendingUp, color: "blue" },
            { key: "user-list", label: "User List", icon: Users, color: "emerald" },
            { key: "customer-list", label: "Customer List", icon: Building2, color: "amber" },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveReport(key)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeReport === key
                  ? `bg-${color}-600 text-white shadow-md`
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
              style={activeReport === key ? {
                backgroundColor: color === "violet" ? "#7c3aed" : color === "blue" ? "#2563eb" : color === "emerald" ? "#059669" : "#d97706"
              } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Filters</h2>
          </div>

          {/* Quotation Filters */}
          {activeReport === "quotation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={qDateFrom} onChange={e => setQDateFrom(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={qDateTo} onChange={e => setQDateTo(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>

                {/* Freight Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Freight Category</label>
                  <select value={qFreightCategory} onChange={e => setQFreightCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="all">All</option>
                    <option value="air">Freight Forwarding</option>
                    <option value="sea">Warehousing</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Country / Location</label>
                  <select value={qCountry} onChange={e => setQCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="">All Countries</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Freight Mode - Multi-select */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Freight Mode (multiple selection)</label>
                <div className="flex flex-wrap gap-2">
                  {freightModeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleFreightMode(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        qFreightModes.includes(opt.value)
                          ? "bg-violet-100 text-violet-700 border-violet-300"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {qFreightModes.includes(opt.value) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sales Person */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sales Person</label>
                  <select value={qSalesPerson} onChange={e => setQSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="all">All</option>
                    {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                  <select value={qDepartment} onChange={e => setQDepartment(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                    <option value="all">All</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sales Activity Filters */}
          {activeReport === "sales-activity" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" value={saDateFrom} onChange={e => setSaDateFrom(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" value={saDateTo} onChange={e => setSaDateTo(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sales Person</label>
                <select value={saSalesPerson} onChange={e => setSaSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="all">All</option>
                  {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* User List - No filters */}
          {activeReport === "user-list" && (
            <p className="text-sm text-slate-500">No filters required. All employees will be listed.</p>
          )}

          {/* Customer List Filters */}
          {activeReport === "customer-list" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sales Person</label>
                <select value={clSalesPerson} onChange={e => setClSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="all">All</option>
                  {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Report"}
            </button>

            {generated && reportData.length > 0 && (
              <>
                <button onClick={handlePrint} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={handleExportExcel} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
                </button>
                <button onClick={handleExportPDF} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-red-600" /> Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Report Output */}
        {generated && (
          <div ref={printRef}>
            {/* Report Header (for print) */}
            <h1 style={{ marginBottom: 4 }}>{reportTitles[activeReport]}</h1>
            <div className="filter-info subtitle">{getFilterDescription()} &middot; Generated {new Date().toLocaleString()}</div>

            {/* Summary Stats */}
            {getSummaryStats()}

            {/* Report Table */}
            {reportData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No data found matching your filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {/* QUOTATION REPORT TABLE */}
                  {activeReport === "quotation" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Quote No</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Customer</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Category</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Mode</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">POL</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">POD</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Sales Person</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const status = (row.Status || row.status || "draft").toLowerCase();
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{row.QuoteNumber || row.quoteNumber || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(row.CreatedDate || row.createdDate)}</td>
                              <td className="px-3 py-2 text-slate-700">{row.Customer || row.customer || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                  (row.FreightCategory || row.freightCategory) === "air" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {(row.FreightCategory || row.freightCategory) === "air" ? <Plane className="w-3 h-3" /> : <Ship className="w-3 h-3" />}
                                  {(row.FreightCategory || row.freightCategory || "—").toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{(row.FreightMode || row.freightMode || "—").toUpperCase()}</td>
                              <td className="px-3 py-2 text-slate-600">{row.PortOfLoading || row.portOfLoading || "—"}</td>
                              <td className="px-3 py-2 text-slate-600">{row.PortOfDischarge || row.portOfDischarge || "—"}</td>
                              <td className="px-3 py-2 text-slate-700">{row.SalesPerson || row.salesPerson || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Department || row.department || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  status === "approved" ? "bg-green-100 text-green-700" :
                                  status === "sent" ? "bg-violet-100 text-violet-700" :
                                  status === "draft" ? "bg-blue-100 text-blue-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* SALES ACTIVITY REPORT TABLE */}
                  {activeReport === "sales-activity" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Activity</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Type</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Sales Person</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Start</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">End</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Status</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Account</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const status = (row.Status || row.status || "").toLowerCase();
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{row.ActivityName || row.activityName || row.activity_name || "—"}</td>
                              <td className="px-3 py-2 text-slate-600">{row.ActivityType || row.activityType || row.activity_type || "—"}</td>
                              <td className="px-3 py-2 text-slate-700">{row.SalesPerson || row.salesPerson || row.owner_name || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{formatDateTime(row.StartTime || row.startTime || row.start_time)}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{formatDateTime(row.EndTime || row.endTime || row.end_time)}</td>
                              <td className="px-3 py-2">
                                <span className={`badge ${status === "completed" ? "badge-completed" : status === "scheduled" ? "badge-scheduled" : "bg-slate-100 text-slate-600"}`}>
                                  {(row.Status || row.status || "—").toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{row.RelatedAccount || row.relatedAccount || row.related_account || "—"}</td>
                              <td className="px-3 py-2 text-slate-500 text-xs max-w-[200px] truncate">{row.LatestComment || row.latestComment || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* USER LIST TABLE */}
                  {activeReport === "user-list" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Name</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Position</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Email</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Phone</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{row.FullName || row.fullName || `${row.FirstName || row.firstName || row.fname || ""} ${row.LastName || row.lastName || row.lname || ""}`.trim() || "—"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.Position || row.position || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{row.Department || row.department || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.Email || row.email || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.Phone || row.phone || row.tp || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.WorkLocation || row.workLocation || row.w_location || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* CUSTOMER LIST TABLE */}
                  {activeReport === "customer-list" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Account Name</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Type</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Industry</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Location</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Sales Person</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Primary Contact</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Email</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{row.AccountName || row.accountName || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{(row.AccountType || row.accountType || "—").toUpperCase()}</td>
                            <td className="px-3 py-2 text-slate-600">{row.Industry || row.industry || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{row.Location || row.location || "—"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.SalesPerson || row.salesPerson || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{row.PrimaryContact || row.primaryContact || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.PrimaryEmail || row.primaryEmail || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.Phone || row.phone || row.tp || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Record count footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                  Showing {reportData.length} record{reportData.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pre-generation state */}
        {!generated && !loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Select filters and generate a report</h3>
            <p className="text-slate-400 text-sm">Configure your filters above and click "Generate Report" to view results</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Generating report...</p>
          </div>
        )}
      </div>

      {/* Print-only styles */}
      <style>{`
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .badge-won { background: #dcfce7; color: #166534; }
        .badge-lost { background: #fee2e2; color: #991b1b; }
        .badge-scheduled { background: #dbeafe; color: #1e40af; }
        .badge-completed { background: #dcfce7; color: #166534; }
        .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .summary-item { background: #f1f5f9; padding: 8px 14px; border-radius: 8px; font-size: 12px; }
        .summary-item strong { display: block; font-size: 20px; color: #1e293b; }
        .subtitle { font-size: 12px; color: #94a3b8; margin-bottom: 12px; }
        @media screen { .filter-info { font-size: 12px; color: #94a3b8; margin-bottom: 12px; } }
      `}</style>
    </div>
  );
}
