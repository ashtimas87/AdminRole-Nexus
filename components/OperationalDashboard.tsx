import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Utility to determine the storage key's user component.
 * For Target Outlook, Station and Company users share a common data pool.
 */
const getEffectiveUserId = (prefix: string, userId: string, role: UserRole): string => {
  if (prefix === 'target' && role === UserRole.STATION) {
    return 'shared_station_target_pool';
  }
  return userId;
};

// Helper to get shared definitions with year and user scoping
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

// Helper to get individual data with year separation and mode prefix (Accomplishment vs Target)
const getSharedDataValue = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, monthIdx: number, defaultValue: number): number => {
  const effectiveId = getEffectiveUserId(prefix, userId, role);
  const key = `${prefix}_${year}_${effectiveId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

// Helper to get file metadata with year separation
const getSharedFiles = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const effectiveId = getEffectiveUserId(prefix, userId, role);
  const key = `files_${year}_${effectiveId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, role: UserRole, piId: string, activityId: string, defaultValues: number[]): MonthData[] => {
  const isStation = role === UserRole.STATION;
  const isCHQ = role === UserRole.CHQ;
  const zeroDefaultYears = ['2026', '2025', '2024', '2023'];
  
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let defVal = defaultValues[mIdx] || 0;
    
    // For unit-level dashboards in these years, we always default to 0 accomplishment data.
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
  
  const pi1_25_activities = [
    { id: "pi1_25_1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snaphot formulated", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { id: "pi1_25_2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: [13, 13, 13, 12, 9, 13, 13, 13, 13, 13, 13, 13] },
    { id: "pi1_25_3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: [10, 9, 9, 9, 9, 9, 9, 10, 9, 9, 10, 11] },
    { id: "pi1_25_4", name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", defaults: [56, 50, 51, 54, 50, 53, 51, 57, 54, 58, 55, 54] },
    { id: "pi1_25_5", name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies", defaults: [790, 691, 688, 757, 688, 721, 789, 688, 645, 766, 307, 688] },
    { id: "pi1_25_6", name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed", defaults: [23, 23, 24, 25, 23, 25, 25, 23, 24, 24, 29, 28] },
    { id: "pi1_25_7", name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted", defaults: [50, 50, 50, 50, 51, 51, 51, 51, 50, 52, 59, 64] },
    { id: "pi1_25_8", name: "Dissemination of related news articles involving the PNP in region for the information of Command Group/Commanders", indicator: "No. of emails and SMS sent", defaults: [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 35, 39] },
    { id: "pi1_25_9", name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers", defaults: [11, 11, 10, 9, 10, 10, 10, 11, 9, 10, 11, 13] },
    { id: "pi1_25_10", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: [552, 511, 517, 570, 551, 660, 680, 644, 647, 557, 681, 712] },
    { id: "pi1_25_11", name: "Social Media Engagement", indicator: "No. of Engagement", defaults: [39, 38, 38, 35, 36, 35, 36, 35, 39, 40, 42, 43] },
    { id: "pi1_25_12", name: "Radio/TV/Live Streaming", indicator: "No. of guesting/show", defaults: [15, 14, 17, 15, 16, 14, 16, 14, 14, 14, 16, 14] },
    { id: "pi1_25_13", name: "Press Briefing", indicator: "No. of Press Briefing to be conducted", defaults: [15, 14, 17, 16, 15, 14, 16, 16, 15, 18, 20, 17] },
    { id: "pi1_25_14", name: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies GAD-Related IEC Materials to be distributed", defaults: [15, 16, 16, 16, 15, 15, 15, 15, 15, 17, 19, 21] },
    { id: "pi1_25_15", name: "Conduct Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation", indicator: "No. of Lectures on Islamic Religious and Cultural Sensitivity to be conducted", defaults: [14, 13, 14, 13, 14, 13, 14, 13, 13, 13, 12, 15] },
    { id: "pi1_25_16", name: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation to be conducted", defaults: [19, 19, 17, 19, 17, 19, 19, 17, 19, 20, 30, 33] },
    { id: "pi1_25_17", name: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding and Counter Radicalization to be conducted", defaults: [17, 17, 17, 16, 13, 17, 17, 17, 17, 18, 20, 22] }
  ];

  const baseDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: is2025 ? pi1_25_activities : (is2026 ? [
        { id: "pi1_26_1", name: "Implementation of Stratcom Snapshots", indicator: "No. of StratCom snapshot formulated", defaults: Array(12).fill(11) },
        { id: "pi1_26_2", name: "Implementation of information Operation (IO) Plans (Non-lethal actions)", indicator: "No. of IO implemented", defaults: Array(12).fill(11) },
        { id: "pi1_26_3", name: "Implementation of counter-Propaganda Strategies", indicator: "No. of counter-Propaganda Strategies activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_4", name: "Conduct of Police Information and Continuing Education (P.I.C.E.)", indicator: "No. of PICE conducted", defaults: Array(12).fill(33) },
        { id: "pi1_26_5", name: "Management of PNP Social Media Pages and Account", indicator: "No. of original contents posted in social media pages and accounts", defaults: Array(12).fill(33) },
        { id: "pi1_26_6", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: Array(12).fill(33) },
        { id: "pi1_26_7", name: "Social Media Engagement", indicator: "No. of Social Media Engagement", defaults: Array(12).fill(33) },
        { id: "pi1_26_8", name: "Provide live news streaming of PNP, projects and activities", indicator: "No. of live news streaming, program, projects and activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_9", name: "Dissemination of the PNP related issuances monitored from QUAD media...", indicator: "No. of forwarded report on Dissemination of the PNP related issuances...", defaults: Array(12).fill(33) },
        { id: "pi1_26_10", name: "Conceptualization Information and Education", indicator: "No. of printed IEC materials distributed", defaults: Array(12).fill(253) },
        { id: "pi1_26_11", name: "Anti-Criminality and Public Safety Awareness Activities", indicator: "No. of Anti-criminality and Public Safety Awareness Activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_12", name: "Radio/TV/Live Streaming", indicator: "No. of Radio/TV/Live Streaming guestings/show conducted", defaults: Array(12).fill(3) },
        { id: "pi1_26_13", name: "Press Briefing", indicator: "No. of press briefing conducted", defaults: Array(12).fill(3) },
        { id: "pi1_26_14", name: "Conduct of FOI awareness activity", indicator: "No. of FOI awareness activities", defaults: Array(12).fill(11) },
        { id: "pi1_26_15", name: "Drug Awareness Activities", indicator: "No. drug awareness activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_16", name: "Conduct of Information Operations Development", indicator: "No. IDO activities conducted", defaults: Array(12).fill(3) }
      ] : pi1_25_activities)
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { id: "pi2_f_1", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities conducted", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }
      ]
    },
    {
      id: "PI3",
      title: "Number of participating respondents",
      activities: [
        { id: "pi3_f_1", name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", defaults: Array(12).fill(5) }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: is2026 && isCiuUser ? [
        { id: "pi4_ciu_1", name: "JAPIC", indicator: "JAPIC conducted", defaults: Array(12).fill(0) },
        { id: "pi4_ciu_2", name: "Operations on loose firearms", indicator: "Operations on loose firearms conducted", defaults: Array(12).fill(0) }
      ] : [
        { id: "pi4_f_1", name: "JAPIC", indicator: "JAPIC conducted", defaults: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] }
      ]
    }
  ];

  const storedCustomPIsStr = localStorage.getItem(`custom_pi_definitions_${year}`);
  const customPIs = storedCustomPIsStr ? JSON.parse(storedCustomPIsStr) : [];
  
  let allDefinitions = [...baseDefinitions, ...customPIs];

  const storedOrder = localStorage.getItem(`pi_order_${year}`);
  if (storedOrder) {
    const orderIds = JSON.parse(storedOrder);
    allDefinitions = allDefinitions.sort((a, b) => {
      const aIdx = orderIds.indexOf(a.id);
      const bIdx = orderIds.indexOf(b.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  return allDefinitions.map(pi => {
    const unitSpecificIdsKey = `pi_activity_ids_${year}_${userId}_${pi.id}`;
    const globalIdsKey = `pi_activity_ids_${year}_${pi.id}`;
    const unitSpecificIds = localStorage.getItem(unitSpecificIdsKey);
    const globalIds = localStorage.getItem(globalIdsKey);
    
    let activityIds;
    if ((year === '2023' || year === '2025' || year === '2026') && role === UserRole.CHQ) {
       activityIds = unitSpecificIds ? JSON.parse(unitSpecificIds) : pi.activities.map(a => a.id);
    } else {
       activityIds = unitSpecificIds ? JSON.parse(unitSpecificIds) : (globalIds ? JSON.parse(globalIds) : pi.activities.map(a => a.id));
    }

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(year, userId, pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(year, userId, pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(prefix, year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return {
      id: pi.id,
      title: getSharedPITitle(year, userId, pi.id, pi.title),
      activities: fullActivities
    };
  });
};

const generateStructuredPIs = (
  prefix: string,
  year: string,
  subjectUser: User, 
  mode: 'normal' | 'zero' | 'consolidated' = 'normal',
  dashboardType: 'OPERATIONAL' | 'CHQ' | 'TACTICAL' = 'OPERATIONAL',
  isTargetOutlook: boolean = false
): PIData[] => {
  const allStationIds = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8', 'st-9', 'st-10', 'st-11'];
  const allChqIds = ['chq-1', 'chq-2', 'chq-3', 'chq-4', 'chq-5', 'chq-6', 'chq-7', 'chq-8', 'chq-9'];

  const definitions = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role);
  const unitHidden: string[] = JSON.parse(localStorage.getItem(`hidden_pis_${subjectUser.id}`) || '[]');

  return definitions
    .filter(def => !unitHidden.includes(def.id))
    .map((def) => {
      const isPercentagePI = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(def.id);
      
      return {
        id: def.id,
        title: def.title,
        activities: def.activities.map((act) => {
          let monthsData: MonthData[];

          if (mode === 'consolidated') {
            monthsData = MONTHS.map((_, mIdx) => {
              let totalValue = 0;
              let targetIds: string[] = [];
              if (dashboardType === 'OPERATIONAL') targetIds = [...allStationIds, ...allChqIds];
              else if (dashboardType === 'CHQ') targetIds = allChqIds;
              else targetIds = allStationIds;

              // Rule: On CHQ user Target Outlook, don't consolidate from Station & Company user
              if (isTargetOutlook && subjectUser.role === UserRole.CHQ) {
                targetIds = allChqIds;
              }

              targetIds.forEach(unitId => {
                // Determine the role for each targetId to fetch correct data
                const unitRole = unitId.startsWith('st-') ? UserRole.STATION : UserRole.CHQ;
                totalValue += getSharedDataValue(prefix, year, unitId, unitRole, def.id, act.id, mIdx, 0);
              });
              
              return {
                value: isPercentagePI ? (targetIds.length > 0 ? Math.round(totalValue / targetIds.length) : 0) : totalValue,
                files: []
              };
            });
          } else {
            monthsData = act.months;
          }

          return {
            id: act.id,
            activity: act.activity,
            indicator: act.indicator,
            months: monthsData,
            total: monthsData.reduce((a, b) => a + b.value, 0)
          };
        })
      };
    });
};

interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User; 
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [exporting, setExporting] = useState(false);
  const [piData, setPiData] = useState<PIData[]>([]);
  const [dataMode, setDataMode] = useState<'normal' | 'zero' | 'consolidated'>('normal');
  
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingLabel, setEditingLabel] = useState<{ rowIdx: number; field: 'activity' | 'indicator' } | null>(null);
  const [textEditValue, setTextEditValue] = useState<string>('');
  
  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const dataPrefix = isTargetOutlook ? 'target' : 'accomplishment';

  const dashboardType = useMemo(() => {
    if (title.toUpperCase().includes("CHQ")) return 'CHQ';
    if (title.toUpperCase().includes("TACTICAL")) return 'TACTICAL';
    return 'OPERATIONAL';
  }, [title]);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;

  const refreshData = () => {
    const isMainView = subjectUser.id === currentUser.id;
    let mode: 'normal' | 'zero' | 'consolidated' = 'normal';

    if (isAdmin && (isMainView || subjectUser.role === UserRole.SUB_ADMIN)) {
      mode = 'consolidated';
    }
    
    setDataMode(mode);
    const data = generateStructuredPIs(dataPrefix, dashboardYear, subjectUser, mode, dashboardType, isTargetOutlook);
    setPiData(data);
    
    if (data.length > 0 && !data.find(pi => pi.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear, dashboardType, activeTab]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const columnTotals = useMemo(() => {
    if (!currentPI) return { monthly: Array(12).fill(0), grand: 0, isPercent: false };
    const monthlyTotals = Array(12).fill(0);
    let grandTotal = 0;
    const isPercent = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);

    currentPI.activities.forEach(act => {
      act.months.forEach((m, mIdx) => { monthlyTotals[mIdx] += m.value; });
      grandTotal += isPercent ? Math.round(act.total / 12) : act.total;
    });

    if (isPercent) {
      const averagedMonthly = monthlyTotals.map(v => currentPI.activities.length > 0 ? Math.round(v / currentPI.activities.length) : 0);
      const averagedGrand = currentPI.activities.length > 0 ? Math.round(grandTotal / currentPI.activities.length) : 0;
      return { monthly: averagedMonthly, grand: averagedGrand, isPercent: true };
    }
    return { monthly: monthlyTotals, grand: grandTotal, isPercent: false };
  }, [currentPI, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    let canEdit = false;
    // New Restriction: Only Super Admin can edit Target Outlook
    if (isTargetOutlook) {
      canEdit = isSuperAdmin;
    } else {
      // Normal permission for Accomplishments
      canEdit = (isSuperAdmin && dataMode !== 'consolidated') || ((currentUser.role === UserRole.CHQ || currentUser.role === UserRole.STATION) && currentUser.id === subjectUser.id);
    }

    if (canEdit) {
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

  const handleAddPI = () => {
    if (!isSuperAdmin) return;
    const newPIId = `PI_CUSTOM_${Date.now()}`;
    const newTitle = "New Performance Indicator";
    const activityId = `act_${Date.now()}`;
    const newPIDef = { id: newPIId, title: newTitle, activities: [{ id: activityId, name: "New Activity", indicator: "New Indicator", defaults: Array(12).fill(0) }] };
    const storedCustomPIsStr = localStorage.getItem(`custom_pi_definitions_${dashboardYear}`);
    const customPIs = storedCustomPIsStr ? JSON.parse(storedCustomPIsStr) : [];
    localStorage.setItem(`custom_pi_definitions_${dashboardYear}`, JSON.stringify([...customPIs, newPIDef]));
    setActiveTab(newPIId);
    refreshData();
  };

  const handleAddActivity = () => {
    if (!isSuperAdmin || !currentPI) return;
    const newId = `custom_row_${Date.now()}`;
    const unitStorageKey = `pi_activity_ids_${dashboardYear}_${subjectUser.id}_${activeTab}`;
    const globalIdsKey = `pi_activity_ids_${dashboardYear}_${activeTab}`;
    const storedIds = localStorage.getItem(unitStorageKey) || localStorage.getItem(globalIdsKey);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    localStorage.setItem(unitStorageKey, JSON.stringify([...activityIds, newId]));
    refreshData();
  };

  const handleDeleteActivity = (activityId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isSuperAdmin || !window.confirm(`Are you sure you want to remove this activity row?`)) return;
    const unitStorageKey = `pi_activity_ids_${dashboardYear}_${subjectUser.id}_${activeTab}`;
    const globalIdsKey = `pi_activity_ids_${dashboardYear}_${activeTab}`;
    const storedIds = localStorage.getItem(unitStorageKey) || localStorage.getItem(globalIdsKey);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    localStorage.setItem(unitStorageKey, JSON.stringify(activityIds.filter((id: string) => id !== activityId)));
    refreshData();
  };

  const handleExportPPT = async () => {
    if (!currentPI) return;
    setExporting(true);
    try {
      const pptx = new pptxgen();
      const slide = pptx.addSlide();
      slide.addText(title, { x: 0.5, y: 0.5, w: 9, fontSize: 18, bold: true });
      await pptx.writeFile({ fileName: `${title}.pptx` });
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  const handleLabelEdit = (rowIdx: number, field: 'activity' | 'indicator', currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingLabel({ rowIdx, field });
    setTextEditValue(currentVal);
  };

  const saveLabel = () => {
    if (!editingLabel || !currentPI) return;
    const activityId = currentPI.activities[editingLabel.rowIdx].id;
    localStorage.setItem(`pi_${editingLabel.field}_name_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}`, textEditValue);
    refreshData();
    setEditingLabel(null);
  };

  if (!currentPI && piData.length === 0) {
    return <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xl">No Performance Indicators Found.</div>;
  }

  if (!currentPI) return null;

  // Determine if cells should show edit pointers
  const canEditAnyCell = isTargetOutlook ? isSuperAdmin : ((isSuperAdmin && dataMode !== 'consolidated') || ((currentUser.role === UserRole.CHQ || currentUser.role === UserRole.STATION) && currentUser.id === subjectUser.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">
            Back to Overview
          </button>
          <div className="flex flex-wrap items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-widest">
                  {dataMode === 'consolidated' ? 'CONSOLIDATED VIEW' : `UNIT: ${subjectUser.name}`}
                </span>
                {isTargetOutlook && !isSuperAdmin && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase border border-amber-200">Read Only</span>
                )}
             </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition shadow-sm">
            PPT Export
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {piData.map((pi) => {
            const label = getSharedTabLabel(dashboardYear, subjectUser.id, pi.id, pi.id.includes('CUSTOM') ? 'NEW PI' : `PI ${pi.id.replace('PI', '')}`);
            return (
              <button 
                key={pi.id}
                onClick={() => setActiveTab(pi.id)} 
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            );
          })}
          {isSuperAdmin && <button onClick={handleAddPI} className="px-4 py-2 rounded-lg text-xs font-black bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition shadow-sm ml-2">+ Add PI</button>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-4 px-6 border-b border-slate-300 text-center font-black uppercase text-slate-800 text-base">
          Performance Indicator #{activeTab.replace('PI', '')} – {currentPI.title}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} {isTargetOutlook ? 'Target Outlook' : 'Accomplishment'}</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase">Total</th>
                {isSuperAdmin && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-24 font-bold uppercase text-[9px]">Action</th>}
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-bold text-[10px] w-11 uppercase">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => {
                const isPercent = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);
                return (
                  <tr key={row.id} className="hover:bg-blue-50/30 group">
                    <td className={`border border-slate-300 p-2 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'activity', row.activity)}>
                      {editingLabel?.rowIdx === rIdx && editingLabel.field === 'activity' ? (
                        <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                      ) : row.activity}
                    </td>
                    <td className={`border border-slate-300 p-2 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'indicator', row.indicator)}>
                      {editingLabel?.rowIdx === rIdx && editingLabel.field === 'indicator' ? (
                        <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                      ) : row.indicator}
                    </td>
                    {row.months.map((m, mIdx) => (
                      <td key={mIdx} className={`border border-slate-300 p-1.5 text-center text-blue-700 font-bold ${canEditAnyCell ? 'cursor-pointer hover:bg-blue-100' : 'cursor-default'}`} onClick={() => handleCellClick(rIdx, mIdx, m.value)}>
                        {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                          <input autoFocus className="w-center bg-white border border-blue-500 rounded px-0.5 outline-none font-black text-center" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span>{m.value}{isPercent ? '%' : ''}</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                    {isSuperAdmin && (
                      <td className="border border-slate-300 p-2 text-center bg-slate-50">
                        <button onClick={(e) => handleDeleteActivity(row.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition">Remove</button>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-black">
                <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase">Total</td>
                {columnTotals.monthly.map((total, idx) => (
                  <td key={idx} className="border border-slate-300 p-1.5 text-center">{total}{columnTotals.isPercent ? '%' : ''}</td>
                ))}
                <td className="border border-slate-300 p-1.5 text-center text-white bg-slate-900">{columnTotals.grand}{columnTotals.isPercent ? '%' : ''}</td>
                {isSuperAdmin && <td className="border border-slate-300"></td>}
              </tr>
              {isSuperAdmin && (
                <tr className="bg-slate-50/50">
                  <td colSpan={isSuperAdmin ? 16 : 15} className="border border-slate-300 p-4 text-center">
                    <button onClick={handleAddActivity} className="text-blue-600 font-bold hover:text-blue-800 transition text-xs uppercase">+ Add Row</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationalDashboard;