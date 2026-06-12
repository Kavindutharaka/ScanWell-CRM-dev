import { useState, useEffect, useContext } from "react";
import Header from "../../components/Header";
import SideNav from "../../components/SideNav";
import ActivitiesSec from "./ActivitiesSec";
import ActivitiesForm from "./ActivitiesForm";
import { fetchActivities, fetchbyEmpId, fetchFullName } from "../../api/ActivityApi";
import { AuthContext } from "../../context/AuthContext";
import useFilters from "../../components/filters/useFilters";

import {
  Phone,
  Mail,
  Calendar,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import ActivitiesNotes from "./ActivitiesNotes";
import { fetchUserDetailsByRoleID } from '../../api/UserRoleApi';

export default function Activities() {
  const { user, permission, loading: authLoading } = useContext(AuthContext);

  const [activities, setActivities] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNoteModal, setOpenNoteModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuccesssNote, setIsSuccesssNote] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({
    status: "",
    activity_id: 0
  });
  const [userDetails, setUserDetails] = useState(null);
  const [typeCounts, setTypeCounts] = useState({ total: 0, siteVisit: 0, call: 0, meeting: 0, email: 0, presentation: 0, other: 0 });

  // Filters
  const { filters, setFilter, clearAllFilters, getApiParams } = useFilters(['activityType', 'status']);

  const activityFilterConfig = [
    { key: 'activityType', label: 'Type', allLabel: 'All Types', minWidth: '150px', options: [
      { value: 'call', label: 'Phone Call' },
      { value: 'email', label: 'Email' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'presentation', label: 'Presentation' },
      { value: 'site-visit', label: 'Site Visit' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'status', label: 'Status', allLabel: 'All Statuses', minWidth: '150px', options: [
      { value: 'planned', label: 'Planned' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'rescheduled', label: 'Rescheduled' },
      { value: 'overdue', label: 'Overdue' }
    ]}
  ];

  useEffect(() => {
    if (user) {
      console.log("Current user in header:", user);
      getUserById(user.id);
    }
  }, [user]);
  
  const getUserById = async (userId) => {
    try {
      const res = await fetchUserDetailsByRoleID(userId);
      console.log("Fetched user data:", res);
      // API returns an array, so take the first item
      if (res && res.length > 0) {
        setUserDetails(res[0]);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const modalOpen = () => {
    setEditingActivity(null);
    setOpenModal(true);
  };

  const modalClose = () => {
    setOpenModal(false);
    setEditingActivity(null);
    // Reset the one-shot "note saved" flag. Without this it stays true forever,
    // and the NEXT edit form to mount sees it truthy and fires autoTriggerEdit()
    // immediately — saving the activity before the user has typed anything.
    setIsSuccesssNote(false);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    // Defensive: never open an edit form with a stale auto-save flag.
    setIsSuccesssNote(false);
    setOpenModal(true);
  };

  const handleFormClose = (response) => {
    modalClose();
    // If the form saved something, refresh the activity list in place so the
    // new/updated row appears immediately (replaces the old window.location.reload).
    if (response) {
      loadActivities();
    }
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const noteModalopen = () => {
    console.log("not trigger this!")
    setOpenNoteModal(true);
  };

  const noteModalClose = () => {
    setOpenNoteModal(false);
  };

  const getInitials = (fullName) => {
      // Handle null, undefined, or empty string
      if (!fullName || fullName === 'null' || fullName.trim() === '') {
        return 'U';
      }
      
      const names = fullName.trim().split(' ');
      
      // Single name - return first letter
      if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
      }
      
      // Multiple names - return first letter of first name + first letter of last name
      const firstInitial = names[0].charAt(0).toUpperCase();
      const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
      return firstInitial + lastInitial;
    };

  useEffect(() => {
    if (userDetails) {
      loadActivities();
    }
  }, [permission, userDetails, page, pageSize, searchQuery, filters]);

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    let result;
    try {
      const apiFilters = getApiParams();
      if (permission?.IsAdmin) {
        result = await fetchActivities(page, pageSize, searchQuery, apiFilters);
      } else {
        if (!userDetails?.emp_id) {
          throw new Error('Employee ID not available');
        }
        result = await fetchbyEmpId(userDetails.emp_id, page, pageSize, searchQuery, apiFilters);
      }

      const rawData = result.data || [];
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 0);
      if (result.typeCounts) setTypeCounts(result.typeCounts);

      const transformedData = rawData.map((activity) => {
        const ownerFullName = activity.owner_name || 'Unassigned';

        return {
          id: activity.id,
          title: activity.activity_name,
          type: getActivityTypeLabel(activity.activity_type),
          typeColor: getActivityTypeColor(activity.activity_type),
          typeIcon: getActivityTypeIcon(activity.activity_type),
          owner: ownerFullName,
          ownerInitial: getInitials(ownerFullName),
          startTime: formatDateTime(activity.start_time),
          endTime: formatDateTime(activity.end_time),
          status: activity.status,
          statusColor: getStatusColor(activity.status),
          relatedAccount: activity.related_account || 'N/A',
          priority: getPriority(activity.status),
          rawData: activity
        };
      });

      setActivities(transformedData);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeLabel = (type) => {
    const typeMap = {
      'call': 'Phone Call',
      'email': 'Email',
      'meeting': 'Meeting',
      'demo': 'Demo',
      'presentation': 'Presentation',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'site-visit': 'Site Visit',
      'training': 'Training',
      'webinar': 'Webinar',
      'conference': 'Conference',
      'task': 'Task',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  // Get activity type color
  const getActivityTypeColor = (type) => {
    const colorMap = {
      'call': 'bg-blue-500',
      'email': 'bg-purple-500',
      'meeting': 'bg-indigo-500',
      'demo': 'bg-green-500',
      'presentation': 'bg-pink-500',
      'proposal': 'bg-cyan-500',
      'negotiation': 'bg-red-500',
      'site-visit': 'bg-orange-500',
      'training': 'bg-teal-500',
      'webinar': 'bg-violet-500',
      'conference': 'bg-lime-500',
      'task': 'bg-slate-500',
      'other': 'bg-gray-500'
    };
    return colorMap[type] || 'bg-slate-500';
  };

  // Get activity type icon
  const getActivityTypeIcon = (type) => {
    const iconMap = {
      'call': Phone,
      'email': Mail,
      'meeting': Users,
      'demo': Calendar,
      'presentation': Users,
      'proposal': Calendar,
      'negotiation': Users,
      'site-visit': Calendar,
      'training': Users,
      'webinar': Calendar,
      'conference': Users,
      'task': Clock,
      'other': AlertCircle
    };
    return iconMap[type] || AlertCircle;
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColorMap = {
      'planned': 'bg-blue-500',
      'in-progress': 'bg-amber-500',
      'completed': 'bg-emerald-500',
      'cancelled': 'bg-red-500',
      'rescheduled': 'bg-purple-500',
      'overdue': 'bg-orange-500'
    };
    return statusColorMap[status] || 'bg-slate-500';
  };

  // Get priority based on status
  const getPriority = (status) => {
    if (status === 'overdue') return 'high';
    if (status === 'in-progress' || status === 'planned') return 'medium';
    return 'low';
  };

  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    // Guard against unparseable input — without this, downstream code that
    // re-parses this string would render "NaN/NaN/NaN 12:NaN AM".
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Please log in to access activities.
      </div>
    );
  }

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
          {error ? (
            <div className="p-4 text-red-500">
              {error}
            </div>
          ) : (
            <ActivitiesSec
              modalOpen={modalOpen}
              onEdit={handleEdit}
              activities={activities}
              setActivities={setActivities}
              loadActivities={loadActivities}
              loading={loading}
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
              filterConfig={activityFilterConfig}
              typeCounts={typeCounts}
            />
          )}
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
              <ActivitiesForm 
                onClose={handleFormClose}
                initialActivity={editingActivity}
                isEditMode={!!editingActivity}
                noteModalOpen={noteModalopen}
                isSuccesssNote={isSuccesssNote}
                setCurrentStatus={setCurrentStatus}
              />
            </div>
          </div>
        </div>
      )}

       {openNoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={modalClose}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative w-full animate-fadeIn">
              <ActivitiesNotes
                onClose={noteModalClose}
                initialActivity={editingActivity}
                setIsSuccesssNote={setIsSuccesssNote}
                currentStatus={currentStatus}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
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