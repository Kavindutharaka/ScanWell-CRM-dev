// Updated Quotes.jsx (Main File)
import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import QuotesInvoiceSec from "./QuotesInvoiceSec";

export default function Quotes() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <QuotesInvoiceSec />
        </main>
      </div>

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