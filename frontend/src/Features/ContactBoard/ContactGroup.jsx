import React from "react";
import {
  ChevronDown,
  Plus,
  UserCircle,
  Mail,
  Phone,
  Building,
  DollarSign,
  Activity,
  MoreHorizontal,
  User,
  Flag,
  MessageSquare,
  Star,
  Briefcase,
  Target
} from "lucide-react";

export default function ContactGroup({ onOpen, loading = false, delay = 0 }) {
  // Sample contacts data
  const contacts = [
    {
      id: 1,
      name: "Robert Anderson",
      email: "robert.anderson@amazon.com",
      phone: "+1 (555) 123-4567",
      title: "Chief Executive Officer",
      account: "Amazon Inc.",
      deals: "Amazon Enterprise Deal",
      dealsValue: 150000,
      type: "Customer",
      priority: "High",
      priorityColor: "bg-red-700",
      comments: "Key decision maker for enterprise solutions. Very responsive via email.",
      timeline: [
        { day: 'Mon', status: 'meeting' },
        { day: 'Tue', status: 'email' },
        { day: 'Wed', status: 'inactive' },
        { day: 'Thu', status: 'call' },
        { day: 'Fri', status: 'meeting' },
        { day: 'Sat', status: 'inactive' },
        { day: 'Sun', status: 'inactive' },
        { day: 'Mon', status: 'email' },
        { day: 'Tue', status: 'call' },
        { day: 'Wed', status: 'meeting' },
        { day: 'Thu', status: 'email' },
        { day: 'Fri', status: 'call' },
        { day: 'Sat', status: 'inactive' },
        { day: 'Sun', status: 'inactive' },
        { day: 'Mon', status: 'meeting' }
      ]
    },
    {
      id: 2,
      name: "Sarah Williams",
      email: "sarah.williams@microsoft.com",
      phone: "+1 (555) 987-6543",
      title: "VP of Technology",
      account: "Microsoft Corp.",
      deals: "Cloud Migration Project",
      dealsValue: 250000,
      type: "Prospect",
      priority: "Medium",
      priorityColor: "bg-amber-600",
      comments: "Interested in our cloud solutions. Schedule demo for next week.",
      timeline: [
        { day: 'Mon', status: 'call' },
        { day: 'Tue', status: 'email' },
        { day: 'Wed', status: 'email' },
        { day: 'Thu', status: 'inactive' },
        { day: 'Fri', status: 'meeting' },
        { day: 'Sat', status: 'inactive' },
        { day: 'Sun', status: 'inactive' },
        { day: 'Mon', status: 'call' },
        { day: 'Tue', status: 'meeting' },
        { day: 'Wed', status: 'email' },
        { day: 'Thu', status: 'call' },
        { day: 'Fri', status: 'meeting' },
        { day: 'Sat', status: 'inactive' },
        { day: 'Sun', status: 'inactive' },
        { day: 'Mon', status: 'email' }
      ]
    }
  ];

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-8 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="w-4 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>
          {Array.from({ length: 2 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Priority badge component
  const PriorityBadge = ({ priority, color }) => {
    const getIcon = () => {
      switch (priority.toLowerCase()) {
        case "high":
          return <Flag className="w-3 h-3" />;
        case "medium":
          return <Target className="w-3 h-3" />;
        case "low":
          return <Star className="w-3 h-3" />;
        default:
          return <Flag className="w-3 h-3" />;
      }
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${color}`}>
        {getIcon()}
        <span>{priority}</span>
      </div>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }) => {
    const getColor = () => {
      switch (type.toLowerCase()) {
        case "customer":
          return "bg-green-100 text-green-800";
        case "prospect":
          return "bg-blue-100 text-blue-800";
        case "partner":
          return "bg-purple-100 text-purple-800";
        case "vendor":
          return "bg-orange-100 text-orange-800";
        default:
          return "bg-slate-100 text-slate-800";
      }
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
        <Briefcase className="w-3 h-3" />
        <span>{type}</span>
      </div>
    );
  };

  // Timeline component
  const TimelineBars = ({ timeline }) => (
    <div className="flex gap-1 justify-center items-center">
      {timeline.map((day, index) => {
        let color = 'bg-slate-200';
        if (day.status === 'meeting') color = 'bg-indigo-500';
        else if (day.status === 'call') color = 'bg-green-500';
        else if (day.status === 'email') color = 'bg-blue-500';
        else if (day.status === 'inactive') color = 'bg-slate-300';

        return (
          <div
            key={index}
            className={`h-6 w-2 rounded-sm ${color} transition-all duration-200 hover:scale-110`}
            title={`${day.day}: ${day.status}`}
          />
        );
      })}
    </div>
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format phone number
  const formatPhone = (phone) => {
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 animate-slideInLeft"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-slate-100 rounded transition-colors group">
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Contact Group</h2>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 active:scale-95 shadow-sm"
              title="Add new contact"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
          )}
        </div>
        
        <button className="p-1 hover:bg-slate-100 rounded transition-colors self-start sm:self-center">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Contacts Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {/* Sticky Checkbox Column */}
                  <th className="px-4 py-3 text-left bg-slate-50 sticky left-0 z-20 border-r border-slate-200 shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                  </th>
                  
                  {/* Sticky Contact Name Column */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 sticky left-16 z-20 border-r border-slate-200 min-w-48 shadow-sm">
                    Contact
                  </th>
                  
                  {/* Scrollable Columns */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-48">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-40">Timeline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Deals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Deal Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-36">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-32">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-24">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-48">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Sticky Checkbox */}
                    <td className="px-4 py-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-sm group-hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                    </td>
                    
                    {/* Sticky Contact Name */}
                    <td className="px-4 py-4 bg-white sticky left-16 z-10 border-r border-slate-200 min-w-48 shadow-sm group-hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium text-slate-900">{contact.name}</span>
                      </div>
                    </td>
                    
                    {/* Scrollable Content */}
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-40">{contact.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <TimelineBars timeline={contact.timeline} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{contact.account}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <span className="truncate max-w-32">{contact.deals}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-emerald-600">
                      {formatCurrency(contact.dealsValue)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{formatPhone(contact.phone)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-24">{contact.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <TypeBadge type={contact.type} />
                    </td>
                    <td className="px-4 py-4">
                      <PriorityBadge priority={contact.priority} color={contact.priorityColor} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="truncate max-w-40" title={contact.comments}>
                          {contact.comments}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="xl:hidden p-4 space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCircle className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-medium text-slate-900">{contact.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeBadge type={contact.type} />
                        <PriorityBadge priority={contact.priority} color={contact.priorityColor} />
                      </div>
                      <div className="text-lg font-bold text-emerald-600">{formatCurrency(contact.dealsValue)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(contact.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{contact.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>Account: {contact.account}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Deal: {contact.deals}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{contact.comments}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm font-medium">Activity Timeline:</span>
                    </div>
                    <TimelineBars timeline={contact.timeline} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {contacts.length === 0 && (
        <div className="text-center py-12">
          <UserCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts yet</h3>
          <p className="text-slate-500 mb-4">Get started by adding your first contact</p>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          )}
        </div>
      )}
    </div>
  );
}