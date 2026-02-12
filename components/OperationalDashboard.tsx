import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2026', '2025', '2024', '2023'];

/**
 * Custom sort for Performance Indicators.
 * Ensures PI1, PI2, ... PI29 appear in numeric order, and ODs come later.
 */
const customPiSort = (a: string, b: string) => {
  const aUpper = a.toUpperCase();
  const bUpper = b.toUpperCase();
  const aIsPriorityPI = aUpper.startsWith('PI') && !aUpper.startsWith('OD');
  const bIsPriorityPI = bUpper.startsWith('PI') && !bUpper.startsWith('OD');
  if (aIsPriorityPI && !bIsPriorityPI) return -1;
  if (!aIsPriorityPI && bIsPriorityPI) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const formatTabLabel = (id: string): string => {
  const cleanId = id.toUpperCase().trim();
  if (cleanId.startsWith('PI') || cleanId.startsWith('OD')) return cleanId;
  return `PI ${cleanId}`;
};

const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (role === UserRole.SUB_ADMIN && prefix === 'target') return 'sa-1';
  return userId;
};

const getSharedActivityName = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultName: string): string => {
  const key = `${prefix}_pi_act_name_${year}_${userId}_${piId}_${activityId}`;
  return localStorage.getItem(key) || defaultName;
};

const getSharedIndicatorName = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const key = `${prefix}_pi_ind_name_${year}_${userId}_${piId}_${activityId}`;
  return localStorage.getItem(key) || defaultIndicator;
};

const getSharedPITitle = (prefix: string, year: string, userId: string, piId: string, defaultTitle: string): string => {
  const key = `${prefix}_pi_title_${year}_${userId}_${piId}`;
  return localStorage.getItem(key) || defaultTitle;
};

