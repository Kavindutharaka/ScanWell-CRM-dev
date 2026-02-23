import { useState, useEffect } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import AccountForm from "./AccountForm";
import AccountSec from "./AccountSec";
import { fetchAccounts, fetchAccountFilterOptions } from "../../api/AccountApi";
import ContactForm from "./ContactForm";
import useFilters from "../../components/filters/useFilters";

export default function Account() {
  const [openModal, setOpenModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Contacts state - stores array of contact objects
  const [contacts, setContacts] = useState([]);

  // Filters
  const { filters, setFilter, clearAllFilters, getApiParams } = useFilters(['accountType', 'salesPerson', 'location']);
  const [filterOptions, setFilterOptions] = useState({ accountTypes: [], salesPersons: [], locations: [] });

  const accountFilterConfig = [
    { key: 'accountType', label: 'Type', allLabel: 'All Types', minWidth: '140px', options: filterOptions.accountTypes.map(v => ({ value: v, label: v })) },
    { key: 'salesPerson', label: 'Sales Person', allLabel: 'All Sales People', minWidth: '160px', options: filterOptions.salesPersons.map(v => ({ value: v, label: v })) },
    { key: 'location', label: 'Location', allLabel: 'All Locations', minWidth: '150px', options: filterOptions.locations.map(v => ({ value: v, label: v })) }
  ];

  const modalOpen = () => {
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    // Clear contacts when closing account modal
    setContacts([]);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Fetch filter options on mount
  useEffect(() => {
    fetchAccountFilterOptions().then(data => {
      setFilterOptions(data || { accountTypes: [], salesPersons: [], locations: [] });
    }).catch(err => console.error('Error fetching filter options:', err));
  }, []);

  // Fetch accounts when page, pageSize, search, or filters change
  useEffect(() => {
    loadAccounts();
  }, [page, pageSize, searchQuery, filters]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiFilters = getApiParams();
      const result = await fetchAccounts(page, pageSize, searchQuery, apiFilters);
      setAccounts(result.data || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 0);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const closeContactModal = () => {
    setOpenContactModal(false);
  };

  // Get existing contacts when editing an account
  const getExistingContactsForEdit = () => {
    try {
      if (selectedAccount && selectedAccount.contactsJson) {
        const parsed = JSON.parse(selectedAccount.contactsJson);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error parsing contactsJson:', e);
    }
    return [];
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      {/* Main layout - takes remaining height */}
      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar */}
        <SideNav 
          isOpen={isMobileMenuOpen} 
          onClose={handleMenuClose}
        />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <AccountSec
            modalOpen={modalOpen}
            setSelectedAccount={setSelectedAccount}
            loading={loading}
            error={error}
            accounts={accounts}
            loadAccounts={loadAccounts}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilter={setFilter}
            clearAllFilters={clearAllFilters}
            filterConfig={accountFilterConfig}
          />
        </main>
      </div>

      {/* Account Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <AccountForm 
                onClose={modalClose} 
                account={selectedAccount}
                loadAccounts={loadAccounts}
                setOpenContactModal={setOpenContactModal}
                contacts={contacts}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {openContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeContactModal}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <ContactForm 
                onClose={closeContactModal} 
                setSecContacts={setContacts}
                existingContacts={getExistingContactsForEdit()}
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