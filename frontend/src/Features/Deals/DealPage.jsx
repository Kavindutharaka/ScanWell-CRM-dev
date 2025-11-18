import { useState, useEffect } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import DealForm from './DealForm';
import DealSec from "./DealSec";
import { fetchDeals } from "../../api/DealApi";

export default function DealPage() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const modalOpen = () => {
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDeals();
      
      // Transform backend data to match component format
      const transformedDeals = data.map(deal => ({
        id: deal.sysID,
        name: deal.dealName,
        stage: deal.stage || 'Prospecting',
        stageColor: getStageColor(deal.stage),
        owner: deal.owner ? deal.owner.charAt(0).toUpperCase() : '?',
        value: parseFloat(deal.dealsValue) || 0,
        contacts: deal.contacts || 'No contacts',
        account: deal.accounts || 'No account',
        expectedCloseDate: deal.expectedCloseDate || '',
        closeProbability: parseFloat(deal.closeProbability) || 0,
        forecastValue: parseFloat(deal.forecastValue) || 0,
        lastInteraction: deal.lastInteraction || '',
        quotesInvoices: deal.quotesInvoicesNumber || 'N/A',
        notes: deal.notes || '',
        // Generate a simple timeline based on stage
        timeline: generateTimeline(deal.stage)
      }));

      setDeals(transformedDeals);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  // Get color based on stage
  const getStageColor = (stage) => {
    const stageMap = {
      'prospecting': 'bg-slate-500',
      'qualification': 'bg-blue-500',
      'needs-analysis': 'bg-indigo-500',
      'discovery': 'bg-purple-500',
      'proposal': 'bg-amber-500',
      'negotiation': 'bg-red-500',
      'closed-won': 'bg-green-500',
      'closed-lost': 'bg-gray-500'
    };
    return stageMap[stage?.toLowerCase()] || 'bg-slate-500';
  };

  // Generate a timeline pattern based on stage
  const generateTimeline = (stage) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const timeline = [];
    
    for (let i = 0; i < 15; i++) {
      const dayIndex = i % 7;
      const day = days[dayIndex];
      let status = 'inactive';
      
      // Weekend
      if (dayIndex === 5 || dayIndex === 6) {
        status = 'inactive';
      } else {
        // Assign status based on stage and pattern
        if (stage?.toLowerCase() === 'proposal') {
          status = Math.random() > 0.3 ? 'proposal' : 'negotiation';
        } else if (stage?.toLowerCase() === 'negotiation') {
          status = Math.random() > 0.4 ? 'negotiation' : 'active';
        } else if (stage?.toLowerCase() === 'discovery') {
          status = 'active';
        } else {
          status = ['active', 'proposal', 'negotiation'][Math.floor(Math.random() * 3)];
        }
      }
      
      timeline.push({ day, status });
    }
    
    return timeline;
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <Header 
        onMenuToggle={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      {/* Main layout - takes remaining height */}
      <div className="flex flex-1 overflow-hidden  pt-14">
        {/* Sidebar */}
        <SideNav 
          isOpen={isMobileMenuOpen} 
          onClose={handleMenuClose}
        />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <DealSec
          modalOpen={modalOpen} 
          deals={deals}
          loadDeals={loadDeals}
          loading={loading}
          error={error}
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
              <DealForm onClose={modalClose} loadDeals={loadDeals}/>
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