import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import InvoicesSec from "./InvoicesSec";

export default function Invoices() {
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
        <SideNav isOpen={isMobileMenuOpen} onClose={handleMenuClose} />

        <main className="flex-1 overflow-y-auto">
          <InvoicesSec />
        </main>
      </div>
    </div>
  );
}
