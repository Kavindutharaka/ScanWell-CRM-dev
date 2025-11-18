import { useState, useEffect } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import ContactForm from "./ContactForm";
import ContactBoardSec from "./ContactBoardSec";
import { fetchContacts, deleteContact } from "../../api/ContactAPI";

export default function ContactBoard() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedData, setSelectedData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);

  const modalOpen = () => {
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
  };

  const handleContactCreated = () => {
    // Trigger refresh of contacts list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Fetch contacts from API
    const loadContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchContacts();
        const transformedContacts = data.map(contact => ({
          sysID: contact.sysID,
          contactName: contact.name || contact.contactName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          title: contact.title || '',
          accounts: contact.company || contact.accounts || '',
          deals: contact.deals || '',
          dealsValue: contact.deal_value || contact.dealsValue || '',
          type: contact.type || '',
          priority: contact.priority || '',
          comments: contact.comments || ''
      }));
        setContacts(transformedContacts);
        console.log("this is fetch data: ",data);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    // Load contacts on mount
    useEffect(() => {
      loadContacts();
    }, []);

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
          <ContactBoardSec 
            modalOpen={modalOpen} 
            refreshTrigger={refreshTrigger}
            setSelectedData={setSelectedData}
            loading={loading}
            loadContacts={loadContacts}
            error={error}
            contacts={contacts}
          />
        </main>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <ContactForm 
                onClose={modalClose} 
                onSuccess={handleContactCreated}
                selectedData={selectedData}
                loadContacts={loadContacts}
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