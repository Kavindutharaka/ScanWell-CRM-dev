import React, { useState } from "react";
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  ChevronDown,
  Plus,
  Filter,
  Users,
  Download,
  MoreHorizontal,
  Star,
  Maximize2,
} from "lucide-react";

const SalesDashboard = () => {
  const [activeView, setActiveView] = useState("View");

  // Sample data
  const dealStatusData = [
    { status: "Won", percentage: 50.0, color: "bg-green-500" },
    { status: "Discovery", percentage: 25.0, color: "bg-blue-400" },
    { status: "Working on it", percentage: 12.5, color: "bg-orange-400" },
    { status: "Proposal", percentage: 12.5, color: "bg-blue-300" },
  ];

  const pipelineData = [
    { stage: "New", count: 5, percentage: 100 },
    { stage: "Discovery", count: 5, percentage: 100 },
    { stage: "Proposal", count: 3, percentage: 60 },
    { stage: "Negotiation", count: 2, percentage: 66.7 },
    { stage: "Won", count: 2, percentage: 100 },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">m</span>
            </div>
            <span className="font-semibold text-gray-800">CRM</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-500 cursor-pointer" />
          <Bell className="w-5 h-5 text-gray-500 cursor-pointer" />
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">1</span>
          </div>
          <Settings className="w-5 h-5 text-gray-500 cursor-pointer" />
          <HelpCircle className="w-5 h-5 text-gray-500 cursor-pointer" />
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">KT</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                <span className="text-sm">Mass email tracking</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                <span className="text-sm">Sequences</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                <span className="text-sm">Quotes and Invoices</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                <span className="text-sm">Virtual events</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                <span className="text-sm">More</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                <span>Favorites</span>
                <Star className="w-3 h-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Workspaces</span>
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-1">
                <div className="bg-teal-500 text-white px-3 py-2 rounded flex items-center justify-between">
                  <span className="text-sm font-medium">CRM</span>
                  <ChevronDown className="w-4 h-4" />
                </div>

                <div className="ml-4 space-y-1 text-sm">
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Demo
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Deals
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Leads
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Accounts
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Client Projects
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Products & Services
                  </div>
                  <div className="text-gray-600 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer">
                    Activities
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer">
                    Sales Dashboard
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                  Sales Dashboard
                </h1>
                <Star className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-200 rounded">
                  <button
                    className={`px-4 py-2 text-sm rounded ${
                      activeView === "View" ? "bg-white shadow" : ""
                    }`}
                    onClick={() => setActiveView("View")}
                  >
                    View
                  </button>
                  <button
                    className={`px-4 py-2 text-sm rounded ${
                      activeView === "Edit" ? "bg-white shadow" : ""
                    }`}
                    onClick={() => setActiveView("Edit")}
                  >
                    Edit
                  </button>
                </div>
                <button className="flex items-center space-x-1 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button className="flex items-center space-x-1 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                  <Users className="w-4 h-4" />
                  <span>Invite</span>
                </button>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
              </div>
            </div>

            {/* Dashboard Controls */}
            <div className="flex items-center space-x-4 mb-6">              
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type to filter"
                  className="max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                <Users className="w-4 h-4" />
                <span>People</span>
              </button>
              <button className="flex items-center space-x-2 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <Settings className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>

            {/* Dashboard Widgets - Row by Row Layout */}
            <div className="space-y-6">
              {/* First Row - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Annual Target Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Annual Target
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Gauge Chart Representation */}
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="w-48 h-24 relative">
                      <div className="absolute inset-0 border-8 border-gray-200 rounded-t-full"></div>
                      <div className="absolute inset-0 border-8 border-l-green-400 border-b-green-400 border-r-blue-500 border-t-blue-500 rounded-t-full"></div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-black origin-bottom rotate-12"></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-sm text-gray-500">ACTUAL</div>
                      <div className="text-2xl font-bold text-gray-800">
                        85K
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">TARGET</div>
                      <div className="text-2xl font-bold text-gray-800">
                        100K
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Target Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Monthly Target
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-4 flex items-end justify-center">
                    <div className="text-white text-center pb-4">
                      <div className="text-xs">Progress visualization</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-sm text-gray-500">
                        MONTHLY ACTUAL
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        30K
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        THIS MONTH'S TARGET
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        10K
                      </div>
                    </div>
                  </div>
                </div>

                {/* Average Deal Value Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Average Deal Value
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      $42,500
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deal Status Distribution Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Deal status distribution
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Pie Chart Representation */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-32 h-32 rounded-full relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-green-500"
                        style={{
                          clipPath:
                            "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)",
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-blue-400"
                        style={{
                          clipPath:
                            "polygon(50% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%)",
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-orange-400"
                        style={{
                          clipPath: "polygon(50% 50%, 0% 50%, 0% 0%, 25% 0%)",
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-blue-300"
                        style={{ clipPath: "polygon(50% 50%, 25% 0%, 50% 0%)" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {dealStatusData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${item.color}`}
                        ></div>
                        <span className="text-gray-600">
                          {item.status}: {item.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actual Revenue by Month Widget */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Actual Revenue by Month (Deals won)
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-end justify-center space-x-4 h-32">
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-500 w-12 h-20 rounded-t flex items-end justify-center pb-2">
                        <span className="text-white text-xs">$30,000</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">
                        September 2025
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-500 w-12 h-24 rounded-t flex items-end justify-center pb-2">
                        <span className="text-white text-xs">$55,000</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">
                        October 2025
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row - Active deals widget alone */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Active deals - Forecasted Rev...
                    </h3>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                      $133,000
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline Conversion Widget - Full Width */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    Pipeline conversion
                  </h3>
                  <div className="flex items-center space-x-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    <Maximize2 className="w-4 h-4 text-gray-400" />
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-end justify-between h-48 bg-gray-50 rounded p-4">
                  {pipelineData.map((stage, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div
                        className="bg-blue-500 rounded"
                        style={{
                          width: "60px",
                          height: `${stage.count * 20}px`,
                        }}
                      >
                        <div className="text-white text-xs p-1 text-center">
                          {stage.count}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        {stage.percentage}%
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {stage.stage}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        40%
                      </div>
                      <div className="text-xs text-gray-600">
                        Conversion to Won
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
