// Read-only view modal for an employee. Opened by the Eye-icon button in the table row.

import { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, Building2, MapPin, Users as UsersIcon, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { BASE_URL } from '../../config/apiConfig';

// Build an absolute URL for the stored profile_image path.
const buildImageSrc = (relUrl) => {
  if (!relUrl) return null;
  if (relUrl.startsWith('http://') || relUrl.startsWith('https://')) return relUrl;
  const apiRoot = BASE_URL.replace(/\/api\/?$/, '');
  return `${apiRoot}${relUrl.startsWith('/') ? '' : '/'}${relUrl}`;
};

const Field = ({ label, value, icon: Icon }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
    <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 min-h-[36px] flex items-center break-words">
      {value || <span className="text-slate-400">—</span>}
    </div>
  </div>
);

export default function EmployeeViewModal({ employee, onClose, onEdit }) {
  const [imgError, setImgError] = useState(false);
  if (!employee) return null;

  const fullName = [employee.fname, employee.lname].filter(Boolean).join(' ') || 'Unknown';
  const empId = `EMP-${String(employee.sysID || 0).padStart(3, '0')}`;
  const isActive = (employee.status || '').toLowerCase() === 'active';
  const initials = ((employee.fname || '').charAt(0) + (employee.lname || '').charAt(0)).toUpperCase() || '?';
  const photoSrc = !imgError ? buildImageSrc(employee.profile_image) : null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Gradient header with avatar */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-28 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-full w-24 h-24 flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white overflow-hidden">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="pt-16 px-6 pb-6 overflow-y-auto">
          {/* Name + status row */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{fullName}</h2>
              <div className="text-sm text-slate-500 mt-0.5">
                {empId}
                {employee.position && <span className="mx-2 text-slate-300">·</span>}
                {employee.position}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {isActive
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                : <><XCircle className="w-3.5 h-3.5" /> {employee.status || 'Disabled'}</>}
            </span>
          </div>

          {/* Personal info */}
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="First Name" value={employee.fname} />
            <Field label="Last Name" value={employee.lname} />
            <Field label="Email" value={employee.email} icon={Mail} />
            <Field label="Phone" value={employee.tp} icon={Phone} />
          </div>

          {/* Work info */}
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Work Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Field label="Position" value={employee.position} icon={Briefcase} />
            <Field label="Department" value={employee.department} icon={Building2} />
            <Field label="Work Location" value={employee.w_location} icon={MapPin} />
            <Field label="Assigned Manager" value={employee.a_manager} icon={UsersIcon} />
          </div>

          {/* Notes (full width) */}
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Notes
          </h3>
          <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-800 min-h-[44px] whitespace-pre-line break-words">
            {employee.note || <span className="text-slate-400">No notes added</span>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => { onClose(); onEdit(employee); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              Edit Employee
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
