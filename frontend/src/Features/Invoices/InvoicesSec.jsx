import { useState, useEffect, useContext } from 'react';
import {
  Search, Award, Plane, Ship, Layers, MapPin, Calendar, User,
  ChevronDown, ChevronUp, Plus, Trash2, Loader2, CheckCircle,
  AlertCircle, X, Lock, DollarSign, FileText
} from 'lucide-react';
import { fetchWonQuotes, fetchInvoiceEntries, createInvoiceEntries, deleteInvoiceEntry, completeInvoice } from '../../api/InvoiceApi';
import { AuthContext } from '../../context/AuthContext';

const EMPTY_ROW = { entryDate: '', invoiceNumber: '', amount: '' };

export default function InvoicesSec() {
  const { permission } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin;

  const [wonQuotes, setWonQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [invoiceEntries, setInvoiceEntries] = useState({});
  const [newRows, setNewRows] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState({});

  useEffect(() => {
    loadWonQuotes();
  }, []);

  const loadWonQuotes = async () => {
    setLoading(true);
    try {
      const data = await fetchWonQuotes();
      const quotes = Array.isArray(data) ? data : [];
      setWonQuotes(quotes);

      // Pre-load invoice entries for all won quotes so totals show immediately
      const entriesMap = {};
      await Promise.all(
        quotes.map(async (q) => {
          try {
            const entries = await fetchInvoiceEntries(q.quoteId);
            entriesMap[q.quoteId] = entries || [];
          } catch {
            entriesMap[q.quoteId] = [];
          }
        })
      );
      setInvoiceEntries(entriesMap);
    } catch (err) {
      console.error('Error loading won quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (quoteId) => {
    setLoadingEntries(prev => ({ ...prev, [quoteId]: true }));
    try {
      const data = await fetchInvoiceEntries(quoteId);
      setInvoiceEntries(prev => ({ ...prev, [quoteId]: data || [] }));
    } catch (err) {
      console.error('Error loading entries:', err);
    } finally {
      setLoadingEntries(prev => ({ ...prev, [quoteId]: false }));
    }
  };

  const toggleExpand = async (quoteId) => {
    if (expandedQuote === quoteId) {
      setExpandedQuote(null);
    } else {
      setExpandedQuote(quoteId);
      if (!invoiceEntries[quoteId]) {
        await loadEntries(quoteId);
      }
      if (!newRows[quoteId]) {
        setNewRows(prev => ({ ...prev, [quoteId]: [{ ...EMPTY_ROW }] }));
      }
    }
  };

  const addRow = (quoteId) => {
    setNewRows(prev => ({
      ...prev,
      [quoteId]: [...(prev[quoteId] || []), { ...EMPTY_ROW }]
    }));
  };

  const removeNewRow = (quoteId, index) => {
    setNewRows(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).filter((_, i) => i !== index)
    }));
  };

  const updateNewRow = (quoteId, index, field, value) => {
    setNewRows(prev => ({
      ...prev,
      [quoteId]: (prev[quoteId] || []).map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const handleSave = async (quoteId) => {
    const rows = newRows[quoteId] || [];
    const validRows = rows.filter(r => r.invoiceNumber.trim() || r.amount || r.entryDate);

    if (validRows.length === 0) {
      setError('Please fill in at least one entry.');
      return;
    }

    for (let i = 0; i < validRows.length; i++) {
      const amt = parseFloat(validRows[i].amount);
      if (isNaN(amt) || amt <= 0) {
        setError(`Row ${i + 1}: Amount must be a valid positive number.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const entries = validRows.map(row => ({
        entryDate: row.entryDate || null,
        invoiceNumber: row.invoiceNumber || null,
        amount: parseFloat(row.amount)
      }));

      await createInvoiceEntries(quoteId, entries);
      setSuccess('Entries saved successfully.');
      setNewRows(prev => ({ ...prev, [quoteId]: [{ ...EMPTY_ROW }] }));
      await loadEntries(quoteId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save entries.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (quoteId, entryId) => {
    if (!window.confirm('Delete this invoice entry?')) return;
    try {
      await deleteInvoiceEntry(entryId);
      setInvoiceEntries(prev => ({
        ...prev,
        [quoteId]: (prev[quoteId] || []).filter(e => e.id !== entryId)
      }));
    } catch (err) {
      setError('Failed to delete entry.');
    }
  };

  const handleComplete = async (quoteId) => {
    if (!window.confirm('Complete this invoice? Once completed, no more entries can be added or modified.')) return;
    try {
      await completeInvoice(quoteId);
      setWonQuotes(prev => prev.map(q =>
        q.quoteId === quoteId ? { ...q, invoiceCompleted: true } : q
      ));
      setSuccess('Invoice completed successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to complete invoice.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'air': return <Plane size={14} className="text-sky-600" />;
      case 'sea': return <Ship size={14} className="text-blue-600" />;
      case 'multimodal': return <Layers size={14} className="text-purple-600" />;
      default: return <FileText size={14} className="text-slate-500" />;
    }
  };

  const filteredQuotes = wonQuotes.filter(q => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (q.quoteNumber || '').toLowerCase().includes(term) ||
      (q.customerName || '').toLowerCase().includes(term) ||
      (q.salesPerson || '').toLowerCase().includes(term) ||
      (q.category || '').toLowerCase().includes(term) ||
      (q.type || '').toLowerCase().includes(term)
    );
  });

  const getQuoteTotal = (quoteId) => {
    const entries = invoiceEntries[quoteId] || [];
    return entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-12 bg-slate-200 rounded" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" size={24} />
            Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage invoices for won quotations ({filteredQuotes.length} quotes)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by quote number, customer, route..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-green-400" />
          </button>
        </div>
      )}

      {/* Won Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Award size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No won quotes found</p>
          <p className="text-sm mt-1">Won quotations will appear here for invoicing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map(quote => {
            const isExpanded = expandedQuote === quote.quoteId;
            const isCompleted = quote.invoiceCompleted;
            const entries = invoiceEntries[quote.quoteId] || [];
            const total = getQuoteTotal(quote.quoteId);

            return (
              <div
                key={quote.quoteId}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Quote Header Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => toggleExpand(quote.quoteId)}
                >
                  {/* Status Indicator */}
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                  {/* Category Icon */}
                  <div className="flex-shrink-0">
                    {getCategoryIcon(quote.category)}
                  </div>

                  {/* Quote Info */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-1">
                    <div className="truncate">
                      <span className="text-xs text-slate-500">Quote</span>
                      <p className="text-sm font-semibold text-slate-800 truncate">{quote.quoteNumber || '—'}</p>
                    </div>
                    <div className="truncate">
                      <span className="text-xs text-slate-500">Customer</span>
                      <p className="text-sm text-slate-700 truncate">{quote.customerName || '—'}</p>
                    </div>
                    <div className="truncate hidden md:block">
                      <span className="text-xs text-slate-500">Sales Person</span>
                      <p className="text-sm text-slate-700 truncate">{quote.salesPerson || '—'}</p>
                    </div>
                    <div className="truncate hidden md:block">
                      <span className="text-xs text-slate-500">Category / Type</span>
                      <p className="text-sm text-slate-700 truncate capitalize">{quote.category || '—'} / {quote.type || '—'}</p>
                    </div>
                    <div className="truncate hidden lg:block">
                      <span className="text-xs text-slate-500">Won Date</span>
                      <p className="text-sm text-slate-700">{quote.outcomeDate ? new Date(quote.outcomeDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                    </div>
                    <div className="truncate hidden lg:block">
                      <span className="text-xs text-slate-500">Invoice Total</span>
                      <p className="text-sm font-semibold text-emerald-700">
                        {total > 0 ? formatCurrency(total) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge + Expand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Lock size={10} />
                        Completed
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/50">
                    {/* Mobile info (shown only on small screens) */}
                    <div className="grid grid-cols-2 gap-3 md:hidden">
                      <div>
                        <span className="text-xs text-slate-500">Sales Person</span>
                        <p className="text-sm text-slate-700">{quote.salesPerson || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Category / Type</span>
                        <p className="text-sm text-slate-700 capitalize">{quote.category || '—'} / {quote.type || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Won Date</span>
                        <p className="text-sm text-slate-700">{quote.outcomeDate ? new Date(quote.outcomeDate).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Category / Type</span>
                        <p className="text-sm text-slate-700">{quote.category} / {quote.type}</p>
                      </div>
                    </div>

                    {/* Existing Entries */}
                    {loadingEntries[quote.quoteId] ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span className="ml-2 text-sm text-slate-500">Loading entries...</span>
                      </div>
                    ) : entries.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          Invoice Entries ({entries.length})
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Invoice Number</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Amount (LKR)</th>
                                {!isCompleted && (
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase w-12"></th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                                    {entry.entryDate
                                      ? new Date(entry.entryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700 font-medium">{entry.invoiceNumber || '—'}</td>
                                  <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(entry.amount)}</td>
                                  {!isCompleted && (
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        onClick={() => handleDeleteEntry(quote.quoteId, entry.id)}
                                        className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                              <tr>
                                <td colSpan="2" className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Total</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-700 text-base">{formatCurrency(total)}</td>
                                {!isCompleted && <td></td>}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        No invoice entries yet. Add entries below.
                      </div>
                    )}

                    {/* Add New Entries (only if not completed) */}
                    {!isCompleted && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-700">Add New Entries</h4>
                          <button
                            onClick={() => addRow(quote.quoteId)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Row
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(newRows[quote.quoteId] || []).map((row, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 items-end p-3 bg-white rounded-lg border border-slate-200"
                            >
                              {/* Date */}
                              <div className="col-span-4 sm:col-span-3">
                                {index === 0 && (
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                                )}
                                <input
                                  type="date"
                                  value={row.entryDate}
                                  onChange={(e) => updateNewRow(quote.quoteId, index, 'entryDate', e.target.value)}
                                  className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Invoice Number */}
                              <div className="col-span-4 sm:col-span-5">
                                {index === 0 && (
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Number</label>
                                )}
                                <input
                                  type="text"
                                  value={row.invoiceNumber}
                                  onChange={(e) => updateNewRow(quote.quoteId, index, 'invoiceNumber', e.target.value)}
                                  placeholder="INV-001"
                                  className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Amount */}
                              <div className="col-span-3 sm:col-span-3">
                                {index === 0 && (
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                                )}
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.amount}
                                  onChange={(e) => updateNewRow(quote.quoteId, index, 'amount', e.target.value)}
                                  placeholder="0.00"
                                  className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Remove */}
                              <div className="col-span-1 flex justify-center">
                                {(newRows[quote.quoteId] || []).length > 1 && (
                                  <button
                                    onClick={() => removeNewRow(quote.quoteId, index)}
                                    className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 mt-3">
                          <button
                            onClick={() => handleSave(quote.quoteId)}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Save Entries
                              </>
                            )}
                          </button>

                          {isAdmin && entries.length > 0 && (
                            <button
                              onClick={() => handleComplete(quote.quoteId)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <Lock className="w-4 h-4" />
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
