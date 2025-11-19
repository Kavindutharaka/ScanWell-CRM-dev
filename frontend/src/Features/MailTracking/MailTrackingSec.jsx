import React, { useState, useEffect } from "react";
import {
  Info,
  MessageSquareShare,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Mouse,
  Send,
} from "lucide-react";

export default function MailTrackingSec() {
  const [selectedCategory, setSelectedCategory] = useState("sent");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  // Sample data
  const sentEmails = [
    {
      id: 1,
      launched: "2025-12-15",
      subject: "Winter Sale Announcement",
      sentBy: "Kavindu Tharaka",
      status: "Ongoing",
      recipients: 1250,
      delivered: 1248,
      opened: 856,
      clicked: 342,
    },
    {
      id: 2,
      launched: "2025-12-14",
      subject: "Product Update Newsletter",
      sentBy: "Kavindu Tharaka",
      status: "Completed",
      recipients: 980,
      delivered: 978,
      opened: 654,
      clicked: 198,
    },
    {
      id: 3,
      launched: "2025-12-13",
      subject: "Customer Feedback Survey",
      sentBy: "Kavindu Tharaka",
      status: "Completed",
      recipients: 2100,
      delivered: 2095,
      opened: 1256,
      clicked: 567,
    },
  ];

  const scheduledEmails = [
    {
      id: 1,
      sendTime: "2025-12-20 09:00",
      subject: "Holiday Special Offer",
      sentBy: "Kavindu Tharaka",
      status: "Scheduled",
      recipients: 1500,
    },
    {
      id: 2,
      sendTime: "2025-12-22 14:00",
      subject: "Year-End Clearance",
      sentBy: "Kavindu Tharaka",
      status: "Scheduled",
      recipients: 2200,
    },
  ];

  const getStatusBadge = (status) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";
    switch (status) {
      case "Ongoing":
        return (
          <span className={`${baseClass} bg-blue-100 text-blue-700`}>
            <Clock className="w-3 h-3" />
            Ongoing
          </span>
        );
      case "Completed":
        return (
          <span className={`${baseClass} bg-green-100 text-green-700`}>
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "Scheduled":
        return (
          <span className={`${baseClass} bg-amber-100 text-amber-700`}>
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-full">
      <style jsx>{`
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .skeleton {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 1000px 100%;
        }

        .table-row-hover:hover {
          background-color: rgba(59, 130, 246, 0.02);
        }
      `}</style>

      <main className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto">
        {/* Page Header */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                  Email Leads
                </h1>
                {/* <p className="text-sm text-slate-500 mt-1">Monitor and analyze your email campaigns</p> */}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* Info Button */}
            <button className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group" title="More information">
              <Info className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>

            {/* Share Button */}
            <button className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group" title="Share campaigns">
              <MessageSquareShare className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group active:scale-95"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={`flex items-center gap-8 mb-6 border-b border-slate-200 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <button
            className={`px-1 py-3 font-medium text-sm transition-all duration-200 relative ${
              selectedCategory === "sent"
                ? "text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
            onClick={() => selectCategory("sent")}
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Sent</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                {sentEmails.length}
              </span>
            </div>
            {selectedCategory === "sent" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </button>

          <button
            className={`px-1 py-3 font-medium text-sm transition-all duration-200 relative ${
              selectedCategory === "scheduled"
                ? "text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
            onClick={() => selectCategory("scheduled")}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Scheduled</span>
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                {scheduledEmails.length}
              </span>
            </div>
            {selectedCategory === "scheduled" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </button>
        </div>

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Campaign Button */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95">
              <Plus className="w-5 h-5" />
              <span>New Campaign</span>
            </button>

            {/* Filter Button */}
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm">
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className={`flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          {/* Sent Emails Table */}
          {selectedCategory === "sent" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Launched</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Subject</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Sent by</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Recipients</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Delivered</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Opened</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Clicked</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    // Loading skeletons
                    Array(3)
                      .fill(0)
                      .map((_, idx) => (
                        <tr key={idx} className="table-row-hover">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-20"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-40"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-slate-200 rounded-full skeleton w-24"></div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 bg-slate-200 rounded skeleton w-16 ml-auto"></div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 bg-slate-200 rounded skeleton w-16 ml-auto"></div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 bg-slate-200 rounded skeleton w-16 ml-auto"></div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 bg-slate-200 rounded skeleton w-16 ml-auto"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-slate-200 rounded skeleton w-8"></div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    sentEmails.map((email) => (
                      <tr key={email.id} className="table-row-hover hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm">{email.launched}</td>
                        <td className="px-6 py-4 text-sm font-medium truncate max-w-xs hover:text-blue-600 cursor-pointer">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{email.sentBy}</td>
                        <td className="px-6 py-4">{getStatusBadge(email.status)}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium">{email.recipients}</td>
                        <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                          {email.delivered}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-1 text-blue-600 font-medium">
                            <Eye className="w-4 h-4" />
                            {email.opened} ({Math.round((email.opened / email.delivered) * 100)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-1 text-purple-600 font-medium">
                            <Mouse className="w-4 h-4" />
                            {email.clicked} ({Math.round((email.clicked / email.opened) * 100)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-500 hover:text-slate-700">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Scheduled Emails Table
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Send Time</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Subject</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Sent by</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Recipients</th>
                    <th className="px-6 py-4 font-semibold text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    Array(2)
                      .fill(0)
                      .map((_, idx) => (
                        <tr key={idx} className="table-row-hover">
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-40"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-slate-200 rounded-full skeleton w-24"></div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 bg-slate-200 rounded skeleton w-16 ml-auto"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-slate-200 rounded skeleton w-8"></div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    scheduledEmails.map((email) => (
                      <tr key={email.id} className="table-row-hover hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm">{email.sendTime}</td>
                        <td className="px-6 py-4 text-sm font-medium truncate max-w-xs hover:text-blue-600 cursor-pointer">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{email.sentBy}</td>
                        <td className="px-6 py-4">{getStatusBadge(email.status)}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium">{email.recipients}</td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-500 hover:text-slate-700">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && selectedCategory === "sent" && sentEmails.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Mail className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No sent campaigns yet</p>
              <p className="text-slate-400 text-sm">Start by creating a new campaign</p>
            </div>
          )}
        </div>

        {/* Floating Refresh Button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh"
          >
            <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
          </button>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}