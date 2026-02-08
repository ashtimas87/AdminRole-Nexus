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

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], ignoreHidden = false) => {
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
        { id: "pi3_a1", name: "Secretariat Meetings", indicator: "No Secretariat Meetings conducted", defaults: Array(12).fill(5) },
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

  const customKey = `${prefix}_custom_definitions_${year}_${effectiveId}`;
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
    .filter(pi => ignoreHidden ? true : !hiddenPIs.includes(pi.id))
    .map(pi => {
      const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${pi.id}`;
      const storedIds = localStorage.getItem(actIdsKey);
      const baseActivityIds = pi.activities.map((a: any) => a.id);
      let activityIds: string[] = storedIds ? JSON.parse(storedIds) : baseActivityIds;

      const activities = activityIds.map(aid => {
        const base = pi.activities.find((a: any) => a.id === aid);
        
        let effectiveDefaults = base?.defaults || Array(12).fill(0);
        if (prefix === 'accomplishment' && (role === UserRole.CHQ || role === UserRole.STATION)) {
          effectiveDefaults = Array(12).fill(0);
        }

        return {
          id: aid,
          activity: getSharedActivityName(prefix, year, effectiveId, pi.id, aid, base?.name || "New Activity"),
          indicator: getSharedIndicatorName(prefix, year, effectiveId, pi.id, aid, base?.indicator || "New Indicator"),
          months: createMonthsForActivity(prefix, year, effectiveId, pi.id, aid, effectiveDefaults, role, isConsolidated, units)
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

const TemplateExportIcon = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="120" fill="#6366f1" />
    <path d="M160 120V392H352V200L272 120H160Z" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M210 240H302" stroke="white" strokeWidth="32" strokeLinecap="round" />
    <path d="M210 290H302" stroke="white" strokeWidth="32" strokeLinecap="round" />
    <path d="M210 340H260" stroke="white" strokeWidth="32" strokeLinecap="round" />
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
  const structureImportRef = useRef<HTMLInputElement>(null);
  const masterImportRef = useRef<HTMLInputElement>(null);
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

  const exportStructureTemplate = () => {
    if (!currentPI) return;
    const worksheetData = currentPI.activities.map(act => {
      const row: any = {
        'PI ID': currentPI.id,
        'PI Title': currentPI.title,
        'Activity ID': act.id,
        'Activity Name': act.activity,
        'Indicator': act.indicator,
      };
      MONTHS.forEach((m, i) => {
        row[m] = act.months[i].value;
      });
      row['Total'] = act.total;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Structure Template");
    XLSX.writeFile(wb, `${currentPI.id}_Structure_Template_${year}.xlsx`);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      data.forEach(row => {
        const piId = row['PI ID'];
        const aid = row['Activity ID'];
        const actName = row['Activity Name'];
        const indicator = row['Indicator'];

        if (piId && aid) {
          if (actName) localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, actName);
          if (indicator) localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, indicator);
          
          MONTHS.forEach((m, i) => {
            if (row[m] !== undefined) {
              localStorage.setItem(`${prefix}_data_${year}_${effectiveId}_${piId}_${aid}_${i}`, String(row[m]));
            }
          });
        }
      });
      refresh();
      if (structureImportRef.current) structureImportRef.current.value = '';
      alert('Structure and data imported successfully.');
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    if (!currentPI) return;
    const worksheetData = currentPI.activities.map(act => {
      const row: any = {
        'Activity': act.activity,
        'Indicator': act.indicator,
      };
      MONTHS.forEach((m, i) => {
        row[m] = act.months[i].value;
      });
      row['Total'] = act.total;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${subjectUser.name}_${activeTab}_Report_${year}.xlsx`);
  };

  const handleExportAllExcel = () => {
    const unitsToConsolidate = prefix === 'accomplishment' ? allUnits : [];
    // Get all definitions, ignoring hidden state for a full system export
    const allData = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate, true);
    
    const wb = XLSX.utils.book_new();
    
    allData.forEach(pi => {
      const worksheetData = pi.activities.map(act => {
        const row: any = {
          'Strategic Activity': act.activity,
          'Performance Indicator': act.indicator,
        };
        MONTHS.forEach((m, i) => {
          row[m] = act.months[i].value;
        });
        const total = act.months.reduce((sum, m) => sum + m.value, 0);
        row['Total'] = total;
        return row;
      });
      
      const ws = XLSX.utils.json_to_sheet(worksheetData);
      
      // Auto-size columns roughly for better UX
      const wscols = [
        {wch: 45}, // Strategic Activity
        {wch: 35}, // Performance Indicator
        ...MONTHS.map(() => ({wch: 8})),
        {wch: 10}  // Total
      ];
      ws['!cols'] = wscols;

      // Excel sheet names have a limit of 31 characters
      XLSX.utils.book_append_sheet(wb, ws, pi.id.substring(0, 31));
    });
    
    XLSX.writeFile(wb, `COCPO_${subjectUser.name}_Full_Report_${year}.xlsx`);
  };

  /**
   * Bulk Export Master Template (All 29 PIs) in a single flat sheet for easy system editing.
   */
  const handleExportMasterTemplate = () => {
    const unitsToConsolidate = prefix === 'accomplishment' ? allUnits : [];
    const allData = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate, true);
    
    const flattenedRows: any[] = [];
    allData.forEach(pi => {
      pi.activities.forEach(act => {
        const row: any = {
          'PI ID': pi.id,
          'PI Title': pi.title,
          'Activity ID': act.id,
          'Strategic Activity': act.activity,
          'Performance Indicator': act.indicator,
        };
        MONTHS.forEach((m, i) => {
          row[m] = act.months[i].value;
        });
        flattenedRows.push(row);
      });
    });

    const ws = XLSX.utils.json_to_sheet(flattenedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master System Template");
    XLSX.writeFile(wb, `COCPO_MASTER_TEMPLATE_${prefix.toUpperCase()}_${year}.xlsx`);
  };

  /**
   * Bulk Import Master Template (All 29 PIs) from a single Excel file.
   */
  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      data.forEach(row => {
        const piId = row['PI ID'];
        const aid = row['Activity ID'];
        const actName = row['Strategic Activity'];
        const indicator = row['Performance Indicator'];

        if (piId && aid) {
          if (actName) localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, actName);
          if (indicator) localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, indicator);
          
          MONTHS.forEach((m, i) => {
            if (row[m] !== undefined) {
              localStorage.setItem(`${prefix}_data_${year}_${effectiveId}_${piId}_${aid}_${i}`, String(row[m]));
            }
          });
        }
      });
      refresh();
      if (masterImportRef.current) masterImportRef.current.value = '';
      alert('Master system structure and data successfully updated.');
    };
    reader.readAsBinaryString(file);
  };

  const handleMoveTab = (e: React.MouseEvent, piId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    if (!canEditStructure) return;
    const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
    const currentOrder = piData.map(pi => pi.id);
    const idx = currentOrder.indexOf(piId);
    if (idx === -1) return;
    const newIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    refresh();
  };

  const renderTable = () => (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              {activeTab} - {currentPI?.title}
            </h2>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Office: {subjectUser.name} • Data Terminal: {year}</p>
          </div>
          {canModifyData && (
            <div className="flex gap-3">
              <button 
                onClick={() => structureImportRef.current?.click()}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2"
              >
                <UploadIcon /> Import Structure
              </button>
              <button 
                onClick={exportStructureTemplate}
                className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2"
              >
                <TemplateExportIcon /> Export Template
              </button>
              <input type="file" ref={structureImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportTemplate} />
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {canEditStructure && <th className="px-6 py-4 w-12"></th>}
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Strategic Activity</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[150px]">Performance Indicator</th>
              {MONTHS.map(m => (
                <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[60px]">{m}</th>
              ))}
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest min-w-[80px]">Total</th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[80px]">Docs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPI?.activities.map((act, rIdx) => (
              <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                {canEditStructure && (
                  <td className="px-6 py-4">
                    <button onClick={() => removeActivity(act.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                )}
                <td className="px-6 py-4">
                  {editingActivityField?.aid === act.id && editingActivityField?.field === 'activity' ? (
                    <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => {
                      localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName);
                      setEditingActivityField(null);
                      refresh();
                    }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-900 outline-none" />
                  ) : (
                    <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'activity' }), setEditFieldName(act.activity))} className={`text-sm font-bold text-slate-900 leading-snug ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>
                      {act.activity}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingActivityField?.aid === act.id && editingActivityField?.field === 'indicator' ? (
                    <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => {
                      localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName);
                      setEditingActivityField(null);
                      refresh();
                    }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-500 outline-none" />
                  ) : (
                    <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'indicator' }), setEditFieldName(act.indicator))} className={`text-xs font-medium text-slate-500 leading-relaxed ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>
                      {act.indicator}
                    </div>
                  )}
                </td>
                {act.months.map((m, mIdx) => (
                  <td key={mIdx} className="px-2 py-4">
                    {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                      <input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-16 mx-auto px-2 py-1 bg-white border-2 border-slate-900 rounded text-center text-sm font-black outline-none shadow-lg z-20" />
                    ) : (
                      <div onClick={() => handleCellClick(rIdx, mIdx, m.value)} className={`w-12 h-10 mx-auto flex items-center justify-center rounded-xl text-sm font-black transition-all ${canModifyData ? 'cursor-pointer hover:bg-slate-100 hover:scale-105 active:scale-95' : ''} ${m.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                        {m.value}{isPercent ? '%' : ''}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <div className="text-sm font-black text-slate-900 bg-slate-100/50 py-2 rounded-xl">
                    {act.total}{isPercent ? '%' : ''}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={(e) => {
                      const firstMonthIdx = act.months.findIndex(m => m.files.length > 0);
                      handleOpenFiles(e, rIdx, firstMonthIdx === -1 ? 0 : firstMonthIdx);
                    }} 
                    className={`p-2 rounded-xl transition-all ${act.months.some(m => m.files.length > 0) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEditStructure && (
        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <button onClick={handleAddActivity} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Activity Entry
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Return to Terminal
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Operations & Unit Accomplishment Control</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser.role === UserRole.SUPER_ADMIN && (
            <>
              <button onClick={handleExportMasterTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
                <TemplateExportIcon /> Export Master Template
              </button>
              <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
                <UploadIcon /> Import Master Template
              </button>
              <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
            </>
          )}
          <button onClick={handleExportExcel} className="bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-700 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm flex items-center gap-2">
            <ExcelExportIcon /> Export Current PI
          </button>
          {currentUser.role === UserRole.SUPER_ADMIN && (
            <button onClick={handleExportAllExcel} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm flex items-center gap-2">
              <ExcelExportIcon /> Export All PIs Report
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {piData.map(pi => (
          <div key={pi.id} className="relative group flex-shrink-0">
            <button onClick={() => setActiveTab(pi.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
              {getSharedTabLabel(prefix, year, effectiveId, pi.id, pi.id)}
            </button>
            {canEditStructure && (
              <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75">
                <button onClick={(e) => handleMoveTab(e, pi.id, 'left')} className="p-1.5 bg-white shadow-lg rounded-full text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-100">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={(e) => handleMoveTab(e, pi.id, 'right')} className="p-1.5 bg-white shadow-lg rounded-full text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-100">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {renderTable()}

      {isFilesModalOpen && activeFileCell && currentPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">MOVs & Documents</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {currentPI.activities[activeFileCell.rowIdx].activity} • {MONTHS[activeFileCell.monthIdx]}
                </p>
              </div>
              <button onClick={() => setIsFilesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(file => (
                    <div key={file.id} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-500/50 hover:bg-blue-50/10 transition-all">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black text-slate-900 truncate">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={file.url} download={file.name} className="p-2 text-slate-400 hover:text-blue-600 transition"><DownloadIcon /></a>
                        {canModifyData && (
                          <button onClick={() => removeFile(file.id)} className="p-2 text-slate-400 hover:text-red-600 transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No MOVs Found</p>
                </div>
              )}

              {canModifyData && (
                <div className="pt-4">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2">
                    <UploadIcon /> Upload New Document
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;