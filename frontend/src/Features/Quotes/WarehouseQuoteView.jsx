import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Download,
  Printer,
  Trash2,
  Save,
  X,
  Plus,
  FileText,
  Warehouse,
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  fetchWareQuoteById,
  updateWareQuote,
  deleteWareQuote,
  updateWareQuoteStatus
} from "../../api/QuoteApi";
import { generateWarehousePDF, printWarehousePDF } from "./utils/warehousePDFGenerator";

const serviceCategories = [
  "Storage",
  "Handling",
  "Loading/Unloading",
  "Packing",
  "Labeling",
  "Transportation",
  "Overtime Charges",
  "Special Services",
  "Other"
];

export default function WarehouseQuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    currency: "LKR",
    issuedDate: "",
    validityDays: 30,
    validityDate: "",
    lineItems: [],
    notes: []
  });

  useEffect(() => {
    loadQuoteData();
  }, [id]);

  useEffect(() => {
    if (formData.issuedDate && formData.validityDays) {
      const issued = new Date(formData.issuedDate);
      issued.setDate(issued.getDate() + parseInt(formData.validityDays));
      setFormData(prev => ({
        ...prev,
        validityDate: issued.toISOString().split('T')[0]
      }));
    }
  }, [formData.issuedDate, formData.validityDays]);

  const loadQuoteData = async () => {
    try {
      setLoading(true);
      const data = await fetchWareQuoteById(id);
      setQuoteData(data);
      setOriginalData(data);
      
      // Populate form data
      setFormData({
        customerId: data.customerId || "",
        customerName: data.customerName || "",
        currency: data.currency || "LKR",
        issuedDate: data.issuedDate ? new Date(data.issuedDate).toISOString().split('T')[0] : "",
        validityDays: data.validityDays || 30,
        validityDate: data.validityDate ? new Date(data.validityDate).toISOString().split('T')[0] : "",
        lineItems: data.lineItems?.map(item => ({
          id: Date.now() + Math.random(),
          category: item.category || "",
          description: item.description || "",
          remarks: item.remarks || "",
          unitOfMeasurement: item.unitOfMeasurement || "",
          amount: item.amount || ""
        })) || [],
        notes: data.notes || []
      });
    } catch (error) {
      console.error('Error loading warehouse quote:', error);
      alert('Failed to load warehouse quote');
      navigate('/quotes-invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    if (!quoteData) return;
    
    const pdfData = {
      quoteNumber: quoteData.quoteNumber,
      customerName: quoteData.customerName,
      currency: quoteData.currency,
      issuedDate: quoteData.issuedDate,
      validityDays: quoteData.validityDays,
      validityDate: quoteData.validityDate
    };

    printWarehousePDF(pdfData, quoteData.lineItems || [], quoteData.notes || []);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Restore original data
    setFormData({
      customerId: originalData.customerId || "",
      customerName: originalData.customerName || "",
      currency: originalData.currency || "LKR",
      issuedDate: originalData.issuedDate ? new Date(originalData.issuedDate).toISOString().split('T')[0] : "",
      validityDays: originalData.validityDays || 30,
      validityDate: originalData.validityDate ? new Date(originalData.validityDate).toISOString().split('T')[0] : "",
      lineItems: originalData.lineItems?.map(item => ({
        id: Date.now() + Math.random(),
        category: item.category || "",
        description: item.description || "",
        remarks: item.remarks || "",
        unitOfMeasurement: item.unitOfMeasurement || "",
        amount: item.amount || ""
      })) || [],
      notes: originalData.notes || []
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customerName) {
      alert("Please provide customer name");
      return;
    }

    if (formData.lineItems.some(item => !item.description || !item.amount)) {
      alert("Please fill in all line item descriptions and amounts");
      return;
    }

    try {
      setSaving(true);
      await updateWareQuote(id, formData);
      alert('Warehouse quote updated successfully!');
      setEditMode(false);
      loadQuoteData(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating warehouse quote:', error);
      alert('Failed to update warehouse quote');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this warehouse quote?`)) {
      return;
    }

    try {
      await deleteWareQuote(id);
      alert('Warehouse quote deleted successfully!');
      navigate('/quotes-invoice');
    } catch (error) {
      console.error('Error deleting warehouse quote:', error);
      alert('Failed to delete warehouse quote');
    }
  };

  const handleDownloadPDF = () => {
    if (!quoteData) return;
    
    const pdfData = {
      quoteNumber: quoteData.quoteNumber,
      customerName: quoteData.customerName,
      currency: quoteData.currency,
      issuedDate: quoteData.issuedDate,
      validityDays: quoteData.validityDays,
      validityDate: quoteData.validityDate
    };

    generateWarehousePDF(pdfData, quoteData.lineItems || [], quoteData.notes || []);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateWareQuoteStatus(id, newStatus);
      alert(`Quote status updated to ${newStatus}`);
      loadQuoteData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // Line Items handlers
  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      category: "",
      description: "",
      remarks: "",
      unitOfMeasurement: "",
      amount: ""
    };
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const removeLineItem = (id) => {
    if (formData.lineItems.length === 1) {
      alert("At least one line item is required");
      return;
    }
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }));
  };

  const updateLineItem = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Notes handlers
  const addNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: [...prev.notes, ""]
    }));
  };

  const removeNote = (index) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const updateNote = (index, value) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.map((note, i) => i === index ? value : note)
    }));
  };

  const calculateTotal = () => {
    const items = editMode ? formData.lineItems : (quoteData?.lineItems || []);
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      Inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
      Expired: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.Active;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon size={16} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quote Not Found</h2>
            <p className="text-gray-600 mb-6">The warehouse quote you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/quotes-invoice')}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Back to Quotes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/quotes-invoices')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Warehouse className="w-7 h-7 text-amber-600" />
                Warehouse Quote {quoteData.quoteNumber}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {editMode ? 'Edit warehouse quotation details' : 'View warehouse quotation details'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editMode && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                {/* ← ADD PRINT BUTTON HERE */}
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
                {/* <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button> */}
              </>
            )}
            {editMode && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quote Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Quote Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  Customer Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    required
                  />
                ) : (
                  <p className="text-base font-semibold text-gray-800">{quoteData.customerName}</p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  Currency
                </label>
                {editMode ? (
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  >
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                ) : (
                  <p className="text-base font-semibold text-gray-800">{quoteData.currency}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                {editMode ? (
                  <select
                    value={quoteData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Expired">Expired</option>
                  </select>
                ) : (
                  getStatusBadge(quoteData.status)
                )}
              </div>

              {/* Issued Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Issued Date
                </label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                ) : (
                  <p className="text-base text-gray-800">
                    {new Date(quoteData.issuedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Validity Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Validity (Days)
                </label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, validityDays: e.target.value }))}
                    min="1"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                ) : (
                  <p className="text-base text-gray-800">{quoteData.validityDays} days</p>
                )}
              </div>

              {/* Validity Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valid Until
                </label>
                <p className="text-base font-semibold text-amber-600">
                  {new Date(editMode ? formData.validityDate : quoteData.validityDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Service Items
            </h2>
            {editMode && (
              <button
                type="button"
                onClick={addLineItem}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
          <div className="p-6">
            {editMode ? (
              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="p-5 border-2 border-slate-200 rounded-xl hover:border-amber-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        Item #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={formData.lineItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                        >
                          <option value="">Select category</option>
                          {serviceCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Unit of Measurement</label>
                        <input
                          type="text"
                          value={item.unitOfMeasurement}
                          onChange={(e) => updateLineItem(item.id, 'unitOfMeasurement', e.target.value)}
                          placeholder="e.g., Per CBM, Per Hour"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Enter service description..."
                          rows="2"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                        <textarea
                          value={item.remarks}
                          onChange={(e) => updateLineItem(item.id, 'remarks', e.target.value)}
                          placeholder="Additional remarks (optional)"
                          rows="2"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Amount *</label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Remarks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quoteData.lineItems?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.category || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.remarks || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unitOfMeasurement || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right text-sm font-bold text-gray-800">Total Amount:</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-amber-600">
                        {quoteData.currency} {calculateTotal()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {editMode && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">Total Amount:</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formData.currency} {calculateTotal()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Terms & Notes
            </h2>
            {editMode && (
              <button
                type="button"
                onClick={addNote}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            )}
          </div>
          <div className="p-6">
            {editMode ? (
              <div className="space-y-3">
                {formData.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-amber-600 mt-2 font-medium">@</span>
                    <textarea
                      value={note}
                      onChange={(e) => updateNote(index, e.target.value)}
                      placeholder="Enter note..."
                      rows="2"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeNote(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {quoteData.notes?.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 font-medium mt-0.5">@</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action Buttons - Bottom */}
        {editMode && (
          <div className="flex justify-end gap-4 pb-6">
            <button
              onClick={handleCancelEdit}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-lg shadow-amber-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}