
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';

// Add missing OperationalDashboardProps interface
interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits?: User[];
  isTemplateMode?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_VARIANTS: Record<string, string[]> = {
  Jan: ['january', 'jan', 'target jan', 'actual jan', 't jan'],
  Feb: ['february', 'feb', 'target feb', 'actual feb', 't feb'],
  Mar: ['march', 'mar', 'target mar', 'actual mar', 't mar'],
  Apr: ['april', 'apr', 'target apr', 'actual apr', 't apr'],
  May: ['may', 'target may', 'actual may', 't may'],
  Jun: ['june', 'jun', 'target jun', 'actual jun', 't jun'],
  Jul: ['july', 'jul', 'target july', 'actual july', 't jul'],
  Aug: ['august', 'aug', 'target august', 'actual august', 't aug'],
  Sep: ['september', 'sep', 'sept', 'target sep', 'actual sep'],
  Oct: ['october', 'oct', 'target oct', 'actual oct', 't oct'],
  Nov: ['november', 'nov', 'target nov', 'actual nov', 't nov'],
  Dec: ['december', 'dec', 'target dec', 'actual dec', 't dec'],
};

const PI1_STRUCTURE = [
  { id: 'pi1_a1', activity: "Implementation of Stratcom Snapshots", indicator: "No. of StratCom snapshot formulated" },
  { id: 'pi1_a2', activity: "Implementation of information Operation (IO) Plans (Non-lethal actions)", indicator: "No. of IO implemented" },
  { id: 'pi1_a3', activity: "Implementation of counter-Propaganda Strategies", indicator: "No. of counter-Propaganda Strategies activities conducted" },
  { id: 'pi1_a4', activity: "Conduct of Police Information and Continuing Education (P.I.C.E.)", indicator: "No. of PICE conducted" },
  { id: 'pi1_a5', activity: "Management of PNP Social Media Pages and Account", indicator: "No. of original contents posted in social media pages and accounts" },
  { id: 'pi1_a6', activity: "Social Media Post Boosting", indicator: "No. of target audience reached" },
  { id: 'pi1_a7', activity: "Social Media Engagement", indicator: "No. of Social Media Engagement" },
  { id: 'pi1_a8', activity: "Provide live news streaming of PNP, projects and activities", indicator: "No. of live news streaming, program, projects and activities conducted" },
  { id: 'pi1_a9', activity: "Dissemination of the PNP related issuances monitored from QUAD media through the use of viber to the member of CG, R Staff, Unit Commander and other concerned directors", indicator: "No. of forwarded report on Dissemination of the PNP related issuances monitored from QUAD media through the use of viber to the member of CG, R Staff, Unit Commander and other concerned directors" },
  { id: 'pi1_a10', activity: "Conceptualization Information and Education", indicator: "No. of printed IEC materials distributed" },
  { id: 'pi1_a11', activity: "Anti-Criminality and Public Safety Awareness Activities", indicator: "No. of anti-criminality and Public Safety Awareness Activities conducted" },
  { id: 'pi1_a12', activity: "Radio/TV/Live Streaming", indicator: "No. of Radio/TV/Live Streaming guestings/show conducted" },
  { id: 'pi1_a13', activity: "Press Briefing", indicator: "No. of press briefing conducted" },
  { id: 'pi1_a14', activity: "Conduct of FOI awareness activity", indicator: "No. of FOI awareness activities" },
  { id: 'pi1_a15', activity: "Drug Awareness Activities", indicator: "No. of drug awareness activities conducted" },
  { id: 'pi1_a16', activity: "Conduct of Information Operations Development", indicator: "No. IDO activities" },
  { id: 'pi1_a17', activity: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs", indicator: "No. of collaborative efforts activities conducted" }
];

const customPiSort = (a: string, b: string) => {
  const aUpper = a.toUpperCase();
  const bUpper = b.toUpperCase();
  const aIsPI = aUpper.startsWith('PI');
  const bIsPI = bUpper.startsWith('PI');
  const aIsOD = aUpper.startsWith('OD');
  const bIsOD = bUpper.startsWith('OD');
  
  if (aIsPI && !bIsPI) return -1;
  if (!aIsPI && bIsPI) return 1;
  if (aIsOD && !bIsOD) return -1;
  if (!aIsOD && bIsOD) return 1;
  
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const formatTabLabel = (id: string): string => {
  const cleanId = id.toUpperCase().trim();
  if (cleanId.startsWith('PI') || cleanId.startsWith('OD')) return cleanId;
  return `PI ${cleanId}`;
};

const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string, isTemplateMode?: boolean): string => {
  if (isTemplateMode) return 'sa-1';
  if (role === UserRole.SUB_ADMIN && prefix === 'target') return 'sa-1';
  return userId;
};

const getSharedActivityName = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultName: string): string => {
  const localKey = `${prefix}_pi_act_name_${year}_${userId}_${piId}_${activityId}`;
  const local = localStorage.getItem(localKey);
  if (local) return local;
  if (userId.startsWith('st-') && userId !== 'st-1') {
      const ps1Key = `${prefix}_pi_act_name_${year}_st-1_${piId}_${activityId}`;
      const ps1 = localStorage.getItem(ps1Key);
      if (ps1) return ps1;
  }
  if (userId !== 'sa-1') {
    const templateKey = `${prefix}_pi_act_name_${year}_sa-1_${piId}_${activityId}`;
    return localStorage.getItem(templateKey) || defaultName;
  }
  return defaultName;
};

