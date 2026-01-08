import React, { useState, useEffect } from "react";
import { X, FileText, Download, Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { getDataObj } from "../../api/RfqApi";

export default function RfqDataModal({ rfqId, rfqNumber, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    fetchRfqPdf();
    
    // Cleanup URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [rfqId]);

  const fetchRfqPdf = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getDataObj(rfqId);
      console.log("Raw response:", response);
      
      if (!response || response === "") {
        setError("No PDF data available for this RFQ");
        return;
      }

      // Convert base64 to blob
      const base64Data = response;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
    } catch (err) {
      console.error("Error fetching RFQ PDF:", err);
      setError("Failed to load PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `RFQ_${rfqNumber || rfqId}.pdf`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden animate-fadeIn">
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          
          .skeleton {
            animation: shimmer 2s infinite;
            background: linear-gradient(
              90deg,
              #f0f0f0 25%,
              #e0e0e0 50%,
              #f0f0f0 75%
            );
            background-size: 1000px 100%;
          }
        `}</style>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">RFQ Document</h2>
              <p className="text-blue-100 text-xs">
                {loading ? "Loading PDF..." : `RFQ #${rfqNumber || rfqId}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && !error && pdfUrl && (
              <>
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="text-white hover:bg-white/20 rounded p-1.5 transition-colors duration-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white text-sm font-medium px-2 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="text-white hover:bg-white/20 rounded p-1.5 transition-colors duration-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {loading ? (
            // Loading State
            <div className="h-full flex flex-col items-center justify-center space-y-4 p-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-slate-600 font-medium">Loading PDF...</p>
              <div className="w-full max-w-md space-y-3">
                {Array(3).fill(0).map((_, idx) => (
                  <div key={idx} className="h-4 bg-slate-200 rounded skeleton"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="h-full flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-slate-700 font-medium text-lg mb-2">Error Loading PDF</p>
              <p className="text-slate-500 text-sm mb-6">{error}</p>
              <button
                onClick={fetchRfqPdf}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : !pdfUrl ? (
            // No PDF State
            <div className="h-full flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium text-lg">No PDF Available</p>
              <p className="text-slate-400 text-sm mt-1">This RFQ has no associated PDF document</p>
            </div>
          ) : (
            // PDF Viewer
            <div className="h-full w-full overflow-auto bg-slate-100 p-2">
              <div 
                className="transition-transform duration-200 origin-top-left"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  width: `${100 / (zoom / 100)}%`,
                  height: `${100 / (zoom / 100)}%`
                }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-none bg-white"
                  title="RFQ PDF Document"
                  style={{ minHeight: '100vh' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && pdfUrl && (
          <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-800">
                  RFQ #{rfqNumber || rfqId}
                </span>
                <span className="text-slate-400">•</span>
                <span>PDF Document</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
