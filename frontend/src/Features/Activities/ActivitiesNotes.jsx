import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Clock, Tag, FileText, AlertCircle } from "lucide-react";
import { saveNotes } from '../../api/ActivityApi';

export default function ActivitiesNotes({onClose, setIsSuccesssNote, currentStatus}) {
    const [formData, setFormData] = useState({
        new_status: "",
        note: "",
        activity_id: 0,
        reschedule_date: ""
    });
    const [errors, setErrors] = useState({
        note: false,
        rescheduleDate: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(()=>{
        setFormData(prev=> ({
            ...prev,
            new_status: currentStatus.status,
            activity_id: currentStatus.activity_id,
            reschedule_date: currentStatus.rescheduleDate || ""
        }));
    },[currentStatus]);

    const handleInputChange =(e)=>{
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: false
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            note: false,
            rescheduleDate: false
        };

        // Validate note
        if(formData.note.length < 5){
            newErrors.note = true;
        }

        // Validate reschedule date if status is reschedule
        if(formData.new_status === 'reschedule' && !formData.reschedule_date){
            newErrors.rescheduleDate = true;
        }

        setErrors(newErrors);
        return !newErrors.note && !newErrors.rescheduleDate;
    };

    const handleSubmit = async (e)=>{
        e.preventDefault();
        
        if(!validateForm()){
            return;
        }

        if(currentStatus.activity_id){
            setIsSubmitting(true);
            console.log(formData);
            
            try {
                const response = await saveNotes(formData);
                console.log(response);
                setIsSuccesssNote(true);
                onClose();
            } catch (error) {
                console.error('Error saving note:', error);
                setIsSubmitting(false);
            }
        }
    };

    // Status display configuration
    const getStatusConfig = (status) => {
        const configs = {
            'planned': { 
                color: 'text-slate-600 bg-slate-100', 
                icon: '📋', 
                label: 'Planned',
                description: 'Activity is planned and scheduled'
            },
            'in_progress': { 
                color: 'text-blue-600 bg-blue-100', 
                icon: '▶️', 
                label: 'In Progress',
                description: 'Activity is currently being worked on'
            },
            'completed': { 
                color: 'text-green-600 bg-green-100', 
                icon: '✅', 
                label: 'Completed',
                description: 'Activity has been completed successfully'
            },
            'cancelled': { 
                color: 'text-red-600 bg-red-100', 
                icon: '❌', 
                label: 'Cancelled',
                description: 'Activity has been cancelled'
            },
            'reschedule': { 
                color: 'text-amber-600 bg-amber-100', 
                icon: '⏰', 
                label: 'Reschedule',
                description: 'Activity is being rescheduled to a new date'
            }
        };
        return configs[status] || configs['planned'];
    };

    const statusConfig = getStatusConfig(formData.new_status);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            Add Status Update Note
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Document the reason for this status change
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onClose()}
                    className="p-2 hover:bg-white/70 rounded-lg transition-colors group"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                </button>
            </div>
            
            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Status Change Info Banner */}
                <div className={`mb-6 p-4 rounded-lg border ${statusConfig.color} border-opacity-30`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{statusConfig.icon}</span>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">
                                Changing Status to: {statusConfig.label}
                            </h3>
                            <p className="text-sm opacity-90">
                                {statusConfig.description}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* New Status (Read-only) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Clock className="w-4 h-4 text-blue-600" />
                                New Status
                            </label>
                            <input
                                type="text"
                                name="new_status"
                                value={statusConfig.label}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                                readOnly
                            />
                        </div>

                        {/* Reschedule Date - Only shown when status is reschedule */}
                        {formData.new_status === 'reschedule' && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                    <Calendar className="w-4 h-4 text-amber-600" />
                                    Reschedule Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="reschedule_date"
                                    value={formData.reschedule_date}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        errors.rescheduleDate ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                                {errors.rescheduleDate && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Reschedule date is required when changing status to Reschedule
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-600">
                                    Select the new date and time for this activity
                                </p>
                            </div>
                        )}

                        {/* Note */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Status Change Note *
                            </label>
                            <textarea
                                name="note"
                                value={formData.note}
                                onChange={handleInputChange}
                                rows={8}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all resize-none ${
                                    errors.note ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                }`}
                                placeholder={`Explain why the status is changing to ${statusConfig.label.toLowerCase()}...

Examples:
• Client requested to reschedule due to scheduling conflict
• Completed all action items and received client confirmation
• Unable to reach client after multiple attempts
• Meeting was productive, moving forward with proposal`}
                            />
                            {errors.note && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Note must be at least 5 characters
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-600">
                                Minimum 5 characters. Be specific about the reason for this status change.
                            </p>
                        </div>

                        {/* Important Notes Section */}
                        {formData.new_status === 'completed' && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-amber-800 text-sm">Important Note</p>
                                        <p className="text-amber-700 text-sm mt-1">
                                            Once an activity is marked as <strong>Completed</strong>, it cannot be edited or changed to any other status. Make sure all information is accurate before proceeding.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <button
                    type="button"
                    onClick={() => onClose()}
                    className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-6 py-3 text-white rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center ${
                        formData.new_status === 'completed' 
                            ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                            : formData.new_status === 'cancelled'
                            ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Calendar className="w-4 h-4" />
                            Save Status Change
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}