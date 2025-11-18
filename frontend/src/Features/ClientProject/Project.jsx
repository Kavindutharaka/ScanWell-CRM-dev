import { useState, useEffect } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import ProjectForm from "./ProjectForm";
import ProjectSec from "./ProjectSec";
import { fetchProjects } from "../../api/ProjectApi";

export default function Project() {
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const modalOpen = () => {
    setEditingProject(null); // Reset editing state when creating new
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setEditingProject(null);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle edit project - opens modal with project data
  const handleEditProject = (project) => {
    setEditingProject(project);
    setOpenModal(true);
  };

  // Handle successful project save
  const handleProjectSuccess = () => {
    loadProjects();
    setEditingProject(null);
  };

  // Fetch projects from API
  const loadProjects = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const data = await fetchProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and refresh when refreshTrigger changes
  useEffect(() => {
    loadProjects();
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
          <ProjectSec 
            modalOpen={modalOpen} 
            projects={projects}
            loading={loading}
            error={error}
            refreshing={refreshing}
            setLoading={setLoading}
            onEditProject={handleEditProject}
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
              <ProjectForm 
                onClose={modalClose} 
                existingProject={editingProject}
                onSuccess={handleProjectSuccess}
                loadProjects={loadProjects}
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