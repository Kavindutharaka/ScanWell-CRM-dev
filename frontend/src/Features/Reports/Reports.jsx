import { useState } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import ReportsSec from "./ReportsSec";

export default function Reports() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex flex-1 overflow-hidden pt-14">
        <SideNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          <ReportsSec />
        </main>
      </div>
    </div>
  );
}
