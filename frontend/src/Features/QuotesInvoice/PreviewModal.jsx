import React, { useState } from 'react';
import { X, Download, Eye, Loader2 } from 'lucide-react';
import QuotationTemplate, { generatePDF } from './QuotationTemplate';

const PreviewModal = ({ isOpen, onClose, quotationData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const filename = `${quotationData.meta.quoteNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const result = await generatePDF(quotationData, filename);
      
      if (result.success) {
        // Show success message
        alert('PDF generated successfully!');
      } else {
        alert(`Error generating PDF: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Quotation Preview</h1>
              <p className="text-sm text-slate-600">Review before generating PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/70 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="flex justify-center">
            <QuotationTemplate data={quotationData} previewMode={true} />
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-white rounded-b-2xl">
          <div className="text-sm text-slate-600">
            Quote ID: <span className="font-semibold">{quotationData.meta.quoteNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
            >
              Close Preview
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
                isGenerating
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;