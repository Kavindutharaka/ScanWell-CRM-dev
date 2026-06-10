import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { fetchEmployees } from "../../api/PMApi";
import {
  fetchTargetConfig,
  updateTargetConfig,
  fetchAllTargets,
  saveEmployeeTarget,
} from "../../api/SalesTargetApi";
import { toast } from '../../components/Toast';
import {
  Target,
  Settings,
  Save,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  Check,
  Search,
} from "lucide-react";

// Month labels
const MONTHS = [
  { key: "jan", label: "Jan", idx: 1 },
  { key: "feb", label: "Feb", idx: 2 },
  { key: "mar", label: "Mar", idx: 3 },
  { key: "apr", label: "Apr", idx: 4 },
  { key: "may", label: "May", idx: 5 },
  { key: "jun", label: "Jun", idx: 6 },
  { key: "jul", label: "Jul", idx: 7 },
  { key: "aug", label: "Aug", idx: 8 },
  { key: "sep", label: "Sep", idx: 9 },
  { key: "oct", label: "Oct", idx: 10 },
  { key: "nov", label: "Nov", idx: 11 },
  { key: "dec", label: "Dec", idx: 12 },
];

// Quarter color classes
const Q_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", header: "bg-blue-100" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", header: "bg-emerald-100" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", header: "bg-amber-100" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", header: "bg-purple-100" },
];

// Get quarters based on financial year start
function getQuarters(fyStart) {
  const quarters = [];
  for (let q = 0; q < 4; q++) {
    const startMonth = ((fyStart - 1 + q * 3) % 12) + 1;
    const monthIndices = [
      startMonth,
      ((startMonth) % 12) + 1,
      ((startMonth + 1) % 12) + 1,
    ];
    // Fix: handle wrapping correctly
    const m1 = startMonth;
    const m2 = m1 === 12 ? 1 : m1 + 1;
    const m3 = m2 === 12 ? 1 : m2 + 1;
    quarters.push({
      label: `Q${q + 1}`,
      months: [m1, m2, m3], // 1-indexed month numbers
    });
  }
  return quarters;
}

// Get month key from 1-indexed month number
function monthKey(monthNum) {
  return MONTHS[monthNum - 1]?.key || "";
}

