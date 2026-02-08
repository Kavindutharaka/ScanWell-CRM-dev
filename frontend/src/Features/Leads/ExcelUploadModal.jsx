import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import ColumnMapper, { autoDetectMapping, isAutoMappingComplete } from "./ColumnMapper";
import { bulkCreateLeads } from "../../api/LeadApi";

const STEPS = ["Upload File", "Map Columns", "Preview & Import"];

export default function ExcelUploadModal({ onClose, onImportSuccess }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [mappedData, setMappedData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Step 1: Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setError(null);
    setFile(selectedFile);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setError("No sheets found in the Excel file.");
        return;
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) {
        setError("The Excel file is empty or has no data rows.");
        return;
      }

      const headers = Object.keys(jsonData[0]);
      setExcelHeaders(headers);
      setRawData(jsonData);

      // Try auto-detect mapping
      const detected = autoDetectMapping(headers);
      setMapping(detected);

      // If auto-mapping found all required fields, skip to preview
      if (isAutoMappingComplete(detected) && Object.keys(detected).length >= 3) {
        const mapped = applyMapping(jsonData, detected);
        setMappedData(mapped);
        setStep(2); // Skip to preview
      } else {
        setStep(1); // Show column mapper
      }
    } catch (err) {
      setError(`Failed to read Excel file: ${err.message}`);
    }
  };

  // Apply mapping to transform raw data into our lead format
  const applyMapping = (data, currentMapping) => {
    // Invert the mapping: target_field -> source_column
    const invertedMapping = {};
    for (const [source, target] of Object.entries(currentMapping)) {
      invertedMapping[target] = source;
    }

    return data.map((row) => {
      const lead = {};

      if (invertedMapping.created_time) {
        const val = row[invertedMapping.created_time];
        lead.createdTime = parseDate(val);
      } else {
        lead.createdTime = null;
      }

      lead.fullName = invertedMapping.full_name ? String(row[invertedMapping.full_name] || "") : "";
      lead.email = invertedMapping.email ? String(row[invertedMapping.email] || "") : "";
      lead.phoneNumber = invertedMapping.phone_number ? String(row[invertedMapping.phone_number] || "") : "";
      lead.adName = invertedMapping.ad_name ? String(row[invertedMapping.ad_name] || "") : "";
      lead.formName = invertedMapping.form_name ? String(row[invertedMapping.form_name] || "") : "";

      return lead;
    });
  };

  // Parse various date formats from Excel
  const parseDate = (val) => {
    if (!val && val !== 0) return null;
    // Excel serial number
    if (typeof val === "number") {
      const date = new Date((val - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    // String date
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString();
  };

  // Step 2: Column mapping confirmed
  const handleMappingConfirm = (confirmedMapping) => {
    setMapping(confirmedMapping);
    const mapped = applyMapping(rawData, confirmedMapping);
    setMappedData(mapped);
    setStep(2);
  };

  // Step 3: Import
  const handleImport = async () => {
    if (mappedData.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await bulkCreateLeads(mappedData);
      setImportResult(result);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Import Leads from Excel</h1>
            <p className="text-sm text-slate-600">Upload and map your lead data</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/70 rounded-lg transition-colors group"
        >
          <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  i === step ? "text-orange-700" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {importResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">{importResult.message}</p>
              <p className="text-xs text-green-600 mt-1">
                You can close this dialog now.
              </p>
            </div>
          </div>
        )}

        {/* Step 0: Upload File */}
        {step === 0 && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-orange-400 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-2">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-slate-500">
                Excel files (.xlsx, .xls) only
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Expected Columns
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div>Created Time / Date</div>
                <div>Full Name / Name</div>
                <div>Email / Email Address</div>
                <div>Phone Number / TP</div>
                <div>Ad Name (optional)</div>
                <div>Form Name (optional)</div>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Your Excel may have extra columns — only the above will be imported. If headers don't match, you'll be able to map them manually.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Column Mapping */}
        {step === 1 && (
          <ColumnMapper
            excelHeaders={excelHeaders}
            sampleData={rawData.slice(0, 3)}
            initialMapping={mapping}
            onConfirm={handleMappingConfirm}
            onCancel={() => {
              setStep(0);
              setFile(null);
              setExcelHeaders([]);
              setRawData([]);
              setMapping({});
            }}
          />
        )}

        {/* Step 2: Preview & Import */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Data Preview
                </h3>
                <p className="text-sm text-slate-500">
                  {mappedData.length} lead(s) ready to import
                  {mappedData.length > 10 && " (showing first 10)"}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Mapping
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Full Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ad Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Form Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedData.slice(0, 10).map((lead, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(lead.createdTime)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{lead.fullName || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{lead.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{lead.phoneNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{lead.adName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{lead.formName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Actions */}
            {!importResult && (
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleImport}
                  disabled={isImporting || mappedData.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import {mappedData.length} Lead(s)
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {importResult && (
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