const getSharedFiles = (prefix: string, year: string, userId: string, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const key = `${prefix}_files_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultValues: number[], role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);

    let files: MonthFile[] = [];

    if (isConsolidated && units.length > 0) {
      value = units.reduce((sum, unit) => {
        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);

      units.forEach(unit => {
        const unitFiles = getSharedFiles(prefix, year, unit.id, piId, activityId, mIdx);
        unitFiles.forEach(f => {
          if (!files.some(existing => existing.id === f.id)) files.push(f);
        });
      });
    } else {
      if (stored !== null) value = parseInt(stored, 10);
      else value = defaultValues[mIdx] || 0;
      files = getSharedFiles(prefix, year, userId, piId, activityId, mIdx);
    }

    return { value, files };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], ignoreHidden = false) => {
  const effectiveId = getEffectiveUserId(userId, role, prefix);
  const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
  const hiddenPIs: string[] = JSON.parse(localStorage.getItem(hiddenPIsKey) || '[]');
  const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
  const customOrder: string[] = JSON.parse(localStorage.getItem(orderKey) || '[]');
  
  const importedListKey = `${prefix}_imported_pi_list_${year}_${effectiveId}`;
  const importedIds: string[] = JSON.parse(localStorage.getItem(importedListKey) || '[]');

  const piStructureMap: Record<string, { title: string; activities: any[] }> = {
    PI1: {
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: [
        { id: "pi1_a1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snapshot formulated", defaults: Array(12).fill(0) },
        { id: "pi1_a2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: Array(12).fill(0) }
      ]
    }
  };

  let baseIds = importedIds.length > 0 ? importedIds : Array.from({ length: 29 }, (_, i) => `PI${i + 1}`);
  baseIds = [...baseIds].sort(customPiSort);

  const piList = baseIds.map(piId => {
    const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
    const storedIds = localStorage.getItem(actIdsKey);
    const struct = piStructureMap[piId] || { 
      title: `Indicator ${piId}`, 
      activities: [{ id: `${piId.toLowerCase()}_a1`, name: "Operational Activity", indicator: "Activity Unit", defaults: Array(12).fill(0) }] 
    };
    let activityIds: string[] = storedIds ? JSON.parse(storedIds) : struct.activities.map((a: any) => a.id);
    const activities = activityIds.map(aid => {
      const base = struct.activities.find((a: any) => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(prefix, year, effectiveId, piId, aid, base?.name || "Activity"),
        indicator: getSharedIndicatorName(prefix, year, effectiveId, piId, aid, base?.indicator || "Indicator"),
        months: createMonthsForActivity(prefix, year, effectiveId, piId, aid, base?.defaults || Array(12).fill(0), role, isConsolidated, units),
        total: 0
      };
    });
    return { id: piId, title: getSharedPITitle(prefix, year, effectiveId, piId, struct.title), activities };
  });

  const customKey = `${prefix}_custom_definitions_${year}_${effectiveId}`;
  const customPIs = JSON.parse(localStorage.getItem(customKey) || '[]');
  let allDefinitions = [...piList, ...customPIs];

  if (customOrder.length > 0) {
    allDefinitions.sort((a, b) => {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }
  return allDefinitions.filter(pi => ignoreHidden ? true : !hiddenPIs.includes(pi.id));
};

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M165.04 100.32L346.96 100.32L512 386.13L330.08 386.13L165.04 100.32Z" fill="#00A859"/>
    <path d="M181.92 386.13L0 386.13L165.04 100.32L346.96 100.32L181.92 386.13Z" fill="#FFC107"/>
    <path d="M181.92 386.13L346.96 100.32L512 386.13L330.08 386.13L181.92 386.13Z" fill="#3B82F6"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits?: User[];
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser, allUnits = [] }) => {
  const [activeTab, setActiveTab] = useState('');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeFileCell, setActiveFileCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'syncing' | 'complete' | 'error'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterImportRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id, subjectUser.role, prefix), [subjectUser.id, subjectUser.role, prefix]);
  
  const isOwner = currentUser.id === subjectUser.id;
  const isConsolidated = useMemo(() => {
    return (currentUser.role === UserRole.SUPER_ADMIN && (title.includes('Consolidation') || title.includes('Operational Dashboard'))) ||
           (currentUser.role === UserRole.CHQ && title.includes('Consolidation'));
  }, [currentUser.role, title]);
  
  const canModifyData = useMemo(() => {
    if (isConsolidated) return false;
    return isOwner || currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && subjectUser.role === UserRole.STATION);
  }, [isConsolidated, isOwner, currentUser.role, subjectUser.role]);

  const refresh = () => {
    const unitsToConsolidate = isConsolidated ? allUnits : [];
    const data = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate);
    setPiData(data.map(d => ({
      ...d,
      activities: d.activities.map(a => ({
        ...a,
        total: a.months.reduce((sum, m) => sum + m.value, 0)
      }))
    })));
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, allUnits, isConsolidated]);

  useEffect(() => {
    if (piData.length > 0) {
      if (!activeTab || !piData.some(pi => pi.id === activeTab)) {
        setActiveTab(piData[0].id);
      }
    } else {
      setActiveTab('');
    }
  }, [piData, activeTab]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleUnhideAll = () => {
    const message = isConsolidated 
      ? 'Restore visibility to all Performance Indicator tabs for EVERY unit in this consolidated view?' 
      : 'Restore visibility to all Performance Indicator tabs for this terminal?';

    if (confirm(message)) {
      if (isConsolidated && allUnits.length > 0) {
        // Bulk clear for all units
        allUnits.forEach(unit => {
          const unitEffectiveId = getEffectiveUserId(unit.id, unit.role, prefix);
          localStorage.setItem(`${prefix}_hidden_pis_${year}_${unitEffectiveId}`, JSON.stringify([]));
        });
        // Also clear for current user terminal scope
        localStorage.setItem(`${prefix}_hidden_pis_${year}_${effectiveId}`, JSON.stringify([]));
      } else {
        const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
        localStorage.setItem(hiddenPIsKey, JSON.stringify([])); 
      }
      refresh();
    }
  };

  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConsolidated) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        if (!wb.SheetNames.length) throw new Error("Worksheet empty");
        const ws = wb.Sheets[wb.SheetNames[0]];
        
        // Use raw arrays for fuzzy header detection
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rows || rows.length === 0) throw new Error("File contains no data");

        // Scan for header row (one that contains keywords)
        let headerRowIdx = rows.findIndex(r => r && r.filter(c => c !== null && c !== '').length >= 3);
        if (headerRowIdx === -1) headerRowIdx = 0;
        const headerRow = rows[headerRowIdx];
        
        const columnMap: Record<string, number> = {};
        const findCol = (keywords: string[], fallbackIdx: number) => {
          const idx = headerRow.findIndex(cell => {
            if (!cell) return false;
            const norm = String(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
            return keywords.some(k => norm.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
          });
          return idx === -1 ? fallbackIdx : idx;
        };

        columnMap.piId = findCol(['piid', 'indicatorid', 'pi', 'tabname', 'id'], 0);
        columnMap.aid = findCol(['activityid', 'actid', 'id', 'activityno'], 1);
        columnMap.activityName = findCol(['activity', 'activityname', 'action'], 2);
        columnMap.indicatorName = findCol(['performanceindicator', 'indicator', 'indicatorname', 'pidescription'], 3);
        columnMap.piTitle = findCol(['pititle', 'indicatortitle', 'goal'], 4);
        
        MONTHS.forEach((m, i) => {
          columnMap[`month_${i}`] = findCol([m.toLowerCase()], 5 + i);
        });

        const isPS1 = subjectUser.id === 'st-1' || subjectUser.name.includes('Police Station 1');
        const isStation1Target = prefix === 'target' && isPS1;
        
        const affectedUnits = isStation1Target 
          ? allUnits.filter(u => u.role === UserRole.STATION && u.name !== 'City Mobile Force Company')
          : [subjectUser];

        let importCount = 0;
        affectedUnits.forEach(unit => {
          const unitEffectiveId = getEffectiveUserId(unit.id, unit.role, prefix);
          const foundPIs = new Set<string>();
          const piActivitiesMap: Record<string, string[]> = {};

          // If the header row looks like data itself, don't skip it
          const headerLooksLikeData = String(headerRow[columnMap.piId] || '').toUpperCase().includes('PI');
          const startIdx = headerLooksLikeData ? headerRowIdx : headerRowIdx + 1;
          
          rows.slice(startIdx).forEach(row => {
            if (!row || !row.length) return;
            let piId = String(row[columnMap.piId] || '').trim().toUpperCase();
            if (!piId) {
               const cellWithPI = row.find(c => String(c).toUpperCase().startsWith('PI') || String(c).toUpperCase().startsWith('OD'));
               if (cellWithPI) piId = String(cellWithPI).trim().toUpperCase();
            }
            if (!piId) return;

            importCount++;
            const aid = String(row[columnMap.aid] || 'a1').trim();
            const activityName = String(row[columnMap.activityName] || 'Activity').trim();
            const indicatorName = String(row[columnMap.indicatorName] || 'Performance Indicator').trim();
            const piTitle = String(row[columnMap.piTitle] || `Indicator ${piId}`).trim();

            foundPIs.add(piId);
            if (!piActivitiesMap[piId]) piActivitiesMap[piId] = [];
            if (!piActivitiesMap[piId].includes(aid)) piActivitiesMap[piId].push(aid);

            localStorage.setItem(`${prefix}_pi_act_name_${year}_${unitEffectiveId}_${piId}_${aid}`, activityName);
            localStorage.setItem(`${prefix}_pi_ind_name_${year}_${unitEffectiveId}_${piId}_${aid}`, indicatorName);
            localStorage.setItem(`${prefix}_pi_title_${year}_${unitEffectiveId}_${piId}`, piTitle);

            MONTHS.forEach((_, i) => { 
              const rawVal = row[columnMap[`month_${i}`]];
              const val = parseInt(String(rawVal || '0'), 10) || 0;
              localStorage.setItem(`${prefix}_data_${year}_${unitEffectiveId}_${piId}_${aid}_${i}`, String(val));
            });
          });

          if (foundPIs.size > 0) {
            const sortedPIs = Array.from(foundPIs).sort(customPiSort);
            localStorage.setItem(`${prefix}_imported_pi_list_${year}_${unitEffectiveId}`, JSON.stringify(sortedPIs));
            Object.entries(piActivitiesMap).forEach(([piId, aids]) => {
              localStorage.setItem(`${prefix}_pi_act_ids_${year}_${unitEffectiveId}_${piId}`, JSON.stringify(aids));
            });
            localStorage.setItem(`${prefix}_hidden_pis_${year}_${unitEffectiveId}`, JSON.stringify([]));
          }
        });

        if (importCount === 0) {
           throw new Error("No Performance Indicator data was detected. Ensure your sheet has 'PI' or 'OD' identifiers.");
        }

        refresh();
        if (isStation1Target) alert(`Registry Refreshed & Propagated to Stations.`);
        else alert(`Registry updated for ${subjectUser.name}.`);
      } catch (err: any) {
        console.error(err);
        alert(`Import Failed: Please ensure your Excel file uses standard column headers (PI ID, Activity, etc.) and is not empty.`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    if (canModifyData) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEdit = () => {
    if (!editingCell || !currentPI) return;
    const val = parseInt(editValue, 10) || 0;
    const aid = currentPI.activities[editingCell.rowIdx].id;
    localStorage.setItem(`${prefix}_data_${year}_${effectiveId}_${activeTab}_${aid}_${editingCell.monthIdx}`, String(val));
    refresh();
    setEditingCell(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Return to Terminal
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1>
              {isConsolidated && (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">Consolidated</span>
              )}
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
              {isConsolidated ? `Aggregated Report: CHQ & Stations` : `Unit: ${subjectUser.name}`} • Year: {year}
            </p>
          </div>
        </div>
        
        {(currentUser.role === UserRole.SUPER_ADMIN || (isOwner && !isConsolidated)) && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleUnhideAll} className="bg-white hover:bg-slate-50 text-slate-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-slate-200 flex items-center gap-2">
              <EyeIcon /> Unhide All
            </button>
            {!isConsolidated && currentUser.role === UserRole.SUPER_ADMIN && (
              <>
                <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
                  <UploadIcon /> Import Master
                </button>
                <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
              </>
            )}
            {!isConsolidated && (
              <button onClick={() => setIsFilesModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
                <GoogleDriveIcon /> Unit Drive
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {piData.map(pi => (
          <button 
            key={pi.id} 
            onClick={() => setActiveTab(pi.id)} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === pi.id ? (isConsolidated ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg') : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {formatTabLabel(pi.id)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className={`${isConsolidated ? 'bg-emerald-900' : 'bg-slate-900'} p-8 text-white transition-colors duration-500`}>
          <h2 className="text-xl font-black uppercase tracking-tight">{formatTabLabel(activeTab)} - {currentPI?.title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[300px]">Activity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Indicator</th>
                {MONTHS.map(m => <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{m}</th>)}
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPI?.activities.map((act, rIdx) => (
                <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-900 leading-snug">{act.activity}</span>
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-600 leading-snug">{act.indicator}</td>
                  {act.months.map((m, mIdx) => (
                    <td key={mIdx} className="px-1 py-5 text-center relative">
                      {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} className="w-12 text-center border-2 border-slate-900 rounded font-black text-xs py-1 shadow-sm" />
                      ) : (
                        <div 
                          onClick={() => handleCellClick(rIdx, mIdx, m.value)} 
                          className={`rounded py-1 font-black text-xs transition-colors ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? (isConsolidated ? 'text-emerald-700' : 'text-slate-900') : 'text-slate-200'}`}
                        >
                          {m.value.toLocaleString()}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className={`px-6 py-5 text-center text-sm font-black ${isConsolidated ? 'text-emerald-900' : 'text-slate-900'}`}>{act.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationalDashboard;