import React, { useState, useEffect } from "react";
import {
  MessageCircleHeart,
  MessageCircle,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Users,
  Share2,
  UserCircle,
  Mail,
  Phone,
  Building,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import { fetchContacts, deleteContact } from "../../api/ContactAPI";

export default function ContactBoardSec({ modalOpen, setSelectedData, loading, loadContacts, error, contacts }) {

  const [searchQuery, setSearchQuery] = useState("");
  // const [contacts, setContacts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  

  // Handle refresh
  const handleRefresh = () => {
    loadContacts();
  };

  const handleEdit = (contact)=>{
    console.log("this is selected data to edit: ",contact);
    setSelectedData(contact);
    modalOpen();
  };

  // Handle delete contact
  // const handleDelete = async (id) => {
  //   if (deleteConfirm !== id) {
  //     setDeleteConfirm(id);
  //     setTimeout(() => setDeleteConfirm(null), 3000);
  //     return;
  //   }

  //   try {
  //     await deleteContact(id);
  //     setContacts(contacts.filter(c => c.id !== id));
  //     setDeleteConfirm(null);
  //   } catch (err) {
  //     console.error('Error deleting contact:', err);
  //     alert('Failed to delete contact. Please try again.');
  //   }
  // };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.accounts?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get priority color
  const getPriorityColor = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-700 border-gray-200';
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    if (!type) return 'bg-gray-100 text-gray-700 border-gray-200';
    switch (type.toLowerCase()) {
      case 'customer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'prospect':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'partner':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'lead':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'vendor':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'consultant':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-full">
      {/* Add custom CSS for animations */}
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
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="p-4 md:p-6 lg:p-8 max-w-[102rem] mx-auto pb-8">
        {/* Page Header */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
                Contacts Board
              </h1>
              <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-sm font-medium">
                {contacts.length}
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* Feedback Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Provide feedback"
            >
              <MessageCircleHeart className="w-4 h-4 text-pink-500 group-hover:text-pink-600" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Messages */}
            <button 
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </button>

            {/* Profile */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold">K</span>
            </div>

            {/* Invite/Share Actions */}
            <div className="flex items-center gap-1">
              <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Invite team members"
              >
                <Users className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
                <span className="hidden sm:inline">Invite</span>
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-medium">1</span>
              </button>
              <button 
                className="p-2 bg-white border border-slate-300 border-l-0 rounded-r-lg hover:bg-slate-50 transition-all duration-200 shadow-sm group"
                title="Share contacts"
              >
                <Share2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={loadContacts}
                className="text-red-600 hover:text-red-700 text-sm font-medium mt-1 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className={`flex flex-col sm:flex-row gap-4 py-4 border-t border-slate-200 mb-6 ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Contact Button */}
            <button 
              onClick={modalOpen}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              title="Add a new contact"
            >
              <Plus className="w-5 h-5" />
              <span>New Contact</span>
            </button>

            {/* Filter Button */}
            <button 
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm"
              title="Filter contacts"
            >
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
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!loading ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-600 font-medium">Loading contacts...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Company & Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Deal Value
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredContacts.map((contact, index) => (
                    <tr 
                      key={contact.id} 
                      className="hover:bg-slate-50 transition-colors"
                      style={{ 
                        animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` 
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(contact.contactName)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{contact.contactName || 'N/A'}</p>
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="w-3 h-3" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="w-3 h-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-800">{contact.accounts || 'N/A'}</p>
                            {contact.title && (
                              <p className="text-sm text-slate-600">{contact.title}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact.type ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(contact.type)}`}>
                            {contact.type}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contact.priority ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(contact.priority)}`}>
                            {contact.priority}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contact.dealsValue ? (
                          <span className="font-semibold text-slate-800">
                            ${parseFloat(contact.dealsValue).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                            title="Edit contact"
                            onClick={()=>handleEdit(contact)}
                          >
                            <Edit className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                          </button>
                          {/* <button
                            onClick={() => handleDelete(contact.id)}
                            className={`p-2 rounded-lg transition-colors group ${
                              deleteConfirm === contact.id 
                                ? 'bg-red-100' 
                                : 'hover:bg-red-50'
                            }`}
                            title={deleteConfirm === contact.id ? "Click again to confirm" : "Delete contact"}
                          >
                            <Trash2 className={`w-4 h-4 ${
                              deleteConfirm === contact.id 
                                ? 'text-red-600' 
                                : 'text-slate-400 group-hover:text-red-600'
                            }`} />
                          </button> */}
                          {/* <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredContacts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No contacts found</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {searchQuery 
                      ? 'Try adjusting your search criteria' 
                      : 'Click "New Contact" to add your first contact'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating refresh button */}
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Refresh Contacts"
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

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}