export default function SalesTargetSec() {
  const { permission, user } = useContext(AuthContext);
  const isAdmin = permission?.IsAdmin;
  // Sales Target module permissions (managed via Role Management).
  // Edit covers saving targets/config; Add is treated the same since the page
  // upserts rows rather than having a separate "create" flow.
  const canEditTargets = isAdmin || permission?.SalesTargetEdit || permission?.SalesTargetAdd || false;
  const tableScrollRef = useRef(null);

  // State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fyConfig, setFyConfig] = useState({ financialYearStart: 1 });
  const [fyLoading, setFyLoading] = useState(false);
  const [fySaving, setFySaving] = useState(false);
  const [fyStartEdit, setFyStartEdit] = useState(1);

  const [employees, setEmployees] = useState([]);
  const [targets, setTargets] = useState({}); // { employeeId: { jan: 0, feb: 0, ..., annual: 0, id: null, dirty: false } }
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState(null); // employeeId currently saving
  const [saveSuccess, setSaveSuccess] = useState(null); // employeeId that just saved
  const [searchQuery, setSearchQuery] = useState("");

  // Load config
  const loadConfig = useCallback(async () => {
    setFyLoading(true);
    try {
      const data = await fetchTargetConfig();
      setFyConfig(data);
      setFyStartEdit(data.financialYearStart || 1);
    } catch (err) {
      console.error("Config load error:", err);
    } finally {
      setFyLoading(false);
    }
  }, []);

  // Load employees + targets
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, targetData] = await Promise.all([
        fetchEmployees(),
        fetchAllTargets(selectedYear),
      ]);

      // Filter active employees only
      const activeEmps = (Array.isArray(empData) ? empData : []).filter(
        (e) => e.status === "Active" || e.status === "active"
      );
      setEmployees(activeEmps);

      // Build targets map
      const targetMap = {};
      const tarr = Array.isArray(targetData) ? targetData : [];
      tarr.forEach((t) => {
        const empId = t.employee_id || t.employeeId;
        targetMap[empId] = {
          id: t.id,
          jan: parseFloat(t.jan_target || t.janTarget || 0),
          feb: parseFloat(t.feb_target || t.febTarget || 0),
          mar: parseFloat(t.mar_target || t.marTarget || 0),
          apr: parseFloat(t.apr_target || t.aprTarget || 0),
          may: parseFloat(t.may_target || t.mayTarget || 0),
          jun: parseFloat(t.jun_target || t.junTarget || 0),
          jul: parseFloat(t.jul_target || t.julTarget || 0),
          aug: parseFloat(t.aug_target || t.augTarget || 0),
          sep: parseFloat(t.sep_target || t.sepTarget || 0),
          oct: parseFloat(t.oct_target || t.octTarget || 0),
          nov: parseFloat(t.nov_target || t.novTarget || 0),
          dec: parseFloat(t.dec_target || t.decTarget || 0),
          annual: parseFloat(t.annual_target || t.annualTarget || 0),
          dirty: false,
        };
      });

      // Ensure all active employees have an entry
      activeEmps.forEach((e) => {
        const id = String(e.sysID || e.SysID);
        if (!targetMap[id]) {
          targetMap[id] = {
            id: null,
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
            annual: 0,
            dirty: false,
          };
        }
      });

      setTargets(targetMap);
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save financial year config
  const handleSaveConfig = async () => {
    setFySaving(true);
    try {
      await updateTargetConfig({
        financialYearStart: fyStartEdit,
        updatedBy: user?.username || "Admin",
      });
      setFyConfig({ ...fyConfig, financialYearStart: fyStartEdit });
    } catch (err) {
      console.error("Config save error:", err);
      toast.error("Failed to save financial year configuration.");
    } finally {
      setFySaving(false);
    }
  };

  // Handle monthly target change
  const handleTargetChange = (employeeId, monthKey, value) => {
    setTargets((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [monthKey]: value === "" ? 0 : parseFloat(value) || 0,
        dirty: true,
      },
    }));
  };

  // Handle annual target change
  const handleAnnualChange = (employeeId, value) => {
    setTargets((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        annual: value === "" ? 0 : parseFloat(value) || 0,
        dirty: true,
      },
    }));
  };

  // Save single employee target
  const handleSaveRow = async (employeeId) => {
    const t = targets[employeeId];
    if (!t) return;
    setSavingRow(employeeId);
    try {
      await saveEmployeeTarget({
        employeeId: employeeId,
        year: selectedYear,
        janTarget: t.jan,
        febTarget: t.feb,
        marTarget: t.mar,
        aprTarget: t.apr,
        mayTarget: t.may,
        junTarget: t.jun,
        julTarget: t.jul,
        augTarget: t.aug,
        sepTarget: t.sep,
        octTarget: t.oct,
        novTarget: t.nov,
        decTarget: t.dec,
        annualTarget: t.annual,
        updatedBy: user?.username || "Admin",
      });
      setTargets((prev) => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], dirty: false },
      }));
      setSaveSuccess(employeeId);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save target.");
    } finally {
      setSavingRow(null);
    }
  };

  // Calculate quarter total for an employee
  const getQuarterTotal = (employeeId, quarterMonths) => {
    const t = targets[employeeId];
    if (!t) return 0;
    return quarterMonths.reduce((sum, mIdx) => sum + (t[monthKey(mIdx)] || 0), 0);
  };

  // Calculate monthly total (sum of all months)
  const getMonthlySum = (employeeId) => {
    const t = targets[employeeId];
    if (!t) return 0;
    return MONTHS.reduce((sum, m) => sum + (t[m.key] || 0), 0);
  };

  // Scroll table
  const scrollTable = (direction) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  const quarters = getQuarters(fyConfig.financialYearStart || 1);

  // Reorder months based on financial year start for display
  const orderedMonths = [];
  const fyStart = fyConfig.financialYearStart || 1;
  for (let i = 0; i < 12; i++) {
    const mIdx = ((fyStart - 1 + i) % 12); // 0-indexed
    orderedMonths.push(MONTHS[mIdx]);
  }

  // Get financial year label
  const getFYLabel = () => {
    if (fyStart === 1) return `Jan ${selectedYear} - Dec ${selectedYear}`;
    return `Apr ${selectedYear} - Mar ${selectedYear + 1}`;
  };

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 2; y <= currentYear + 3; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-600" />
              Sales Target
            </h1>
            <p className="text-slate-500 mt-1">
              Set and manage sales targets per employee
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Year Config Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Financial Year Configuration
            </h2>
            <span className="text-xs text-slate-400 ml-2">(Common for all employees)</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
                Financial Year Begins:
              </label>
              <select
                value={fyStartEdit}
                onChange={(e) => setFyStartEdit(parseInt(e.target.value))}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-medium"
              >
                <option value={1}>January</option>
                <option value={4}>April</option>
              </select>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={!canEditTargets || fySaving || fyStartEdit === fyConfig.financialYearStart}
              title={!canEditTargets ? 'You need Sales Target edit permission' : undefined}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {fySaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Config
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                FY: {getFYLabel()} &nbsp;|&nbsp;
                {quarters.map((q, i) => (
                  <span key={i} className={`font-medium ${Q_COLORS[i].text}`}>
                    {q.label}:{MONTHS[q.months[0] - 1]?.label}-{MONTHS[q.months[2] - 1]?.label}
                    {i < 3 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Target Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Header Bar */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  Employee Targets — {selectedYear}
                </h3>
                <span className="text-sm opacity-80">
                  ({employees.length} employees)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollTable("left")}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTable("right")}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Search Bar */}
            {/* <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee by name, position, department..."
                className="w-full pl-9 pr-4 py-2 bg-white/15 border border-white/25 rounded-lg text-sm text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20"
              />
            </div> */}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading targets...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No active employees found.</p>
            </div>
          ) : (
            <div
              ref={tableScrollRef}
              className="overflow-x-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <table className="w-full min-w-[1200px]">
                {/* Quarter Headers */}
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-100 px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200 w-[180px] min-w-[180px]">
                      &nbsp;
                    </th>
                    {quarters.map((q, qi) => (
                      <th
                        key={qi}
                        colSpan={3}
                        className={`px-2 py-2 text-center text-xs font-bold border-b border-slate-200 ${Q_COLORS[qi].header} ${Q_COLORS[qi].text}`}
                      >
                        {q.label} ({MONTHS[q.months[0] - 1]?.label}-{MONTHS[q.months[2] - 1]?.label})
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-bold border-b border-slate-200 bg-orange-100 text-orange-700 w-[110px]">
                      Annual
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-bold border-b border-slate-200 bg-slate-100 text-slate-600 w-[100px]">
                      Monthly Sum
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold border-b border-slate-200 bg-slate-100 w-[80px]">
                      &nbsp;
                    </th>
                  </tr>
                  {/* Month Headers */}
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                      Employee
                    </th>
                    {orderedMonths.map((m, i) => {
                      const qi = Math.floor(i / 3);
                      return (
                        <th
                          key={m.key}
                          className={`px-2 py-2 text-center text-xs font-semibold border-b border-slate-200 ${Q_COLORS[qi].bg} ${Q_COLORS[qi].text} w-[85px] min-w-[85px]`}
                        >
                          {m.label}
                        </th>
                      );
                    })}
                    <th className="px-3 py-2 text-center text-xs font-semibold border-b border-slate-200 bg-orange-50 text-orange-700 w-[110px]">
                      Target
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold border-b border-slate-200 bg-slate-50 text-slate-500 w-[100px]">
                      Total
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold border-b border-slate-200 bg-slate-50 w-[80px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const empId = String(emp.sysID || emp.SysID);
                    const t = targets[empId] || {};
                    const monthlySum = getMonthlySum(empId);
                    const isSaving = savingRow === empId;
                    const justSaved = saveSuccess === empId;

                    return (
                      <tr
                        key={empId}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          t.dirty ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Employee Name - Sticky */}
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700 flex-shrink-0">
                              {(emp.fname?.[0] || "").toUpperCase()}
                              {(emp.lname?.[0] || "").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {emp.fname} {emp.lname}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {emp.position || emp.department || ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Monthly Inputs */}
                        {orderedMonths.map((m, i) => {
                          const qi = Math.floor(i / 3);
                          return (
                            <td
                              key={m.key}
                              className={`px-1 py-2 text-center ${Q_COLORS[qi].bg} border-r border-slate-100/50`}
                            >
                              <input
                                type="number"
                                value={t[m.key] || ""}
                                onChange={(e) =>
                                  handleTargetChange(empId, m.key, e.target.value)
                                }
                                placeholder="0"
                                className={`w-full px-2 py-1.5 text-sm text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white ${
                                  t[m.key] > 0
                                    ? "border-slate-300 text-slate-800 font-medium"
                                    : "border-slate-200 text-slate-400"
                                }`}
                                min="0"
                                step="100"
                              />
                            </td>
                          );
                        })}

                        {/* Annual Target */}
                        <td className="px-2 py-2 text-center bg-orange-50/50 border-r border-slate-100">
                          <input
                            type="number"
                            value={t.annual || ""}
                            onChange={(e) =>
                              handleAnnualChange(empId, e.target.value)
                            }
                            placeholder="0"
                            className={`w-full px-2 py-1.5 text-sm text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white font-semibold ${
                              t.annual > 0
                                ? "border-orange-300 text-orange-700"
                                : "border-slate-200 text-slate-400"
                            }`}
                            min="0"
                            step="1000"
                          />
                        </td>

                        {/* Monthly Sum (read-only) */}
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-sm font-semibold ${
                              monthlySum > 0 ? "text-slate-700" : "text-slate-300"
                            }`}
                          >
                            {monthlySum > 0
                              ? monthlySum.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })
                              : "—"}
                          </span>
                        </td>

                        {/* Save Button */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleSaveRow(empId)}
                            disabled={!canEditTargets || isSaving || !t.dirty}
                            title={!canEditTargets ? 'You need Sales Target edit permission' : undefined}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              justSaved
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : t.dirty
                                ? "bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : justSaved ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            {isSaving ? "..." : justSaved ? "Saved" : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Quarter Totals Footer */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-200">
                      Quarter Totals
                    </td>
                    {quarters.map((q, qi) =>
                      q.months.map((mIdx, mi) => {
                        // Sum all employees for this month
                        const colTotal = employees.reduce((sum, emp) => {
                          const empId = String(emp.sysID || emp.SysID);
                          return sum + (targets[empId]?.[monthKey(mIdx)] || 0);
                        }, 0);
                        return (
                          <td
                            key={`${qi}-${mi}`}
                            className={`px-2 py-3 text-center text-xs font-bold ${Q_COLORS[qi].bg} ${Q_COLORS[qi].text} border-r border-slate-200/50`}
                          >
                            {colTotal > 0 ? colTotal.toLocaleString() : "—"}
                          </td>
                        );
                      })
                    )}
                    {/* Annual total */}
                    <td className="px-3 py-3 text-center text-xs font-bold text-orange-700 bg-orange-50">
                      {employees
                        .reduce((sum, emp) => {
                          const empId = String(emp.sysID || emp.SysID);
                          return sum + (targets[empId]?.annual || 0);
                        }, 0)
                        .toLocaleString() || "—"}
                    </td>
                    {/* Monthly sum total */}
                    <td className="px-3 py-3 text-center text-xs font-bold text-slate-600">
                      {employees
                        .reduce((sum, emp) => {
                          const empId = String(emp.sysID || emp.SysID);
                          return sum + getMonthlySum(empId);
                        }, 0)
                        .toLocaleString() || "—"}
                    </td>
                    <td className="px-3 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Monthly targets are stored by calendar month. The financial year configuration only
            affects how quarters (Q1–Q4) are grouped for display and dashboard reporting. Changing
            the financial year start does not affect saved target data.
          </p>
        </div>
      </div>
    </div>
  );
}
