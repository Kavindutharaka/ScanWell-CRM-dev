// /sys-run — developer audit viewer. Admin-only, hidden from sidebar.
import { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import SideNav from '../../components/SideNav';
import SysRunSec from './SysRunSec';
import { AuthContext } from '../../context/AuthContext';

export default function SysRun() {
  const { user, permission, loading } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // AuthContext flips `loading=false` as soon as /auth/me resolves — but the
  // permission lookup (/auth/info/:id) runs separately and may still be pending.
  // Guard against the brief window where loading=false but permission is null
  // by waiting until BOTH user AND permission are resolved (or until we know
  // permission failed to load).
  if (loading || (user && permission === null)) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  // Hard gate: only admins can view the audit log.
  if (!permission?.IsAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="flex flex-1 overflow-hidden pt-14">
        <SideNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <SysRunSec />
        </main>
      </div>
    </div>
  );
}
