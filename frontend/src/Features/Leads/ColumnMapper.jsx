import { useState } from "react";
import {
  Link2,
  Link2Off,
  Wand2,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// Known aliases for auto-detection
const FIELD_ALIASES = {
  created_time: [
    "created time",
    "created_time",
    "date",
    "created date",
    "submission date",
    "timestamp",
    "created",
    "time",
    "submitted at",
  ],
  full_name: [
    "full name",
    "full_name",
    "name",
    "fullname",
    "lead name",
    "customer name",
    "contact name",
    "user name",
    "username",
  ],
  email: [
    "email",
    "email address",
    "e-mail",
    "email_address",
    "mail",
    "e mail",
    "contact email",
  ],
  phone_number: [
    "phone number",
    "phone_number",
    "full phone number",
    "tp",
    "phone",
    "mobile",
    "contact number",
    "mobile number",
    "telephone",
    "tel",
    "cell",
    "contact no",
  ],
  ad_name: ["ad name", "ad_name", "advertisement", "ad", "campaign name", "campaign"],
  form_name: ["form name", "form_name", "form", "lead form", "source form"],
};

// Our target fields with labels and descriptions
const TARGET_FIELDS = [
  { key: "created_time", label: "Created Time", description: "Lead submission timestamp", required: false },
  { key: "full_name", label: "Full Name", description: "User's full name", required: true },
  { key: "email", label: "Email", description: "User's email address", required: false },
  { key: "phone_number", label: "Phone Number", description: "Phone with country code", required: false },
  { key: "ad_name", label: "Ad Name", description: "Name of the ad (optional)", required: false },
  { key: "form_name", label: "Form Name", description: "Name of the lead form (optional)", required: false },
];

export function autoDetectMapping(excelHeaders) {
  const mapping = {};
  const normalizedHeaders = excelHeaders.map((h) => h.toLowerCase().trim());

  for (const field of TARGET_FIELDS) {
    const aliases = FIELD_ALIASES[field.key] || [];
    const matchIndex = normalizedHeaders.findIndex((h) =>
      aliases.some((alias) => h === alias || h.includes(alias))
    );
    if (matchIndex !== -1) {
      mapping[excelHeaders[matchIndex]] = field.key;
    }
  }
  return mapping;
}

export function isAutoMappingComplete(mapping) {
  const mappedTargets = new Set(Object.values(mapping));
  const requiredFields = TARGET_FIELDS.filter((f) => f.required);
  return requiredFields.every((f) => mappedTargets.has(f.key));
}

export default function ColumnMapper({
  excelHeaders,
  sampleData,
  initialMapping = {},
  onConfirm,
  onCancel,
}) {
  const [mapping, setMapping] = useState(initialMapping);
  const [selectedExcelCol, setSelectedExcelCol] = useState(null);

  const mappedTargets = new Set(Object.values(mapping));
  const mappedSources = new Set(Object.keys(mapping));

  const handleExcelColumnClick = (header) => {
    if (mappedSources.has(header)) {
      // Unmap it
      const newMapping = { ...mapping };
      delete newMapping[header];
      setMapping(newMapping);
      setSelectedExcelCol(null);
    } else {
      setSelectedExcelCol(header === selectedExcelCol ? null : header);
    }
  };

  const handleTargetFieldClick = (fieldKey) => {
    if (!selectedExcelCol) return;

    // If target is already mapped by another source, remove old mapping
    const newMapping = { ...mapping };
    for (const [src, tgt] of Object.entries(newMapping)) {
      if (tgt === fieldKey) {
        delete newMapping[src];
      }
    }
    newMapping[selectedExcelCol] = fieldKey;
    setMapping(newMapping);
    setSelectedExcelCol(null);
  };

  const handleAutoDetect = () => {
    const detected = autoDetectMapping(excelHeaders);
    setMapping(detected);
    setSelectedExcelCol(null);
  };

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  // Get sample value for a header
  const getSampleValue = (header) => {
    if (!sampleData || sampleData.length === 0) return "—";
    const val = sampleData[0][header];
    if (val === undefined || val === null || val === "") return "—";
    const str = String(val);
    return str.length > 30 ? str.substring(0, 30) + "..." : str;
  };

  // Find which excel column maps to a target field
  const getSourceForTarget = (fieldKey) => {
    return Object.entries(mapping).find(([, tgt]) => tgt === fieldKey)?.[0] || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Map Excel Columns to Lead Fields
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Click an Excel column on the left, then click the matching field on the right to connect them.
          </p>
        </div>
        <button
          onClick={handleAutoDetect}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Wand2 className="w-4 h-4" />
          Auto Detect
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Side - Excel Columns */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Excel Columns ({excelHeaders.length})
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {excelHeaders.map((header) => {
              const isMapped = mappedSources.has(header);
              const isSelected = selectedExcelCol === header;
              const targetKey = mapping[header];
              const targetField = TARGET_FIELDS.find((f) => f.key === targetKey);

              return (
                <button
                  key={header}
                  onClick={() => handleExcelColumnClick(header)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isMapped
                      ? "border-green-300 bg-green-50"
                      : isSelected
                      ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isMapped ? (
                          <Link2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Link2Off className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 truncate">{header}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6 truncate">
                        Sample: {getSampleValue(header)}
                      </p>
                    </div>
                    {isMapped && targetField && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0 ml-2">
                        <ArrowRight className="w-3 h-3" />
                        {targetField.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Our Fields */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Lead Fields
          </h4>
          <div className="space-y-2">
            {TARGET_FIELDS.map((field) => {
              const isMapped = mappedTargets.has(field.key);
              const sourceCol = getSourceForTarget(field.key);
              const isClickable = selectedExcelCol !== null;

              return (
                <button
                  key={field.key}
                  onClick={() => handleTargetFieldClick(field.key)}
                  disabled={!isClickable}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isMapped
                      ? "border-green-300 bg-green-50"
                      : isClickable
                      ? "border-orange-200 bg-orange-50 hover:border-orange-400 cursor-pointer"
                      : "border-slate-200 bg-slate-50 cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isMapped ? (
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : field.required ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6">{field.description}</p>
                    </div>
                    {isMapped && sourceCol && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0 ml-2 truncate max-w-[120px]">
                        {sourceCol}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-green-700">{Object.keys(mapping).length}</span> of{" "}
            <span className="font-medium">{TARGET_FIELDS.length}</span> fields mapped
          </div>
          {selectedExcelCol && (
            <div className="text-sm text-orange-600 font-medium">
              Now click a target field to map "{selectedExcelCol}"
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleConfirm}
          disabled={Object.keys(mapping).length === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
        >
          <Check className="w-5 h-5" />
          Confirm Mapping ({Object.keys(mapping).length} fields)
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
