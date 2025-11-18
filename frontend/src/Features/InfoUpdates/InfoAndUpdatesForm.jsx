import React, { useState, useEffect } from "react";
import { X, Link as LinkIcon, Image, Upload, Loader2, Save } from "lucide-react";

export default function InfoAndUpdatesForm({ onClose, initialItem, isEditMode }) {
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    logoUrl: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && initialItem) {
      setFormData({
        title: initialItem.title || "",
        link: initialItem.link || "",
        description: initialItem.description || "",
        logoUrl: initialItem.logoUrl || "",
      });
      if (initialItem.logoUrl) {
        setLogoPreview(initialItem.logoUrl);
      }
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: "Please select a valid image file"
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: "File size must be less than 5MB"
        }));
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors.logo) {
        setErrors(prev => ({
          ...prev,
          logo: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.link.trim()) {
      newErrors.link = "Link is required";
    } else {
      // Basic URL validation
      try {
        new URL(formData.link);
      } catch {
        newErrors.link = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!isEditMode && !logoFile && !logoPreview) {
      newErrors.logo = "Logo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const itemData = {
        ...formData,
        id: isEditMode ? initialItem.id : Date.now(),
        logoUrl: logoPreview || formData.logoUrl,
        addedDate: isEditMode ? initialItem.addedDate : new Date().toISOString().split('T')[0],
        addedBy: "Kavindu Tharaka", // This should come from auth context
      };

      console.log("Saving item:", itemData);
      
      // Call onClose with the saved data
      onClose(itemData);
    } catch (error) {
      console.error("Error saving item:", error);
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
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditMode ? "Edit Resource" : "Add New Resource"}
            </h2>
            <p className="text-blue-100 text-sm">
              {isEditMode ? "Update resource information" : "Add a new logistics resource link"}
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
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Sri Lanka Ports Authority"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              errors.title
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
          {errors.title && (
            <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Link URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                errors.link
                  ? "border-red-300 focus:ring-red-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
          </div>
          {errors.link && (
            <p className="mt-1.5 text-sm text-red-600">{errors.link}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of this resource..."
            rows="3"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
              errors.description
                ? "border-red-300 focus:ring-red-500"
                : "border-slate-300 focus:ring-blue-500"
            }`}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Logo {!isEditMode && <span className="text-red-500">*</span>}
          </label>
          
          <div className="flex gap-4">
            {/* Preview */}
            {logoPreview && (
              <div className="shrink-0">
                <div className="h-24 w-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex-1">
              <label
                htmlFor="logo-upload"
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                  errors.logo
                    ? "border-red-300 bg-red-50 hover:bg-red-100"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <Upload className={`w-6 h-6 mb-1 ${errors.logo ? "text-red-400" : "text-slate-400"}`} />
                  <p className={`text-xs ${errors.logo ? "text-red-600" : "text-slate-500"}`}>
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          {errors.logo && (
            <p className="mt-1.5 text-sm text-red-600">{errors.logo}</p>
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
