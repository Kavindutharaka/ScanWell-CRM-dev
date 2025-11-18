import { useState, useEffect } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import HRSystemForm from "./HRSystemForm";
import HRSystemSec from "./HRSystemSec";
// import { fetchDepartments, fetchPositions } from "../../api/HRApi";
import { fetchDepartment } from "../../api/DepartmentApi";
import { fetchPosition } from "../../api/PositionApi";

export default function HRSystemManagement() {
  const [openModal, setOpenModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const scrollBottom = true;
 
  const modalOpen = () => {
    setOpenModal(true);
  };

  const modalClose = () => {
    setSelectedItem(null);
    setOpenModal(false);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(()=>{
    loadDepartment();
    loadPosition();
  },[]);

  const loadDepartment = async () =>{
    const data = await fetchDepartment();
    setDepartments(data);
    console.log(data);
  };
  const loadPosition = async () =>{
    const data = await fetchPosition();
    setPositions(data);
    console.log(data);
  };

  // const loadDepartments = async () => {
  //   try {
  //     // const data = await fetchDepartments();
  //     // setDepartments(data);
      
  //     // Sample data - replace with API call
  //     setDepartments([
  //       { id: 1, name: 'Operations' },
  //       { id: 2, name: 'Transport' },
  //       { id: 3, name: 'Warehouse' },
  //       { id: 4, name: 'HR' },
  //       { id: 5, name: 'IT' },
  //       { id: 6, name: 'Customs' },
  //       { id: 7, name: 'Logistics' }
  //     ]);
  //   } catch (err) {
  //     console.error('Error loading departments:', err);
  //   }
  // };

  // const loadPositions = async () => {
  //   try {
  //     // const data = await fetchPositions();
  //     // setPositions(data);
      
  //     // Sample data - replace with API call
  //     setPositions([
  //       { id: 1, name: 'Warehouse Manager' },
  //       { id: 2, name: 'Truck Driver' },
  //       { id: 3, name: 'Operations Supervisor' },
  //       { id: 4, name: 'HR Assistant' },
  //       { id: 5, name: 'Logistics Coordinator' },
  //       { id: 6, name: 'Customs Officer' },
  //       { id: 7, name: 'Delivery Driver' },
  //       { id: 8, name: 'Forklift Operator' },
  //       { id: 9, name: 'Dispatcher' },
  //       { id: 10, name: 'Fleet Manager' }
  //     ]);
  //   } catch (err) {
  //     console.error('Error loading positions:', err);
  //   }
  // };

  const refreshData = () => {
    // loadDepartments();
    // loadPositions();
  };

  // useEffect(() => {
  //   loadDepartments();
  //   loadPositions();
  // }, []);
  

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
          scrollBottom={scrollBottom}
        />

        {/* Main content area - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <HRSystemSec 
            modalOpen={modalOpen}
            departments={departments}
            positions={positions}
            setSelectedItem={setSelectedItem}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setDepartments={setDepartments}
            setPositions={setPositions}
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
              <HRSystemForm 
                onClose={modalClose} 
                editItem={selectedItem}
                activeTab={activeTab}
                onSuccess={refreshData}
                loadDepartment={loadDepartment}
                loadPosition={loadPosition}
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