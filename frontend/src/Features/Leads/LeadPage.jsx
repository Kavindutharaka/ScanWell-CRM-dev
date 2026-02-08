import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import ExcelUploadModal from "./ExcelUploadModal";
import LeadSec from "./LeadSec";

export default function LeadPage() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const modalOpen = () => {
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
  };

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
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
          <LeadSec modalOpen={modalOpen} key={refreshKey} />
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
              <ExcelUploadModal
                onClose={modalClose}
                onImportSuccess={() => {
                  handleImportSuccess();
                }}
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
