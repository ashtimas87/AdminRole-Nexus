import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Utility to determine the storage key's user component.
 */
const getEffectiveUserId = (prefix: string, userId: string, role: UserRole): string => {
  if (prefix === 'target' && role === UserRole.STATION) {
    return 'shared_station_target_pool';
  }
  return userId;
};

// Helper to get shared definitions
const getSharedActivityName = (year: string, userId: string, piId: string, activityId: string, defaultName: string): string => {
  const scoped = localStorage.getItem(`pi_activity_name_${year}_${userId}_${piId}_${activityId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_activity_name_${year}_${piId}_${activityId}`);
  return global || defaultName;
};

const getSharedIndicatorName = (year: string, userId: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const scoped = localStorage.getItem(`pi_indicator_name_${year}_${userId}_${piId}_${activityId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_indicator_name_${year}_${piId}_${activityId}`);
  return global || defaultIndicator;
};

const getSharedPITitle = (year: string, userId: string, piId: string, defaultTitle: string): string => {
  const scoped = localStorage.getItem(`pi_title_${year}_${userId}_${piId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_title_${year}_${piId}`);
  return global || defaultTitle;
};

const getSharedTabLabel = (year: string, userId: string, piId: string, defaultLabel: string): string => {
  const scoped = localStorage.getItem(`pi_tab_label_${year}_${userId}_${piId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_tab_label_${year}_${piId}`);
  return global || defaultLabel;
};