const getSharedIndicatorName = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const localKey = `${prefix}_pi_ind_name_${year}_${userId}_${piId}_${activityId}`;
  const local = localStorage.getItem(localKey);
  if (local) return local;
  if (userId.startsWith('st-') && userId !== 'st-1') {
      const ps1Key = `${prefix}_pi_ind_name_${year}_st-1_${piId}_${activityId}`;
      const ps1 = localStorage.getItem(ps1Key);
      if (ps1) return ps1;
  }
  if (userId !== 'sa-1') {
    const templateKey = `${prefix}_pi_ind_name_${year}_sa-1_${piId}_${activityId}`;
    return localStorage.getItem(templateKey) || defaultIndicator;
  }
  return defaultIndicator;
};

const getSharedPITitle = (prefix: string, year: string, userId: string, piId: string, defaultTitle: string): string => {
  const localKey = `${prefix}_pi_title_${year}_${userId}_${piId}`;
  const local = localStorage.getItem(localKey);
  if (local) return local;
  if (userId.startsWith('st-') && userId !== 'st-1') {
      const ps1Key = `${prefix}_pi_title_${year}_st-1_${piId}`;
      const ps1 = localStorage.getItem(ps1Key);
      if (ps1) return ps1;
  }
  if (userId !== 'sa-1') {
    const templateKey = `${prefix}_pi_title_${year}_sa-1_${piId}`;
    return localStorage.getItem(templateKey) || defaultTitle;
  }
  return defaultTitle;
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultValues: number[], role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);
    if (isConsolidated && units.length > 0) {
      value = units.reduce((sum, unit) => {
        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);
    } else {
      if (stored !== null) value = parseInt(stored, 10);
      else value = defaultValues[mIdx] || 0;
    }
    return { value, files: [] };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], isTemplateMode: boolean, ignoreHidden = false) => {
  const effectiveId = getEffectiveUserId(userId, role, prefix, isTemplateMode);
  const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
  const hiddenPIs: string[] = JSON.parse(localStorage.getItem(hiddenPIsKey) || '[]');
  const importedListKey = `${prefix}_imported_pi_list_${year}_${effectiveId}`;
  let importedIds: string[] = JSON.parse(localStorage.getItem(importedListKey) || '[]');

  const defaultList = [
    ...Array.from({ length: 29 }, (_, i) => `PI${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `OD${i + 1}`)
  ];

  // If station has no local import, check PS1 structure
  if (importedIds.length === 0 && effectiveId.startsWith('st-') && effectiveId !== 'st-1' && !isTemplateMode) {
      const ps1Key = `${prefix}_imported_pi_list_${year}_st-1`;
      importedIds = JSON.parse(localStorage.getItem(ps1Key) || '[]');
  }

  // LOGIC CHANGE: If we have an imported list, only show those by default.
  // Standard tabs not in the import file are effectively "hidden" until unhidden.
  let baseIds = importedIds.length > 0 ? importedIds : defaultList;

  if (isTemplateMode) {
    baseIds = baseIds.filter(id => !id.startsWith('OD'));
  }

  baseIds = [...new Set(baseIds)].sort(customPiSort);

  return baseIds.map(piId => {
    const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
    let storedIds = localStorage.getItem(actIdsKey);
    if (!storedIds && effectiveId.startsWith('st-') && effectiveId !== 'st-1' && !isTemplateMode) {
        storedIds = localStorage.getItem(`${prefix}_pi_act_ids_${year}_st-1_${piId}`);
    }
    let activityIds: string[];
    let fallbackStructure: { id: string; activity: string; indicator: string }[];
    if (piId === 'PI1') {
      fallbackStructure = PI1_STRUCTURE;
    } else {
      const piNumMatch = piId.match(/^PI(\d+)$/);
      const piNum = piNumMatch ? parseInt(piNumMatch[1], 10) : null;
      if (piNum !== null && piNum >= 2 && piNum <= 29) {
        fallbackStructure = [{ id: `${piId.toLowerCase()}_a1`, activity: "Number of sectoral groups/BPATs mobilized/organized", indicator: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs" }];
      } else {
        fallbackStructure = [{ id: `${piId.toLowerCase()}_a1`, activity: "Operational Activity", indicator: "Activity Unit" }];
      }
    }
    activityIds = storedIds ? JSON.parse(storedIds) : fallbackStructure.map(a => a.id);
    const activities = activityIds.map(aid => {
      const base = fallbackStructure.find(a => a.id === aid) || fallbackStructure[0];
      return {
        id: aid,
        activity: getSharedActivityName(prefix, year, effectiveId, piId, aid, base.activity),
        indicator: getSharedIndicatorName(prefix, year, effectiveId, piId, aid, base.indicator),
        months: createMonthsForActivity(prefix, year, effectiveId, piId, aid, Array(12).fill(0), role, isConsolidated, units),
        total: 0
      };
    });
    const defaultTitle = piId === 'PI1' ? "Number of Community Awareness/Information Activities Initiated" : `Indicator ${piId}`;
    return { id: piId, title: getSharedPITitle(prefix, year, effectiveId, piId, defaultTitle), activities };
  }).filter(pi => ignoreHidden ? true : !hiddenPIs.includes(pi.id));
};

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser, allUnits = [], isTemplateMode = false }) => {
  const [activeTab, setActiveTab] = useState('');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ piId: string; rowIdx: number; monthIdx: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ piId: string; rowIdx: number; field: 'activity' | 'indicator' | 'title' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tabbed' | 'master'>('tabbed');
  const masterImportRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode), [subjectUser.id, subjectUser.role, prefix, isTemplateMode]);
  
  const isOwner = currentUser.id === subjectUser.id;
  const isConsolidated = useMemo(() => (currentUser.role === UserRole.SUPER_ADMIN && (title.includes('Consolidation') || title.includes('Operational Dashboard'))) || (currentUser.role === UserRole.CHQ && title.includes('Consolidation')), [currentUser.role, title]);
  const canModifyData = useMemo(() => isConsolidated ? false : isOwner || currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && subjectUser.role === UserRole.STATION), [isConsolidated, isOwner, currentUser.role, subjectUser.role]);
  const canModifyTemplate = useMemo(() => isTemplateMode && currentUser.role === UserRole.SUPER_ADMIN, [isTemplateMode, currentUser.role]);

  const refresh = () => {
    const unitsToConsolidate = isConsolidated ? allUnits : [];
    const data = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate, isTemplateMode);
    setPiData(data.map(d => ({ ...d, activities: d.activities.map(a => ({ ...a, total: a.months.reduce((sum, m) => sum + m.value, 0) })) })));
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, allUnits, isConsolidated, isTemplateMode]);
  useEffect(() => { if (piData.length > 0) { if (!activeTab || !piData.some(pi => pi.id === activeTab)) setActiveTab(piData[0].id); } else setActiveTab(''); }, [piData, activeTab]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleUnhideAll = () => {
    if (confirm('Restore ALL system Performance Indicators? This will show all tabs (PI1-29) regardless of imported content.')) {
      const defaultList = [
        ...Array.from({ length: 29 }, (_, i) => `PI${i + 1}`),
        ...Array.from({ length: 10 }, (_, i) => `OD${i + 1}`)
      ];
      const importedListKey = `${prefix}_imported_pi_list_${year}_${effectiveId}`;
      const existingImported: string[] = JSON.parse(localStorage.getItem(importedListKey) || '[]');
      const newUnion = Array.from(new Set([...defaultList, ...existingImported]));
      localStorage.setItem(importedListKey, JSON.stringify(newUnion));
      localStorage.setItem(`${prefix}_hidden_pis_${year}_${effectiveId}`, JSON.stringify([]));
      refresh();
    }
  };

  const handleHideTab = (piId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Hide ${formatTabLabel(piId)} from terminal view?`)) {
      const hiddenKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
      const hidden: string[] = JSON.parse(localStorage.getItem(hiddenKey) || '[]');
      if (!hidden.includes(piId)) hidden.push(piId);
      localStorage.setItem(hiddenKey, JSON.stringify(hidden));
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
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rows || rows.length === 0) throw new Error("File empty");
        let headerRowIdx = rows.findIndex(r => r && r.filter(c => c).length >= 5);
        if (headerRowIdx === -1) headerRowIdx = 0;
        const headerRow = rows[headerRowIdx];
        const columnMap: Record<string, number> = {};
        const findCol = (keywords: string[]) => headerRow.findIndex(cell => { if (!cell) return false; const norm = String(cell).toLowerCase().trim(); return keywords.some(k => norm.includes(k)); });
        columnMap.piId = findCol(['piid', 'indicatorid', 'pi', 'tab', 'indicator #', 'id']);
        columnMap.aid = findCol(['activityid', 'actid', 'activity #', 'no.', 'order']);
        columnMap.activityName = findCol(['activity', 'activity name', 'description']);
        columnMap.indicatorName = findCol(['performance', 'indicator name', 'indicator description', 'measurement', 'measure']);
        columnMap.piTitle = findCol(['pi title', 'indicator title', 'goal', 'objective', 'summary']);
        MONTHS.forEach((m, i) => { columnMap[`month_${i}`] = findCol(MONTH_VARIANTS[m]); });
        const isStation1Ref = !isTemplateMode && subjectUser.name.includes('Police Station 1');
        const targetPrefixes = isTemplateMode ? ['target', 'accomplishment'] : [prefix];
        const affectedUnits = isStation1Ref && !isTemplateMode ? allUnits.filter(u => u.role === UserRole.STATION && u.name !== 'City Mobile Force Company') : [subjectUser];
        targetPrefixes.forEach(pfx => {
          affectedUnits.forEach(unit => {
            const uId = getEffectiveUserId(unit.id, unit.role, pfx, isTemplateMode);
            const foundPIs = new Set<string>();
            const piActivitiesMap: Record<string, string[]> = {};
            rows.slice(headerRowIdx + 1).forEach(row => {
              if (!row || row.length < 2) return;
              let piId = String(row[columnMap.piId] || '').trim().toUpperCase();
              if (!piId.startsWith('PI') && !piId.startsWith('OD')) {
                const altPi = row.find(c => { const s = String(c).toUpperCase(); return s.startsWith('PI') || s.startsWith('OD'); });
                if (altPi) piId = String(altPi).trim().toUpperCase(); else return;
              }
              const currentActCount = piActivitiesMap[piId]?.length || 0;
              const defaultSampleAct = piId === 'PI1' ? (PI1_STRUCTURE[currentActCount]?.activity || 'Operational Activity') : 'Operational Activity';
              const defaultSampleInd = piId === 'PI1' ? (PI1_STRUCTURE[currentActCount]?.indicator || 'Activity Unit') : 'Activity Unit';
              const aid = String(row[columnMap.aid] || `${piId.toLowerCase()}_a${currentActCount + 1}`).trim().toLowerCase().replace(/\s+/g, '');
              const actName = String(row[columnMap.activityName] || defaultSampleAct).trim();
              const indName = String(row[columnMap.indicatorName] || defaultSampleInd).trim();
              const piTitle = String(row[columnMap.piTitle] || `Indicator ${piId}`).trim();
              foundPIs.add(piId);
              if (!piActivitiesMap[piId]) piActivitiesMap[piId] = [];
              if (!piActivitiesMap[piId].includes(aid)) piActivitiesMap[piId].push(aid);
              localStorage.setItem(`${pfx}_pi_act_name_${year}_${uId}_${piId}_${aid}`, actName);
              localStorage.setItem(`${pfx}_pi_ind_name_${year}_${uId}_${piId}_${aid}`, indName);
              localStorage.setItem(`${pfx}_pi_title_${year}_${uId}_${piId}`, piTitle);
              MONTHS.forEach((_, i) => { const valCol = columnMap[`month_${i}`]; const val = valCol !== -1 ? (parseInt(String(row[valCol] || '0'), 10) || 0) : 0; localStorage.setItem(`${pfx}_data_${year}_${uId}_${piId}_${aid}_${i}`, String(val)); });
            });
            if (foundPIs.size > 0) {
              const sortedPIs = Array.from(foundPIs).sort(customPiSort);
              localStorage.setItem(`${pfx}_imported_pi_list_${year}_${uId}`, JSON.stringify(sortedPIs));
              Object.entries(piActivitiesMap).forEach(([pid, aids]) => { localStorage.setItem(`${pfx}_pi_act_ids_${year}_${uId}_${pid}`, JSON.stringify(aids)); });
              localStorage.setItem(`${pfx}_hidden_pis_${year}_${uId}`, JSON.stringify([]));
            }
          });
        });
        refresh();
        alert(isTemplateMode ? 'Global Master Template Synchronized.' : `Import Successful for ${subjectUser.name}`);
      } catch (err: any) { alert("Import Failed: Check file headers."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleCellClick = (piId: string, rowIdx: number, monthIdx: number, val: number) => { if (canModifyData) { setEditingCell({ piId, rowIdx, monthIdx }); setEditValue(String(val)); } };
  const handleLabelClick = (piId: string, rowIdx: number, field: 'activity' | 'indicator' | 'title', currentVal: string) => { if (canModifyTemplate) { setEditingLabel({ piId, rowIdx, field }); setEditValue(currentVal); } };
  const saveEdit = () => {
    const userIdToSave = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (editingCell) {
      const val = parseInt(editValue, 10) || 0;
      const targetPI = piData.find(p => p.id === editingCell.piId);
      if (!targetPI) return;
      const aid = targetPI.activities[editingCell.rowIdx].id;
      localStorage.setItem(`${prefix}_data_${year}_${userIdToSave}_${editingCell.piId}_${aid}_${editingCell.monthIdx}`, String(val));
      setEditingCell(null);
    } else if (editingLabel) {
      const targetPI = piData.find(p => p.id === editingLabel.piId);
      if (!targetPI) return;
      const targetPrefixes = isTemplateMode ? ['target', 'accomplishment'] : [prefix];
      targetPrefixes.forEach(pfx => {
        if (editingLabel.field === 'title') { localStorage.setItem(`${pfx}_pi_title_${year}_${userIdToSave}_${editingLabel.piId}`, editValue); } else {
          const aid = targetPI.activities[editingLabel.rowIdx].id;
          const key = editingLabel.field === 'activity' ? `${pfx}_pi_act_name_${year}_${userIdToSave}_${editingLabel.piId}_${aid}` : `${pfx}_pi_ind_name_${year}_${userIdToSave}_${editingLabel.piId}_${aid}`;
          localStorage.setItem(key, editValue);
        }
      });
      setEditingLabel(null);
    }
    refresh();
  };

  const renderTableRows = (pi: PIData) => pi.activities.map((act, rIdx) => (
    <tr key={`${pi.id}-${act.id}`} className="hover:bg-slate-50/50 group transition-colors border-b border-slate-100">
      <td className="px-6 py-4">
        {editingLabel?.piId === pi.id && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'activity' ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-[13px] px-2 outline-none" /> : <span onClick={() => handleLabelClick(pi.id, rIdx, 'activity', act.activity)} className={`text-[13px] font-bold text-slate-900 leading-snug block py-1 ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.activity}</span>}
      </td>
      <td className="px-6 py-4">
        {editingLabel?.piId === pi.id && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'indicator' ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-[11px] px-2 outline-none" /> : <span onClick={() => handleLabelClick(pi.id, rIdx, 'indicator', act.indicator)} className={`text-[11px] font-semibold text-slate-500 leading-snug block py-1 ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.indicator}</span>}
      </td>
      {act.months.map((m, mIdx) => (
        <td key={mIdx} className="px-1 py-4 text-center relative">
          {editingCell?.piId === pi.id && editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} className="w-12 text-center border-2 border-slate-900 rounded font-black text-[11px] py-0.5 shadow-sm outline-none" /> : <div onClick={() => handleCellClick(pi.id, rIdx, mIdx, m.value)} className={`rounded py-1 font-black text-[11px] transition-colors ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? (isConsolidated ? 'text-emerald-700' : (isTemplateMode ? 'text-rose-700' : 'text-slate-900')) : 'text-slate-200'}`}>{m.value.toLocaleString()}</div>}
        </td>
      ))}
      <td className={`px-6 py-4 text-center text-xs font-black ${isConsolidated ? 'text-emerald-900' : (isTemplateMode ? 'text-rose-900' : 'text-slate-900')}`}>{act.total.toLocaleString()}</td>
    </tr>
  ));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg> Return to Terminal
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{isTemplateMode ? 'Master Template Control' : title}</h1>
              {isConsolidated && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">Consolidated</span>}
              {isTemplateMode && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-200 shadow-sm animate-pulse">Master Source Active</span>}
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">Unit: {subjectUser.name} • Year: {year} {isTemplateMode && '• Structure defined here is Global'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode(prev => prev === 'tabbed' ? 'master' : 'tabbed')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2 ${viewMode === 'master' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" /></svg> {viewMode === 'tabbed' ? 'Master List View' : 'Back to Tabbed View'}</button>
          {!isConsolidated && currentUser.role === UserRole.SUPER_ADMIN && (
            <>
              <button onClick={handleUnhideAll} className="bg-white hover:bg-slate-50 text-slate-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-slate-200 flex items-center gap-2"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Unhide All PIs</button>
              <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Import Master</button>
              <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
            </>
          )}
        </div>
      </div>
      {viewMode === 'tabbed' ? (
        <>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {piData.map(pi => (
              <div key={pi.id} className="relative group">
                <button onClick={() => setActiveTab(pi.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap pr-10 ${activeTab === pi.id ? (isConsolidated ? 'bg-emerald-600 text-white shadow-lg' : isTemplateMode ? 'bg-rose-600 text-white shadow-lg scale-105' : 'bg-slate-900 text-white shadow-lg') : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{formatTabLabel(pi.id)}</button>
                {currentUser.role === UserRole.SUPER_ADMIN && !isConsolidated && (
                  <button onClick={(e) => handleHideTab(pi.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-400/20 text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">×</button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className={`${isConsolidated ? 'bg-emerald-900' : isTemplateMode ? 'bg-rose-900' : 'bg-slate-900'} p-8 text-white transition-colors duration-500`}>
              {editingLabel?.piId === activeTab && editingLabel?.field === 'title' ? <div className="flex items-center gap-2"><span className="text-xl font-black uppercase">{formatTabLabel(activeTab)} - </span><input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="bg-white/10 text-white border-2 border-white/30 rounded px-2 outline-none w-full font-black uppercase" /></div> : <h2 onClick={() => handleLabelClick(activeTab, 0, 'title', currentPI?.title || '')} className={`text-xl font-black uppercase tracking-tight ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-800/40 rounded px-2 transition-colors' : ''}`}>{formatTabLabel(activeTab)} - {currentPI?.title}</h2>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10"><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[300px]">Activity</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Performance Measurement</th>{MONTHS.map(m => <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{m}</th>)}<th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{currentPI?.activities.map((act, rIdx) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-5">{editingLabel?.piId === activeTab && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'activity' ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-sm px-2 outline-none" /> : <span onClick={() => handleLabelClick(activeTab, rIdx, 'activity', act.activity)} className={`text-sm font-bold text-slate-900 leading-snug block ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.activity}</span>}</td>
                    <td className="px-6 py-5">{editingLabel?.piId === activeTab && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'indicator' ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-xs px-2 outline-none" /> : <span onClick={() => handleLabelClick(activeTab, rIdx, 'indicator', act.indicator)} className={`text-xs font-semibold text-slate-600 leading-snug block ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.indicator}</span>}</td>
                    {act.months.map((m, mIdx) => (<td key={mIdx} className="px-1 py-5 text-center relative">{editingCell?.piId === activeTab && editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} className="w-12 text-center border-2 border-slate-900 rounded font-black text-xs py-1 shadow-sm outline-none" /> : <div onClick={() => handleCellClick(activeTab, rIdx, mIdx, m.value)} className={`rounded py-1 font-black text-xs transition-colors ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? (isConsolidated ? 'text-emerald-700' : (isTemplateMode ? 'text-rose-700' : 'text-slate-900')) : 'text-slate-200'}`}>{m.value.toLocaleString()}</div>}</td>))}
                    <td className={`px-6 py-5 text-center text-sm font-black ${isConsolidated ? 'text-emerald-900' : (isTemplateMode ? 'text-rose-900' : 'text-slate-900')}`}>{act.total.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-700">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-30"><tr className={`${isTemplateMode ? 'bg-rose-900' : 'bg-slate-900'} text-white shadow-md`}><th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] min-w-[300px] border-r border-slate-800">Activity</th><th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] min-w-[200px] border-r border-slate-800">Performance Measurement</th>{MONTHS.map(m => <th key={m} className="px-2 py-5 text-center text-[10px] font-black uppercase tracking-wider min-w-[50px]">{m}</th>)}<th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] bg-indigo-900/50">Cumulative</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{piData.map((pi) => (
                <React.Fragment key={pi.id}>
                  <tr className="bg-slate-50/80 sticky z-20" style={{ top: '64px' }}><td colSpan={15} className="px-6 py-3 border-y border-slate-200"><div className="flex items-center gap-3"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${isConsolidated ? 'bg-emerald-600' : isTemplateMode ? 'bg-rose-600' : 'bg-slate-900'}`}>{formatTabLabel(pi.id)}</span>{editingLabel?.piId === pi.id && editingLabel?.field === 'title' ? <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="text-xs font-black text-slate-800 uppercase tracking-tight border-b border-rose-500 outline-none bg-transparent" /> : <span onClick={() => handleLabelClick(pi.id, 0, 'title', pi.title)} className={`text-xs font-black text-slate-800 uppercase tracking-tight ${canModifyTemplate ? 'cursor-pointer hover:bg-rose-50 px-1 rounded transition-colors' : ''}`}>{pi.title}</span>}</div></td></tr>
                  {renderTableRows(pi)}
                </React.Fragment>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;
