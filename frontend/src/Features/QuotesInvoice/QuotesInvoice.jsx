import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import QuotesInvoiceSec from "./QuotesInvoiceSec";
import QuoteInvoiceForm from "./QuoteInvoiceForm";
import RateManage from "./RateManage";

export default function QuotesInvoice() {
  const [openModal, setOpenModal] = useState(false);
  const [openRateModal, setOpenRateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalType, setModalType] = useState('quote');
  const [editingDocument, setEditingDocument] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const modalOpen = (type = 'quote') => {
    setModalType(type);
    setEditingDocument(null);
    setOpenModal(true);
  };
  const modalRateOpen = () => {
    setOpenRateModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setEditingDocument(null);
  };

  const modalRateClose = () => {
    setOpenRateModal(false);
  };

  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setModalType(doc.type?.toLowerCase() || 'quote');
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="flex flex-1 overflow-hidden pt-14">
        <SideNav 
          isOpen={isMobileMenuOpen} 
          onClose={handleMenuClose}
        />

        <main className="flex-1 overflow-y-auto">
          <QuotesInvoiceSec 
            modalOpen={modalOpen}
            onEditDocument={handleEditDocument}
            refreshTrigger={refreshTrigger}
            openRateModal={modalRateOpen}
          />
        </main>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <QuoteInvoiceForm 
                onClose={modalClose} 
                type={modalType}
                editDocument={editingDocument}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      )}
      {openRateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <RateManage 
                onClose={modalRateClose}
              />
            </div>
          </div>
        </div>
      )}



      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}