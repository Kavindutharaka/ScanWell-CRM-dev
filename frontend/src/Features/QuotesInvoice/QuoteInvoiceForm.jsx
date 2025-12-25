import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  FileText,
  Plane,
  Ship,
  Package,
  Container,
  Truck,
  Route as RouteIcon,
  Layers
} from "lucide-react";

export default function QuoteInvoiceForm({ onClose, type = 'quote', editDocument = null, onSuccess }) {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const modes = [
    { id: 'air-import', label: 'Air Import', icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50', category: 'air', mode: 'import' },
    { id: 'air-export', label: 'Air Export', icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50', category: 'air', mode: 'export' },
    { id: 'sea-import-fcl', label: 'Sea Import FCL', icon: Container, color: 'text-teal-600', bg: 'bg-teal-50', category: 'sea', mode: 'import' },
    { id: 'sea-import-lcl', label: 'Sea Import LCL', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', category: 'sea', mode: 'import' },
    { id: 'sea-export-fcl', label: 'Sea Export FCL', icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50', category: 'sea', mode: 'export' },
    { id: 'sea-export-lcl', label: 'Sea Export LCL', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50', category: 'sea', mode: 'export' }
  ];

  const categories = [
    { id: 'direct', label: 'Direct', icon: RouteIcon, description: 'Single route without stops' },
    { id: 'transit', label: 'Transshipment', icon: Layers, description: 'Multiple transit points' },
    { id: 'multimodal', label: 'MultiModal', icon: Truck, description: 'Combined air and sea' }
  ];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setSelectedCategory(""); // Reset category when mode changes
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleContinue = () => {
    if (!selectedMode || !selectedCategory) return;

    const modeData = modes.find(m => m.id === selectedMode);
    
    if (selectedCategory === 'multimodal') {
      // MultiModal doesn't need category and mode params
      navigate('/quotes?type=multimodal');
    } else {
      // Direct and Transit need category and mode
      navigate(`/quotes?category=${modeData.category}&type=${selectedCategory}&mode=${modeData.mode}`);
    }
    
    onClose(); // Close the modal after navigation
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {editDocument ? 'Edit' : 'Create New'} {type === 'quote' ? 'Quote' : 'Invoice'}
              </h1>
              <p className="text-sm text-slate-600">Select freight mode and routing type</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/70 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="space-y-8">
            {/* Freight Mode Selection */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Step 1: Select Freight Mode</h3>
              <p className="text-slate-500 text-sm mb-4">Choose your shipping method</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {modes.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      selectedMode === mode.id 
                        ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50' 
                        : 'border-slate-200 hover:border-teal-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${mode.bg} ${mode.color} flex items-center justify-center mb-3`}>
                      <mode.icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-700 block">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Routing Type Selection */}
            {selectedMode && (
              <div className="pt-6 border-t border-slate-100 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Step 2: Select Routing Type</h3>
                <p className="text-slate-500 text-sm mb-4">Choose how your cargo will be transported</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-5 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:shadow-md ${
                        selectedCategory === cat.id 
                          ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-200' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedCategory === cat.id ? 'bg-teal-100' : 'bg-slate-100'
                      }`}>
                        <cat.icon className={`w-7 h-7 ${
                          selectedCategory === cat.id ? 'text-teal-700' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="text-center">
                        <span className="font-semibold block text-base">{cat.label}</span>
                        <span className={`text-xs block mt-1 ${
                          selectedCategory === cat.id ? 'text-teal-600' : 'text-slate-500'
                        }`}>
                          {cat.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedMode && (
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 animate-fadeIn">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border-2 border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedCategory}
                  onClick={handleContinue}
                  className={`px-8 py-2.5 rounded-lg font-medium transition-all ${
                    selectedCategory
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continue to Quote Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}