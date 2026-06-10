import { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import SalesTargetSec from "./SalesTargetSec";
import { AuthContext } from "../../context/AuthContext";

export default function SalesTargetPage() {
  const { user, permission, loading } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollBottom = true;

  // Wait for both user AND permission to resolve before deciding access —
  // AuthContext flips loading=false before the permission fetch completes.
  if (loading || (user && permission === null)) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  // Direct-URL guard: SideNav hides the link, but anyone typing /hr/sales-target
  // still reaches this page — bounce them unless they hold the SalesTargetView permission.
  if (!permission?.IsAdmin && !permission?.SalesTargetView) {
    return <Navigate to="/dashboard" replace />;
  }

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
          scrollBottom={scrollBottom}
        />

        <main className="flex-1 overflow-y-auto">
          <SalesTargetSec />
        </main>
      </div>
    </div>
  );
}
