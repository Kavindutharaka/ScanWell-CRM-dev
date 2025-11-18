import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import InfoAndUpdatesSec from "./InfoAndUpdatesSec";
import InfoAndUpdatesForm from "./InfoAndUpdatesForm";

export default function InfoAndUpdates() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const modalOpen = () => {
    setEditingItem(null);
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleFormClose = (response) => {
    // response contains the updated/created item data
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
      {/* Fixed Header */}
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      {/* Main layout - takes remaining height */}
      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar */}
        <SideNav 
          isOpen={isMobileMenuOpen} 
          onClose={handleMenuClose}
        />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <InfoAndUpdatesSec modalOpen={modalOpen} onEdit={handleEdit} />
        </main>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full max-w-2xl animate-fadeIn">
              <InfoAndUpdatesForm 
                onClose={handleFormClose}
                initialItem={editingItem}
                isEditMode={!!editingItem}
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
