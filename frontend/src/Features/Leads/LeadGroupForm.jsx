import { X, Users, Tag, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { createLeadGroup, fetchLeadGroups } from "../../api/LeadApi";

export default function LeadGroupForm({ onClose }) {
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingGroups, setExistingGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState(null);

  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true);
      setGroupError(null);
      const data = await fetchLeadGroups();
      setExistingGroups(data);
    } catch (err) {
      setGroupError("Failed to load lead groups. Please try again.");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.groupName.trim()) {
      newErrors.groupName = 'Group name is required';
    }
    if (existingGroups.some(group => group.name.toLowerCase() === formData.groupName.trim().toLowerCase())) {
      newErrors.groupName = 'Group name already exists';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const groupData = {
        name: formData.groupName,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      await createLeadGroup(groupData);
      alert('Lead group created successfully!');
      onClose();
    } catch (error) {
      alert('Failed to create lead group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Lead Group</h1>
            <p className="text-sm text-slate-600">Organize leads into groups for better management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/70 rounded-lg transition-colors group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Users className="w-4 h-4 text-orange-600" />
              Group Name *
            </label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                errors.groupName ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              placeholder="Enter group name"
            />
            {errors.groupName && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="w-4 h-4">⚠️</span>
                {errors.groupName}
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <FileText className="w-4 h-4 text-orange-600" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              placeholder="Describe the purpose of this group"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Tag className="w-4 h-4 text-orange-600" />
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-slate-400"
              placeholder="e.g., marketing, high-priority, new"
            />
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
        {isLoadingGroups ? (
          <div className="mt-6 text-center text-sm text-slate-500">Loading existing groups...</div>
        ) : groupError ? (
          <div className="mt-6 text-center text-sm text-red-500">{groupError}</div>
        ) : (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Existing Groups</h3>
            {existingGroups.length === 0 ? (
              <p className="text-sm text-slate-500">No groups found. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {existingGroups.map(group => (
                  <div key={group.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-600">{group.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}