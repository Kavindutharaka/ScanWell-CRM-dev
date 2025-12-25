import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Building,
  Globe,
  MapPin,
  Users,
  BarChart3,
  Clock,
  User,
  Briefcase,
  MoreHorizontal,
  ExternalLink,
  Activity,
  Edit,
  Mail,
  Phone,
  Tag,
} from "lucide-react";

export default function AccountsDetails({ onOpen, onEdit, setSelectedAccount, accounts, error, loading, loadAccounts }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (sysID) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sysID)) {
        newSet.delete(sysID);
      } else {
        newSet.add(sysID);
      }
      return newSet;
    });
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    onOpen();
  };

  // Parse contacts from contactsJson
  const parseContacts = (contactsJson) => {
    try {
      if (!contactsJson) return [];
      const parsed = JSON.parse(contactsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing contacts:', e);
      return [];
    }
  };

  // Loading skeleton for table
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-slate-200 rounded"></div>
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-8 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="w-4 h-4 bg-slate-200 rounded"></div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header row */}
          <div className="grid grid-cols-11 gap-4 p-4 bg-slate-50 border-b border-slate-200">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded"></div>
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-11 gap-4 p-4 border-b border-slate-100">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Industry badge
  const IndustryBadge = ({ industry }) => {
    if (!industry) return null;
    
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        <Briefcase className="w-3 h-3" />
        <span className="truncate max-w-32">{industry}</span>
      </div>
    );
  };

  // Domain link component
  const DomainLink = ({ domain }) => {
    if (!domain) return <span className="text-sm text-slate-400">-</span>;
    
    return (
      <a
        href={domain.startsWith('http') ? domain : `https://${domain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors group"
      >
        <Globe className="w-3 h-3" />
        <span className="text-sm truncate max-w-32">{domain.replace(/^https?:\/\//, '')}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  };

  // Contact display component
  const ContactDisplay = ({ contact, isPrimary = false }) => (
    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-slate-800">{contact.contactName || 'Unnamed'}</span>
          {isPrimary && (
            <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full">
              Primary
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {contact.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-3 h-3 text-orange-500" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.position && (
          <div className="flex items-center gap-2 text-slate-600">
            <Tag className="w-3 h-3 text-orange-500" />
            <span className="truncate">{contact.position}</span>
          </div>
        )}
        {contact.mobile && (
          <div className="flex items-center gap-2 text-slate-600 md:col-span-2">
            <Phone className="w-3 h-3 text-orange-500" />
            <span>{contact.mobile}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Expanded row content
  const ExpandedRowContent = ({ account }) => {
    const contacts = parseContacts(account.contactsJson);
    
    return (
      <tr>
        <td colSpan="10" className="px-4 py-4 bg-slate-50">
          <div className="space-y-4">
            {/* Contact Information Section */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Contact Information ({contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'})
              </h4>
              {contacts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {contacts.map((contact, index) => (
                    <ContactDisplay key={index} contact={contact} isPrimary={index === 0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No contacts added</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Type</label>
                <p className="text-sm text-slate-800 mt-1">{account.accountType || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FMS Code</label>
                <p className="text-sm text-slate-800 mt-1">{account.fmsCode || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Phone</label>
                <p className="text-sm text-slate-800 mt-1">{account.tp || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Person</label>
                <p className="text-sm text-slate-800 mt-1">{account.salesPerson || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <p className="text-sm text-slate-800 mt-1">{account.description || '-'}</p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Action buttons
  const ActionButtons = ({ account }) => {
    const isExpanded = expandedRows.has(account.sysID);
    const contacts = parseContacts(account.contactsJson);
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleRow(account.sysID)}
          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
          title={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => handleEdit(account)}
          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
          title="Edit account"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to load accounts</h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadAccounts}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table View */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Primary Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => {
                  const isExpanded = expandedRows.has(account.sysID);
                  const contacts = parseContacts(account.contactsJson);
                  
                  return (
                    <React.Fragment key={account.sysID}>
                      <tr className={`hover:bg-slate-50 transition-colors group ${isExpanded ? 'bg-slate-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-slate-900">{account.accountName || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <DomainLink domain={account.domain} />
                        </td>
                        <td className="px-4 py-4">
                          <IndustryBadge industry={account.industry} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-32">{account.primaryContact || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {account.primaryEmail ? (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-32">{account.primaryEmail}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-32">{account.location || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {account.accountType && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              {account.accountType}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-orange-600" />
                            <span className="text-sm font-medium text-slate-700">{contacts.length}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ActionButtons account={account} />
                        </td>
                      </tr>
                      {isExpanded && <ExpandedRowContent account={account} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="xl:hidden p-4 space-y-4">
            {accounts.map((account) => {
              const isExpanded = expandedRows.has(account.sysID);
              const contacts = parseContacts(account.contactsJson);
              
              return (
                <div key={account.sysID} className="bg-slate-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-purple-600" />
                          <h3 className="font-medium text-slate-900">{account.accountName}</h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <DomainLink domain={account.domain} />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <IndustryBadge industry={account.industry} />
                          {account.accountType && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              {account.accountType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ActionButtons account={account} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Primary: {account.primaryContact || '-'}</span>
                      </div>
                      {account.primaryEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{account.primaryEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Location: {account.location || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span>Contacts: {contacts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content for mobile */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        All Contacts ({contacts.length})
                      </h4>
                      {contacts.length > 0 ? (
                        <div className="space-y-2">
                          {contacts.map((contact, index) => (
                            <ContactDisplay key={index} contact={contact} isPrimary={index === 0} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No contacts added</p>
                        </div>
                      )}
                      
                      {/* Additional details */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        {account.fmsCode && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500">FMS Code</label>
                            <p className="text-sm text-slate-800">{account.fmsCode}</p>
                          </div>
                        )}
                        {account.tp && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Company Phone</label>
                            <p className="text-sm text-slate-800">{account.tp}</p>
                          </div>
                        )}
                        {account.salesPerson && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Sales Person</label>
                            <p className="text-sm text-slate-800">{account.salesPerson}</p>
                          </div>
                        )}
                        {account.description && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Description</label>
                            <p className="text-sm text-slate-800">{account.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state for when no accounts */}
      {accounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No accounts yet</h3>
          <p className="text-slate-500 mb-4">Get started by adding your first account</p>
          {onOpen && (
            <button 
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}