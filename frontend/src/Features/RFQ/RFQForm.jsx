import React, { useState, useEffect } from "react";
import { X, FileText, Upload, Loader2, Save, DollarSignIcon } from "lucide-react";
import { createRfq } from "../../api/RfqApi";

export default function InfoAndUpdatesForm({ onClose, initialItem, isEditMode }) {
  const [formData, setFormData] = useState({
    rfq_number: "",
    customer: "",
    valid_date: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (isEditMode && initialItem) {
      setFormData({
        rfq_number: initialItem.rfq_number || "",
        customer: initialItem.customer || "",
        valid_date: initialItem.valid_date || "",
        file: null,
      });
    }
  }, [isEditMode, initialItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - only PDF files
      const validTypes = ['application/pdf'];
      const validExtensions = ['.pdf'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setErrors(prev => ({
          ...prev,
          file: "Please select a valid PDF file (.pdf)"
        }));
        e.target.value = null;
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          file: "File size must be less than 20MB"
        }));
        e.target.value = null;
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file: file
      }));
      
      setFileName(file.name);

      // Clear error
      if (errors.file) {
        setErrors(prev => ({
          ...prev,
          file: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rfq_number.trim()) {
      newErrors.rfq_number = "RFQ Number is required";
    }

    if (!formData.customer.trim()) {
      newErrors.customer = "Customer is required";
    }

    if (!formData.valid_date.trim()) {
      newErrors.valid_date = "Valid Date is required";
    }

    if (!isEditMode && !formData.file) {
      newErrors.file = "PDF file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Get base64 string without the data:application/pdf;base64, prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const file = formData.file;
      const base64PDF = await convertFileToBase64(file);

      const itemData = {
        rfq_number: formData.rfq_number,
        customer: formData.customer,
        valid_date: formData.valid_date,
        data_obj: base64PDF,
        file_name: file.name,
        added_by: "Kavindu Tharaka",
      };

      console.log("Saving RFQ with PDF...");
      const response = await createRfq(itemData);

      console.log(response);
      if (response) {
        window.location.reload();
      }

      onClose(itemData);
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

        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="customer"
            value={formData.customer}
            onChange={handleInputChange}
            placeholder="Enter customer"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              errors.customer
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
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

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            PDF File {!isEditMode && <span className="text-red-500">*</span>}
          </label>
          
          <div className="space-y-2">
            {/* Upload Button */}
            {!formData.file && (
              <div>
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    errors.file
                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <FileText className={`w-6 h-6 mb-1 ${errors.file ? "text-red-400" : "text-slate-400"}`} />
                    <p className={`text-xs ${errors.file ? "text-red-600" : "text-slate-500"}`}>
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF files only (Max 20MB)</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Selected File Display */}
            {fileName && (
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium truncate">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, file: null }));
                    setFileName("");
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {errors.file && (
            <p className="mt-1.5 text-sm text-red-600">{errors.file}</p>
          )}
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
