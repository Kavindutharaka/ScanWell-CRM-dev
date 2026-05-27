import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/axios";
import { STATIC_URL } from "../../config/apiConfig";
import { fetchNewsFeedImages, uploadNewsFeedImage, deleteNewsFeedImage } from "../../api/NewsFeedApi";
import {
  LayoutGrid,
  Newspaper,
  Calendar,
  RefreshCw,
  FileText,
  Users,
  Briefcase,
  Activity,
  PieChart,
  BarChart3,
  XCircle,
  Clock,
  Phone,
  MapPin,
  Percent,
  Award,
  Zap,
  Building2,
  Plus,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Target,
  TrendingUp,
} from "lucide-react";
import { fetchTargetConfig, fetchAllTargets } from "../../api/SalesTargetApi";
import { toast } from '../../components/Toast';
import { confirm } from '../../components/ConfirmDialog';
import { usePersistedState } from '../../hooks/usePersistedState';

// ===== COLORS =====
const COLORS = {
  primary: "#0073EA",
  primaryLight: "#D6EFFF",
  success: "#00C875",
  successLight: "#D6F5E8",
  danger: "#E44258",
  dangerLight: "#FDDDE3",
  warning: "#FDAB3D",
  warningLight: "#FFF3D6",
  purple: "#A25DDC",
  purpleLight: "#EDE1F5",
  blue: "#579BFC",
  blueLight: "#D6E6FF",
  dark: "#323338",
  gray: "#676879",
  lightGray: "#C5C7D0",
};

const PIE_COLORS = ["#00C875", "#E44258", "#579BFC", "#FDAB3D", "#A25DDC", "#FF642E", "#0073EA", "#BB3354"];

