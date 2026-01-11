import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Warehouse, 
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock
} from "lucide-react";
import axios from "axios";
import { createWareQuote } from "../../api/QuoteApi";

export default function WarehouseQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    currency: "LKR",
    issuedDate: new Date().toISOString().split('T')[0],
    validityDays: 30,
    validityDate: "",
    lineItems: [
      {
        id: Date.now(),
        category: "Storage",
        description: "Storage for CBM - PER DAY PER CBM",
        remarks: "",
        unitOfMeasurement: "",
        amount: ""
      }
    ],
    notes: [
      "Rates are based on 2.5Ton Fork-lift. If any heavy equipment's are needed prices will be indicated at that time.",
      "Working Hours will be 9.00 am to 5.00 pm on weekdays",
      "Credit period: 15 days from the date of invoice.",
      "Additional charges may apply for any special handling or value-added services requested.",
      "Government Taxes will be applicable for warehouse rent (VAT & NBT)",
      "Warehouse access and storage to be as per Scanwell Logistics policy",
      "Customer must obtain All Risk Insurance cover for their goods.",
      "Scanwell Logistics reserves the right to terminate or cancel the quotation at any time.",
      "In the event of a price increase, Scanwell Logistics will inform the client in writing in advance.",
      "General Terms and Conditions apply."
    ]
  });

  // Calculate validity date when issued date or validity days change
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

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.customerId,
      customerName: customer.customerName
    }));
    setSearchTerm(customer.customerName);
    setShowCustomerDropdown(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    //Validation
    if (!formData.customerId) {
      alert("Please select a customer");
      return;
    }

    if (formData.lineItems.some(item => !item.description || !item.amount)) {
      alert("Please fill in all line item descriptions and amounts");
      return;
    }

    setLoading(true);

    console.log("this is form data: ", formData);
    try {
      const response = await createWareQuote(formData);

      if (response.ok) {
        alert("Warehouse quote created successfully!");
        // Reset form or navigate away
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving warehouse quote:', error);
      alert("Failed to save warehouse quote");
    } finally {
      setLoading(false);
    }
  };

  const serviceCategories = [
    "Storage",
    "Warehouse Handling",
    "Overtime Charges",
    "Transport Charges",
    "Picking & Packing",
    "Insurance",
    "Other"
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 mb-6 border border-teal-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Warehouse Quotation</h1>
            <p className="text-slate-600 text-sm">Create warehouse storage and handling quote</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Quote Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  Customer *
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  required
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.customerId}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full px-4 py-2.5 text-left hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="font-medium text-slate-800">{customer.customerName}</div>
                        <div className="text-sm text-slate-500">{customer.customerCode}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              {/* Issued Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Issued Date *
                </label>
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              {/* Validity Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Validity (Days)
                </label>
                <input
                  type="number"
                  value={formData.validityDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, validityDays: e.target.value }))}
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Validity Date (Read-only display) */}
            {formData.validityDate && (
              <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-100">
                <p className="text-sm text-teal-700">
                  <span className="font-medium">Valid Until:</span> {new Date(formData.validityDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Service Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="p-5 border-2 border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium">
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
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm"
                      >
                        <option value="">Select category</option>
                        {serviceCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Unit of Measurement */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Unit of Measurement
                      </label>
                      <input
                        type="text"
                        value={item.unitOfMeasurement}
                        onChange={(e) => updateLineItem(item.id, 'unitOfMeasurement', e.target.value)}
                        placeholder="e.g., Per CBM, Per Hour, Per Trip"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Enter service description..."
                        rows="2"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm resize-none"
                        required
                      />
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Remarks
                      </label>
                      <textarea
                        value={item.remarks}
                        onChange={(e) => updateLineItem(item.id, 'remarks', e.target.value)}
                        placeholder="Additional remarks (optional)"
                        rows="2"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm resize-none"
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Terms & Notes
            </h2>
            <button
              type="button"
              onClick={addNote}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {formData.notes.map((note, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-teal-600 mt-2 font-medium">@</span>
                  <textarea
                    value={note}
                    onChange={(e) => updateNote(index, e.target.value)}
                    placeholder="Enter note..."
                    rows="2"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm resize-none"
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
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-lg shadow-teal-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Warehouse Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}
