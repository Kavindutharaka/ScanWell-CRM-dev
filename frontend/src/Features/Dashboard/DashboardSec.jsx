import React, { useState, useEffect } from "react";
import {
  Search,
  Settings,
  ChevronDown,
  Filter,
  Users,
  Download,
  MoreHorizontal,
  Star,
  Plus,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Info,
  TrendingUp,
  Newspaper
} from "lucide-react";

export default function DashboardSec() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Sample data
  const dealStatusData = [
    { status: "Won", percentage: 50.0, color: "bg-[#00C875]", count: 8 }, // Monday Green
    { status: "Discovery", percentage: 25.0, color: "bg-[#0086C0]", count: 4 }, // Monday Blue
    { status: "Working on it", percentage: 12.5, color: "bg-[#FDAB3D]", count: 2 }, // Monday Orange
    { status: "Proposal", percentage: 12.5, color: "bg-[#A25DDC]", count: 2 }, // Monday Purple
  ];

  const monthlyData = [
    { month: "Sep", value: 30000, trend: "up" },
    { month: "Oct", value: 55000, trend: "up" },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  // ----------------------------------------------------------------------
  // LOADING SKELETONS
  // ----------------------------------------------------------------------
  const WidgetLoading = () => (
    <div className="bg-white rounded-lg border border-[#d0d4e4] shadow-sm p-5 h-full flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-4"></div>
      </div>
      <div className="flex-1 bg-slate-100 rounded"></div>
    </div>
  );

  // ----------------------------------------------------------------------
  // WIDGET CONTAINER
  // ----------------------------------------------------------------------
  const Widget = ({ title, children, className = "", loading = false, hasFilter = true }) => {
    if (loading) return <WidgetLoading />;

    return (
      <div 
        className={`bg-white rounded-lg border border-[#d0d4e4] shadow-sm hover:shadow-md transition-shadow flex flex-col ${className}`}
        style={{ animation: 'fadeIn 0.5s ease-out' }}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[#323338] text-lg truncate tracking-tight">
              {title}
            </h3>
            {hasFilter && <Filter className="w-3 h-3 text-[#676879] cursor-pointer hover:text-[#323338]" />}
          </div>
          <button className="text-[#676879] hover:text-[#323338] transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------------
  // TAB NAVIGATION
  // ----------------------------------------------------------------------
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "marketplace", label: "MarketPlace Info", icon: TrendingUp },
    { id: "newsfeed", label: "News Feed", icon: Newspaper }
  ];

  return (
    <main className="w-full bg-[#f6f8fb] min-h-screen text-[#323338] font-sans selection:bg-[#0086C0] selection:text-white">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom scrollbar for light theme */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f6f8fb; }
        ::-webkit-scrollbar-thumb { background: #c3c6d4; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8abbd; }
      `}</style>
      
      <div className="p-6 max-w-[1600px] mx-auto pb-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-[#d0d4e4] pb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#323338] tracking-wide">
              Sales Dashboard
            </h1>
            <button className="text-[#676879] hover:text-yellow-400 transition-colors">
              <Star className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-[#d0d4e4]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 font-medium transition-all relative
                    ${isActive 
                      ? 'text-[#0086C0] border-b-2 border-[#0086C0]' 
                      : 'text-[#676879] hover:text-[#323338] hover:bg-white/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. ANNUAL TARGET (Gauge) */}
            <Widget title="Annual Target" className="lg:col-span-1 h-64" loading={loading}>
              <div className="flex flex-col items-center justify-end h-full relative pb-4">
                {/* Gauge visual */}
                <div className="relative w-48 h-24 overflow-hidden mb-2">
                  {/* Background arc */}
                  <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] border-[#e6e9ef]"></div>
                  {/* Active arc (Simulated with rotation) */}
                  <div 
                      className="absolute top-0 left-0 w-48 h-48 rounded-full border-[20px] border-transparent border-t-[#00C875] border-l-[#0086C0]"
                      style={{ transform: 'rotate(45deg)', opacity: 1 }}
                  ></div>
                  
                  {/* Needle */}
                  <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-[#323338] origin-bottom transform -rotate-12 rounded-full z-10 shadow-sm"></div>
                  {/* Center dot */}
                  <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-[#323338] rounded-full transform -translate-x-1/2 translate-y-1/2 z-20 border-2 border-white"></div>
                </div>

                <div className="flex justify-between w-full mt-6 px-2">
                  <div className="text-center">
                    <div className="text-[10px] text-[#676879] font-bold uppercase tracking-wider mb-1">ACTUAL</div>
                    <div className="text-xl font-bold text-[#323338]">85K</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[#676879] font-bold uppercase tracking-wider mb-1">TARGET</div>
                    <div className="text-xl font-bold text-[#323338]">100K</div>
                  </div>
                </div>
              </div>
            </Widget>

            {/* 2. MONTHLY TARGET (Battery/Bar) */}
            <Widget title="Monthly Target" className="lg:col-span-1 h-64" loading={loading}>
              <div className="flex flex-col justify-center h-full gap-8">
                {/* Progress Bar */}
                <div className="relative h-12 w-full bg-[#e6e9ef] rounded-md overflow-hidden flex">
                  <div 
                      className="h-full bg-gradient-to-r from-[#0086C0] to-[#A25DDC]" 
                      style={{ width: '100%' }}
                  ></div>
                  {/* Overflow indicator */}
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg drop-shadow-md">
                     300%
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between w-full px-2">
                  <div className="text-center">
                    <div className="text-[10px] text-[#676879] font-bold uppercase tracking-wider mb-1">MONTHLY ACTUAL</div>
                    <div className="text-xl font-bold text-[#00C875]">55K</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[#676879] font-bold uppercase tracking-wider mb-1">THIS MONTH'S TARGET</div>
                    <div className="text-xl font-bold text-[#323338]">10K</div>
                  </div>
                </div>
              </div>
            </Widget>

            {/* 3. AVERAGE DEAL VALUE (Big Number) */}
            <Widget title="Average Sales Value" className="lg:col-span-1 h-64" loading={loading}>
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl font-light text-[#323338] mb-2">$42,500</div>
              </div>
            </Widget>

            {/* 4. ACTIVE DEALS (Big Number) */}
            <Widget title="Active Sales - Forecasted Rev..." className="lg:col-span-1 h-64" loading={loading}>
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl font-light text-[#323338] mb-2">$133,000</div>
              </div>
            </Widget>

            {/* 5. DEAL STATUS (Pie Chart) */}
            <Widget title="Sales status distribution" className="lg:col-span-2 min-h-[300px]" loading={loading}>
              <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-8">
                {/* Pie Visual */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    {/* Won: 50% - Green */}
                    <circle 
                      cx="50" cy="50" r="25" 
                      fill="transparent" 
                      stroke="#00C875" 
                      strokeWidth="50" 
                      strokeDasharray="78.5 78.5"
                      strokeDashoffset="0"
                    />
                    {/* Discovery: 25% - Blue */}
                    <circle 
                      cx="50" cy="50" r="25" 
                      fill="transparent" 
                      stroke="#0086C0" 
                      strokeWidth="50" 
                      strokeDasharray="39.25 117.75"
                      strokeDashoffset="-78.5"
                    />
                    {/* Working on it: 12.5% - Orange */}
                    <circle 
                      cx="50" cy="50" r="25" 
                      fill="transparent" 
                      stroke="#FDAB3D" 
                      strokeWidth="50" 
                      strokeDasharray="19.625 137.375"
                      strokeDashoffset="-117.75"
                    />
                    {/* Proposal: 12.5% - Purple */}
                    <circle 
                      cx="50" cy="50" r="25" 
                      fill="transparent" 
                      stroke="#A25DDC" 
                      strokeWidth="50" 
                      strokeDasharray="19.625 137.375"
                      strokeDashoffset="-137.375"
                    />
                  </svg>
                </div>  

                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {dealStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <div className="flex flex-col">
                              <span className="text-sm text-[#323338]">{item.status}: <span className="text-[#676879]">{item.percentage}%</span></span>
                          </div>
                      </div>
                  ))}
                </div>
              </div>
            </Widget>

            {/* 6. ACTUAL REVENUE BY MONTH (Bar Chart) */}
            <Widget title="Actual Revenue by Month (Deals won)" className="lg:col-span-2 min-h-[300px]" loading={loading}>
              <div className="h-full w-full flex flex-col justify-end pt-8 px-4 relative">
                  {/* Y-Axis Lines */}
                  {[0, 10, 20, 30, 40, 50, 60].map((val, i) => (
                      <div key={i} className="absolute w-full border-t border-slate-100" style={{ bottom: `${(val / 60) * 80 + 20}%`, left: 0 }}>
                          <span className="absolute -left-0 -top-2.5 text-[10px] text-[#676879]">${val},000</span>
                      </div>
                  ))}

                  {/* Bars */}
                  <div className="flex justify-around items-end h-[80%] z-10 pl-8">
                      {monthlyData.map((data, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 group w-24">
                              <div className="mb-1 text-xs text-[#323338] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                  ${data.value.toLocaleString()}
                              </div>
                              <div 
                                  className="w-full bg-[#579BFC] hover:bg-[#4680d3] transition-all rounded-t-sm relative"
                                  style={{ height: `${(data.value / 60000) * 100}%` }}
                              ></div>
                              <div className="text-xs text-[#676879] mt-2">{data.month}</div>
                          </div>
                      ))}
                      {/* Placeholder for Nov to match image */}
                      <div className="flex flex-col items-center gap-2 w-24 opacity-50">
                          <div 
                              className="w-full bg-[#e6e9ef] border border-dashed border-[#c3c6d4] rounded-t-sm"
                              style={{ height: '5px' }}
                          ></div>
                          <div className="text-xs text-[#676879] mt-2">Nov</div>
                      </div>
                  </div>
                  
                  {/* Floating Help Button (Bottom Right of this widget) */}
                  <div className="absolute bottom-4 right-4 z-20">
                       <button className="bg-[#0086C0] hover:bg-[#0071a1] text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                          Help
                       </button>
                  </div>
              </div>
            </Widget>
          </div>
        )}

        {/* --- MARKETPLACE INFO --- */}
        {activeTab === "marketplace" && (
          <div className="bg-white rounded-lg border border-[#d0d4e4] shadow-sm p-8 min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-[#676879] mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-[#323338] mb-2">MarketPlace Info</h2>
              <p className="text-[#676879]">Content coming soon...</p>
            </div>
          </div>
        )}

        {/* --- NEWS FEED --- */}
        {activeTab === "newsfeed" && (
          <div className="bg-white rounded-lg border border-[#d0d4e4] shadow-sm p-8 min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <Newspaper className="w-16 h-16 text-[#676879] mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-[#323338] mb-2">News Feed</h2>
              <p className="text-[#676879]">Content coming soon...</p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}