import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import RFQSec from "./RFQSec";
import RFQForm from "./RFQForm";
import SalesEntryModal from "./SalesEntryModal";

export default function RFQ() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [salesEntryItem, setSalesEntryItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const modalOpen = () => {
    setEditingItem(null);
    setOpenModal(true);
  };

  const modalClose = (shouldRefresh) => {
    setOpenModal(false);
    setEditingItem(null);
    if (shouldRefresh) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleSalesEntry = (item) => {
    setSalesEntryItem(item);
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
        <SideNav isOpen={isMobileMenuOpen} onClose={handleMenuClose} />

        <main className="flex-1 overflow-y-auto">
          <RFQSec
            key={refreshKey}
            modalOpen={modalOpen}
            onEdit={handleEdit}
            onSalesEntry={handleSalesEntry}
          />
        </main>
      </div>

      {/* RFQ Form Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => modalClose()}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full max-w-2xl animate-fadeIn">
              <RFQForm
                onClose={modalClose}
                initialItem={editingItem}
                isEditMode={!!editingItem}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sales Entry Modal */}
      {salesEntryItem && (
        <SalesEntryModal
          rfqItem={salesEntryItem}
          onClose={() => setSalesEntryItem(null)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
