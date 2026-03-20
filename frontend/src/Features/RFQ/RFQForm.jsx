import { useState, useEffect, useRef } from "react";
import { X, Loader2, Save, DollarSignIcon, Link2, ChevronDown, FolderOpen, ExternalLink, FileSpreadsheet } from "lucide-react";
import { createRfq, updateRfq } from "../../api/RfqApi";
import { fetchAccountNames } from "../../api/AccountApi";

export default function RFQForm({ onClose, initialItem, isEditMode }) {
  const [formData, setFormData] = useState({
    rfq_number: "",
    customer: "",
    valid_date: "",
    link: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Account name suggestions
  const [accountNames, setAccountNames] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef(null);

  useEffect(() => {
    loadAccountNames();
  }, []);

  useEffect(() => {
    if (isEditMode && initialItem) {
      setFormData({
        rfq_number: initialItem.rfq_number || "",
        customer: initialItem.customer || "",
        valid_date: initialItem.valid_date
          ? new Date(initialItem.valid_date).toISOString().split("T")[0]
          : "",
        link: initialItem.link || "",
      });
      setCustomerQuery(initialItem.customer || "");
    }
  }, [isEditMode, initialItem]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadAccountNames = async () => {
    try {
      const data = await fetchAccountNames();
      setAccountNames(data || []);
    } catch (err) {
      console.error("Error loading account names:", err);
    }
  };

  const filteredAccounts = accountNames.filter((name) =>
    name?.toLowerCase().includes(customerQuery.toLowerCase())
  );

  const handleCustomerInputChange = (value) => {
    setCustomerQuery(value);
    setFormData((prev) => ({ ...prev, customer: value }));
    setShowCustomerDropdown(true);
    if (errors.customer) {
      setErrors((prev) => ({ ...prev, customer: "" }));
    }
  };

  const handleSelectCustomer = (name) => {
    setCustomerQuery(name);
    setFormData((prev) => ({ ...prev, customer: name }));
    setShowCustomerDropdown(false);
    if (errors.customer) {
      setErrors((prev) => ({ ...prev, customer: "" }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.rfq_number.trim()) newErrors.rfq_number = "RFQ Number is required";
    if (!formData.customer.trim()) newErrors.customer = "Customer is required";
    if (!formData.valid_date.trim()) newErrors.valid_date = "Valid Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const itemData = {
        rfq_number: formData.rfq_number,
        customer: formData.customer,
        valid_date: formData.valid_date,
        link: formData.link || null,
        added_by: "",
      };

      if (isEditMode && initialItem) {
        await updateRfq(initialItem.sysID, itemData);
      } else {
        await createRfq(itemData);
      }

      onClose(true);
    } catch (error) {
      console.error("Error saving RFQ:", error);
      setErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <DollarSignIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditMode ? "Edit RFQ" : "Add New RFQ"}
            </h2>
            <p className="text-blue-100 text-sm">
              {isEditMode ? "Update RFQ information" : "Add a new Request for Quotation"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onClose()}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* RFQ Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            RFQ Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="rfq_number"
            value={formData.rfq_number}
            onChange={handleInputChange}
            placeholder="Enter RFQ Number..."
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              errors.rfq_number
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
          {errors.rfq_number && (
            <p className="mt-1.5 text-sm text-red-600">{errors.rfq_number}</p>
          )}
        </div>

        {/* Customer - Autocomplete from Account Names */}
        <div ref={customerRef} className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => handleCustomerInputChange(e.target.value)}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Search account name..."
              className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.customer
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {showCustomerDropdown && filteredAccounts.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredAccounts.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCustomer(name)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {errors.customer && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customer}</p>
          )}
        </div>

        {/* Valid Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Valid Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="valid_date"
            value={formData.valid_date}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              errors.valid_date
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
          {errors.valid_date && (
            <p className="mt-1.5 text-sm text-red-600">{errors.valid_date}</p>
          )}
        </div>

        {/* Link with SharePoint folder suggestion */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            File Link <span className="text-slate-400 text-xs">(optional)</span>
          </label>

          {/* SharePoint folder info box */}
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800 space-y-1.5">
                <p className="font-medium text-sm text-blue-900">Upload your Excel file to the shared folder, then paste the file URL below.</p>
                <a
                  href="https://scanwellcolombo-my.sharepoint.com/personal/it_scanwellcmb_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fit%5Fscanwellcmb%5Fcom%2FDocuments%2FSLC%20Shared&ga=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Open SharePoint Folder
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="Paste your file URL here..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={loading}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? "Update" : "Save"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
