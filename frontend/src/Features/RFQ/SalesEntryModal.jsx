import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { fetchSalesEntries, createSalesEntries, deleteSalesEntry } from "../../api/RfqApi";
import { fetchEmployees } from "../../api/PMApi";
import { confirm } from '../../components/ConfirmDialog';

const EMPTY_ROW = { mode: "AIR", type: "Import", booking_no: "", amount: "", sales_person: "" };

function SalesPersonInput({ value, onChange, employees, index }) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = employees.filter((emp) =>
    emp.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setShowDropdown(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search employee..."
        className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto min-w-[220px] w-max right-0">
          {filtered.slice(0, 10).map((name, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(name)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg whitespace-nowrap"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SalesEntryModal({ rfqItem, onClose }) {
  const [existingEntries, setExistingEntries] = useState([]);
  const [newRows, setNewRows] = useState([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [employeeNames, setEmployeeNames] = useState([]);

  useEffect(() => {
    loadEntries();
    loadEmployees();
  }, [rfqItem.sysID]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesEntries(rfqItem.sysID);
      setExistingEntries(data);
    } catch (err) {
      console.error("Error loading sales entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      const names = (data || []).map(
        (emp) => `${emp.fname || ""} ${emp.lname || ""}`.trim()
      ).filter(Boolean);
      setEmployeeNames(names);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  const addRow = () => {
    setNewRows((prev) => [...prev, { ...EMPTY_ROW }]);
  };

  const removeNewRow = (index) => {
    setNewRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewRow = (index, field, value) => {
    setNewRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteExisting = async (entryId) => {
    if (!(await confirm("Delete this sales entry?"))) return;
    try {
      await deleteSalesEntry(entryId);
      setExistingEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      setError("Failed to delete entry.");
    }
  };

  const handleSave = async () => {
    const validRows = newRows.filter(
      (row) => row.booking_no.trim() || row.amount || row.sales_person.trim()
    );

    if (validRows.length === 0) {
      setError("Please fill in at least one entry.");
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
      const entries = validRows.map((row) => ({
        mode: row.mode,
        type: row.type,
        bookingNo: row.booking_no || null,
        amount: parseFloat(row.amount),
        salesPerson: row.sales_person || null,
      }));

      const result = await createSalesEntries(rfqItem.sysID, entries);
      setSuccess(result.message || "Entries saved successfully.");
      setNewRows([{ ...EMPTY_ROW }]);
      await loadEntries();
    } catch (err) {
      setError("Failed to save entries. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalExisting = existingEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        `}</style>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sales Entries</h2>
              <p className="text-blue-100 text-sm">
                RFQ #{rfqItem.rfq_number} - {rfqItem.customer}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Existing Entries */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-slate-500">Loading entries...</span>
            </div>
          ) : existingEntries.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Existing Entries ({existingEntries.length})
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Mode</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Booking No</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">Amount</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Sales Person</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            entry.mode === "AIR"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-cyan-100 text-cyan-700"
                          }`}>
                            {entry.mode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            entry.type === "Import"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{entry.bookingNo || "—"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{entry.salesPerson || "—"}</td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => handleDeleteExisting(entry.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan="4" className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">
                        Total
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(totalExisting)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              No sales entries yet for this RFQ.
            </div>
          )}

          {/* Add New Entries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Add New Entries
              </h3>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            <div className="space-y-3">
              {newRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  {/* Mode */}
                  <div className="col-span-1">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mode</label>
                    )}
                    <select
                      value={row.mode}
                      onChange={(e) => updateNewRow(index, "mode", e.target.value)}
                      className="w-full px-1.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="AIR">AIR</option>
                      <option value="Sea">Sea</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    )}
                    <select
                      value={row.type}
                      onChange={(e) => updateNewRow(index, "type", e.target.value)}
                      className="w-full px-1.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Import">Import</option>
                      <option value="Export">Export</option>
                    </select>
                  </div>

                  {/* Booking No */}
                  <div className="col-span-3">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-slate-500 mb-1">Booking No</label>
                    )}
                    <input
                      type="text"
                      value={row.booking_no}
                      onChange={(e) => updateNewRow(index, "booking_no", e.target.value)}
                      placeholder="Booking No"
                      className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateNewRow(index, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Sales Person - Autocomplete from Employees */}
                  <div className="col-span-3 relative">
                    {index === 0 && (
                      <label className="block text-xs font-medium text-slate-500 mb-1">Sales Person</label>
                    )}
                    <SalesPersonInput
                      value={row.sales_person}
                      onChange={(val) => updateNewRow(index, "sales_person", val)}
                      employees={employeeNames}
                      index={index}
                    />
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-center">
                    {newRows.length > 1 && (
                      <button
                        onClick={() => removeNewRow(index)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors font-medium text-sm"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </div>
  );
}
