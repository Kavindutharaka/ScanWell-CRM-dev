import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import RatesSec from "./RatesSec";
import RateForm from "./RateForm";

export default function Rates() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const modalOpen = () => {
    setEditingRate(null);
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setEditingRate(null);
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    modalClose();
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
          <RatesSec 
            modalOpen={modalOpen}
            onEditRate={handleEditRate}
            refreshTrigger={refreshTrigger}
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
              <RateForm 
                onClose={modalClose} 
                editRate={editingRate}
                onSuccess={handleSuccess}
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
