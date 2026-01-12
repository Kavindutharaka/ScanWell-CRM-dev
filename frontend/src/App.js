// App.js
import React,{useEffect, useContext} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SalesDashboard from './Features/Dashboard/Dashboard';
import ContactBoard from './Features/ContactBoard/ContactBoard';
import MailTracking from './Features/MailTracking/MailTracking';
import QuotesInvoice from './Features/QuotesInvoice/QuotesInvoice';
import RFQ from './Features/RFQ/RFQ';
import LeadPage from './Features/Leads/LeadPage';
import Account from './Features/Accounts/Account';
import Rates from './Features/Rates/Rates';
import Activities from './Features/Activities/Activities';
import Login from './Features/Login/Login';
import HREmployees from './Features/PeopleHRManagement/HREmployees';
import HRSystemManagement from './Features/HRManagement/HRSystemManagement';
import Info from './Features/InfoUpdates/InfoAndUpdates';
import EmployeeRoleManagement from './Features/RoleBase/EmployeeRoleManagement';
import Profile from './Features/Profile/Profile';
import Quotes from './Features/Quotes/Quotes';
import WarehouseQuoteView from './Features/Quotes/WarehouseQuoteView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login/>} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<SalesDashboard />} />
            {/* <Route path="/contacts" element={<ContactBoard />} /> */}
            <Route path="/mail-tracking" element={<MailTracking />} />
            <Route path="/quotes-invoices" element={<QuotesInvoice />} />
            <Route path="/quotes" element={<Quotes/>} />
            <Route path="/rates" element={<Rates />} />
            <Route path="/rfq" element={<RFQ />} />
            <Route path="/leads" element={<LeadPage />} />
            <Route path="/accounts" element={<Account />} />
            <Route path="/sales-plans" element={<Activities />} />
            <Route path="/usefull-link" element={<Info />} />
            <Route path="/hr/manage-employee" element={<HREmployees />} />
            <Route path="/hr/manage" element={<HRSystemManagement />} />
            <Route path="/rolebase" element={<EmployeeRoleManagement />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/warehouse-quotes/:id" element={<WarehouseQuoteView />} />
            
            {/* Default redirect when logged in */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all */}
          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;