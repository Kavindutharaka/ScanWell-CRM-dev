import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, X, Lock } from 'lucide-react';

export default function ActivityView({ isAdmin = false, data = [], onClose }) {
    const [todayDate, setTodayDate] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        
        const local = [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate())
        ].join("-");
        
        setTodayDate(local);
    }, []);

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Check if activity time has passed
    const hasTimePassed = (endTime) => {
        if (!endTime) return false;
        const activityEndTime = new Date(endTime);
        return currentTime > activityEndTime;
    };

    // Filter activities for today and sort by time (AM to PM)
    const todayActivities = useMemo(() => {
        console.log("todayDate: ", todayDate);
        if (!todayDate || !data || data.length === 0) return [];
        console.log("data are: ", data);
        
        const filtered = data.filter(activity => {
            if (!activity.endTime) return false;
            
            // Parse the endTime string (format: "Jan 12, 2026, 10:14 PM") into a Date object
            const endDate = new Date(activity.endTime);
            if (isNaN(endDate.getTime())) return false; // Invalid date
            
            // Extract date part in yyyy-MM-dd format
            const activityDate = endDate.toISOString().split('T')[0];
            return activityDate === todayDate;
        });
        
        // Sort by time in ascending order (AM first, then PM)
        return filtered.sort((a, b) => {
            const timeA = new Date(a.endTime).getTime();
            const timeB = new Date(b.endTime).getTime();
            return timeA - timeB;
        });
    }, [data, todayDate]);

    // Get activity type icon/color
    const getActivityTypeColor = (type) => {
        const colors = {
            'Call': 'bg-blue-100 text-blue-800',
            'Meeting': 'bg-purple-100 text-purple-800',
            'Email': 'bg-green-100 text-green-800',
            'Task': 'bg-orange-100 text-orange-800',
            'Demo': 'bg-pink-100 text-pink-800',
            'Follow-up': 'bg-yellow-100 text-yellow-800'
        };
        return colors[type] || 'bg-slate-100 text-slate-800';
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            {todayDate || 'Loading...'}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            {todayActivities.length} {todayActivities.length === 1 ? 'Task' : 'Tasks'} Today
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/70 rounded-lg transition-colors group ml-8"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
                {todayActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No activities scheduled for today</p>
                        <p className="text-slate-400 text-sm mt-2">Create a new activity to get started</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                                        {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Owner</th>}
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Activity</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Related Account</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {todayActivities.map((activity, index) => {
                                        const isPast = hasTimePassed(activity.endTime);
                                        return (
                                            <tr key={activity.activityId || index} className={`hover:bg-slate-50 transition-colors group ${isPast ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {index + 1}
                                                        </span>
                                                        {isPast && (
                                                            <Lock className="w-3 h-3 text-slate-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-slate-700">
                                                            {activity.owner || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm ${isPast ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                                            {activity.endTime ? new Date(activity.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </span>
                                                        {isPast && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                Passed
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="max-w-xs">
                                                        <p className={`text-sm font-medium ${isPast ? 'text-slate-500 line-through' : 'text-slate-800'} truncate`}>
                                                            {activity.title || 'Untitled Activity'}
                                                        </p>
                                                        {activity.description && (
                                                            <p className="text-xs text-slate-500 truncate mt-1">
                                                                {activity.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                                        {activity.type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-slate-700">
                                                        {activity.relatedAccount || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-4">
                            {todayActivities.map((activity, index) => {
                                const isPast = hasTimePassed(activity.endTime);
                                return (
                                    <div key={activity.activityId || index} className={`bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${isPast ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-700">#{index + 1}</span>
                                                {isPast && (
                                                    <Lock className="w-3 h-3 text-slate-400" />
                                                )}
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                                    {activity.type || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${isPast ? 'text-slate-500 line-through' : 'text-slate-500'}`}>
                                                    {activity.endTime ? new Date(activity.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </span>
                                                {isPast && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        Passed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className={`text-sm font-semibold ${isPast ? 'text-slate-500 line-through' : 'text-slate-800'} mb-2`}>
                                            {activity.title || 'Untitled Activity'}
                                        </h3>
                                        {activity.description && (
                                            <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                                {activity.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                                            {isAdmin && activity.owner && (
                                                <span>Owner: {activity.owner}</span>
                                            )}
                                            {activity.relatedAccount && (
                                                <span>Account: {activity.relatedAccount}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}