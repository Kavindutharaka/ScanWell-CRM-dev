import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Clock, Tag, FileText } from "lucide-react";
import { saveNotes } from '../../api/ActivityApi';

export default function ActivitiesNotes({onClose, setIsSuccesssNote, currentStatus}) {
    const[formData, setFormData] = useState({
        new_status: "",
        note: "",
        activity_id: 0
    });
    const [errors, setErrors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(()=>{
        setFormData(prev=> ({
            ...prev,
            new_status: currentStatus.status,
            activity_id: currentStatus.activity_id
        }));
    },[currentStatus]);

    const handleInputChange =(e)=>{
         const { name, value } = e.target;
            setFormData(prev => ({
            ...prev,
            [name]: value
            }));
    };

    const handleSubmit = async (e)=>{
      e.preventDefault();
        if(formData.note.length < 5){
            setErrors(true);
            return;
        }
        if(currentStatus.activity_id){
          console.log(formData);
          const response = await saveNotes(formData);
          console.log(response);
          setIsSuccesssNote(true);
          onClose();
        }
        console.log("hit");
    };
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
              Add Note
            </h1>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                New Status
              </label>
              <input
                type="text"
                name="activityName"
                value={formData.new_status}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                readOnly
              />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    Note *
                </label>

                <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={8} // you can adjust how tall it starts
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 transition-all resize-none"
                    placeholder="Add your note..."
                />

                {errors && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    Invalid Note
                    </p>
                )}
                </div>


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
          className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
