import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import SalesDashboard from './monday-crm-dashboard';
import ContactBoard from './Features/ContactBoard/ContactBoard';
import MailTracking from './Features/MailTracking/MailTracking';
import QuotesInvoice from './Features/QuotesInvoice/QuotesInvoice';
import DealPage from './Features/Deals/DealPage';
import LeadPage from './Features/Leads/LeadPage';
import Account from './Features/Accounts/Account';
import Project from './Features/ClientProject/Project';
import Activities from './Features/Activities/Activities';
import Dashboard from './Features/Dashboard/Dashboard';
import SeaImport from './AirImport'
import RateManage from './Features/QuotesInvoice/RateManage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App/>
   {/* <RateManage/> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
