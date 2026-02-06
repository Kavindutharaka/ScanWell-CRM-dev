// components/TermsConditionsSection.jsx
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ClipboardPaste } from 'lucide-react';
import { termsConditionsSuggestions } from '../../../data/quoteData';

export default function TermsConditionsSection({ formData, setFormData, disabled = false }) {
  const [newTerm, setNewTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const addTerm = (term) => {
    if (disabled || !term.trim()) return;
    setFormData(prev => ({
      ...prev,
      termsConditions: [...prev.termsConditions, term.trim()]
    }));
    setNewTerm('');
  };

  const addBulkTerms = () => {
    if (disabled || !bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map(line => line.replace(/^\d+[\.\)\-\:]\s*/, '').trim())
      .filter(line => line.length > 0);
    if (lines.length === 0) return;
    setFormData(prev => ({
      ...prev,
      termsConditions: [...prev.termsConditions, ...lines]
    }));
    setBulkText('');
    setShowBulkPaste(false);
  };

  const removeTerm = (index) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      termsConditions: prev.termsConditions.filter((_, i) => i !== index)
    }));
  };

  const startEdit = (index) => {
    if (disabled) return;
    setEditingIndex(index);
    setEditValue(formData.termsConditions[index]);
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      const updated = [...formData.termsConditions];
      updated[editingIndex] = editValue.trim();
      setFormData(prev => ({ ...prev, termsConditions: updated }));
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Terms & Conditions</h3>

      {!disabled && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select from defaults or add custom:</label>
          <div className="flex gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addTerm(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Select a term --</option>
              {termsConditionsSuggestions.map((term, index) => (
                <option key={index} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTerm(newTerm)}
              placeholder="Or type a custom term..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => addTerm(newTerm)}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={18} />
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowBulkPaste(!showBulkPaste)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                showBulkPaste
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ClipboardPaste size={18} />
              Paste Bulk
            </button>
          </div>

          {showBulkPaste && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
              <label className="block text-sm font-medium text-blue-700">
                Paste multiple terms (one per line):
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Paste your terms here...\nEach line will be added as a separate term.\nNumbered prefixes like '1.' or '1)' are auto-removed."}
                rows={5}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600">
                  {bulkText.trim() ? `${bulkText.split('\n').filter(l => l.trim()).length} term(s) detected` : 'Paste or type terms separated by new lines'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setBulkText(''); setShowBulkPaste(false); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addBulkTerms}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {formData.termsConditions.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-4 space-y-2">
          {formData.termsConditions.map((term, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">{index + 1}. {term}</span>
                  {!disabled && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(index)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTerm(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}