const getSharedDataValue = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, monthIdx: number, defaultValue: number): number => {
  const effectiveId = getEffectiveUserId(prefix, userId, role);
  const key = `${prefix}_${year}_${effectiveId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

const getSharedFiles = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const effectiveId = getEffectiveUserId(prefix, userId, role);
  const key = `files_${prefix}_${year}_${effectiveId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, defaultValues: number[]): MonthData[] => {
  const isStation = role === UserRole.STATION;
  const isCHQ = role === UserRole.CHQ;
  const zeroDefaultYears = ['2026', '2025', '2024', '2023'];
  
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let defVal = defaultValues[mIdx] || 0;
    if (prefix === 'accomplishment' && ((zeroDefaultYears.includes(year) && (isStation || isCHQ)) || (year === '2025' && isCHQ))) {
      defVal = 0;
    }
    
    return {
      value: getSharedDataValue(prefix, year, userId, role, piId, activityId, mIdx, defVal),
      files: getSharedFiles(prefix, year, userId, role, piId, activityId, mIdx)
    };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole) => {
  const is2026 = year === '2026';
  const is2025 = year === '2025';
  const isCiuUser = userId === 'chq-2'; 
  
  const baseDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: is2025 ? [] : (is2026 ? [
        { id: "pi1_26_1", name: "Implementation of Stratcom Snapshots", indicator: "No. of StratCom snapshot formulated", defaults: Array(12).fill(11) },
        { id: "pi1_26_2", name: "Implementation of information Operation (IO) Plans (Non-lethal actions)", indicator: "No. of IO implemented", defaults: Array(12).fill(11) }
      ] : [])
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { id: "pi2_f_1", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts...", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }
      ]
    }
  ];

  const storedCustomPIsStr = localStorage.getItem(`custom_pi_definitions_${year}`);
  const customPIs = storedCustomPIsStr ? JSON.parse(storedCustomPIsStr) : [];
  let allDefinitions = [...baseDefinitions, ...customPIs];

  return allDefinitions.map(pi => {
    const unitSpecificIdsKey = `pi_activity_ids_${year}_${userId}_${pi.id}`;
    const globalIdsKey = `pi_activity_ids_${year}_${pi.id}`;
    const unitSpecificIds = localStorage.getItem(unitSpecificIdsKey);
    const globalIds = localStorage.getItem(globalIdsKey);
    
    let activityIds = unitSpecificIds ? JSON.parse(unitSpecificIds) : (globalIds ? JSON.parse(globalIds) : pi.activities.map(a => a.id));

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(year, userId, pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(year, userId, pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(prefix, year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return { id: pi.id, title: getSharedPITitle(year, userId, pi.id, pi.title), activities: fullActivities };
  });
};

const generateStructuredPIs = (prefix: string, year: string, subjectUser: User, mode: 'normal' | 'zero' | 'consolidated', dashboardType: 'OPERATIONAL' | 'CHQ' | 'TACTICAL', isTargetOutlook: boolean): PIData[] => {
  const definitions = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role);
  return definitions.map((def) => ({
    id: def.id,
    title: def.title,
    activities: def.activities.map((act) => ({
      id: act.id,
      activity: act.activity,
      indicator: act.indicator,
      months: act.months,
      total: act.months.reduce((a, b) => a + b.value, 0)
    }))
  }));
};

interface OperationalDashboardProps { title: string; onBack: () => void; currentUser: User; subjectUser: User; }

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [dataMode, setDataMode] = useState<'normal' | 'zero' | 'consolidated'>('normal');
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingLabel, setEditingLabel] = useState<{ rowIdx: number; field: 'activity' | 'indicator' } | null>(null);
  const [textEditValue, setTextEditValue] = useState<string>('');
  
  // File states
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeFileCell, setActiveFileCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const dataPrefix = isTargetOutlook ? 'target' : 'accomplishment';

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;

  const refreshData = () => {
    const isMainView = subjectUser.id === currentUser.id;
    let mode: 'normal' | 'zero' | 'consolidated' = (isAdmin && (isMainView || subjectUser.role === UserRole.SUB_ADMIN)) ? 'consolidated' : 'normal';
    setDataMode(mode);
    setPiData(generateStructuredPIs(dataPrefix, dashboardYear, subjectUser, mode, 'OPERATIONAL', isTargetOutlook));
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear, activeTab]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    if ((isTargetOutlook && isSuperAdmin) || (!isTargetOutlook && ((isSuperAdmin && dataMode !== 'consolidated') || (currentUser.id === subjectUser.id)))) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEditValue = () => {
    if (!editingCell || !currentPI) return;
    const newValue = parseInt(editValue, 10) || 0;
    const activityId = currentPI.activities[editingCell.rowIdx].id;
    const effectiveId = getEffectiveUserId(dataPrefix, subjectUser.id, subjectUser.role);
    localStorage.setItem(`${dataPrefix}_${dashboardYear}_${effectiveId}_${activeTab}_${activityId}_${editingCell.monthIdx}`, String(newValue));
    refreshData();
    setEditingCell(null);
  };

  const handleOpenFiles = (e: React.MouseEvent, rowIdx: number, monthIdx: number) => {
    e.stopPropagation();
    setActiveFileCell({ rowIdx, monthIdx });
    setIsFilesModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFileCell || !currentPI) return;

    const reader = new FileReader();
    reader.onload = () => {
      const activityId = currentPI.activities[activeFileCell.rowIdx].id;
      const effectiveId = getEffectiveUserId(dataPrefix, subjectUser.id, subjectUser.role);
      const storageKey = `files_${dataPrefix}_${dashboardYear}_${effectiveId}_${activeTab}_${activityId}_${activeFileCell.monthIdx}`;
      
      const existingFiles: MonthFile[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const newFile: MonthFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: reader.result as string, // base64 for demo
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify([...existingFiles, newFile]));
      refreshData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fileId: string) => {
    if (!activeFileCell || !currentPI) return;
    const activityId = currentPI.activities[activeFileCell.rowIdx].id;
    const effectiveId = getEffectiveUserId(dataPrefix, subjectUser.id, subjectUser.role);
    const storageKey = `files_${dataPrefix}_${dashboardYear}_${effectiveId}_${activeTab}_${activityId}_${activeFileCell.monthIdx}`;
    const existingFiles: MonthFile[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify(existingFiles.filter(f => f.id !== fileId)));
    refreshData();
  };

  if (!currentPI) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">Back to Overview</button>
          <div className="flex flex-wrap items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-widest">{dataMode === 'consolidated' ? 'CONSOLIDATED' : `UNIT: ${subjectUser.name}`}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr className="bg-[#FFFF00] font-bold uppercase">
                <th rowSpan={2} className="border border-slate-300 p-2 w-72">Activity</th>
                <th rowSpan={2} className="border border-slate-300 p-2 w-72">Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-white text-sm">MONTHS</th>
                <th rowSpan={2} className="border border-slate-300 p-2 w-16">Total</th>
              </tr>
              <tr className="bg-[#FFFF00]">
                {MONTHS.map(m => <th key={m} className="border border-slate-300 p-1.5 w-11">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => (
                <tr key={row.id} className="hover:bg-blue-50/30">
                  <td className="border border-slate-300 p-2 font-medium">{row.activity}</td>
                  <td className="border border-slate-300 p-2">{row.indicator}</td>
                  {row.months.map((m, mIdx) => (
                    <td key={mIdx} className="border border-slate-300 p-1 text-center relative group">
                      {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                        <input autoFocus className="w-full bg-white border border-blue-500 rounded text-center outline-none font-black" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} />
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[36px]">
                          <span className="text-blue-700 font-bold cursor-pointer hover:underline" onClick={() => handleCellClick(rIdx, mIdx, m.value)}>{m.value}</span>
                          <button 
                            onClick={(e) => handleOpenFiles(e, rIdx, mIdx)}
                            className={`mt-1 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-black transition-all ${m.files.length > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100'}`}
                          >
                            {m.files.length > 0 ? `📎 ${m.files.length}` : '+ FILE'}
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="border border-slate-300 p-1.5 text-center font-black bg-slate-50">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Files Modal */}
      {isFilesModalOpen && activeFileCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Support Documents</h3>
                <button onClick={() => setIsFilesModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{MONTHS[activeFileCell.monthIdx]} {dashboardYear} • {currentPI.activities[activeFileCell.rowIdx].activity}</p>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No evidence uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(file => (
                    <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <a href={file.url} download={file.name} className="p-2 text-slate-400 hover:text-blue-600 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                         {(isSuperAdmin || currentUser.id === subjectUser.id) && (
                           <button onClick={() => removeFile(file.id)} className="p-2 text-slate-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(isSuperAdmin || currentUser.id === subjectUser.id) && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Upload New Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;