// Format LKR currency
const fmtLKR = (val) => {
  const n = Number(val) || 0;
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(1)}K`;
  return `LKR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Format a Date to local YYYY-MM-DD string (avoids UTC shift from toISOString)
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DashboardSec() {
  const { user, permission, loading: authLoading } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin === true;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfYear  = new Date(now.getFullYear(), 0, 1);
  const [dateFrom, setDateFrom] = useState(toLocalDateStr(firstOfMonth));
  const [dateTo, setDateTo] = useState(toLocalDateStr(now));

  // ===== PIPELINE — separate date range =====
  const [pipelineDateFrom, setPipelineDateFrom] = useState(toLocalDateStr(firstOfYear));
  const [pipelineDateTo,   setPipelineDateTo]   = useState(toLocalDateStr(now));
  const [pipelineData, setPipelineData] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  // Dashboard / Market-Place tab + selected period preset — both persist across sessions.
  const [activeTab, setActiveTab] = usePersistedState('dashboard.activeTab', 'dashboard');
  const [activePreset, setActivePreset] = usePersistedState('dashboard.activePreset', 'thisMonth');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // ===== SALES TARGET STATE =====
  const [salesTarget, setSalesTarget] = useState({ monthlyTarget: 0, yearlyTarget: 0 });
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState({ monthlyTarget: "", yearlyTarget: "" });

  // ===== SALES TARGET (NEW - per employee, quarterly) =====
  const [fyConfig, setFyConfig] = useState({ financialYearStart: 1 });
  const [employeeTargets, setEmployeeTargets] = useState([]);

  // ===== NEWS FEED STATE =====
  const [newsFeedImages, setNewsFeedImages] = useState([]);
  const [newsFeedLoading, setNewsFeedLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);

  // ===== FETCH =====
  const fetchDashboard = useCallback(async () => {
    // Don't fetch until auth is fully loaded (user + permission resolved)
    if (authLoading || !user?.id || permission === null) return;
    setLoading(true);
    setError(null);
    try {
      const params = { dateFrom, dateTo, isAdmin: isAdmin.toString() };
      params.userRoleId = user.id;
      const res = await api.get("/dashboard", { params });
      setData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, isAdmin, user?.id, authLoading, permission]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ===== PIPELINE FETCH (independent date range) =====
  const fetchPipeline = useCallback(async () => {
    if (authLoading || !user?.id || permission === null) return;
    setPipelineLoading(true);
    try {
      const params = { dateFrom: pipelineDateFrom, dateTo: pipelineDateTo, isAdmin: isAdmin.toString(), userRoleId: user.id };
      const res = await api.get("/dashboard/pipeline", { params });
      setPipelineData(res.data?.pipeline || []);
    } catch (err) {
      console.error("Pipeline fetch error:", err);
    } finally {
      setPipelineLoading(false);
    }
  }, [pipelineDateFrom, pipelineDateTo, isAdmin, user?.id, authLoading, permission]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // ===== SALES TARGET =====
  const fetchSalesTarget = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/sales-target", { params: { year: now.getFullYear(), month: now.getMonth() + 1 } });
      setSalesTarget(res.data);
    } catch (err) {
      console.error("Sales target fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchSalesTarget();
  }, [fetchSalesTarget]);

  // ===== LOAD FY CONFIG + EMPLOYEE TARGETS =====
  const loadTargetData = useCallback(async () => {
    try {
      const [config, targets] = await Promise.all([
        fetchTargetConfig(),
        fetchAllTargets(now.getFullYear()),
      ]);
      setFyConfig(config || { financialYearStart: 1 });
      setEmployeeTargets(Array.isArray(targets) ? targets : []);
    } catch (err) {
      console.error("Target data load error:", err);
    }
  }, []);

  useEffect(() => {
    loadTargetData();
  }, [loadTargetData]);

  const handleSaveTarget = async () => {
    try {
      await api.post("/dashboard/sales-target", {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        monthlyTarget: parseFloat(targetForm.monthlyTarget) || 0,
        yearlyTarget: parseFloat(targetForm.yearlyTarget) || 0,
      });
      setEditingTarget(false);
      fetchSalesTarget();
    } catch (err) {
      console.error("Save target error:", err);
      toast.error("Failed to save sales target.");
    }
  };

  // ===== NEWS FEED FUNCTIONS =====
  const loadNewsFeed = useCallback(async () => {
    setNewsFeedLoading(true);
    try {
      const imgs = await fetchNewsFeedImages();
      setNewsFeedImages(Array.isArray(imgs) ? imgs : []);
    } catch (err) {
      console.error("News feed error:", err);
      setNewsFeedImages([]);
    } finally {
      setNewsFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "newsfeed") loadNewsFeed();
  }, [activeTab, loadNewsFeed]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("imageFile", uploadFile);
      fd.append("caption", uploadCaption || "default");
      fd.append("uploadedBy", permission?.Username || user?.username || "Admin");
      await uploadNewsFeedImage(fd);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCaption("");
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadNewsFeed();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image. " + (err?.response?.data || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!(await confirm("Are you sure you want to delete this image?"))) return;
    try {
      console.log(id);
      await deleteNewsFeedImage(id);
      loadNewsFeed();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete image.");
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadCaption("");
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ===== PRESETS =====
  const setPreset = (preset) => {
    const today = new Date();
    let from = new Date(), to = new Date();
    switch (preset) {
      case "thisMonth": from = new Date(today.getFullYear(), today.getMonth(), 1); to = today; break;
      case "lastMonth": from = new Date(today.getFullYear(), today.getMonth() - 1, 1); to = new Date(today.getFullYear(), today.getMonth(), 0); break;
      case "thisQuarter": {
        // Use financial year start for quarter calculation
        const fys = (fyConfig?.financialYearStart || 1) - 1; // 0-indexed (0=Jan, 3=Apr)
        const adjustedMonth = (today.getMonth() - fys + 12) % 12;
        const q = Math.floor(adjustedMonth / 3);
        const qStartMonth = (fys + q * 3) % 12;
        from = new Date(today.getFullYear(), qStartMonth, 1);
        // If the quarter start month is after current month (crossed year boundary), adjust year
        if (qStartMonth > today.getMonth()) from = new Date(today.getFullYear() - 1, qStartMonth, 1);
        to = today;
        break;
      }
      case "thisYear": from = new Date(today.getFullYear(), 0, 1); to = today; break;
      default: break;
    }
    setDateFrom(toLocalDateStr(from));
    setDateTo(toLocalDateStr(to));
    setActivePreset(preset);
  };

  // ===== STAT CARD =====
  const StatCard = ({ icon: Icon, label, value, subValue, color, bg }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg transition-all duration-300 group"
         style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
             style={{ backgroundColor: bg }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  // ===== GAUGE METER (Gemini - Monday.com style) =====
  const GaugeMeter = ({ value = 0, label, target = 0 }) => {
    const max = Math.max(target * 1.2, value * 1.1, 100000);
    const ticks = Array.from({ length: 6 }, (_, i) => Math.round((max / 5) * i));
    const formatCompactNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return num.toString();
    };
    const valuePercent = value / max;
    const targetPercent = target / max;
    const cx = 160, cy = 150, r = 100, labelRadius = 135;
    const valueRotation = valuePercent * 180 - 180;
    const targetRotation = targetPercent * 180 - 180;

    return (
      <div className="flex flex-col items-center w-full">
        <div className="w-full relative">
          <svg viewBox="0 0 320 180" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="gauge-gradient" x1="60" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00C875" />
                <stop offset="50%" stopColor="#00B4D8" />
                <stop offset="100%" stopColor="#0077B6" />
              </linearGradient>
            </defs>
            {/* Background Gray Arc */}
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none" stroke="#E6E9EF" strokeWidth="30" strokeLinecap="butt" />
            {/* Colored Gradient Arc */}
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none" stroke="url(#gauge-gradient)" strokeWidth="30" strokeLinecap="butt"
              pathLength="100" strokeDasharray={`${valuePercent * 100} 100`} />
            {/* Scale Labels */}
            {ticks.map((tick, index) => {
              const p = index / 5;
              const angle = p * Math.PI;
              const x = cx - labelRadius * Math.cos(angle);
              const y = cy - labelRadius * Math.sin(angle);
              return (
                <text key={index} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  className="fill-gray-600 text-[10px] font-semibold tracking-wide">
                  {tick}
                </text>
              );
            })}
            {/* Target Marker Triangle */}
            {target > 0 && (
              <polygon points={`${cx + 115},${cy} ${cx + 125},${cy - 5} ${cx + 125},${cy + 5}`}
                fill="#0F172A" transform={`rotate(${targetRotation}, ${cx}, ${cy})`} />
            )}
            {/* Needle */}
            <g transform={`rotate(${valueRotation}, ${cx}, ${cy})`}>
              <polygon points={`${cx},${cy - 3} ${cx + 80},${cy} ${cx},${cy + 3}`} fill="#0F172A" />
            </g>
            <circle cx={cx} cy={cy} r="6" fill="#0F172A" />
          </svg>
        </div>
        {/* ACTUAL / TARGET */}
        <div className="w-full flex justify-between mt-2 px-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 tracking-wider">ACTUAL</span>
            <span className="text-2xl font-extrabold text-gray-800">{formatCompactNumber(value)}</span>
          </div>
          {target > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-gray-400 tracking-wider">TARGET</span>
              <span className="text-2xl font-extrabold text-gray-800">{formatCompactNumber(target)}</span>
            </div>
          )}
        </div>
        {label && <p className="text-xs text-slate-400 mt-2">{label}</p>}
      </div>
    );
  };

  // ===== MINI PIE CHART =====
  const MiniPieChart = ({ segments, size = 160 }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <div className="flex items-center justify-center text-slate-300 text-sm h-full">No data</div>;
    const r = 40;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} className="transform -rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle key={i} cx="50" cy="50" r={r} fill="transparent" stroke={seg.color}
              strokeWidth="20" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-currentOffset}
              className="transition-all duration-700" />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="white" />
      </svg>
    );
  };

  // ===== BAR CHART =====
  const BarChart = ({ items, maxHeight = 200 }) => {
    const maxVal = Math.max(...items.map(i => i.value), 1);
    return (
      <div className="flex items-end gap-3 justify-center" style={{ height: maxHeight }}>
        {items.map((item, i) => {
          const h = (item.value / maxVal) * (maxHeight - 40);
          return (
            <div key={i} className="flex flex-col items-center gap-1 group flex-1 max-w-[60px]">
              <span className="text-xs font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {fmtLKR(item.value)}
              </span>
              <div className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{ height: Math.max(h, 4), background: `linear-gradient(to top, ${item.color || COLORS.primary}, ${item.colorEnd || item.color || COLORS.blue})` }} />
              <span className="text-[10px] text-slate-400 font-medium mt-1">{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ===== PROGRESS BAR =====
  const ProgressBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  // ===== WIDGET =====
  const Widget = ({ title, icon: Icon, children, className = "", span = 1 }) => (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
         style={{ gridColumn: `span ${span}` }}>
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">{title}</h3>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );

  // ===== LOADING =====
  if (loading) {
    return (
      <main className="w-full bg-slate-50 min-h-screen p-6">
        <div className="max-w-[1600px] mx-auto animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-6" />
          <div className="h-10 bg-slate-200 rounded w-full mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}
          </div>
        </div>
      </main>
    );
  }

  // ===== DATA =====
  const qs = data?.quotationStats || {};
  const pipeline = pipelineData.length > 0 ? pipelineData : (data?.pipelineConversion || []);
  const monthly = data?.monthlyRevenue || { rfqRevenue: [], quoteVolume: [] };
  const activity = data?.activityStats || {};
  const rfq = data?.rfqRevenue || {};
  const deals = data?.dealStats || {};
  const customers = data?.customerStats || {};
  const recentActs = data?.recentActivities || [];
  const topCusts = data?.topCustomers || [];
  const quoteOutcomes = data?.quoteOutcomes || {};
  const monthlyInvoice = data?.monthlyInvoice || [];

  const pipeTotal = pipeline.reduce((s, p) => s + (p.count || 0), 0);

  const statusColors = { draft: COLORS.blue, sent: COLORS.purple, approved: COLORS.success, won: "#00C875", lost: "#E44258" };

  // Total Deals Won = RFQ Revenue + Won Quote Amount + Won Deal Value
  const totalDealsWon = (rfq.totalRevenue || 0) + (quoteOutcomes.totalWonAmount || 0) + (deals.wonDealValue || 0);

  // Quote win rate (won quotes vs total quotations)
  // NOTE: denominator is total quotations, NOT (won + lost). Using (won + lost) gives 100%
  // whenever there are no "lost" outcomes, which was the reported bug.
  const wonQuotesCount = quoteOutcomes.wonQuotes || 0;
  const lostQuotesCount = quoteOutcomes.lostQuotes || 0;
  const totalQuotesForRate = qs.totalQuotes || 0;
  const approvalRate = totalQuotesForRate > 0
    ? ((wonQuotesCount / totalQuotesForRate) * 100).toFixed(1)
    : "0";

  // Loss & Pending rates over total quotations (same denominator as Win Rate, for consistency).
  // Pending = quotes that haven't been marked won or lost yet.
  const lossRate = totalQuotesForRate > 0
    ? ((lostQuotesCount / totalQuotesForRate) * 100).toFixed(1)
    : "0";
  const pendingQuotesCount = Math.max(0, totalQuotesForRate - wonQuotesCount - lostQuotesCount);
  const pendingRate = totalQuotesForRate > 0
    ? ((pendingQuotesCount / totalQuotesForRate) * 100).toFixed(1)
    : "0";

  // RFQ monthly bars
  const rfqBars = (monthly.rfqRevenue || []).map(m => ({
    label: m.monthName, value: m.rfqRevenue || 0, color: COLORS.success, colorEnd: "#4ADE80",
  }));

  // Quote volume monthly bars — show sales amount (won quotes total)
  // Falls back to count if no sales amounts exist yet (legacy data)
  const hasSalesAmounts = (monthly.quoteVolume || []).some(m => (m.totalSalesAmount || 0) > 0);
  const quoteBars = (monthly.quoteVolume || []).map(m => ({
    label: m.monthName,
    value: hasSalesAmounts ? (m.totalSalesAmount || 0) : (m.quoteCount || 0),
    count: m.quoteCount || 0,
    color: COLORS.primary,
    colorEnd: COLORS.blue,
  }));

  // Pie segments — full sales status distribution (all quote statuses + deals)
  const dealPieSegments = [
    { label: "Draft", value: qs.draftCount || 0, color: COLORS.blue },
    { label: "Sent", value: qs.sentCount || 0, color: COLORS.purple },
    { label: "Approved", value: qs.approvedCount || 0, color: COLORS.warning },
    { label: "Won", value: (deals.wonDeals || 0) + (quoteOutcomes.wonQuotes || 0), color: COLORS.success },
    { label: "Lost", value: (deals.lostDeals || 0) + (quoteOutcomes.lostQuotes || 0), color: COLORS.danger },
    { label: "Active Deals", value: deals.activeDeals || 0, color: "#579BFC" },
    { label: "Other", value: qs.otherCount || 0, color: COLORS.lightGray },
  ].filter(s => s.value > 0);
  const totalDealsPieCount = dealPieSegments.reduce((s, seg) => s + seg.value, 0);

  const pipelinePieSegments = pipeline.map((p, i) => ({
    label: (p.status || "Other").charAt(0).toUpperCase() + (p.status || "other").slice(1),
    value: p.count || 0,
    color: statusColors[p.status?.toLowerCase()] || PIE_COLORS[i % PIE_COLORS.length],
  })).filter(s => s.value > 0);

  // Activity pie by type (Meeting, Call, Visit, etc.) instead of status
  const actTypeBreakdown = activity.typeBreakdown || [];
  const actPieSegments = actTypeBreakdown.length > 0
    ? actTypeBreakdown.map((tb, i) => ({
        label: tb.type || "Other",
        value: tb.count || 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      })).filter(s => s.value > 0)
    : [
        { label: "Completed", value: activity.completedActivities || 0, color: COLORS.success },
        { label: "Pending", value: activity.pendingActivities || 0, color: COLORS.warning },
        { label: "Declined", value: activity.declinedActivities || 0, color: COLORS.danger },
        { label: "Cancelled", value: activity.cancelledActivities || 0, color: COLORS.lightGray },
      ].filter(s => s.value > 0);

  // ===== QUARTERLY TARGET CALCULATIONS =====
  const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const fyStart = fyConfig?.financialYearStart || 1;

  // Build quarters based on FY start
  const dashQuarters = [];
  for (let q = 0; q < 4; q++) {
    const m1 = ((fyStart - 1 + q * 3) % 12); // 0-indexed
    const m2 = (m1 + 1) % 12;
    const m3 = (m1 + 2) % 12;
    dashQuarters.push({ label: `Q${q + 1}`, months: [m1, m2, m3] }); // 0-indexed
  }

  // Filter targets: admin sees all, user sees own
  const userFilteredTargets = isAdmin
    ? employeeTargets
    : employeeTargets.filter(t => {
        const empId = t.employee_id || t.employeeId;
        return String(empId) === String(user?.employeeId || user?.id);
      });

  // Helper: get monthly target value for a given 0-indexed month from a target row
  const getMonthVal = (t, mIdx) => {
    const key = MONTH_KEYS[mIdx] + "_target";
    const camelKey = MONTH_KEYS[mIdx] + "Target";
    return parseFloat(t[key] || t[camelKey] || 0);
  };

  // Calculate total target per quarter (sum across filtered employees)
  const getQuarterTarget = (quarterMonths) => {
    return userFilteredTargets.reduce((sum, t) => {
      return sum + quarterMonths.reduce((ms, mIdx) => ms + getMonthVal(t, mIdx), 0);
    }, 0);
  };

  // Annual target total
  const totalAnnualTarget = userFilteredTargets.reduce(
    (sum, t) => sum + parseFloat(t.annual_target || t.annualTarget || 0), 0
  );

  // ===== DATE-RANGE AWARE TARGET for Gauge =====
  // Calculate which months are covered by dateFrom-dateTo and sum those months' targets
  const getTargetForDateRange = () => {
    if (!dateFrom || !dateTo || userFilteredTargets.length === 0) return 0;
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    // Collect all months (0-indexed) covered in the date range
    const coveredMonths = new Set();
    const d = new Date(from.getFullYear(), from.getMonth(), 1);
    while (d <= to) {
      coveredMonths.add(d.getMonth()); // 0-indexed
      d.setMonth(d.getMonth() + 1);
    }
    // Sum targets for those months across filtered employees
    return userFilteredTargets.reduce((sum, t) => {
      let empSum = 0;
      coveredMonths.forEach(mIdx => { empSum += getMonthVal(t, mIdx); });
      return sum + empSum;
    }, 0);
  };

  const periodTarget = getTargetForDateRange();

  const QUARTER_COLORS = [
    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", bar: "bg-blue-500" },
    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
    { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "bg-purple-500" },
  ];
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "newsfeed", label: "Market Place", icon: Newspaper },
  ];

  return (
    <main className="w-full bg-gradient-to-br from-slate-50 to-slate-100/50 min-h-screen text-slate-800 font-sans">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeInUp 0.5s ease-out both; }
        .fade-in-1 { animation-delay: 0.05s; } .fade-in-2 { animation-delay: 0.1s; }
        .fade-in-3 { animation-delay: 0.15s; } .fade-in-4 { animation-delay: 0.2s; }
      `}</style>

      <div className="p-6 max-w-[1600px] mx-auto pb-16">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isAdmin ? "Admin Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin ? "Overview of all company performance" : "Your personal performance overview"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
              {[{ label: "Month", key: "thisMonth" }, { label: "Quarter", key: "thisQuarter" }, { label: "Year", key: "thisYear" }].map(p => (
                <button key={p.key} onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activePreset === p.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
                className="text-xs border-none outline-none bg-transparent text-slate-600 w-28" />
              <span className="text-slate-300">—</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
                className="text-xs border-none outline-none bg-transparent text-slate-600 w-28" />
            </div>
            <button onClick={fetchDashboard}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABS - Monday.com arrow/ribbon style */}
        <div className="mb-6">
          <div className="flex items-center">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-2 transition-all outline-none group"
                  style={{ zIndex: isActive ? 10 : tabs.length - idx }}>
                  <svg viewBox="0 0 160 48" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path
                      d={idx === 0
                        ? "M8,2 L140,2 L158,24 L140,46 L8,46 Q2,46 2,40 L2,8 Q2,2 8,2 Z"
                        : "M2,2 L140,2 L158,24 L140,46 L2,46 L20,24 Z"}
                      fill={isActive ? "#0073EA" : "#F1F5F9"}
                      stroke={isActive ? "#0073EA" : "#E2E8F0"}
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className={`relative flex items-center gap-2 px-7 py-3 text-sm font-semibold ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                  }`} style={{ paddingLeft: idx === 0 ? "1.25rem" : "2rem" }}>
                    <Icon className="w-4 h-4" />{tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm flex items-center gap-2">
            <XCircle className="w-5 h-5" /> {error}
            <button onClick={fetchDashboard} className="ml-auto text-red-600 underline text-xs">Retry</button>
          </div>
        )}

        {/* ===== DASHBOARD ===== */}
        {activeTab === "dashboard" && data && (
          <>
            {/* --- BIG GAUGE METER + KPI CARDS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Large Gauge - Deals Won Revenue */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 fade-in fade-in-1">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Total Sales Won</h3>
                </div>
                <GaugeMeter value={totalDealsWon} label="RFQ Revenue + Won Sales" target={periodTarget} />
                <div className="flex justify-around mt-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{fmtLKR(rfq.totalRevenue || 0)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">RFQ Revenue</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{fmtLKR((quoteOutcomes.totalWonAmount || 0) + (deals.wonDealValue || 0))}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Won Sales</p>
                  </div>
                  {periodTarget > 0 && (
                    <>
                      <div className="w-px bg-slate-100" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{fmtLKR(periodTarget)}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sales Target</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right side KPI cards */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="fade-in fade-in-1">
                  <StatCard icon={FileText} label="Total Quotations" value={qs.totalQuotes || 0}
                    subValue={`${qs.approvedCount || 0} approved · ${qs.sentCount || 0} sent`}
                    color={COLORS.primary} bg={COLORS.primaryLight} />
                </div>
                <div className="fade-in fade-in-2">
                  <StatCard icon={Percent} label="Win Rate" value={`${approvalRate}%`}
                    subValue={`${quoteOutcomes.wonQuotes || 0} won · ${quoteOutcomes.lostQuotes || 0} lost`}
                    color={COLORS.purple} bg={COLORS.purpleLight} />
                </div>
                <div className="fade-in fade-in-3">
                  <StatCard icon={Activity} label="Sales Visits" value={activity.totalActivities || 0}
                    subValue={`${activity.completedActivities || 0} completed`}
                    color={COLORS.warning} bg={COLORS.warningLight} />
                </div>
                <div className="fade-in fade-in-1">
                  <StatCard icon={Briefcase} label="Quotations Won" value={wonQuotesCount}
                    subValue={`${wonQuotesCount} won · ${lostQuotesCount} lost`}
                    color={COLORS.blue} bg={COLORS.blueLight} />
                </div>
                <div className="fade-in fade-in-2">
                  <StatCard icon={Building2} label="Accounts" value={customers.totalAccounts || 0}
                    subValue={isAdmin ? "All company accounts" : "Your accounts"}
                    color={COLORS.primary} bg={COLORS.primaryLight} />
                </div>
                <div className="fade-in fade-in-3">
                  <StatCard icon={Zap} label="RFQ Revenue" value={fmtLKR(rfq.totalRevenue || 0)}
                    subValue={`${rfq.totalRfqs || 0} RFQs · ${rfq.totalEntries || 0} entries`}
                    color={COLORS.success} bg={COLORS.successLight} />
                </div>
                <div className="fade-in fade-in-1">
                  <StatCard icon={XCircle} label="Loss Rate" value={`${lossRate}%`}
                    subValue={`${lostQuotesCount} lost · of ${totalQuotesForRate} total`}
                    color={COLORS.danger} bg={COLORS.dangerLight} />
                </div>
                <div className="fade-in fade-in-2">
                  <StatCard icon={Clock} label="Pending Rate" value={`${pendingRate}%`}
                    subValue={`${pendingQuotesCount} pending · of ${totalQuotesForRate} total`}
                    color={COLORS.warning} bg={COLORS.warningLight} />
                </div>
              </div>
            </div>

            {/* --- SALES TARGET vs ACTUAL --- */}
            {totalAnnualTarget > 0 && (
              <div className="mb-6 fade-in fade-in-2">
                {/* Annual Progress Bar */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <h3 className="text-sm font-semibold text-slate-700">
                        Annual Target {isAdmin ? "(All Employees)" : ""}
                      </h3>
                      <span className="text-xs text-slate-400">
                        FY {fyStart === 1 ? `Jan-Dec ${now.getFullYear()}` : `Apr ${now.getFullYear()}-Mar ${now.getFullYear() + 1}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-orange-700">{fmtLKR(totalDealsWon)}</span>
                      <span className="text-sm text-slate-400"> / {fmtLKR(totalAnnualTarget)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((totalDealsWon / totalAnnualTarget) * 100, 100)}%`,
                        background: totalDealsWon >= totalAnnualTarget
                          ? `linear-gradient(90deg, ${COLORS.success}, #4ADE80)`
                          : `linear-gradient(90deg, ${COLORS.warning}, #FDBA74)`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 text-right">
                    {totalAnnualTarget > 0
                      ? `${Math.min(((totalDealsWon / totalAnnualTarget) * 100), 999).toFixed(1)}% achieved`
                      : "No target set"}
                  </p>
                </div>

                {/* Quarterly Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashQuarters.map((q, qi) => {
                    const qTarget = getQuarterTarget(q.months);
                    const qMonthLabels = q.months.map(m => MONTH_LABELS[m]).join("-");
                    const progressPct = qTarget > 0 ? Math.min((totalDealsWon / 4 / qTarget) * 100, 100) : 0;

                    return (
                      <div
                        key={qi}
                        className={`rounded-xl border p-4 ${QUARTER_COLORS[qi].bg} ${QUARTER_COLORS[qi].border}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${QUARTER_COLORS[qi].text}`}>{q.label}</span>
                          <span className="text-[10px] text-slate-400">{qMonthLabels}</span>
                        </div>
                        <p className={`text-xl font-bold ${QUARTER_COLORS[qi].text} mb-1`}>
                          {qTarget > 0 ? fmtLKR(qTarget) : "—"}
                        </p>
                        <p className="text-[10px] text-slate-500 mb-2">Target</p>
                        {qTarget > 0 && (
                          <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${QUARTER_COLORS[qi].bar}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- PIPELINE CONVERSION ROW --- */}
            <div className="flex justify-center mb-6">
              <div className="w-full lg:w-[60%]">
              {/* Pipeline Conversion - Monday.com funnel style (Gemini v2) */}
              <Widget title="Pipeline Conversion" icon={BarChart3} className="fade-in fade-in-1">
                {/* Independent date filter for pipeline */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={pipelineDateFrom}
                    onChange={e => setPipelineDateFrom(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={pipelineDateTo}
                    onChange={e => setPipelineDateTo(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {pipelineLoading && <span className="text-xs text-slate-400 italic">Loading…</span>}
                </div>
                {(() => {
                  // Sort pipeline stages into a logical funnel order so bars & flow %'s don't
                  // depend on SQL GROUP BY ordering (which is not guaranteed).
                  const stageOrder = ['draft', 'submitted', 'won', 'lost'];
                  const data = pipeline.length > 0
                    ? [...pipeline].sort((a, b) => {
                        const ai = stageOrder.indexOf((a.status || '').toLowerCase());
                        const bi = stageOrder.indexOf((b.status || '').toLowerCase());
                        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                      })
                    : [];
                  if (data.length === 0) return <div className="text-sm text-slate-400 text-center py-8">No pipeline data</div>;

                  const rawMax = Math.max(...data.map(d => d.count || 0), 1);
                  const totalStages = data.length;

                  // Dynamic Y-Axis scale (~4-5 ticks)
                  let tickStep = Math.ceil(rawMax / 4);
                  if (tickStep === 0) tickStep = 1;
                  const yTicks = [];
                  for (let i = 0; i <= Math.ceil(rawMax / tickStep) * tickStep; i += tickStep) {
                    yTicks.push(i);
                  }
                  const maxScale = yTicks[yTicks.length - 1] || 1;

                  const svgWidth = 600;
                  const svgHeight = 250;
                  const margin = { top: 30, right: 0, bottom: 40, left: 40 };
                  const chartWidth = svgWidth - margin.left - margin.right;
                  const chartHeight = svgHeight - margin.top - margin.bottom;
                  const barWidth = 44;

                  const getCenter = (index) => margin.left + (index + 0.5) * (chartWidth / totalStages);
                  const getX = (index) => getCenter(index) - barWidth / 2;
                  const getY = (count) => margin.top + chartHeight - ((count || 0) / maxScale) * chartHeight;

                  // Funnel shading path
                  let funnelPath = `M ${getX(0)} ${getY(0)} `;
                  data.forEach((stage, i) => {
                    funnelPath += `L ${getX(i)} ${getY(stage.count)} `;
                    funnelPath += `L ${getX(i) + barWidth} ${getY(stage.count)} `;
                    if (i < totalStages - 1) {
                      funnelPath += `L ${getX(i + 1)} ${getY(data[i + 1].count)} `;
                    }
                  });
                  funnelPath += `L ${getX(totalStages - 1) + barWidth} ${getY(0)} Z`;

                  // Win Rate = won_count / total_quotes * 100
                  // Numerator: count of items where status === 'won'
                  // Denominator: sum of all NON-outcome statuses (draft, submitted, etc.)
                  //   - excluding 'won' and 'lost' because those come from a separate outcomes table
                  //   - (won + lost are appended by backend and would double-count)
                  const wonItem = data.find(d => (d.status || '').toLowerCase() === 'won');
                  const wonCount = wonItem ? (wonItem.count || 0) : 0;
                  const totalQuotes = data.reduce((sum, d) => {
                    const s = (d.status || '').toLowerCase();
                    if (s === 'won' || s === 'lost') return sum;
                    return sum + (d.count || 0);
                  }, 0);
                  const overallConversion = totalQuotes === 0 ? 0 : Math.round((wonCount / totalQuotes) * 100);

                  return (
                    <div className="flex items-stretch">
                      <div className="flex-grow overflow-x-auto overflow-y-hidden">
                        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
                          <defs>
                            <filter id="tag-shadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
                            </filter>
                          </defs>
                          {/* Y-Axis grid lines */}
                          {yTicks.map((tick) => (
                            <g key={`y-${tick}`}>
                              <line x1={margin.left} x2={svgWidth - 10} y1={getY(tick)} y2={getY(tick)} stroke="#F3F4F6" strokeWidth="1.5" />
                              <text x={margin.left - 10} y={getY(tick)} dy="0.3em" fontSize="11" fill="#9CA3AF" textAnchor="end">{tick}</text>
                            </g>
                          ))}
                          {/* Waterfall shading */}
                          <path d={funnelPath} fill="#D6EFFF" opacity="0.6" />
                          {/* Bars */}
                          {data.map((stage, i) => {
                            const x = getX(i);
                            const y = getY(stage.count);
                            const barH = ((stage.count || 0) / maxScale) * chartHeight;
                            const isWon = stage.status?.toLowerCase() === 'won';
                            return (
                              <g key={`bar-${i}`}>
                                <rect x={x} y={y} width={barWidth} height={Math.max(barH, 0)} fill={isWon ? '#00C875' : '#0073EA'} rx="3" ry="3" />
                                <text x={getCenter(i)} y={y - 10} fontSize="13" fontWeight="bold" fill="#374151" textAnchor="middle">{stage.count}</text>
                                <text x={getCenter(i)} y={margin.top + chartHeight + 20} fontSize="12" fill="#6B7280" textAnchor="middle" className="capitalize">{stage.status || 'Other'}</text>
                              </g>
                            );
                          })}
                          {/* Flow percentage tags */}
                          {data.map((stage, i) => {
                            if (i >= totalStages - 1) return null;
                            const nextStage = data[i + 1];
                            const rawPct = (stage.count || 0) === 0 ? 0 : ((nextStage.count || 0) / stage.count) * 100;
                            const pct = Number.isInteger(rawPct) ? rawPct : rawPct.toFixed(1);
                            const tagCx = (getX(i) + barWidth + getX(i + 1)) / 2;
                            const tagCy = (getY(stage.count) + getY(nextStage.count)) / 2;
                            const tagW = 46, tagH = 22, pointW = 6;
                            const left = tagCx - tagW / 2;
                            const top = tagCy - tagH / 2;
                            const tagPath = `M ${left} ${top} H ${left + tagW - pointW} L ${left + tagW} ${tagCy} L ${left + tagW - pointW} ${top + tagH} H ${left} Z`;
                            return (
                              <g key={`pct-${i}`}>
                                <path d={tagPath} fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#tag-shadow)" />
                                <text x={tagCx - 2} y={tagCy} dy="0.35em" fontSize="11" fontWeight="600" fill="#6B7280" textAnchor="middle">{pct}%</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      {/* Conversion sidebar */}
                      <div className="w-[120px] flex-shrink-0 flex items-center relative pl-6 border-l border-gray-100 ml-2">
                        <svg className="absolute left-[-5px] top-1/2 transform -translate-y-1/2" width="10" height="140" viewBox="0 0 10 140">
                          <line x1="5" y1="5" x2="5" y2="135" stroke="#CBD5E1" strokeWidth="1" />
                          <polygon points="1,6 5,0 9,6" fill="#CBD5E1" />
                          <polygon points="1,134 5,140 9,134" fill="#CBD5E1" />
                        </svg>
                        <div className="flex flex-col items-center justify-center text-center w-full">
                          <div className="text-3xl font-extrabold text-[#00C875] mb-1">{overallConversion}%</div>
                          <div className="text-[12px] text-gray-500 font-medium leading-tight">Conversion to<br/>Won</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Widget>
              </div>
            </div>

            {/* --- CHARTS ROW 2 --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Monthly Sales & Margin Bar Chart */}
              <Widget title="Monthly Sales & Margin" icon={BarChart3} className="fade-in fade-in-2">
                <div className="flex flex-col items-center w-full">
                  {(() => {
                    if (monthlyInvoice.length === 0) {
                      return <div className="flex items-center justify-center text-slate-300 text-sm h-[320px]">No invoice data for selected period</div>;
                    }

                    const maxVal = Math.max(...monthlyInvoice.map(m => Math.max(m.totalSales || 0, m.totalMargin || 0)), 1);
                    // Round up to nearest nice number for Y-axis
                    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                    const yMax = Math.ceil(maxVal / magnitude) * magnitude;
                    const ySteps = 5;
                    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => (yMax / ySteps) * (ySteps - i));

                    const chartW = Math.max(monthlyInvoice.length * 120, 380);
                    const chartH = 300;
                    const padL = 70, padR = 20, padT = 15, padB = 45;
                    const plotW = chartW - padL - padR;
                    const plotH = chartH - padT - padB;
                    const barGroupW = plotW / monthlyInvoice.length;
                    const barW = Math.min(barGroupW * 0.3, 40);
                    const gap = 6;

                    const fmtAxis = (v) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                      return v.toFixed(0);
                    };

                    return (
                      <div className="w-full overflow-x-auto thin-scrollbar">
                        <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="mx-auto">
                          {/* Y-axis grid lines and labels */}
                          {yLabels.map((val, i) => {
                            const y = padT + (i / ySteps) * plotH;
                            return (
                              <g key={`y-${i}`}>
                                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="3,3" />
                                <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[11px] fill-slate-400">{fmtAxis(val)}</text>
                              </g>
                            );
                          })}
                          {/* X-axis line */}
                          <line x1={padL} y1={padT + plotH} x2={chartW - padR} y2={padT + plotH} stroke="#CBD5E1" strokeWidth="1" />

                          {/* Bars per month */}
                          {monthlyInvoice.map((m, i) => {
                            const groupX = padL + i * barGroupW + barGroupW / 2;
                            const salesH = yMax > 0 ? ((m.totalSales || 0) / yMax) * plotH : 0;
                            const marginH = yMax > 0 ? ((m.totalMargin || 0) / yMax) * plotH : 0;
                            const salesY = padT + plotH - salesH;
                            const marginY = padT + plotH - marginH;
                            const marginPct = m.marginPercent || 0;

                            return (
                              <g key={`bar-${i}`}>
                                {/* Sales bar (blue) */}
                                <rect x={groupX - barW - gap / 2} y={salesY} width={barW} height={salesH} rx="2" fill="#3B82F6" />
                                {/* Margin bar (orange) */}
                                <rect x={groupX + gap / 2} y={marginY} width={barW} height={marginH} rx="2" fill="#F97316" />
                                {/* Margin % label on top of orange bar */}
                                {marginH > 0 && (
                                  <text x={groupX + gap / 2 + barW / 2} y={marginY - 5} textAnchor="middle" className="text-[10px] font-semibold fill-orange-600">{marginPct}%</text>
                                )}
                                {/* Month label */}
                                <text x={groupX} y={padT + plotH + 20} textAnchor="middle" className="text-[12px] fill-slate-500 font-medium">{m.monthName}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-5 mt-3 pt-2 border-t border-slate-100 w-full">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
                      <span className="text-xs text-slate-600">Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#F97316]" />
                      <span className="text-xs text-slate-600">Margin</span>
                    </div>
                  </div>
                  {/* Total summary */}
                  {monthlyInvoice.length > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-xs text-slate-400">Total Sales: </span>
                      <span className="text-sm font-bold text-slate-700">{fmtLKR(monthlyInvoice.reduce((s, m) => s + (m.totalSales || 0), 0))}</span>
                      <span className="text-xs text-slate-400 ml-3">Total Margin: </span>
                      <span className="text-sm font-bold text-orange-600">{fmtLKR(monthlyInvoice.reduce((s, m) => s + (m.totalMargin || 0), 0))}</span>
                    </div>
                  )}
                </div>
              </Widget>

              {/* Activities */}
              <Widget title="Sales Activities" icon={Activity} className="fade-in fade-in-3">
                <div className="flex flex-col items-center">
                  <div className="relative my-2">
                    <MiniPieChart segments={actPieSegments} size={140} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-slate-800">{activity.totalActivities || 0}</span>
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-1 mt-2">
                    {actPieSegments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-slate-600 flex-1">{seg.label}</span>
                        <span className="text-xs font-semibold text-slate-700">{seg.value}</span>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{(activity.totalActivities || 0) > 0 ? ((seg.value / (activity.totalActivities || 1)) * 100).toFixed(0) : 0}%</span>
                      </div>
                    ))}
                  </div>
                  {(activity.totalActivities || 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 w-full">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">By Status</p>
                      <ProgressBar label="Completed" value={activity.completedActivities || 0}
                        total={activity.totalActivities || 1} color={COLORS.success} />
                      <ProgressBar label="Pending" value={activity.pendingActivities || 0}
                        total={activity.totalActivities || 1} color={COLORS.warning} />
                      <ProgressBar label="Declined" value={activity.declinedActivities || 0}
                        total={activity.totalActivities || 1} color={COLORS.danger} />
                      <ProgressBar label="Cancelled" value={activity.cancelledActivities || 0}
                        total={activity.totalActivities || 1} color={COLORS.lightGray} />
                    </div>
                  )}
                </div>
              </Widget>
            </div>

            {/* --- REVENUE CHARTS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Widget title="Monthly RFQ Revenue" icon={BarChart3} className="fade-in fade-in-1">
                <div className="pt-4">
                  {rfqBars.length > 0 ? <BarChart items={rfqBars} maxHeight={180} /> : (
                    <div className="flex items-center justify-center h-[180px] text-slate-300 text-sm">No RFQ data for this period</div>
                  )}
                </div>
              </Widget>
              <Widget title={hasSalesAmounts ? "Monthly Quotation Sales Amount" : "Monthly Quotation Volume"} icon={BarChart3} className="fade-in fade-in-2">
                <div className="pt-4">
                  {quoteBars.length > 0 ? <BarChart items={quoteBars} maxHeight={180} /> : (
                    <div className="flex items-center justify-center h-[180px] text-slate-300 text-sm">No quote data for this period</div>
                  )}
                  {hasSalesAmounts && (
                    <div className="text-xs text-slate-400 text-center mt-1">Bars show total won sales amount per month</div>
                  )}
                </div>
              </Widget>
            </div>

            {/* --- BOTTOM ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Widget title="Top Customers (Won)" icon={Users} className="fade-in fade-in-1">
                {topCusts.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {topCusts.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.customer}</p>
                          <p className="text-xs text-slate-400">{c.quoteCount} won {c.quoteCount === 1 ? 'quote' : 'quotes'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-300 text-sm">No won quotes in this period</div>
                )}
              </Widget>

              <Widget title="Recent Activities" icon={Clock} span={2} className="fade-in fade-in-2">
                {recentActs.length > 0 ? (
                  <div className="space-y-1.5 mt-1 max-h-[300px] overflow-y-auto">
                    {recentActs.map((act, i) => {
                      const typeColors = {
                        call: { bg: "#DBEAFE", fg: "#2563EB", icon: Phone },
                        visit: { bg: "#D1FAE5", fg: "#059669", icon: MapPin },
                        meeting: { bg: "#EDE9FE", fg: "#7C3AED", icon: Users },
                      };
                      const tc = typeColors[(act.activityType || "").toLowerCase()] || { bg: "#F1F5F9", fg: "#64748B", icon: Activity };
                      const TypeIcon = tc.icon;
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: tc.bg }}>
                            <TypeIcon className="w-4 h-4" style={{ color: tc.fg }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{act.activityName || "Untitled"}</p>
                            <p className="text-xs text-slate-400">
                              {act.ownerName && <span>{act.ownerName} · </span>}
                              {act.relatedAccount && <span>{act.relatedAccount} · </span>}
                              {act.startTime && new Date(act.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            (act.status || "").toLowerCase() === "done" ? "bg-green-100 text-green-700" :
                            (act.status || "").toLowerCase() === "declined" ? "bg-red-100 text-red-700" :
                            (act.status || "").toLowerCase() === "cancelled" ? "bg-slate-100 text-slate-500" :
                            "bg-amber-100 text-amber-700"
                          }`}>{act.status || "Pending"}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-300 text-sm">No recent activities</div>
                )}
              </Widget>
            </div>
          </>
        )}

        {/* NEWS FEED */}
        {activeTab === "newsfeed" && (
          <div className="min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Market Place</h2>
                <p className="text-sm text-slate-400 mt-1">Latest news, announcements & updates</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </button>
              )}
            </div>

            {/* Loading */}
            {newsFeedLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : newsFeedImages.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex items-center justify-center">
                <div className="text-center">
                  <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-500 mb-2">No News Yet</h3>
                  <p className="text-slate-400 text-sm">
                    {isAdmin
                      ? "Click \"Add Image\" to post company news and updates."
                      : "Company news and updates will appear here."}
                  </p>
                </div>
              </div>
            ) : (
              /* Masonry Grid */
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {newsFeedImages.map((img) => (
                  <div
                    key={img.SysID}
                    className="break-inside-avoid group relative rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setLightboxImage(img)}
                  >
                    <img
                      src={`${STATIC_URL}${img.image_url}`}
                      alt={img.caption || "News image"}
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      {img.caption && (
                        <p className="text-white text-sm font-medium mb-1 line-clamp-2">{img.caption}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-white/70 text-xs">
                          {img.uploaded_by} &middot;{" "}
                          {img.created_at
                            ? new Date(img.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(img.sysID)
                            }}
                            className="w-8 h-8 rounded-lg bg-red-500/80 hover:bg-red-600 flex items-center justify-center transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeUploadModal}>
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Upload Market Place Image</h3>
                    <button
                      onClick={closeUploadModal}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4">
                    {/* File Input Area */}
                    {!uploadPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                        <span className="text-sm font-medium text-slate-500">Click to select an image</span>
                        <span className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WebP (max 10MB)</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="w-full max-h-64 object-contain rounded-xl border border-slate-200"
                        />
                        <button
                          onClick={() => {
                            setUploadFile(null);
                            setUploadPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    {/* Caption Input */}
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-1 block">Caption (optional)</label>
                      <input
                        type="text"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="Add a caption..."
                        maxLength={500}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={closeUploadModal}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!uploadFile || uploading}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightboxImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => setLightboxImage(null)}
              >
                <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={`${STATIC_URL}${lightboxImage.image_url}`}
                    alt={lightboxImage.caption || "News image"}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                  />
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                  {lightboxImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
                      <p className="text-white text-sm font-medium">{lightboxImage.caption}</p>
                      <p className="text-white/60 text-xs mt-1">
                        {lightboxImage.uploaded_by} &middot;{" "}
                        {lightboxImage.created_at
                          ? new Date(lightboxImage.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
