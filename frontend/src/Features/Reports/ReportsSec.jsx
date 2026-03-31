import React, { useState, useEffect, useRef } from "react";
import { BASE_URL } from "../../config/apiConfig";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Download, Printer, Filter, Calendar, ChevronDown,
  Users, Building2, Plane, Ship, BarChart3, RefreshCw, X,
  CheckCircle2, XCircle, Clock, TrendingUp, Briefcase, FileSpreadsheet,
  DollarSign, Target
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
  const [customerLocations, setCustomerLocations] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);

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
  const [saActivityTypes, setSaActivityTypes] = useState([]);
  const [saStatuses, setSaStatuses] = useState([]);

  // Customer List filters
  const [clSalesPerson, setClSalesPerson] = useState("all");
  const [clCountry, setClCountry] = useState("all");
  const [clAccountType, setClAccountType] = useState("all");

  // Invoice Profit filters
  const [ipDateFrom, setIpDateFrom] = useState("");
  const [ipDateTo, setIpDateTo] = useState("");
  const [ipSalesPerson, setIpSalesPerson] = useState("all");

  // Sales Target filters
  const [stYear, setStYear] = useState(new Date().getFullYear());
  const [stSalesPerson, setStSalesPerson] = useState("all");
  const [stPeriod, setStPeriod] = useState("monthly"); // monthly, quarterly, annually

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

  // Activity type options
  const activityTypeOptions = [
    { value: "site_visit", label: "Site Visit" },
    { value: "call", label: "Phone Call" },
    { value: "meeting", label: "Meeting" },
    { value: "email", label: "Email" },
    { value: "presentation", label: "Presentation" },
  ];

  // Activity status options
  const activityStatusOptions = [
    { value: "planned", label: "Planned" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "reschedule", label: "Reschedule" },
  ];

  // Load filter data on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const opts = { credentials: 'include' };
        const [spRes, deptRes, countryRes, custLocRes, accTypeRes] = await Promise.all([
          fetch(`${BASE_URL}/report/filter/salespersons`, opts),
          fetch(`${BASE_URL}/report/filter/departments`, opts),
          fetch(`${BASE_URL}/report/filter/countries`, opts),
          fetch(`${BASE_URL}/report/filter/customer-locations`, opts),
          fetch(`${BASE_URL}/report/filter/account-types`, opts),
        ]);
        const spData = await spRes.json();
        const deptData = await deptRes.json();
        const countryData = await countryRes.json();
        const custLocData = await custLocRes.json();
        const accTypeData = await accTypeRes.json();
        setSalespersons(spData.map(s => s.name || s.Name).filter(Boolean));
        setDepartments(deptData.map(d => d.d_name || d.dName || d.DName || d.dname).filter(Boolean));
        setCountries(countryData.map(c => c.country || c.Country).filter(Boolean));
        setCustomerLocations(custLocData.map(c => c.country || c.Country).filter(Boolean));
        setAccountTypes(accTypeData.map(t => t.type || t.Type).filter(Boolean));
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

  const toggleActivityType = (type) => {
    setSaActivityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleActivityStatus = (status) => {
    setSaStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
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
          if (saActivityTypes.length > 0) params.append("activityType", saActivityTypes.join(","));
          if (saStatuses.length > 0) params.append("status", saStatuses.join(","));
          break;
        case "user-list":
          url = `${BASE_URL}/report/user-list`;
          break;
        case "customer-list":
          url = `${BASE_URL}/report/customer-list`;
          if (clSalesPerson !== "all") params.append("salesPerson", clSalesPerson);
          if (clCountry !== "all") params.append("country", clCountry);
          if (clAccountType !== "all") params.append("accountType", clAccountType);
          break;
        case "invoice-profit":
          url = `${BASE_URL}/report/invoice-profit`;
          if (ipDateFrom) params.append("dateFrom", ipDateFrom);
          if (ipDateTo) params.append("dateTo", ipDateTo);
          if (ipSalesPerson !== "all") params.append("salesPerson", ipSalesPerson);
          break;
        case "sales-target":
          url = `${BASE_URL}/report/sales-target`;
          params.append("year", stYear);
          if (stSalesPerson !== "all") params.append("salesPerson", stSalesPerson);
          break;
      }

      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const response = await fetch(fullUrl, { credentials: 'include' });
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
            'Reschedule Date': formatDateTimeForExport(row.RescheduleDate || row.rescheduleDate || row.reschedule_date),
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
        case "invoice-profit":
          return {
            '#': i + 1,
            'Invoice No': row.InvoiceNumber || row.invoiceNumber || '—',
            'Date': formatDateForExport(row.EntryDate || row.entryDate),
            'Quote No': row.QuoteNumber || row.quoteNumber || '—',
            'Customer': row.Customer || row.customer || '—',
            'Sales Person': row.SalesPerson || row.salesPerson || '—',
            'Department': row.Department || row.department || '—',
            'Amount': row.Amount != null ? Number(row.Amount || row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—',
            'Cost Invoice': row.CostInvoice != null ? Number(row.CostInvoice || row.costInvoice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—',
            'Margin': row.InvoiceMargin != null ? Number(row.InvoiceMargin || row.invoiceMargin || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—',
            'Margin %': row.Amount && row.InvoiceMargin != null ? ((Number(row.InvoiceMargin) / Number(row.Amount)) * 100).toFixed(1) + '%' : '—'
          };
        case "sales-target": {
          if (stPeriod === "annually") {
            return {
              '#': i + 1,
              'Employee': row.EmployeeName || row.employeeName || '—',
              'Position': row.Position || row.position || '—',
              'Department': row.Department || row.department || '—',
              'Annual Target': Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
            };
          } else if (stPeriod === "quarterly") {
            const jan = Number(row.JanTarget || row.janTarget || 0);
            const feb = Number(row.FebTarget || row.febTarget || 0);
            const mar = Number(row.MarTarget || row.marTarget || 0);
            const apr = Number(row.AprTarget || row.aprTarget || 0);
            const may = Number(row.MayTarget || row.mayTarget || 0);
            const jun = Number(row.JunTarget || row.junTarget || 0);
            const jul = Number(row.JulTarget || row.julTarget || 0);
            const aug = Number(row.AugTarget || row.augTarget || 0);
            const sep = Number(row.SepTarget || row.sepTarget || 0);
            const oct = Number(row.OctTarget || row.octTarget || 0);
            const nov = Number(row.NovTarget || row.novTarget || 0);
            const dec = Number(row.DecTarget || row.decTarget || 0);
            return {
              '#': i + 1,
              'Employee': row.EmployeeName || row.employeeName || '—',
              'Position': row.Position || row.position || '—',
              'Department': row.Department || row.department || '—',
              'Q1 (Jan-Mar)': (jan + feb + mar).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Q2 (Apr-Jun)': (apr + may + jun).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Q3 (Jul-Sep)': (jul + aug + sep).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Q4 (Oct-Dec)': (oct + nov + dec).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Annual Target': Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
            };
          } else {
            return {
              '#': i + 1,
              'Employee': row.EmployeeName || row.employeeName || '—',
              'Position': row.Position || row.position || '—',
              'Department': row.Department || row.department || '—',
              'Jan': Number(row.JanTarget || row.janTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Feb': Number(row.FebTarget || row.febTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Mar': Number(row.MarTarget || row.marTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Apr': Number(row.AprTarget || row.aprTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'May': Number(row.MayTarget || row.mayTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Jun': Number(row.JunTarget || row.junTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Jul': Number(row.JulTarget || row.julTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Aug': Number(row.AugTarget || row.augTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Sep': Number(row.SepTarget || row.sepTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Oct': Number(row.OctTarget || row.octTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Nov': Number(row.NovTarget || row.novTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Dec': Number(row.DecTarget || row.decTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
              'Annual': Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
            };
          }
        }
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
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(reportTitles[activeReport], 14, 15);

    // Subtitle
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${getFilterDescription()} | Generated ${new Date().toLocaleString()}`, 14, 22);

    let tableStartY = 28;

    // Add summary boxes for sales-activity report
    if (activeReport === "sales-activity" && reportData.length > 0) {
      const statusCounts = {};
      reportData.forEach(r => {
        const s = (r.Status || r.status || "unknown").toLowerCase();
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const total = reportData.length;
      const planned = statusCounts["planned"] || 0;
      const completed = statusCounts["completed"] || 0;
      const cancelled = statusCounts["cancelled"] || 0;

      const summaryItems = [
        { label: "Total Activities", count: total, color: [51, 65, 85] },      // slate-700
        { label: "Planned", count: planned, color: [59, 130, 246] },            // blue-500
        { label: "Completed", count: completed, color: [34, 197, 94] },         // green-500
        { label: "Cancelled", count: cancelled, color: [239, 68, 68] },         // red-500
      ];

      const boxW = 45, boxH = 18, boxGap = 6, boxY = 26;
      const boxStartX = 14;

      summaryItems.forEach((item, i) => {
        const x = boxStartX + i * (boxW + boxGap);
        // Box background
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'F');
        // Count (large white text)
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(String(item.count), x + boxW / 2, boxY + 8, { align: 'center' });
        // Label (small white text)
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(item.label, x + boxW / 2, boxY + 14, { align: 'center' });
      });

      tableStartY = boxY + boxH + 6; // push table below summary boxes
    }

    // Table
    const headers = Object.keys(exportData[0]);
    const rows = exportData.map(row => headers.map(h => row[h]));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: tableStartY,
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
    "invoice-profit": "Invoice List / Profit Margin Report",
    "sales-target": "Sales Target Report",
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
        const statusCounts = {};
        reportData.forEach(r => {
          const s = (r.Status || r.status || "unknown").toLowerCase();
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const statusColors = {
          planned: "#64748b", scheduled: "#2563eb", in_progress: "#3b82f6",
          completed: "#16a34a", cancelled: "#dc2626", reschedule: "#d97706"
        };
        return (
          <div className="summary">
            <div className="summary-item"><strong>{total}</strong>Total Activities</div>
            {Object.entries(statusCounts).map(([s, count]) => (
              <div key={s} className="summary-item">
                <strong style={{ color: statusColors[s] || "#64748b" }}>{count}</strong>
                {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
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
      case "invoice-profit": {
        const totalAmt = reportData.reduce((sum, r) => sum + Number(r.Amount || r.amount || 0), 0);
        const totalCost = reportData.reduce((sum, r) => sum + Number(r.CostInvoice || r.costInvoice || 0), 0);
        const totalMargin = reportData.reduce((sum, r) => sum + Number(r.InvoiceMargin || r.invoiceMargin || 0), 0);
        const marginPct = totalAmt > 0 ? ((totalMargin / totalAmt) * 100).toFixed(1) : "0.0";
        return (
          <div className="summary">
            <div className="summary-item"><strong>{reportData.length}</strong>Total Invoices</div>
            <div className="summary-item"><strong style={{ color: "#2563eb" }}>{totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>Total Amount</div>
            <div className="summary-item"><strong style={{ color: "#dc2626" }}>{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>Total Cost</div>
            <div className="summary-item"><strong style={{ color: "#16a34a" }}>{totalMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>Total Margin</div>
            <div className="summary-item"><strong style={{ color: "#7c3aed" }}>{marginPct}%</strong>Margin %</div>
          </div>
        );
      }
      case "sales-target": {
        const totalAnnual = reportData.reduce((sum, r) => sum + Number(r.AnnualTarget || r.annualTarget || 0), 0);
        return (
          <div className="summary">
            <div className="summary-item"><strong>{reportData.length}</strong>Employees</div>
            <div className="summary-item"><strong style={{ color: "#059669" }}>{totalAnnual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>Total Annual Target</div>
          </div>
        );
      }
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
        if (saDateFrom || saDateTo) parts.push(`End Date: ${saDateFrom || "start"} to ${saDateTo || "now"}`);
        if (saSalesPerson !== "all") parts.push(`Sales Person: ${saSalesPerson}`);
        if (saActivityTypes.length > 0) parts.push(`Type: ${saActivityTypes.map(t => activityTypeOptions.find(o => o.value === t)?.label || t).join(", ")}`);
        if (saStatuses.length > 0) parts.push(`Status: ${saStatuses.map(s => activityStatusOptions.find(o => o.value === s)?.label || s).join(", ")}`);
        break;
      case "customer-list":
        if (clSalesPerson !== "all") parts.push(`Sales Person: ${clSalesPerson}`);
        if (clCountry !== "all") parts.push(`Country: ${clCountry}`);
        if (clAccountType !== "all") parts.push(`Type: ${clAccountType.charAt(0).toUpperCase() + clAccountType.slice(1)}`);
        break;
      case "invoice-profit":
        if (ipDateFrom || ipDateTo) parts.push(`Date: ${ipDateFrom || "start"} to ${ipDateTo || "now"}`);
        if (ipSalesPerson !== "all") parts.push(`Sales Person: ${ipSalesPerson}`);
        break;
      case "sales-target":
        parts.push(`Year: ${stYear}`);
        if (stSalesPerson !== "all") parts.push(`Sales Person: ${stSalesPerson}`);
        parts.push(`View: ${stPeriod.charAt(0).toUpperCase() + stPeriod.slice(1)}`);
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
            { key: "invoice-profit", label: "Invoice / Profit", icon: DollarSign, color: "green" },
            { key: "sales-target", label: "Sales Target", icon: Target, color: "rose" },
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
                backgroundColor: color === "violet" ? "#7c3aed" : color === "blue" ? "#2563eb" : color === "emerald" ? "#059669" : color === "amber" ? "#d97706" : color === "green" ? "#16a34a" : color === "rose" ? "#e11d48" : "#7c3aed"
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date From</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={saDateFrom} onChange={e => setSaDateFrom(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date To</label>
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

              {/* Activity Type - Multi-select */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Activity Type (multiple selection)</label>
                <div className="flex flex-wrap gap-2">
                  {activityTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleActivityType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        saActivityTypes.includes(opt.value)
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {saActivityTypes.includes(opt.value) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Status - Multi-select */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Status (multiple selection)</label>
                <div className="flex flex-wrap gap-2">
                  {activityStatusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleActivityStatus(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        saStatuses.includes(opt.value)
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {saStatuses.includes(opt.value) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User List - No filters */}
          {activeReport === "user-list" && (
            <p className="text-sm text-slate-500">No filters required. All employees will be listed.</p>
          )}

          {/* Customer List Filters */}
          {activeReport === "customer-list" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sales Person</label>
                <select value={clSalesPerson} onChange={e => setClSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="all">All</option>
                  {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Country / Location</label>
                <select value={clCountry} onChange={e => setClCountry(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="all">All</option>
                  {customerLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type (Import / Export)</label>
                <select value={clAccountType} onChange={e => setClAccountType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="all">All</option>
                  {accountTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Invoice Profit Filters */}
          {activeReport === "invoice-profit" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" value={ipDateFrom} onChange={e => setIpDateFrom(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" value={ipDateTo} onChange={e => setIpDateTo(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sales Person</label>
                <select value={ipSalesPerson} onChange={e => setIpSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="all">All</option>
                  {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Sales Target Filters */}
          {activeReport === "sales-target" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
                  <select value={stYear} onChange={e => setStYear(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
                  <select value={stSalesPerson} onChange={e => setStSalesPerson(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="all">All Employees</option>
                    {salespersons.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">View Period</label>
                  <div className="flex gap-2">
                    {[
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "annually", label: "Annually" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStPeriod(opt.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          stPeriod === opt.value
                            ? "bg-rose-100 text-rose-700 border-rose-300"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {stPeriod === opt.value && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Reschedule Date</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Status</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Account</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const status = (row.Status || row.status || "").toLowerCase();
                          const rescheduleDate = row.RescheduleDate || row.rescheduleDate || row.reschedule_date;
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{row.ActivityName || row.activityName || row.activity_name || "—"}</td>
                              <td className="px-3 py-2 text-slate-600">{row.ActivityType || row.activityType || row.activity_type || "—"}</td>
                              <td className="px-3 py-2 text-slate-700">{row.SalesPerson || row.salesPerson || row.owner_name || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{formatDateTime(row.StartTime || row.startTime || row.start_time)}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{formatDateTime(row.EndTime || row.endTime || row.end_time)}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">
                                {rescheduleDate ? (
                                  <span className="text-amber-600 font-medium">{formatDateTime(rescheduleDate)}</span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`badge ${
                                  status === "completed" ? "badge-completed" :
                                  status === "scheduled" || status === "planned" ? "badge-scheduled" :
                                  status === "cancelled" ? "badge-lost" :
                                  status === "reschedule" ? "bg-amber-100 text-amber-700" :
                                  status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
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

                  {/* INVOICE PROFIT REPORT TABLE */}
                  {activeReport === "invoice-profit" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Invoice No</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Quote No</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Customer</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Sales Person</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Amount</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Cost Invoice</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Margin</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const amount = Number(row.Amount || row.amount || 0);
                          const cost = Number(row.CostInvoice || row.costInvoice || 0);
                          const margin = Number(row.InvoiceMargin || row.invoiceMargin || 0);
                          const marginPct = amount > 0 ? ((margin / amount) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{row.InvoiceNumber || row.invoiceNumber || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{formatDate(row.EntryDate || row.entryDate)}</td>
                              <td className="px-3 py-2 text-slate-700">{row.QuoteNumber || row.quoteNumber || "—"}</td>
                              <td className="px-3 py-2 text-slate-700">{row.Customer || row.customer || "—"}</td>
                              <td className="px-3 py-2 text-slate-700">{row.SalesPerson || row.salesPerson || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Department || row.department || "—"}</td>
                              <td className="px-3 py-2 text-right font-medium text-blue-700">{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right text-red-600">{row.CostInvoice != null ? cost.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "—"}</td>
                              <td className={`px-3 py-2 text-right font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{row.InvoiceMargin != null ? margin.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "—"}</td>
                              <td className={`px-3 py-2 text-right text-xs font-medium ${Number(marginPct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {row.InvoiceMargin != null ? `${marginPct}%` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Totals Footer */}
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={7} className="px-3 py-2.5 text-right text-xs font-bold text-slate-700 uppercase">Totals</td>
                          <td className="px-3 py-2.5 text-right font-bold text-blue-700">
                            {reportData.reduce((sum, r) => sum + Number(r.Amount || r.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-red-600">
                            {reportData.reduce((sum, r) => sum + Number(r.CostInvoice || r.costInvoice || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-green-600">
                            {reportData.reduce((sum, r) => sum + Number(r.InvoiceMargin || r.invoiceMargin || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-bold text-violet-600">
                            {(() => {
                              const tAmt = reportData.reduce((sum, r) => sum + Number(r.Amount || r.amount || 0), 0);
                              const tMar = reportData.reduce((sum, r) => sum + Number(r.InvoiceMargin || r.invoiceMargin || 0), 0);
                              return tAmt > 0 ? `${((tMar / tAmt) * 100).toFixed(1)}%` : "0.0%";
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  {/* SALES TARGET REPORT TABLE */}
                  {activeReport === "sales-target" && stPeriod === "monthly" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Employee</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Position</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                            <th key={m} className="px-2 py-2.5 text-right text-xs font-semibold text-slate-600">{m}</th>
                          ))}
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-rose-700 bg-rose-50">Annual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                          const keys = ["JanTarget","FebTarget","MarTarget","AprTarget","MayTarget","JunTarget","JulTarget","AugTarget","SepTarget","OctTarget","NovTarget","DecTarget"];
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.EmployeeName || row.employeeName || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Position || row.position || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Department || row.department || "—"}</td>
                              {keys.map((k, idx) => {
                                const val = Number(row[k] || row[k.charAt(0).toLowerCase() + k.slice(1)] || 0);
                                return (
                                  <td key={months[idx]} className={`px-2 py-2 text-right text-xs ${val > 0 ? "text-slate-700" : "text-slate-300"}`}>
                                    {val > 0 ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : "—"}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-right font-bold text-rose-700 bg-rose-50 text-xs">
                                {Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-bold text-slate-700 uppercase">Totals</td>
                          {["JanTarget","FebTarget","MarTarget","AprTarget","MayTarget","JunTarget","JulTarget","AugTarget","SepTarget","OctTarget","NovTarget","DecTarget"].map(k => (
                            <td key={k} className="px-2 py-2.5 text-right text-xs font-bold text-slate-700">
                              {reportData.reduce((sum, r) => sum + Number(r[k] || r[k.charAt(0).toLowerCase() + k.slice(1)] || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-right font-bold text-rose-700 bg-rose-50 text-xs">
                            {reportData.reduce((sum, r) => sum + Number(r.AnnualTarget || r.annualTarget || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  {/* SALES TARGET - QUARTERLY VIEW */}
                  {activeReport === "sales-target" && stPeriod === "quarterly" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Employee</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Position</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-blue-600 bg-blue-50">Q1 (Jan-Mar)</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600 bg-emerald-50">Q2 (Apr-Jun)</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-amber-600 bg-amber-50">Q3 (Jul-Sep)</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-600 bg-violet-50">Q4 (Oct-Dec)</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-rose-700 bg-rose-50">Annual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => {
                          const g = (k) => Number(row[k] || row[k.charAt(0).toLowerCase() + k.slice(1)] || 0);
                          const q1 = g("JanTarget") + g("FebTarget") + g("MarTarget");
                          const q2 = g("AprTarget") + g("MayTarget") + g("JunTarget");
                          const q3 = g("JulTarget") + g("AugTarget") + g("SepTarget");
                          const q4 = g("OctTarget") + g("NovTarget") + g("DecTarget");
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.EmployeeName || row.employeeName || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Position || row.position || "—"}</td>
                              <td className="px-3 py-2 text-slate-600 text-xs">{row.Department || row.department || "—"}</td>
                              <td className="px-3 py-2 text-right font-medium text-blue-700 bg-blue-50">{q1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right font-medium text-emerald-700 bg-emerald-50">{q2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right font-medium text-amber-700 bg-amber-50">{q3.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right font-medium text-violet-700 bg-violet-50">{q4.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right font-bold text-rose-700 bg-rose-50">
                                {Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-bold text-slate-700 uppercase">Totals</td>
                          {[
                            { keys: ["JanTarget","FebTarget","MarTarget"], cls: "text-blue-700 bg-blue-50" },
                            { keys: ["AprTarget","MayTarget","JunTarget"], cls: "text-emerald-700 bg-emerald-50" },
                            { keys: ["JulTarget","AugTarget","SepTarget"], cls: "text-amber-700 bg-amber-50" },
                            { keys: ["OctTarget","NovTarget","DecTarget"], cls: "text-violet-700 bg-violet-50" }
                          ].map((q, qi) => (
                            <td key={qi} className={`px-3 py-2.5 text-right font-bold ${q.cls}`}>
                              {reportData.reduce((sum, r) => sum + q.keys.reduce((s, k) => s + Number(r[k] || r[k.charAt(0).toLowerCase() + k.slice(1)] || 0), 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-right font-bold text-rose-700 bg-rose-50">
                            {reportData.reduce((sum, r) => sum + Number(r.AnnualTarget || r.annualTarget || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  {/* SALES TARGET - ANNUALLY VIEW */}
                  {activeReport === "sales-target" && stPeriod === "annually" && (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Employee</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Position</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Department</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-rose-700">Annual Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.EmployeeName || row.employeeName || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.Position || row.position || "—"}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs">{row.Department || row.department || "—"}</td>
                            <td className="px-3 py-2 text-right font-bold text-rose-700 text-base">
                              {Number(row.AnnualTarget || row.annualTarget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-bold text-slate-700 uppercase">Total</td>
                          <td className="px-3 py-2.5 text-right font-bold text-rose-700 text-base">
                            {reportData.reduce((sum, r) => sum + Number(r.AnnualTarget || r.annualTarget || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
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
