import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/axios";
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
  Building2
} from "lucide-react";

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
  const [dateFrom, setDateFrom] = useState(toLocalDateStr(firstOfMonth));
  const [dateTo, setDateTo] = useState(toLocalDateStr(now));

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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

  // ===== PRESETS =====
  const setPreset = (preset) => {
    const today = new Date();
    let from = new Date(), to = new Date();
    switch (preset) {
      case "thisMonth": from = new Date(today.getFullYear(), today.getMonth(), 1); to = today; break;
      case "lastMonth": from = new Date(today.getFullYear(), today.getMonth() - 1, 1); to = new Date(today.getFullYear(), today.getMonth(), 0); break;
      case "thisQuarter": { const q = Math.floor(today.getMonth() / 3); from = new Date(today.getFullYear(), q * 3, 1); to = today; break; }
      case "thisYear": from = new Date(today.getFullYear(), 0, 1); to = today; break;
      default: break;
    }
    setDateFrom(toLocalDateStr(from));
    setDateTo(toLocalDateStr(to));
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

  // ===== GAUGE METER (large, colorful) =====
  const GaugeMeter = ({ value, label, maxLabel }) => {
    // Gauge shows from 0 to a calculated max
    const maxVal = value > 0 ? value * 1.3 : 100000;
    const pct = Math.min((value / maxVal) * 100, 100);
    const angle = (pct / 100) * 180; // 0-180 degrees

    // Color gradient based on amount
    const gaugeColor = value > 0 ? "url(#gaugeGrad)" : COLORS.lightGray;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-72 h-44 overflow-hidden">
          <svg viewBox="0 0 200 120" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00C875" />
                <stop offset="50%" stopColor="#0073EA" />
                <stop offset="100%" stopColor="#A25DDC" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path d="M 20 105 A 80 80 0 0 1 180 105" fill="none" stroke="#E6E9EF" strokeWidth="30" strokeLinecap="round" />
            {/* Value arc */}
            {value > 0 && (
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="30"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 251.2} 251.2`}
                className="transition-all duration-1000"
              />
            )}
            {/* Needle */}
            <g transform={`rotate(${angle - 90}, 100, 105)`}>
              <line x1="100" y1="105" x2="100" y2="40" stroke="#323338" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="105" r="6" fill="#323338" />
              <circle cx="100" cy="105" r="3" fill="white" />
            </g>
            {/* Min/Max labels */}
            <text x="20" y="118" textAnchor="middle" className="text-[8px]" fill="#676879">0</text>
            <text x="180" y="118" textAnchor="middle" className="text-[8px]" fill="#676879">{maxLabel || fmtLKR(maxVal)}</text>
          </svg>
        </div>
        <div className="text-center -mt-2">
          <p className="text-3xl font-bold text-slate-800">{fmtLKR(value)}</p>
          <p className="text-xs text-slate-400 mt-1">{label}</p>
        </div>
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
  const pipeline = data?.pipelineConversion || [];
  const monthly = data?.monthlyRevenue || { rfqRevenue: [], quoteVolume: [] };
  const activity = data?.activityStats || {};
  const rfq = data?.rfqRevenue || {};
  const deals = data?.dealStats || {};
  const customers = data?.customerStats || {};
  const recentActs = data?.recentActivities || [];
  const topCusts = data?.topCustomers || [];
  const quoteOutcomes = data?.quoteOutcomes || {};

  const pipeTotal = pipeline.reduce((s, p) => s + (p.count || 0), 0);

  const statusColors = { draft: COLORS.blue, sent: COLORS.purple, approved: COLORS.success };

  // Total Deals Won = RFQ Revenue + Won Quote Amount + Won Deal Value
  const totalDealsWon = (rfq.totalRevenue || 0) + (quoteOutcomes.totalWonAmount || 0) + (deals.wonDealValue || 0);

  // Quote win rate (won vs total outcomes)
  const totalOutcomes = (quoteOutcomes.wonQuotes || 0) + (quoteOutcomes.lostQuotes || 0);
  const approvalRate = totalOutcomes > 0 ? (((quoteOutcomes.wonQuotes || 0) / totalOutcomes) * 100).toFixed(1) : "0";

  // RFQ monthly bars
  const rfqBars = (monthly.rfqRevenue || []).map(m => ({
    label: m.monthName, value: m.rfqRevenue || 0, color: COLORS.success, colorEnd: "#4ADE80",
  }));

  // Quote volume monthly bars
  const quoteBars = (monthly.quoteVolume || []).map(m => ({
    label: m.monthName, value: m.quoteCount || 0, color: COLORS.primary, colorEnd: COLORS.blue,
  }));

  // Pie segments
  // Combine deal_reg + quote_outcomes for the deal status pie
  const dealPieSegments = [
    { label: "Won", value: (deals.wonDeals || 0) + (quoteOutcomes.wonQuotes || 0), color: COLORS.success },
    { label: "Lost", value: (deals.lostDeals || 0) + (quoteOutcomes.lostQuotes || 0), color: COLORS.danger },
    { label: "Active", value: deals.activeDeals || 0, color: COLORS.blue },
  ].filter(s => s.value > 0);
  const totalDealsPieCount = (deals.totalDeals || 0) + (quoteOutcomes.wonQuotes || 0) + (quoteOutcomes.lostQuotes || 0);

  const pipelinePieSegments = pipeline.map((p, i) => ({
    label: (p.status || "Other").charAt(0).toUpperCase() + (p.status || "other").slice(1),
    value: p.count || 0,
    color: statusColors[p.status?.toLowerCase()] || PIE_COLORS[i % PIE_COLORS.length],
  })).filter(s => s.value > 0);

  const actPieSegments = [
    { label: "Completed", value: activity.completedActivities || 0, color: COLORS.success },
    { label: "Pending", value: activity.pendingActivities || 0, color: COLORS.warning },
    { label: "Declined", value: activity.declinedActivities || 0, color: COLORS.danger },
    { label: "Cancelled", value: activity.cancelledActivities || 0, color: COLORS.lightGray },
  ].filter(s => s.value > 0);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "newsfeed", label: "News Feed", icon: Newspaper },
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
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-slate-50 text-slate-500 hover:text-slate-700">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="text-xs border-none outline-none bg-transparent text-slate-600 w-28" />
              <span className="text-slate-300">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="text-xs border-none outline-none bg-transparent text-slate-600 w-28" />
            </div>
            <button onClick={fetchDashboard}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-6">
          <div className="flex gap-1 border-b border-slate-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all relative ${
                    activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  <Icon className="w-4 h-4" />{tab.label}
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
                  <h3 className="text-sm font-semibold text-slate-700">Total Deals Won</h3>
                </div>
                <GaugeMeter value={totalDealsWon} label="RFQ Revenue + Won Deals" />
                <div className="flex justify-around mt-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{fmtLKR(rfq.totalRevenue || 0)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">RFQ Revenue</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{fmtLKR((quoteOutcomes.totalWonAmount || 0) + (deals.wonDealValue || 0))}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Won Deals</p>
                  </div>
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
                  <StatCard icon={Activity} label="Activities" value={activity.totalActivities || 0}
                    subValue={`${activity.completedActivities || 0} completed`}
                    color={COLORS.warning} bg={COLORS.warningLight} />
                </div>
                <div className="fade-in fade-in-1">
                  <StatCard icon={Briefcase} label="Total Deals" value={totalDealsPieCount}
                    subValue={`${(deals.wonDeals || 0) + (quoteOutcomes.wonQuotes || 0)} won · ${(deals.lostDeals || 0) + (quoteOutcomes.lostQuotes || 0)} lost`}
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
              </div>
            </div>

            {/* --- CHARTS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Pipeline Conversion */}
              <Widget title="Pipeline Conversion" icon={PieChart} className="fade-in fade-in-1">
                <div className="flex flex-col items-center">
                  <div className="relative my-2">
                    <MiniPieChart segments={pipelinePieSegments} size={140} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-slate-800">{pipeTotal}</span>
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-1 mt-2">
                    {pipeline.map((p, i) => {
                      const color = statusColors[p.status?.toLowerCase()] || PIE_COLORS[i];
                      const pct = pipeTotal > 0 ? ((p.count / pipeTotal) * 100).toFixed(0) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-slate-600 flex-1 capitalize">{p.status || "Other"}</span>
                          <span className="text-xs font-semibold text-slate-700">{p.count}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Widget>

              {/* Deal Status (Deals + Quote Outcomes combined) */}
              <Widget title="Deal Status Distribution" icon={PieChart} className="fade-in fade-in-2">
                <div className="flex flex-col items-center">
                  <div className="relative my-2">
                    <MiniPieChart segments={dealPieSegments} size={140} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-slate-800">{totalDealsPieCount}</span>
                        <p className="text-[10px] text-slate-400">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-1 mt-2">
                    {dealPieSegments.map((seg, i) => {
                      const pct = totalDealsPieCount > 0 ? ((seg.value / totalDealsPieCount) * 100).toFixed(0) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-xs text-slate-600 flex-1">{seg.label}</span>
                          <span className="text-xs font-semibold text-slate-700">{seg.value}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {(deals.totalDealValue > 0 || quoteOutcomes.totalWonAmount > 0) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 w-full text-center">
                      <span className="text-xs text-slate-400">Total Won Value: </span>
                      <span className="text-sm font-bold text-slate-700">{fmtLKR((deals.wonDealValue || 0) + (quoteOutcomes.totalWonAmount || 0))}</span>
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
                      </div>
                    ))}
                  </div>
                  {(activity.typeBreakdown || []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 w-full">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">By Type</p>
                      {(activity.typeBreakdown || []).slice(0, 5).map((tb, i) => (
                        <ProgressBar key={i} label={tb.type} value={tb.count}
                          total={activity.totalActivities || 1} color={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
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
              <Widget title="Monthly Quotation Volume" icon={BarChart3} className="fade-in fade-in-2">
                <div className="pt-4">
                  {quoteBars.length > 0 ? <BarChart items={quoteBars} maxHeight={180} /> : (
                    <div className="flex items-center justify-center h-[180px] text-slate-300 text-sm">No quote data for this period</div>
                  )}
                </div>
              </Widget>
            </div>

            {/* --- BOTTOM ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Widget title="Top Customers" icon={Users} className="fade-in fade-in-1">
                {topCusts.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {topCusts.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.customer}</p>
                          <p className="text-xs text-slate-400">{c.quoteCount} quotes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-300 text-sm">No customer data</div>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-600 mb-2">News Feed</h2>
              <p className="text-slate-400 text-sm">Company news and updates will appear here</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
