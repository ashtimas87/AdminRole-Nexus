import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import pptxgen from "pptxgenjs";
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns the effective ID for storage, ensuring each unit and dashboard type has its own scope.
 */
const getEffectiveUserId = (userId: string): string => {
  return userId;
};

// Scoped storage helpers using prefix, year, and unit ID
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

const getSharedTabLabel = (prefix: string, year: string, userId: string, piId: string, defaultLabel: string): string => {
  const key = `${prefix}_pi_tab_${year}_${userId}_${piId}`;
  return localStorage.getItem(key) || defaultLabel;
};

const getSharedDataValue = (prefix: string, year: string, userId: string, piId: string, activityId: string, monthIdx: number, defaultValue: number): number => {
  const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

const getSharedFiles = (prefix: string, year: string, userId: string, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const key = `${prefix}_files_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultValues: number[], role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    if (prefix === 'accomplishment' && isConsolidated && units.length > 0) {
      value = units.reduce((sum, unit) => {
        const key = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(key);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);
    } else {
      value = getSharedDataValue(prefix, year, userId, piId, activityId, mIdx, defaultValues[mIdx] || 0);
    }

    return {
      value,
      files: getSharedFiles(prefix, year, userId, piId, activityId, mIdx)
    };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[]) => {
  const effectiveId = getEffectiveUserId(userId);
  const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
  const hiddenPIs: string[] = JSON.parse(localStorage.getItem(hiddenPIsKey) || '[]');
  const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
  const customOrder: string[] = JSON.parse(localStorage.getItem(orderKey) || '[]');

  const piStructureMap: Record<string, { title: string; activities: any[] }> = {
    PI1: {
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: [
        { id: "pi1_a1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snapshot formulated", defaults: Array(12).fill(1) },
        { id: "pi1_a2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: Array(12).fill(13) },
        { id: "pi1_a3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: Array(12).fill(9) },
        { id: "pi1_a4", name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", defaults: Array(12).fill(54) },
        { id: "pi1_a5", name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies", defaults: Array(12).fill(688) },
        { id: "pi1_a6", name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed", defaults: Array(12).fill(25) },
        { id: "pi1_a7", name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted", defaults: Array(12).fill(51) },
        { id: "pi1_a8", name: "Dissemination of related news articles", indicator: "No. of emails and SMS sent", defaults: Array(12).fill(36) },
        { id: "pi1_a9", name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers", defaults: Array(12).fill(10) },
        { id: "pi1_a10", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: Array(12).fill(600) },
        { id: "pi1_a11", name: "Social Media Engagement", indicator: "No. of Engagement", defaults: Array(12).fill(38) },
        { id: "pi1_a12", name: "Radio/TV/Live Streaming", indicator: "No. of guesting/show", defaults: Array(12).fill(15) },
        { id: "pi1_a13", name: "Press Briefing", indicator: "No. of Press Briefing to be conducted", defaults: Array(12).fill(16) },
        { id: "pi1_a14", name: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies GAD-Related IEC Materials to be distributed", defaults: Array(12).fill(15) },
        { id: "pi1_a15", name: "Conduct Awareness activity relative to clan/family feuds settlement", indicator: "No. of Awareness activity relative to clan/family feuds", defaults: Array(12).fill(13) },
        { id: "pi1_a16", name: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Lectures on Islamic Religious and Cultural Sensitivity", defaults: Array(12).fill(19) },
        { id: "pi1_a17", name: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding and Counter Radicalization", defaults: Array(12).fill(17) }
      ]
    },
    PI2: {
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [{ id: "pi2_a1", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs", indicator: "No. of collaborative efforts activities conducted", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }]
    },
    PI3: {
      title: "Number of participating respondents",
      activities: [
        { id: "pi3_a1", name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", defaults: Array(12).fill(5) },
        { id: "pi3_a2", name: "Convening of IO Working Group", indicator: "No. of activities conducted", defaults: Array(12).fill(6) },
        { id: "pi3_a3", name: "Activation of SyncCom during major events", indicator: "No. of activities conducted", defaults: Array(12).fill(8) },
        { id: "pi3_a4", name: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted", defaults: Array(12).fill(10) },
        { id: "pi3_a5", name: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted", defaults: Array(12).fill(5) },
        { id: "pi3_a6", name: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted", defaults: Array(12).fill(4) },
        { id: "pi3_a7", name: "PNP Good Deeds", indicator: "No. of PNP Good Deeds", defaults: Array(12).fill(15) },
        { id: "pi3_a8", name: "Drug Awareness Activities", indicator: "No. of activities conducted", defaults: Array(12).fill(9) },
        { id: "pi3_a9", name: "National Children's Month", indicator: "No. of activities conducted", defaults: Array(12).fill(6) }
      ]
    },
    PI4: {
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: [
        { id: "pi4_a1", name: "JAPIC", indicator: "JAPIC conducted", defaults: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
        { id: "pi4_a2", name: "Operations on loose firearms", indicator: "Operations on loose firearms conducted", defaults: Array(12).fill(3) },
        { id: "pi4_a3", name: "Bakal/Sita", indicator: "Bakal/Sita conducted", defaults: Array(12).fill(750) }
      ]
    },
    PI5: {
      title: "Number of functional LACAP",
      activities: [
        { id: "pi5_a1", name: "P/CPOC meetings", indicator: "# P/CPOC meetings participated", defaults: Array(12).fill(10) },
        { id: "pi5_a2", name: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted", defaults: Array(12).fill(43) },
        { id: "pi5_a3", name: "operations against illegal gambling", indicator: "# of operations against illegal gambling conducted", defaults: Array(12).fill(10) },
        { id: "pi5_a4", name: "operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted", defaults: Array(12).fill(55) }
      ]
    },
    PI6: {
      title: "Number of police stations utilizing PIPS",
      activities: [
        { id: "pi6_a1", name: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted", defaults: Array(12).fill(53) },
        { id: "pi6_a2", name: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted", defaults: Array(12).fill(138) }
      ]
    },
    PI7: {
      title: "Number of Internal Security Operations conducted",
      activities: [
        { id: "pi7_a1", name: "JPSCC meetings", indicator: "JPSCC meetings conducted", defaults: Array(12).fill(4) },
        { id: "pi7_a2", name: "PPSP", indicator: "PPSP conducted", defaults: Array(12).fill(30) }
      ]
    },
    PI8: {
      title: "Number of target hardening measures conducted",
      activities: [
        { id: "pi8_a1", name: "Security Survey/Inspection", indicator: "# of Security Survey/Inspection conducted", defaults: Array(12).fill(2) },
        { id: "pi8_a2", name: "CI check/validation", indicator: "# of CI check/validation conducted", defaults: Array(12).fill(18) },
        { id: "pi8_a3", name: "Clearances issued to civilians", indicator: "# of Clearances issued to civilians", defaults: Array(12).fill(3500) },
        { id: "pi8_a4", name: "# of beat/foot patrols conducted", indicator: "# of beat/foot patrols conducted", defaults: Array(12).fill(6142) },
        { id: "pi8_a5", name: "# of mobile patrols conducted", indicator: "# of mobile patrols conducted", defaults: Array(12).fill(640) },
        { id: "pi8_a6", name: "# of checkpoints conducted", indicator: "# of checkpoints conducted", defaults: Array(12).fill(700) }
      ]
    },
    PI9: {
      title: "Percentage reduction of crimes involving foreign and domestic tourists",
      activities: [
        { id: "pi9_a1", name: "Maintenance of TPU", indicator: "# of TPU maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a2", name: "Maintenance of TAC", indicator: "# of TAC maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a3", name: "Maintenance of TAD", indicator: "# of TAD maintained", defaults: Array(12).fill(3) }
      ]
    },
    PI10: {
      title: "Number of Police stations using COMPSTAT for crime prevention",
      activities: [
        { id: "pi10_a1", name: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting and Analysis System data recorded", defaults: Array(12).fill(300) },
        { id: "pi10_a2", name: "e-Wanted Persons Information System", indicator: "No. of Wanted Persons recorded", defaults: Array(12).fill(100) },
        { id: "pi10_a3", name: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded", defaults: Array(12).fill(170) }
      ]
    },
    PI11: {
      title: "Number of threat group neutralized",
      activities: [
        { id: "pi11_a1", name: "HVTs neutralized", indicator: "HVTs neutralized", defaults: Array(12).fill(4) },
        { id: "pi11_a2", name: "IRs (criminality) for validation referred", indicator: "IRs (criminality) for validation referred", defaults: Array(12).fill(45) }
      ]
    },
    PI12: {
      title: "Number of utilized BINs",
      activities: [
        { id: "pi12_a1", name: "# of inventory made", indicator: "# of inventory made", defaults: Array(12).fill(35) },
        { id: "pi12_a2", name: "# of BINs documented/registered and maintained", indicator: "# of BINs documented/registered and maintained", defaults: Array(12).fill(35) }
      ]
    },
    PI13: {
      title: "Number of criminal cases filed",
      activities: [{ id: "pi13_a1", name: "Total cases filed", indicator: "Total cases filed", defaults: Array(12).fill(0) }]
    },
    PI14: {
      title: "Number of cases resulting to conviction/dismissal",
      activities: [{ id: "pi14_a1", name: "Monitoring of Filed Cases", indicator: "Monitoring of Filed Cases", defaults: Array(12).fill(0) }]
    },
    PI15: {
      title: "Percentage of Trained investigative personnel",
      activities: [
        { id: "pi15_a1", name: "Nr. of Inventory Conducted for investigators (CIC)", indicator: "CIC", defaults: Array(12).fill(90) },
        { id: "pi15_a2", name: "Nr. of Inventory Conducted for investigators (IOBC)", indicator: "IOBC", defaults: Array(12).fill(14) }
      ]
    },
    PI16: {
      title: "Percentage of investigative positions filled up with trained investigators",
      activities: [{ id: "pi16_a1", name: "Screening and evaluation of candidates", indicator: "# of screening and evaluation conducted", defaults: Array(12).fill(0) }]
    },
    PI17: {
      title: "Improvement in response time",
      activities: [
        { id: "pi17_a1", name: "Repair of patrol vehicles", indicator: "# of patrol vehicles repaired", defaults: Array(12).fill(0) },
        { id: "pi17_a2", name: "Change oil of patrol vehicles", indicator: "# of change oil made", defaults: Array(12).fill(0) },
        { id: "pi17_a3", name: "Maintenance of OPCEN", indicator: "# of OPCEN maintained", defaults: Array(12).fill(0) }
      ]
    },
    PI18: {
      title: "Percentage of dedicated investigators assigned to handle specific cases",
      activities: [{ id: "pi18_a1", name: "Conduct case build up and investigation", indicator: "Percentage", defaults: Array(12).fill(100) }]
    },
    PI19: {
      title: "Number of recipients of a. awards b. punished",
      activities: [
        { id: "pi19_a1", name: "Monday Flag Raising/Awarding Ceremony", indicator: "# of Monday Flag Raising/Awarding Ceremony conducted", defaults: Array(12).fill(4) },
        { id: "pi19_a2", name: "Issuing commendations", indicator: "# of commendations issued", defaults: Array(12).fill(100) }
      ]
    },
    PI20: {
      title: "Percentage of investigative personnel equipped with standard investigative systems",
      activities: [{ id: "pi20_a1", name: "Attendance in specialized training", indicator: "Percentage", defaults: Array(12).fill(100) }]
    },
    PI21: {
      title: "Percentage of Police Stations using e-based system",
      activities: [{ id: "pi21_a1", name: "Total Stations", indicator: "Total", defaults: Array(12).fill(550) }]
    },
    PI22: {
      title: "Number of cases filed in court/total # of cases investigated",
      activities: [
        { id: "pi22_a1", name: "Index Crime Investigated", indicator: "No. Of Index Crime Investigated", defaults: Array(12).fill(30) },
        { id: "pi22_a2", name: "Index Crime Filed", indicator: "No. Of Index Crime Filed", defaults: Array(12).fill(28) }
      ]
    },
    PI23: {
      title: "Number of investigative infrastructure/equipment identified/accounted",
      activities: [{ id: "pi23_a1", name: "Inventory, inspection & Accounting", indicator: "# of Inventory, inspection & Accounting conducted", defaults: Array(12).fill(1) }]
    },
    PI24: {
      title: "Percentage of fill- up of investigative equipment and infrastructure",
      activities: [
        { id: "pi24_a1", name: "Field investigative crime scene kit", indicator: "No. of Field investigative crime scene kit accounted", defaults: Array(12).fill(21) },
        { id: "pi24_a2", name: "Police line", indicator: "No. of Police line accounted", defaults: Array(12).fill(45) }
      ]
    },
    PI25: {
      title: "Percentage of IT- compliant stations",
      activities: [
        { id: "pi25_a1", name: "computer preventive maintenance", indicator: "# of computer preventive maintenance conducted", defaults: Array(12).fill(210) },
        { id: "pi25_a2", name: "Maintenance of printers", indicator: "# of printers maintained", defaults: Array(12).fill(95) }
      ]
    },
    PI26: {
      title: "Number of linkages established",
      activities: [{ id: "pi26_a1", name: "JSCC meetings", indicator: "No. of JSCC meetings conducted", defaults: Array(12).fill(1) }]
    },
    PI27: {
      title: "Number of community/ stakeholders support generated",
      activities: [
        { id: "pi27_a1", name: "Memorandum of Agreement signing", indicator: "No. of MOA/MOU signing initiated", defaults: Array(12).fill(9) },
        { id: "pi27_a2", name: "Support to bloodletting activity", indicator: "No of Support to bloodletting activity conducted", defaults: Array(12).fill(5) }
      ]
    },
    PI28: {
      title: "Number of investigative activities funded",
      activities: [{ id: "pi28_a1", name: "Monitoring and Investigation of Violation of Specials laws", indicator: "No. of Investigation monitored", defaults: Array(12).fill(110) }]
    },
    PI29: {
      title: "Number of special investigation cases requested for fund support",
      activities: [{ id: "pi29_a1", name: "Creation and activation of SITG Cases", indicator: "# of SITG Cases Created and Activated", defaults: [0,0,0,0,0,0,0,0,0,1,0,0] }]
    }
  };

  const baseDefinitions = Object.keys(piStructureMap).map(piId => ({
    id: piId,
    title: piStructureMap[piId].title,
    activities: piStructureMap[piId].activities
  }));

  const customKey = `${prefix}_custom_definitions_${year}`;
  const customPIs = JSON.parse(localStorage.getItem(customKey) || '[]');
  let allDefinitions = [...baseDefinitions, ...customPIs];

  if (customOrder.length > 0) {
    allDefinitions.sort((a, b) => {
      const idxA = customOrder.indexOf(a.id);
      const idxB = customOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  return allDefinitions
    .filter(pi => !hiddenPIs.includes(pi.id))
    .map(pi => {
      const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${pi.id}`;
      const storedIds = localStorage.getItem(actIdsKey);
      const baseActivityIds = pi.activities.map((a: any) => a.id);
      let activityIds: string[] = storedIds ? JSON.parse(storedIds) : baseActivityIds;

      const activities = activityIds.map(aid => {
        const base = pi.activities.find((a: any) => a.id === aid);
        return {
          id: aid,
          activity: getSharedActivityName(prefix, year, effectiveId, pi.id, aid, base?.name || "New Activity"),
          indicator: getSharedIndicatorName(prefix, year, effectiveId, pi.id, aid, base?.indicator || "New Indicator"),
          months: createMonthsForActivity(prefix, year, effectiveId, pi.id, aid, base?.defaults || Array(12).fill(0), role, isConsolidated, units)
        };
      });

      return {
        id: pi.id,
        title: getSharedPITitle(prefix, year, effectiveId, pi.id, pi.title),
        activities
      };
    });
};

const DownloadIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <circle cx="256" cy="256" r="256" fill="url(#downloadGrad)" />
    <path d="M256 100V300" stroke="white" strokeWidth="40" strokeLinecap="round" />
    <path d="M170 215L256 300L342 215" stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M140 330V380H372V330" stroke="white" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="120" fill="#3b82f6" />
    <path d="M256 360V120" stroke="white" strokeWidth="48" strokeLinecap="round" />
    <path d="M170 207L256 120L342 207" stroke="white" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M130 310V410H382V310" stroke="white" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExcelExportIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="120" fill="#10B981" />
    <path d="M380 160H132V352H380V160Z" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M132 224H380" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M224 160V352" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M170 260L210 310M210 260L170 310" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RestoreHiddenIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="120" fill="black" />
    <path d="M360 152L152 360" stroke="white" strokeWidth="56" strokeLinecap="round" />
    <path d="M152 240V360H272" stroke="white" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" />
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
  const [activeTab, setActiveTab] = useState('PI1');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeFileCell, setActiveFileCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabLabel, setEditTabLabel] = useState<string>('');
  const [editingActivityField, setEditingActivityField] = useState<{ aid: string; field: 'activity' | 'indicator' } | null>(null);
  const [editFieldName, setEditFieldName] = useState<string>('');

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id), [subjectUser.id]);
  const isOwner = currentUser.id === subjectUser.id;
  const isHeadOfficeView = subjectUser.id === currentUser.id || subjectUser.role === UserRole.SUB_ADMIN;
  const isConsolidated = prefix === 'accomplishment' && isHeadOfficeView;
  const isRestrictedSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN && (subjectUser.role === UserRole.CHQ || subjectUser.role === UserRole.STATION);
  const canModifyData = (isOwner || (currentUser.role === UserRole.SUPER_ADMIN && isHeadOfficeView)) && !isRestrictedSuperAdmin && !isConsolidated;
  const canEditStructure = currentUser.role === UserRole.SUPER_ADMIN;

  const refresh = () => {
    const unitsToConsolidate = prefix === 'accomplishment' ? allUnits : [];
    const data = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate);
    setPiData(data.map(d => ({
      ...d,
      activities: d.activities.map(a => ({
        ...a,
        total: a.months.reduce((sum, m) => sum + m.value, 0)
      }))
    })));
    if (data.length > 0 && !data.find(d => d.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, activeTab, allUnits]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);
  const isPercent = useMemo(() => ["PI4", "PI9", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab), [activeTab]);

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
    const storageKey = `${prefix}_data_${year}_${effectiveId}_${activeTab}_${aid}_${editingCell.monthIdx}`;
    localStorage.setItem(storageKey, String(val));
    if (prefix === 'target' && year === '2026' && subjectUser.name === 'Police Station 1') {
      allUnits.forEach(unit => {
        if (unit.role === UserRole.STATION && unit.name !== 'City Mobile Force Company' && unit.id !== subjectUser.id) {
          const syncKey = `${prefix}_data_${year}_${unit.id}_${activeTab}_${aid}_${editingCell.monthIdx}`;
          localStorage.setItem(syncKey, String(val));
        }
      });
    }
    refresh();
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
      const aid = currentPI.activities[activeFileCell.rowIdx].id;
      const key = `${prefix}_files_${year}_${effectiveId}_${activeTab}_${aid}_${activeFileCell.monthIdx}`;
      const existing: MonthFile[] = JSON.parse(localStorage.getItem(key) || '[]');
      const newFile: MonthFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: reader.result as string,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify([...existing, newFile]));
      refresh();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fid: string) => {
    if (!activeFileCell || !currentPI) return;
    const aid = currentPI.activities[activeFileCell.rowIdx].id;
    const key = `${prefix}_files_${year}_${effectiveId}_${activeTab}_${aid}_${activeFileCell.monthIdx}`;
    const existing: MonthFile[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(f => f.id !== fid)));
    refresh();
  };

  const handleAddActivity = () => {
    if (!canEditStructure || !currentPI) return;
    const newId = `custom_act_${Date.now()}`;
    const currentActIds = currentPI.activities.map(a => a.id);
    const newActIds = [...currentActIds, newId];
    localStorage.setItem(`${prefix}_pi_act_ids_${year}_${effectiveId}_${activeTab}`, JSON.stringify(newActIds));
    localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${activeTab}_${newId}`, "New Activity Entry");
    localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${activeTab}_${newId}`, "Unit Count");
    refresh();
  };

  const removeActivity = (aid: string) => {
    if (!canEditStructure || !currentPI) return;
    if (!confirm('Are you sure you want to PERMANENTLY remove this activity row for this unit view?')) return;
    const newIds = currentPI.activities.map(a => a.id).filter(id => id !== aid);
    localStorage.setItem(`${prefix}_pi_act_ids_${year}_${effectiveId}_${activeTab}`, JSON.stringify(newIds));
    refresh();
  };

  const handleMoveTab = (e: React.MouseEvent, piId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    if (!canEditStructure) return;
    const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
    const currentOrder = piData.map(p => p.id);
    const idx = currentOrder.indexOf(piId);
    if (idx === -1) return;
    const newOrder = [...currentOrder];
    if (direction === 'left' && idx > 0) [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    else if (direction === 'right' && idx < newOrder.length - 1) [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    refresh();
  };

  const handleStartRenameTab = (e: React.MouseEvent, pi: PIData) => {
    e.stopPropagation();
    if (!canEditStructure) return;
    setEditingTabId(pi.id);
    setEditTabLabel(getSharedTabLabel(prefix, year, effectiveId, pi.id, `PI ${pi.id.replace('PI','')}`));
  };

  const handleSaveTabLabel = () => {
    if (editingTabId) {
      localStorage.setItem(`${prefix}_pi_tab_${year}_${effectiveId}_${editingTabId}`, editTabLabel);
      setEditingTabId(null);
      refresh();
    }
  };

  const hideTab = (pid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditStructure) return;
    if (!confirm(`Permanently hide Tab ${pid} from the current unit's report profile?`)) return;
    const key = `${prefix}_hidden_pis_${year}_${effectiveId}`;
    const hidden: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...hidden, pid]));
    refresh();
  };

  const handleStartEditField = (aid: string, field: 'activity' | 'indicator', currentVal: string) => {
    if (!canEditStructure) return;
    setEditingActivityField({ aid, field });
    setEditFieldName(currentVal);
  };

  const handleSaveField = () => {
    if (!editingActivityField) return;
    const { aid, field } = editingActivityField;
    const key = field === 'activity' 
      ? `${prefix}_pi_act_name_${year}_${effectiveId}_${activeTab}_${aid}`
      : `${prefix}_pi_ind_name_${year}_${effectiveId}_${activeTab}_${aid}`;
    localStorage.setItem(key, editFieldName);
    setEditingActivityField(null);
    refresh();
  };

  const unhideAll = () => {
    if (!confirm('Restore all hidden items and reset tab labels/order for this unit/year?')) return;
    localStorage.removeItem(`${prefix}_hidden_pis_${year}_${effectiveId}`);
    localStorage.removeItem(`${prefix}_pi_order_${year}_${effectiveId}`);
    refresh();
  };

  /**
   * Generates a comprehensive multi-sheet Excel report for all active Performance Indicators.
   * As requested: exports all tabbings (PI 1 to PI 29) with their respective monthly data.
   */
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    piData.forEach(pi => {
      const tabLabel = getSharedTabLabel(prefix, year, effectiveId, pi.id, `PI ${pi.id.replace('PI','')}`);
      const piIsPercent = ["PI4", "PI9", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(pi.id);

      // Construct a data array for the sheet
      const sheetData = pi.activities.map(act => {
        const row: Record<string, any> = {
          "Activity": act.activity,
          "Indicator": act.indicator
        };
        
        // Add monthly values
        act.months.forEach((m, idx) => {
          row[MONTHS[idx]] = piIsPercent ? `${m.value}%` : m.value;
        });
        
        // Add row total
        row["Total"] = piIsPercent ? `${Math.round(act.total / 12)}%` : act.total;
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      
      // Basic column width hints for better readability
      worksheet['!cols'] = [
        { wch: 45 }, // Activity
        { wch: 45 }, // Indicator
        ...Array(13).fill({ wch: 8 }) // Jan-Dec + Total
      ];

      // Excel sheet names are restricted to 31 chars and certain symbols are forbidden
      const safeSheetName = tabLabel.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, ' ');
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });

    const reportType = isTargetOutlook ? 'Target_Outlook' : 'Accomplishment_Report';
    XLSX.writeFile(workbook, `${subjectUser.name}_${reportType}_${year}.xlsx`);
  };

  const handleExportPPT = async () => {
    const pres = new pptxgen();
    const titleSlide = pres.addSlide();
    titleSlide.background = { fill: "F8FAFC" };
    titleSlide.addText("CPSMU Monitoring Report", { x: 0, y: "40%", w: "100%", align: "center", fontSize: 36, bold: true, color: "0F172A" });
    titleSlide.addText(`${title}\nUnit: ${subjectUser.name}`, { x: 0, y: "55%", w: "100%", align: "center", fontSize: 18, color: "64748B" });
    piData.forEach(pi => {
      const slide = pres.addSlide();
      slide.addText(pi.title, { x: 0.5, y: 0.3, w: "90%", fontSize: 14, bold: true, color: "0F172A", align: "center" });
      const piIsPercent = ["PI4", "PI9", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(pi.id);
      const tableData = [
        [{ text: "Activity", options: { fill: "FFFF00", bold: true } }, { text: "Indicator", options: { fill: "FFFF00", bold: true } }, ...MONTHS.map(m => ({ text: m, options: { fill: "00B0F0", bold: true, color: "FFFFFF" } })), { text: "Total", options: { fill: "FFFF00", bold: true } }],
        ...pi.activities.map(a => [{ text: a.activity }, { text: a.indicator }, ...a.months.map(m => ({ text: piIsPercent ? `${m.value}%` : String(m.value) })), { text: piIsPercent ? `${Math.round(a.total / 12)}%` : String(a.total), options: { bold: true } }])
      ];
      slide.addTable(tableData, { x: 0.2, y: 1.0, w: 9.6, fontSize: 8, border: { type: "solid", color: "CBD5E1", pt: 0.5 }, align: "center", valign: "middle", autoPage: true, colWidths: [1.8, 1.8, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.6] });
    });
    pres.writeFile({ fileName: `${subjectUser.name}_${prefix}_${year}_Dashboard.pptx` });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      jsonData.forEach(row => {
        const { PI_ID, PI_Title, Tab_Label, Activity_ID, Activity_Name, Indicator_Name } = row;
        if (PI_ID && PI_Title) localStorage.setItem(`${prefix}_pi_title_${year}_${effectiveId}_${PI_ID}`, PI_Title);
        if (PI_ID && Tab_Label) localStorage.setItem(`${prefix}_pi_tab_${year}_${effectiveId}_${PI_ID}`, Tab_Label);
        if (PI_ID && Activity_ID && Activity_Name) localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${PI_ID}_${Activity_ID}`, Activity_Name);
        if (PI_ID && Activity_ID && Indicator_Name) localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${PI_ID}_${Activity_ID}`, Indicator_Name);
      });
      refresh();
      alert('Dashboard structure updated successfully!');
      if (excelImportRef.current) excelImportRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const totals = useMemo(() => {
    if (!currentPI) return { m: Array(12).fill(0), g: 0 };
    const m = Array(12).fill(0);
    currentPI.activities.forEach(a => a.months.forEach((mo, i) => m[i] += mo.value));
    const div = currentPI.activities.length || 1;
    const mOut = isPercent ? m.map(v => Math.round(v / div)) : m;
    const g = isPercent ? (mOut.reduce((s,v)=>s+v,0)/12) : currentPI.activities.reduce((s, a) => s + a.total, 0);
    return { m: mOut, g: isPercent ? Math.round(g) : g };
  }, [currentPI, isPercent]);

  if (!currentPI) return null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900 transition flex items-center gap-2 mb-3">Back to Overview</button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-widest">UNIT: {subjectUser.name}</span>
            <div className="flex items-center gap-2 ml-2">
              <button onClick={handleExportPPT} className="p-1 hover:scale-110 transition-transform" title="Export PPT"><DownloadIcon /></button>
              <button onClick={handleExportExcel} className="p-1 hover:scale-110 transition-transform" title="Export Excel Report (PI 1 to PI 29)"><ExcelExportIcon /></button>
              {currentUser.role === UserRole.SUPER_ADMIN && (
                <>
                  <label className="p-1 hover:scale-110 transition-transform cursor-pointer" title="Import Structure Template">
                    <UploadIcon />
                    <input type="file" ref={excelImportRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                  </label>
                  <button onClick={unhideAll} className="p-1 hover:scale-110 transition-transform" title="Restore Hidden Items"><RestoreHiddenIcon /></button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {piData.map((pi) => {
            const label = getSharedTabLabel(prefix, year, effectiveId, pi.id, `PI ${pi.id.replace('PI','')}`);
            const isEditing = editingTabId === pi.id;
            return (
              <div key={pi.id} className="relative group/tab flex items-center gap-1">
                {canEditStructure && !isEditing && (
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                    <button onClick={(e) => handleMoveTab(e, pi.id, 'left')} className="p-0.5 bg-slate-100 rounded text-slate-500"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                    <button onClick={(e) => handleMoveTab(e, pi.id, 'right')} className="p-0.5 bg-slate-100 rounded text-slate-500"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                )}
                <div className="relative group">
                  <button 
                    onClick={() => !isEditing && setActiveTab(pi.id)} 
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all border flex items-center gap-2 ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {isEditing ? (
                      <input autoFocus className="bg-white text-slate-900 px-1 rounded border border-blue-500 font-black outline-none w-24" value={editTabLabel} onChange={e => setEditTabLabel(e.target.value)} onBlur={handleSaveTabLabel} onKeyDown={e => e.key === 'Enter' && handleSaveTabLabel()} />
                    ) : label}
                    {canEditStructure && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button onClick={(e) => handleStartRenameTab(e, pi)} className="text-slate-400 hover:text-blue-400 p-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={(e) => hideTab(pi.id, e)} className="text-slate-400 hover:text-red-400 p-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-slate-50 py-4 px-6 border-b border-slate-200 text-center font-black uppercase text-slate-800 text-[10px] tracking-widest flex items-center justify-center gap-2">
          Indicator #{activeTab.replace('PI','')} – {currentPI.title}
          {isConsolidated && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[8px] font-black uppercase tracking-tighter">Aggregated View</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#FFFF00] font-black uppercase">
                <th rowSpan={2} className="border border-slate-300 p-2 w-72">Activity</th>
                <th rowSpan={2} className="border border-slate-300 p-2 w-72">Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-white">{isTargetOutlook ? `${year} Target Outlook` : `${year} Accomplishments`}</th>
                <th rowSpan={2} className="border border-slate-300 p-2 w-16">Total</th>
              </tr>
              <tr className="bg-[#FFFF00] uppercase font-bold">{MONTHS.map(m => <th key={m} className="border border-slate-300 p-1 w-10">{m}</th>)}</tr>
            </thead>
            <tbody>
              {currentPI.activities.map((a, rIdx) => (
                <tr key={a.id} className="hover:bg-blue-50/30 group">
                  <td className="border border-slate-300 p-2 relative group-hover:pr-10 transition-all">
                    {editingActivityField?.aid === a.id && editingActivityField?.field === 'activity' ? (
                      <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none font-black" value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                    ) : (
                      <span className={canEditStructure ? 'cursor-pointer hover:underline' : ''} onClick={() => handleStartEditField(a.id, 'activity', a.activity)}>{a.activity}</span>
                    )}
                    {canEditStructure && <button onClick={() => removeActivity(a.id)} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                  </td>
                  <td className="border border-slate-300 p-2">
                    {editingActivityField?.aid === a.id && editingActivityField?.field === 'indicator' ? (
                      <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none font-black" value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                    ) : (
                      <span className={canEditStructure ? 'cursor-pointer hover:underline' : ''} onClick={() => handleStartEditField(a.id, 'indicator', a.indicator)}>{a.indicator}</span>
                    )}
                  </td>
                  {a.months.map((m, mIdx) => (
                    <td key={mIdx} className="border border-slate-300 p-1 text-center">
                      {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                        <input autoFocus className="w-full bg-white border border-blue-500 rounded text-center outline-none font-black" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[34px]">
                          <span className={`text-blue-700 font-bold ${canModifyData ? 'cursor-pointer hover:underline' : ''}`} onClick={() => handleCellClick(rIdx, mIdx, m.value)}>{m.value}{isPercent ? '%' : ''}</span>
                          <button onClick={e => handleOpenFiles(e, rIdx, mIdx)} className={`mt-0.5 text-[7px] font-black px-1 rounded border transition-all ${m.files.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 border-slate-200'}`}>{m.files.length > 0 ? `📎 ${m.files.length}` : '+ FILE'}</button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="border border-slate-300 p-2 text-center font-black bg-slate-50">{isPercent ? `${Math.round(a.total/12)}%` : a.total}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-black uppercase">
                <td colSpan={2} className="border border-slate-300 p-2 text-right">TOTAL</td>
                {totals.m.map((v, i) => <td key={i} className="border border-slate-300 p-1 text-center">{v}{isPercent ? '%' : ''}</td>)}
                <td className="border border-slate-300 p-2 text-center text-white bg-slate-900">{totals.g}{isPercent ? '%' : ''}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {canEditStructure && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
            <button onClick={handleAddActivity} className="px-6 py-2 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black text-xs uppercase hover:bg-slate-900 hover:text-white transition-all shadow-sm">Add New Activity Entry</button>
          </div>
        )}
      </div>

      {isFilesModalOpen && activeFileCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div><h3 className="text-xl font-black text-slate-900">Evidence Terminal</h3><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{MONTHS[activeFileCell.monthIdx]} {year} • {currentPI.activities[activeFileCell.rowIdx].activity}</p></div>
              <button onClick={() => setIsFilesModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length === 0 ? <div className="text-center py-8 text-slate-400 font-bold text-xs">No documents uploaded.</div> : currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-800 truncate">{f.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(f.uploadedAt).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-1"><a href={f.url} download={f.name} className="p-1.5 text-slate-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>{canModifyData && <button onClick={() => removeFile(f.id)} className="p-1.5 text-slate-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}</div>
                </div>
              ))}
            </div>
            {canModifyData && <div className="p-6 bg-slate-50 border-t border-slate-100"><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow hover:bg-slate-800 flex items-center justify-center gap-2 transition-all">Upload Evidence</button></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;