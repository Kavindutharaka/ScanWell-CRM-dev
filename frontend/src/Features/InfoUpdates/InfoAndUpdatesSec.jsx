import React, { useState, useEffect } from "react";
import {
  Info,
  RotateCcw,
  Search,
  Plus,
  ExternalLink,
  Image,
  Edit,
  Trash2,
  MoreHorizontal,
  Link as LinkIcon,
} from "lucide-react";

export default function InfoAndUpdatesSec({ modalOpen, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoItems, setInfoItems] = useState([]);

  useEffect(() => {
    fetchInfoItems();
  }, []);

  const fetchInfoItems = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Sample data
      const sampleData = [
        {
          id: 1,
          title: "Sri Lanka Ports Authority",
          link: "https://www.slpa.lk/",
          logoUrl: "https://www.slpa.lk/images/logo.png",
          description: "Live vessel tracking and port information",
          addedDate: "2025-01-15",
          addedBy: "Kavindu Tharaka",
        },
        {
          id: 2,
          title: "Marine Traffic",
          link: "https://www.marinetraffic.com/",
          logoUrl: "https://www.marinetraffic.com/images/logo.png",
          description: "Global ship tracking and maritime intelligence",
          addedDate: "2025-01-14",
          addedBy: "Kavindu Tharaka",
        },
        {
          id: 3,
          title: "Flight Radar 24",
          link: "https://www.flightradar24.com/",
          logoUrl: "https://www.flightradar24.com/images/logo.png",
          description: "Real-time flight tracking worldwide",
          addedDate: "2025-01-13",
          addedBy: "Kavindu Tharaka",
        },
        {
          id: 4,
          title: "JCT Terminals",
          link: "https://www.jctsl.lk/",
          logoUrl: "https://www.jctsl.lk/images/logo.png",
          description: "Container terminal operations and schedules",
          addedDate: "2025-01-12",
          addedBy: "Kavindu Tharaka",
        },
      ];
      setInfoItems(sampleData);
      setLoading(false);
    }, 1500);
  };

  const handleRefresh = () => {
    fetchInfoItems();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setInfoItems(infoItems.filter(item => item.id !== id));
    }
  };

  const filteredItems = infoItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        .logo-img {
          object-fit: contain;
          max-height: 100%;
          max-width: 100%;
        }
      `}</style>

      <main className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto">
        {/* Page Header */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                  Info & Updates
                </h1>
                <p className="text-sm text-slate-500 mt-1">Quick access to important logistics resources</p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <button
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Link</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className={`flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-700 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Logo</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Title</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Description</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Link</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Added Date</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Added By</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  // Loading skeletons
                  Array(4)
                    .fill(0)
                    .map((_, idx) => (
                      <tr key={idx} className="table-row-hover">
                        <td className="px-6 py-4">
                          <div className="h-12 w-12 bg-slate-200 rounded skeleton"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-40"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-64"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded skeleton w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-slate-200 rounded skeleton w-20"></div>
                        </td>
                      </tr>
                    ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="table-row-hover hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                          {item.logoUrl ? (
                            <img 
                              src={item.logoUrl} 
                              alt={item.title}
                              className="logo-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="text-slate-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                              }}
                            />
                          ) : (
                            <Image className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                        {item.description}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.addedDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.addedBy}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors duration-150 text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors duration-150 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <LinkIcon className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No resources found</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {searchQuery ? "Try adjusting your search" : "Start by adding a new link"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
