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
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Eye,
  Edit,
  UserPlus,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export default function DashboardSec() {
  const [activeView, setActiveView] = useState("View");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Sample data
  const dealStatusData = [
    { status: "Won", percentage: 50.0, color: "bg-emerald-500", count: 8 },
    { status: "Discovery", percentage: 25.0, color: "bg-blue-500", count: 4 },
    { status: "Working on it", percentage: 12.5, color: "bg-amber-500", count: 2 },
    { status: "Proposal", percentage: 12.5, color: "bg-indigo-500", count: 2 },
  ];

  const pipelineData = [
    { stage: "New", count: 5, percentage: 100, value: "$25,000" },
    { stage: "Discovery", count: 5, percentage: 100, value: "$42,500" },
    { stage: "Proposal", count: 3, percentage: 60, value: "$67,800" },
    { stage: "Negotiation", count: 2, percentage: 66.7, value: "$85,200" },
    { stage: "Won", count: 2, percentage: 100, value: "$133,000" },
  ];

  const monthlyData = [
    { month: "Aug", value: 25000, trend: "up" },
    { month: "Sep", value: 30000, trend: "up" },
    { month: "Oct", value: 55000, trend: "up" },
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // Loading skeleton component
  const LoadingSkeleton = ({ className = "", children }) => (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );

  // Widget loading component
  const WidgetLoading = ({ title, type = "default" }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <LoadingSkeleton>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
          </LoadingSkeleton>
        </div>
        <div className="flex items-center gap-2">
          <LoadingSkeleton>
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
          </LoadingSkeleton>
          <LoadingSkeleton>
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
          </LoadingSkeleton>
        </div>
      </div>
      <div className="p-4">
        {type === "gauge" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <LoadingSkeleton>
                <div className="w-32 h-16 bg-slate-200 rounded-t-full"></div>
              </LoadingSkeleton>
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton>
                <div className="text-center space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </LoadingSkeleton>
              <LoadingSkeleton>
                <div className="text-center space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </LoadingSkeleton>
            </div>
          </div>
        )}
        {type === "chart" && (
          <div className="space-y-4">
            <LoadingSkeleton>
              <div className="h-24 bg-slate-200 rounded"></div>
            </LoadingSkeleton>
            <div className="flex justify-between">
              <LoadingSkeleton>
                <div className="text-center space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              </LoadingSkeleton>
              <LoadingSkeleton>
                <div className="text-center space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                  <div className="h-6 bg-slate-200 rounded w-12"></div>
                </div>
              </LoadingSkeleton>
            </div>
          </div>
        )}
        {type === "metric" && (
          <div className="text-center space-y-3">
            <LoadingSkeleton>
              <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full"></div>
            </LoadingSkeleton>
            <LoadingSkeleton>
              <div className="space-y-2">
                <div className="h-8 bg-slate-200 rounded w-20 mx-auto"></div>
                <div className="h-4 bg-slate-200 rounded w-24 mx-auto"></div>
              </div>
            </LoadingSkeleton>
          </div>
        )}
        {type === "pie" && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <LoadingSkeleton>
              <div className="w-32 h-32 bg-slate-200 rounded-full mx-auto lg:mx-0"></div>
            </LoadingSkeleton>
            <div className="flex-1 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <LoadingSkeleton>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </div>
                  </LoadingSkeleton>
                  <LoadingSkeleton>
                    <div className="text-right space-y-1">
                      <div className="h-4 bg-slate-200 rounded w-8"></div>
                      <div className="h-3 bg-slate-200 rounded w-12"></div>
                    </div>
                  </LoadingSkeleton>
                </div>
              ))}
            </div>
          </div>
        )}
        {type === "bar" && (
          <div className="space-y-4">
            <div className="flex items-end justify-center gap-4 h-32">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i}>
                  <div 
                    className="bg-slate-200 rounded-t-md"
                    style={{
                      width: "40px",
                      height: `${40 + i * 20}px`
                    }}
                  ></div>
                </LoadingSkeleton>
              ))}
            </div>
            <LoadingSkeleton>
              <div className="text-center space-y-2">
                <div className="h-6 bg-slate-200 rounded w-24 mx-auto"></div>
                <div className="h-3 bg-slate-200 rounded w-32 mx-auto"></div>
              </div>
            </LoadingSkeleton>
          </div>
        )}
        {type === "pipeline" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-50 rounded-lg p-4 min-h-[200px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                  <div 
                    className="bg-slate-200 rounded-t-md min-w-[60px]"
                    style={{ height: `${40 + i * 15}px` }}
                  ></div>
                  <div className="text-center space-y-1">
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                    <div className="h-3 bg-slate-200 rounded w-14"></div>
                  </div>
                </LoadingSkeleton>
              ))}
              <LoadingSkeleton>
                <div className="bg-slate-200 rounded-lg p-4 min-w-[120px] h-24"></div>
              </LoadingSkeleton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i}>
                  <div className="bg-slate-200 rounded-lg p-4 text-center h-16"></div>
                </LoadingSkeleton>
              ))}
            </div>
          </div>
        )}
        {type === "default" && (
          <LoadingSkeleton>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          </LoadingSkeleton>
        )}
      </div>
    </div>
  );

  // Widget component for reusability with loading state
  const Widget = ({ title, children, actions = true, className = "", loading = false, loadingType = "default" }) => {
    if (loading) {
      return <WidgetLoading title={title} type={loadingType} />;
    }

    return (
      <div 
        className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${className}`}
        style={{
          animation: 'slideInFromLeft 0.8s ease-out forwards',
          opacity: 0,
          transform: 'translateX(-50px)'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm md:text-base truncate">
            {title}
          </h3>
          {actions && (
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-slate-100 rounded transition-colors group">
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </button>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors group">
                <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  };

  return (
    <main className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-full">
      <style jsx>{`
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromBottom {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-left {
          animation: slideInFromLeft 0.6s ease-out forwards;
        }
        
        .animate-slide-in-bottom {
          animation: slideInFromBottom 0.5s ease-out forwards;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-900 { animation-delay: 0.9s; }
        .delay-1000 { animation-delay: 1.0s; }
      `}</style>
      
      <div className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Sales Dashboard
              </h1>
            </div>
            <button className="p-1 hover:bg-white/70 rounded transition-colors group">
              <Star className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Action Buttons */}
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Type to filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <Users className="w-4 h-4" />
              People
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="p-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Settings className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Annual Target */}
            <Widget 
              title="Annual Target" 
              className="md:col-span-2 xl:col-span-1" 
              loading={loading} 
              loadingType="gauge"
            >
              <div className={`text-center space-y-4 ${!loading ? 'animate-slide-in-left delay-100' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                {/* Gauge visualization */}
                <div className="relative mx-auto w-32 h-16">
                  <div className="absolute inset-0 border-8 border-slate-200 rounded-t-full"></div>
                  <div className="absolute inset-0 border-[1rem] border-l-emerald-400 border-b-emerald-400 border-r-blue-500 border-t-blue-500 rounded-t-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-slate-800 origin-bottom rotate-12"></div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-600">
                    85%
                  </div>
                </div>
                
                <div className="flex justify-between text-center">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">ACTUAL</div>
                    <div className="text-lg font-bold text-slate-800">$85K</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">TARGET</div>
                    <div className="text-lg font-bold text-slate-800">$100K</div>
                  </div>
                </div>
              </div>
            </Widget>

            {/* Monthly Target */}
            <Widget 
              title="Monthly Target" 
              className="md:col-span-2 xl:col-span-1" 
              loading={loading} 
              loadingType="chart"
            >
              <div className={`space-y-4 ${!loading ? 'animate-slide-in-left delay-200' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold">300%</div>
                    <div className="text-xs opacity-90">Above target</div>
                  </div>
                </div>
                
                <div className="flex justify-between text-center">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">ACTUAL</div>
                    <div className="text-lg font-bold text-emerald-600">$30K</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">TARGET</div>
                    <div className="text-lg font-bold text-slate-800">$10K</div>
                  </div>
                </div>
              </div>
            </Widget>

            {/* Average Deal Value */}
            <Widget 
              title="Average Deal Value" 
              className="md:col-span-1" 
              loading={loading} 
              loadingType="metric"
            >
              <div className={`text-center space-y-3 ${!loading ? 'animate-slide-in-left delay-300' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">$42,500</div>
                  <div className="flex items-center justify-center gap-1 text-sm text-emerald-600">
                    <ArrowUp className="w-4 h-4" />
                    12% vs last month
                  </div>
                </div>
              </div>
            </Widget>

            {/* Active Deals */}
            <Widget 
              title="Active Deals - Forecasted Revenue" 
              className="md:col-span-1" 
              loading={loading} 
              loadingType="metric"
            >
              <div className={`text-center space-y-3 ${!loading ? 'animate-slide-in-left delay-400' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">$133,000</div>
                  <div className="text-sm text-slate-600">16 active deals</div>
                </div>
              </div>
            </Widget>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Deal Status Distribution */}
            <Widget 
              title="Deal Status Distribution" 
              loading={loading} 
              loadingType="pie"
            >
              <div className={`flex flex-col lg:flex-row lg:items-center gap-6 ${!loading ? 'animate-slide-in-left delay-500' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                {/* Pie chart representation */}
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="50, 100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-800">16</div>
                        <div className="text-xs text-slate-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {dealStatusData.map((item, index) => (
                    <div key={index} className={`flex items-center justify-between ${!loading ? 'animate-slide-in-left' : ''}`} style={{ 
                      opacity: loading ? 1 : 0,
                      animationDelay: loading ? '0s' : `${0.6 + index * 0.1}s`
                    }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm text-slate-700 font-medium">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">{item.count}</div>
                        <div className="text-xs text-slate-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Widget>

            {/* Revenue by Month */}
            <Widget 
              title="Revenue by Month (Won Deals)" 
              loading={loading} 
              loadingType="bar"
            >
              <div className={`space-y-4 ${!loading ? 'animate-slide-in-left delay-600' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                <div className="flex items-end justify-center gap-4 h-32">
                  {monthlyData.map((month, index) => (
                    <div key={index} className={`flex flex-col items-center gap-2 ${!loading ? 'animate-slide-in-bottom' : ''}`} style={{ 
                      opacity: loading ? 1 : 0,
                      animationDelay: loading ? '0s' : `${0.7 + index * 0.1}s`
                    }}>
                      <div
                        className="bg-blue-500 rounded-t-md flex items-end justify-center relative group cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{
                          width: "40px",
                          height: `${(month.value / 60000) * 100}px`,
                          minHeight: "20px"
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ${month.value.toLocaleString()}
                        </div>
                        
                        <div className="flex items-center text-white text-xs mb-1">
                          {month.trend === "up" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{month.month}</span>
                    </div>
                  ))}
                </div>
                
                <div className={`text-center ${!loading ? 'animate-slide-in-bottom delay-1000' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                  <div className="text-lg font-bold text-emerald-600">+83% Growth</div>
                  <div className="text-xs text-slate-500">vs previous quarter</div>
                </div>
              </div>
            </Widget>
          </div>

          {/* Pipeline Conversion - Full Width */}
          <Widget 
            title="Pipeline Conversion" 
            className="w-full" 
            loading={loading} 
            loadingType="pipeline"
          >
            <div className={`space-y-4 ${!loading ? 'animate-slide-in-left delay-700' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
              <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-50 rounded-lg p-4 min-h-[200px]">
                {pipelineData.map((stage, index) => (
                  <div key={index} className={`flex flex-col items-center gap-2 flex-1 min-w-[80px] ${!loading ? 'animate-slide-in-bottom' : ''}`} style={{ 
                    opacity: loading ? 1 : 0,
                    animationDelay: loading ? '0s' : `${0.8 + index * 0.1}s`
                  }}>
                    <div
                      className="bg-blue-500 rounded-t-md flex flex-col items-center justify-end p-2 relative group cursor-pointer hover:bg-blue-600 transition-all duration-200 min-w-[60px]"
                      style={{
                        height: `${Math.max(stage.count * 25, 40)}px`
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        <div className="font-medium">{stage.stage}</div>
                        <div>Count: {stage.count}</div>
                        <div>Value: {stage.value}</div>
                        <div>Rate: {stage.percentage}%</div>
                      </div>
                      
                      <div className="text-white text-sm font-bold">{stage.count}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-800">{stage.percentage}%</div>
                      <div className="text-xs text-slate-600 font-medium">{stage.stage}</div>
                      <div className="text-xs text-slate-500">{stage.value}</div>
                    </div>
                  </div>
                ))}
                
                {/* Conversion Summary */}
                <div className={`flex flex-col items-center justify-center bg-white rounded-lg p-4 shadow-sm border border-slate-200 min-w-[120px] ${!loading ? 'animate-slide-in-left delay-900' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">40%</div>
                    <div className="text-xs text-slate-600 font-medium">Overall</div>
                    <div className="text-xs text-slate-500">Conversion Rate</div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>+5% vs last month</span>
                  </div>
                </div>
              </div>
              
              {/* Pipeline insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className={`bg-blue-50 rounded-lg p-4 text-center ${!loading ? 'animate-slide-in-left delay-1000' : ''}`} style={{ opacity: loading ? 1 : 0 }}>
                  <div className="text-lg font-bold text-blue-700">17</div>
                  <div className="text-sm text-blue-600">Total Pipeline</div>
                </div>
                <div className={`bg-emerald-50 rounded-lg p-4 text-center ${!loading ? 'animate-slide-in-left delay-1000' : ''}`} style={{ opacity: loading ? 1 : 0, animationDelay: loading ? '0s' : '1.1s' }}>
                  <div className="text-lg font-bold text-emerald-700">$353,500</div>
                  <div className="text-sm text-emerald-600">Pipeline Value</div>
                </div>
                <div className={`bg-amber-50 rounded-lg p-4 text-center ${!loading ? 'animate-slide-in-left delay-1000' : ''}`} style={{ opacity: loading ? 1 : 0, animationDelay: loading ? '0s' : '1.2s' }}>
                  <div className="text-lg font-bold text-amber-700">28 days</div>
                  <div className="text-sm text-amber-600">Avg. Cycle Time</div>
                </div>
              </div>
            </div>
          </Widget>
        </div>

        {/* Add refresh button to control loading state */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Dashboard"
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

        {/* Bottom spacing to ensure content isn't cut off */}
        <div className="h-8"></div>
      </div>
    </main>
  );
}