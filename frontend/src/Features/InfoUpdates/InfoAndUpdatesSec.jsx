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

import ResourceApi from '../../api/ResourceApi'; // Adjust the import path as necessary

export default function InfoAndUpdatesSec({ modalOpen, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoItems, setInfoItems] = useState([]);

  useEffect(() => {
    fetchInfoItems();
  }, []);

  const fetchInfoItems = async () => {
    setLoading(true);
    try {
      const response = await ResourceApi.fetchResources();
      const items = response.map((item) => ({
        id: item.sysID,
        title: item.title,
        link: item.link,
        description: item.description,
        logoUrl: item.logoUrl,
        addedDate: item.addedDate,
        addedBy: item.addedBy,
      }));
      setInfoItems(items);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInfoItems();
  };

  const handleDelete = async (id) => {
    console.log("this is the id pass to the delete: ", id);
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await ResourceApi.deleteResource(id);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
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
                  Useful Links
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

        {/* Table Container - Desktop */}
        <div className={`hidden md:flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
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

        {/* Mobile Card View */}
        <div className={`md:hidden space-y-4 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          {loading ? (
            // Loading skeletons for mobile
            Array(4)
              .fill(0)
              .map((_, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="h-16 w-16 bg-slate-200 rounded-lg skeleton flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 rounded skeleton w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded skeleton w-full"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded skeleton w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded skeleton w-2/3"></div>
                  </div>
                </div>
              ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Card Header with Logo and Title */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                      {item.logoUrl ? (
                        <img 
                          src={item.logoUrl} 
                          alt={item.title}
                          className="logo-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="text-slate-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      ) : (
                        <Image className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body with Details */}
                <div className="p-4 space-y-3">
                  {/* Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Link</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                  </div>

                  {/* Added Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Added Date</span>
                      <span className="text-sm text-slate-700 font-medium">{item.addedDate}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Added By</span>
                      <span className="text-sm text-slate-700 font-medium">{item.addedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Actions */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <LinkIcon className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No resources found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {searchQuery ? "Try adjusting your search" : "Start by adding a new link"}
                </p>
              </div>
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