
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import pptxgen from "pptxgenjs";
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns the effective ID for storage, ensuring each unit and dashboard type has its own scope.
 * Maps SUB_ADMIN to 'sa-1' (Super Admin) for Target Outlook to share data.
 */
const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (role === UserRole.SUB_ADMIN && prefix === 'target') {
    return 'sa-1';
  }
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

const getSharedFiles = (prefix: string, year: string, userId: string, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const key = `${prefix}_files_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, defaultValues: number[], role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    
    // Check if there is an explicit value stored for this specific user/view
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);

    if (stored !== null) {
      value = parseInt(stored, 10);
    } else if (isConsolidated && units.length > 0) {
      // For consolidated views, sum up all unit data
      value = units.reduce((sum, unit) => {
        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);

      // FALLBACK FOR TARGET OUTLOOK: If consolidated sum is 0, show the Super Admin's "Master" target if available
      if (value === 0 && prefix === 'target' && userId !== 'sa-1') {
        const masterKey = `${prefix}_data_${year}_sa-1_${piId}_${activityId}_${mIdx}`;
        const masterVal = localStorage.getItem(masterKey);
        if (masterVal !== null) {
          value = parseInt(masterVal, 10);
        }
      }
    } else {
      value = defaultValues[mIdx] || 0;
    }

    return {
      value,
      files: getSharedFiles(prefix, year, userId, piId, activityId, mIdx)
    };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], ignoreHidden = false) => {
  const effectiveId = getEffectiveUserId(userId, role, prefix);
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
        if ((prefix === 'accomplishment' || prefix === 'target') && (role === UserRole.CHQ || role === UserRole.STATION)) {
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

const PaperclipIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${active ? 'text-emerald-500' : 'text-slate-300 group-hover/cell:text-slate-400'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 512 512" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M165.04 100.32L346.96 100.32L512 386.13L330.08 386.13L165.04 100.32Z" fill="#00A859"/>
    <path d="M181.92 386.13L0 386.13L165.04 100.32L346.96 100.32L181.92 386.13Z" fill="#FFC107"/>
    <path d="M181.92 386.13L346.96 100.32L512 386.13L330.08 386.13L181.92 386.13Z" fill="#3B82F6"/>
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full text-blue-400" fill="currentColor">
    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'local' | 'mirroring' | 'complete'>('idle');
  const [vaultData, setVaultData] = useState<any[]>([]); 
  const [vaultFolder, setVaultFolder] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterImportRef = useRef<HTMLInputElement>(null);
  const [editingActivityField, setEditingActivityField] = useState<{ aid: string; field: 'activity' | 'indicator' } | null>(null);
  const [editFieldName, setEditFieldName] = useState<string>('');
  const [vaultOpen, setVaultOpen] = useState(false);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id, subjectUser.role, prefix), [subjectUser.id, subjectUser.role, prefix]);
  
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;
  const isOwner = currentUser.id === subjectUser.id;
  const isHeadOfficeView = subjectUser.id === currentUser.id || subjectUser.role === UserRole.SUB_ADMIN;
  const isConsolidated = (prefix === 'accomplishment' || prefix === 'target') && isHeadOfficeView;
  
  const canModifyData = isOwner || currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && subjectUser.role === UserRole.STATION);
  const canEditStructure = currentUser.role === UserRole.SUPER_ADMIN;
  const canAccessFiles = isOwner || isAdmin;

  const refresh = () => {
    const unitsToConsolidate = (prefix === 'accomplishment' || prefix === 'target') ? allUnits : [];
    const data = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate);
    setPiData(data.map(d => ({
      ...d,
      activities: d.activities.map(a => ({
        ...a,
        total: a.months.reduce((sum, m) => sum + m.value, 0)
      }))
    })));
    
    const vaultKey = `superadmin_drive_vault_${year}`;
    setVaultData(JSON.parse(localStorage.getItem(vaultKey) || '[]'));

    // Reset active tab if the imported file hid the current one
    if (data.length > 0 && !data.find(d => d.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, activeTab, allUnits]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  // Helper to determine if a performance indicator text implies a percentage value
  const checkIsPercent = (indicator: string) => {
    const lower = indicator.toLowerCase();
    // Keywords that imply a percentage
    if (lower.includes('percentage') || lower.includes('%') || lower.includes('rate') || lower.includes('ratio')) {
       // Keywords that explicitly override and imply a count/number
       if (lower.includes('no.') || lower.includes('number') || lower.includes('#') || lower.includes('count')) {
          return false;
       }
       return true;
    }
    return false;
  };

  const syncToSuperAdminDrive = (files: MonthFile[], unitId: string) => {
    const vaultKey = `superadmin_drive_vault_${year}`;
    const vault: any[] = JSON.parse(localStorage.getItem(vaultKey) || '[]');
    const newEntries = files.map(file => ({
      ...file,
      unitId,
      unitName: subjectUser.name,
      prefix,
      piId: activeTab || 'MASTER',
      syncedAt: new Date().toISOString(),
      sharedWith: "barvickrunch@gmail.com"
    }));
    const updatedVault = [...vault, ...newEntries];
    localStorage.setItem(vaultKey, JSON.stringify(updatedVault));
    setVaultData(updatedVault); 
  };

  const saveDataWithSync = (piId: string, aid: string, monthIdx: number, val: number) => {
    const storageKey = `${prefix}_data_${year}_${effectiveId}_${piId}_${aid}_${monthIdx}`;
    localStorage.setItem(storageKey, String(val));
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
    saveDataWithSync(activeTab, aid, editingCell.monthIdx, val);
    refresh();
    setEditingCell(null);
  };

  const handleOpenFiles = (e: React.MouseEvent, rowIdx: number, monthIdx: number) => {
    e.stopPropagation();
    if (!canAccessFiles) {
      alert("Access Denied. Only Admins or the Unit Owner can access uploaded MOVs.");
      return;
    }
    setActiveFileCell({ rowIdx, monthIdx });
    setIsFilesModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeFileCell || !currentPI) return;
    
    setSyncStatus('local');
    const aid = currentPI.activities[activeFileCell.rowIdx].id;
    const key = `${prefix}_files_${year}_${effectiveId}_${activeTab}_${aid}_${activeFileCell.monthIdx}`;
    const existing: MonthFile[] = JSON.parse(localStorage.getItem(key) || '[]');
    
    const newFiles: MonthFile[] = [];
    const uploadPromises = Array.from(files).map((file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: reader.result as string,
            type: file.type,
            uploadedAt: new Date().toISOString()
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(uploadPromises);
    
    const updatedFiles = [...existing, ...newFiles];
    localStorage.setItem(key, JSON.stringify(updatedFiles));
    
    // Mirroring to Super Admin Drive
    setTimeout(() => {
      setSyncStatus('mirroring');
      syncToSuperAdminDrive(newFiles, effectiveId);
      
      setTimeout(() => {
        setSyncStatus('complete');
        refresh();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSyncStatus('idle'), 2000);
      }, 1000);
    }, 800);
  };

  const removeFile = (fid: string) => {
    if (!activeFileCell || !currentPI) return;
    const aid = currentPI.activities[activeFileCell.rowIdx].id;
    const key = `${prefix}_files_${year}_${effectiveId}_${activeTab}_${aid}_${activeFileCell.monthIdx}`;
    const existing: MonthFile[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(existing.filter(f => f.id !== fid)));

    const vaultKey = `superadmin_drive_vault_${year}`;
    const vault: any[] = JSON.parse(localStorage.getItem(vaultKey) || '[]');
    const updatedVault = vault.filter((f: any) => f.id !== fid);
    localStorage.setItem(vaultKey, JSON.stringify(updatedVault));
    setVaultData(updatedVault);

    refresh();
  };

  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mirroring source Master file to Super Admin Drive
    const masterReader = new FileReader();
    masterReader.onload = () => {
      const masterFileObj: MonthFile = {
        id: `master-${Date.now()}`,
        name: `IMPORTED_MASTER_${file.name}`,
        url: masterReader.result as string,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
      syncToSuperAdminDrive([masterFileObj], effectiveId);
    };
    masterReader.readAsDataURL(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      
      const foundPIs = new Set<string>();
      const piActivitiesMap: Record<string, string[]> = {};
      const customPIsMap: Record<string, { id: string; title: string; activities: any[] }> = {};
      const standardPIIds = Array.from({length: 29}, (_, i) => `PI${i+1}`);

      data.forEach(row => {
        const piIdRaw = row['PI ID'];
        const piId = piIdRaw ? String(piIdRaw).trim().toUpperCase() : null;
        const aidRaw = row['Activity ID'];
        const aid = aidRaw ? String(aidRaw).trim() : null;
        
        const activityName = row['Activity'] || row['Strategic Activity'];
        const indicatorName = row['Performance Indicator'];
        const piTitle = row['PI Title'] || row['Strategic Priority'] || row['Strategic Goal'] || `Performance Indicator ${piId}`;

        if (piId && aid) {
          foundPIs.add(piId);
          if (!piActivitiesMap[piId]) piActivitiesMap[piId] = [];
          if (!piActivitiesMap[piId].includes(aid)) {
             piActivitiesMap[piId].push(aid);
          }

          // Ensure name exact mapping
          if (activityName) {
            localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, activityName);
          }
          if (indicatorName) {
            localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, indicatorName);
          }
          if (piTitle) {
            localStorage.setItem(`${prefix}_pi_title_${year}_${effectiveId}_${piId}`, piTitle);
          }

          // Detect custom PIs
          if (!standardPIIds.includes(piId)) {
            if (!customPIsMap[piId]) {
              customPIsMap[piId] = { id: piId, title: piTitle, activities: [] };
            }
            if (!customPIsMap[piId].activities.find(a => a.id === aid)) {
              customPIsMap[piId].activities.push({ id: aid });
            }
          }

          // Upload month data Jan to Dec
          MONTHS.forEach((m, i) => { 
            const rawVal = row[m];
            const val = (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') 
              ? (parseInt(rawVal, 10) || 0) 
              : 0;
            saveDataWithSync(piId, aid, i, val); 
          });
        }
      });

      // Save list structure for each PI
      Object.entries(piActivitiesMap).forEach(([piId, aids]) => {
        const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
        localStorage.setItem(actIdsKey, JSON.stringify(aids));
      });

      // Update custom definitions key for rendering non-standard PIs
      const customKeyToSave = `${prefix}_custom_definitions_${year}_${effectiveId}`;
      localStorage.setItem(customKeyToSave, JSON.stringify(Object.values(customPIsMap)));

      // Synchronize hidden PIs based on "exact" list from file
      const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
      // In "exact" mode, hide anything NOT in the file from the standard set
      const newHidden = standardPIIds.filter(id => !foundPIs.has(id));
      localStorage.setItem(hiddenPIsKey, JSON.stringify(newHidden));

      refresh();
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    if (!currentPI) return;
    const exportData = currentPI.activities.map(act => {
      const row: any = { 'Activity': act.activity, 'Performance Indicator': act.indicator };
      MONTHS.forEach((m, i) => { row[m] = act.months[i].value; });
      row['Total'] = act.total;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `${subjectUser.name}_${activeTab}_${year}.xlsx`);
  };

  const handleExportMasterTemplate = () => {
    const allData: any[] = [];
    piData.forEach(pi => {
      pi.activities.forEach(act => {
        const row: any = { 'PI ID': pi.id, 'PI Title': pi.title, 'Activity ID': act.id, 'Activity': act.activity, 'Performance Indicator': act.indicator };
        MONTHS.forEach((m, i) => { row[m] = act.months[i].value; });
        allData.push(row);
      });
    });
    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Template");
    
    let filename = `Master_Template_${year}.xlsx`;
    if (year === '2026') {
      const suffix = prefix === 'accomplishment' ? 'ACCOMPLISHMENT_2026' : 'TARGET_OUTLOOK_2026';
      let cleanName = subjectUser.name.toUpperCase().replace(/\s+/g, '_');
      filename = `${cleanName}_${suffix}.xlsx`;
    }
    
    XLSX.writeFile(wb, filename);
  };

  const handleMoveTab = (e: React.MouseEvent, piId: string, direction: 'left' | 'right') => {
    e.stopPropagation();
    const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
    const allPossiblePIs = piData.map(p => p.id);
    const currentIndex = allPossiblePIs.indexOf(piId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= allPossiblePIs.length) return;
    const newOrder = [...allPossiblePIs];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[newIndex];
    newOrder[newIndex] = temp;
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    refresh();
  };

  const handleRestoreAllTabs = () => {
    const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
    localStorage.removeItem(hiddenPIsKey);
    refresh();
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    if (type.includes('pdf')) return <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    return <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  };

  const vaultFolders = useMemo(() => {
    const units = new Set(vaultData.map((f: any) => f.unitName));
    return Array.from(units).sort();
  }, [vaultData]);

  const filteredVaultFiles = useMemo(() => {
    if (!vaultFolder) return [];
    return vaultData.filter((f: any) => f.unitName === vaultFolder).reverse();
  }, [vaultData, vaultFolder]);

  const renderTable = () => {
    const monthlyTotals = Array(12).fill(0);
    let grandTotal = 0;
    currentPI?.activities.forEach(act => {
      act.months.forEach((m, i) => { monthlyTotals[i] += m.value; });
      grandTotal += act.total;
    });

    return (
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                {activeTab} - {currentPI?.title}
              </h2>
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                Unit: {subjectUser.name} • Terminal: {year}
                {isAdmin && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] border border-emerald-500/30 font-black uppercase tracking-widest">Global Drive Oversight</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {canEditStructure && <th className="px-6 py-4 w-12"></th>}
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Activity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[150px]">Performance Indicator</th>
                {MONTHS.map(m => ( <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[70px]">{m}</th> ))}
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest min-w-[80px]">Total</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[80px]">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPI?.activities.map((act, rIdx) => {
                const rowIsPercent = checkIsPercent(act.indicator);
                return (
                  <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                    {canEditStructure && (
                      <td className="px-6 py-4"><button onClick={() => {
                        if(confirm("Permanently remove this entry?")) {
                          const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${activeTab}`;
                          const currentIds = JSON.parse(localStorage.getItem(actIdsKey) || '[]');
                          localStorage.setItem(actIdsKey, JSON.stringify(currentIds.filter((id:any) => id !== act.id)));
                          refresh();
                        }
                      }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-sm font-black uppercase">Remove</button></td>
                    )}
                    <td className="px-6 py-4">
                      {editingActivityField?.aid === act.id && editingActivityField?.field === 'activity' ? (
                        <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => { localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName); setEditingActivityField(null); refresh(); }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-900 outline-none" />
                      ) : ( <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'activity' }), setEditFieldName(act.activity))} className={`text-sm font-bold text-slate-900 leading-snug ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>{act.activity}</div> )}
                    </td>
                    <td className="px-6 py-4">
                      {editingActivityField?.aid === act.id && editingActivityField?.field === 'indicator' ? (
                        <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => { localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName); setEditingActivityField(null); refresh(); }} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-500 outline-none" />
                      ) : ( <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'indicator' }), setEditFieldName(act.indicator))} className={`text-xs font-medium text-slate-500 leading-relaxed ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>{act.indicator}</div> )}
                    </td>
                    {act.months.map((m, mIdx) => (
                      <td key={mIdx} className="px-1 py-4 group/cell">
                        <div className="flex items-center justify-center gap-0.5">
                          {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                            <input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-12 mx-auto px-1 py-1 bg-white border-2 border-slate-900 rounded text-center text-xs font-black outline-none shadow-lg z-20" />
                          ) : ( 
                            <div onClick={() => handleCellClick(rIdx, mIdx, m.value)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                              {m.value}{rowIsPercent ? '%' : ''}
                            </div> 
                          )}
                          <button 
                            onClick={(e) => handleOpenFiles(e, rIdx, mIdx)} 
                            className={`flex items-center justify-center w-6 h-6 rounded-md transition-all ${m.files.length > 0 ? 'bg-emerald-50' : 'opacity-0 group-hover/cell:opacity-100 hover:bg-slate-100'}`}
                          >
                            <PaperclipIcon active={m.files.length > 0} />
                          </button>
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center"><div className="text-sm font-black text-slate-900 bg-slate-100/50 py-2 rounded-xl">{act.total}{rowIsPercent ? '%' : ''}</div></td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { const firstMonthIdx = act.months.findIndex(m => m.files.length > 0); handleOpenFiles(e, rIdx, firstMonthIdx === -1 ? 0 : firstMonthIdx); }} 
                        className={`p-2 rounded-xl transition-all ${act.months.some(m => m.files.length > 0) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 bg-slate-50/50">
              <tr className="font-black text-slate-900">
                {canEditStructure && <td className="px-6 py-6"></td>}
                <td colSpan={2} className="px-6 py-6 text-sm uppercase tracking-widest text-slate-900 font-black">Grand Total</td>
                {monthlyTotals.map((total, idx) => ( <td key={idx} className="px-1 py-6 text-center text-sm">{total}</td> ))}
                <td className="px-6 py-6 text-center"><div className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg">{grandTotal}</div></td>
                <td className="px-6 py-6"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all"><svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>Return to Terminal</button>
          <div className="flex flex-col gap-1"><h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1><p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Operations & Accomplishment Control</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.CHQ || currentUser.role === UserRole.STATION) && (
            <>
              {currentUser.role === UserRole.SUPER_ADMIN && (
                <div className="flex bg-emerald-600 rounded-2xl shadow-lg overflow-hidden transition hover:bg-emerald-700">
                  <button onClick={() => { setVaultOpen(true); refresh(); }} className="text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-r border-white/10">
                    <GoogleDriveIcon /> Unit Drive Vault
                  </button>
                  <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-white px-3 py-3 hover:bg-white/10 transition flex items-center gap-2" title="Launch barvickrunch@gmail.com Storage">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    <span className="text-[10px] font-black">DRIVE</span>
                  </a>
                </div>
              )}
              {currentUser.role === UserRole.SUPER_ADMIN && <button onClick={handleRestoreAllTabs} className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm flex items-center gap-2 border border-slate-200"><RestoreHiddenIcon /> Restore Tabs</button>}
              <button onClick={handleExportMasterTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export Master</button>
              <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"><UploadIcon /> Import Master</button>
              <input type="file" min-width="150px" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
            </>
          )}
          <button onClick={handleExportExcel} className="bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-700 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm flex items-center gap-2 text-xs">Export Current PI</button>
        </div>
      </div>
      
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {piData.map(pi => (
          <div key={pi.id} className="relative group flex-shrink-0">
            <button onClick={() => setActiveTab(pi.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{getSharedTabLabel(prefix, year, effectiveId, pi.id, pi.id)}</button>
            {canEditStructure && (
              <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75">
                <button onClick={(e) => handleMoveTab(e, pi.id, 'left')} className="p-1.5 bg-white shadow-lg rounded-full text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={(e) => handleMoveTab(e, pi.id, 'right')} className="p-1.5 bg-white shadow-lg rounded-full text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-100"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {renderTable()}

      {/* Super Admin Vault Modal */}
      {vaultOpen && currentUser.role === UserRole.SUPER_ADMIN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-emerald-900 p-10 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
                       <GoogleDriveIcon /> Super Admin Cloud Vault
                    </h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2">
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">DRIVE STORAGE: </p>
                        <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-white text-xs font-black uppercase tracking-widest hover:text-emerald-300 transition underline underline-offset-4 decoration-emerald-500/50">barvickrunch@gmail.com</a>
                      </div>
                    </div>
                 </div>
                 <button onClick={() => setVaultOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors border border-white/10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
                 {!vaultFolder ? (
                   <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {vaultFolders.length > 0 ? vaultFolders.map(folder => (
                         <div key={folder} onClick={() => setVaultFolder(folder)} className="group cursor-pointer p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 text-blue-300 group-hover:text-blue-500 transition-colors">
                               <FolderIcon />
                            </div>
                            <div className="text-center">
                               <p className="font-black text-slate-900 text-sm truncate max-w-[150px]">{folder}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unit Folder</p>
                            </div>
                         </div>
                      )) : (
                        <div className="col-span-full py-20 text-center">
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No unit folders created yet</p>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVaultFiles.map((file: any) => (
                        <div key={file.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:border-emerald-500 transition-all flex flex-col justify-between">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 border">
                                 {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="font-black text-slate-900 truncate text-sm">{file.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.unitName}</p>
                              </div>
                           </div>
                           <button onClick={() => {
                              const vaultKey = `superadmin_drive_vault_${year}`;
                              const filtered = vaultData.filter((f: any) => f.id !== file.id);
                              localStorage.setItem(vaultKey, JSON.stringify(filtered));
                              setVaultData(filtered); 
                           }} className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Delete</button>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {isFilesModalOpen && activeFileCell && currentPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-8 border-b border-slate-100 relative">
               <div className="absolute top-8 right-8 flex items-center gap-4">
                  {isAdmin && <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"><GoogleDriveIcon /><span className="text-[10px] font-black text-slate-900 uppercase">Dual Mirror System</span></div>}
                  <button onClick={() => setIsFilesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-black">CLOSE</button>
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">MOVs & Documents</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Unit: {subjectUser.name} • {MONTHS[activeFileCell.monthIdx]} {year}
               </p>
               <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${syncStatus === 'idle' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {syncStatus === 'idle' && 'All files synced to personal Gmail & Shared to Super Admin'}
                      {syncStatus === 'local' && 'Saving to Unit Storage...'}
                      {syncStatus === 'mirroring' && 'Mirroring to Super Admin Drive (barvickrunch@gmail.com)...'}
                      {syncStatus === 'complete' && 'Dual Sync Complete!'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Global Vault: barvickrunch@gmail.com / Monitoring Storage</span>
                  </div>
               </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(file => (
                    <div key={file.id} className="group p-5 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-between hover:border-indigo-500 hover:bg-slate-50/50 transition-all shadow-sm">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-black text-slate-900 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID: {file.id.toUpperCase()}</span>
                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                              Mirror Secure
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={file.url} download={file.name} className="p-2.5 text-slate-400 hover:text-indigo-600 transition bg-white rounded-xl border border-transparent hover:border-slate-100 text-xs font-black uppercase">LINK</a>
                        {canModifyData && (
                          <button onClick={() => removeFile(file.id)} className="p-2.5 text-slate-400 hover:text-rose-600 transition bg-white rounded-xl border border-transparent hover:border-slate-100 text-xs font-black uppercase">DELETE</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No MOVs Found for this month</p>
                </div>
              )}

              {canModifyData && (
                <div className="pt-6 border-t border-slate-100">
                  <button onClick={() => fileInputRef.current?.click()} className="group w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3">
                    <UploadIcon /> {syncStatus === 'idle' ? 'Upload to Gmail Storage & Sync to Super Admin' : 'Synchronizing Dual Storage...'}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                  <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 opacity-50">
                    Files are stored in respective Unit Drives and mirrored to barvickrunch@gmail.com
                  </p>
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
