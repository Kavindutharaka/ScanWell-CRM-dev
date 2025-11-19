import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/SideNav';

import SalesDashboard from './Features/Dashboard/Dashboard';
import ContactBoard from './Features/ContactBoard/ContactBoard';
import MailTracking from './Features/MailTracking/MailTracking';
import QuotesInvoice from './Features/QuotesInvoice/QuotesInvoice';
import RFQ from './Features/RFQ/RFQ';
import LeadPage from './Features/Leads/LeadPage';
import Account from './Features/Accounts/Account';
import Rates from './Features/Rates/Rates';
import Activities from './Features/Activities/Activities';
import Login from './Features/Login/Login'

// HR Components
import HREmployees from './Features/PeopleHRManagement/HREmployees';
import HRSystemManagement from './Features/HRManagement/HRSystemManagement';
import Info from './Features/InfoUpdates/InfoAndUpdates';
// Add these when you create them:
// import HRPositions from './Features/HR/Positions/HRPositions';
// import HRAttendance from './Features/HR/Attendance/HRAttendance';
// import HRPerformance from './Features/HR/Performance/HRPerformance';
// import HRSettings from './Features/HR/Settings/HRSettings';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Top-level routes */}
        <Route path="/mail-tracking" element={<MailTracking />} />
        <Route path="/usefull-link" element={<Info />} />
        <Route path="/quotes-invoices" element={<QuotesInvoice />} />
        <Route path="/rates" element={<Rates/>} />
        
        {/* Workspace routes */}
        <Route path="/contacts" element={<ContactBoard />} />
        <Route path="/rfq" element={<RFQ/>} />
        <Route path="/leads" element={<LeadPage />} />
        <Route path="/accounts" element={<Account />} />
        {/* <Route path="/projects" element={<Project />} /> */}
        <Route path="/sales-plans" element={<Activities />} />
        <Route path="/dashboard" element={<SalesDashboard />} />
        
        {/* HR Management routes */}
        <Route path="/hr/manage-employee" element={<HREmployees />} />
        <Route path="/hr/manage" element={<HRSystemManagement />} />
        {/* Uncomment these as you create the components:
        <Route path="/hr/positions" element={<HRPositions />} />
        <Route path="/hr/attendance" element={<HRAttendance />} />
        <Route path="/hr/performance" element={<HRPerformance />} />
        <Route path="/hr/settings" element={<HRSettings />} />
        */}
        <Route path="/login" element={<Login />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  );
}