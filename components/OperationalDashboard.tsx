
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to get shared definitions with year scoping
const getSharedActivityName = (year: string, piId: string, activityId: string, defaultName: string): string => {
  const stored = localStorage.getItem(`pi_activity_name_${year}_${piId}_${activityId}`);
  return stored || defaultName;
};

const getSharedIndicatorName = (year: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const stored = localStorage.getItem(`pi_indicator_name_${year}_${piId}_${activityId}`);
  return stored || defaultIndicator;
};

const getSharedPITitle = (year: string, piId: string, defaultTitle: string): string => {
  const stored = localStorage.getItem(`pi_title_${year}_${piId}`);
  return stored || defaultTitle;
};

// Helper to get individual accomplishment data with year separation
const getSharedAccomplishment = (year: string, userId: string, piId: string, activityId: string, monthIdx: number, defaultValue: number): number => {
  const key = `accomplishment_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

// Helper to get file metadata with year separation
const getSharedFiles = (year: string, userId: string, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const key = `files_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (year: string, userId: string, role: UserRole, piId: string, activityId: string, defaultValues: number[]): MonthData[] => {
  const isStation = role === UserRole.STATION;
  return Array.from({ length: 12 }).map((_, mIdx) => ({
    value: getSharedAccomplishment(year, userId, piId, activityId, mIdx, isStation ? 0 : (defaultValues[mIdx] || 0)),
    files: getSharedFiles(year, userId, piId, activityId, mIdx)
  }));
};

const getPIDefinitions = (year: string, userId: string, role: UserRole) => {
  const baseDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: [
        { id: "pi1_a1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snaphot formulated", defaults: Array(12).fill(1) },
        { id: "pi1_a2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: Array(12).fill(13) },
        { id: "pi1_a3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: Array(12).fill(10) },
        { id: "pi1_a4", name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", defaults: Array(12).fill(55) },
        { id: "pi1_a5", name: "Production of Leaflets as IEC Materials", indicator: "No. of Printed copies", defaults: Array(12).fill(700) },
        { id: "pi1_a6", name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers/Tarpaulins Displayed", defaults: Array(12).fill(25) },
        { id: "pi1_a7", name: "Face-to-face Awareness Activities", indicator: "No. of activities conducted", defaults: Array(12).fill(50) }
      ]
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { id: "pi2_a1", name: "Collaborative efforts with stakeholders", indicator: "No. of collaborative efforts activities conducted", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }
      ]
    },
    {
      id: "PI3",
      title: "Number of participating respondents",
      activities: [
        { id: "pi3_a1", name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", defaults: Array(12).fill(5) },
        { id: "pi3_a2", name: "Convening of IO Working Group", indicator: "No. of activities conducted", defaults: Array(12).fill(6) },
        { id: "pi3_a3", name: "Activation of SyncCom", indicator: "No. of activities conducted", defaults: Array(12).fill(8) },
        { id: "pi3_a4", name: "PNP Good Deeds", indicator: "No. of PNP Good Deeds", defaults: Array(12).fill(15) }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: [
        { id: "pi4_a1", name: "JAPIC", indicator: "JAPIC conducted", defaults: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
        { id: "pi4_a2", name: "Operations on loose firearms", indicator: "Operations conducted", defaults: [3, 4, 5, 3, 2, 2, 4, 0, 8, 3, 7, 3] },
        { id: "pi4_a3", name: "Bakal/Sita", indicator: "Bakal/Sita conducted", defaults: Array(12).fill(750) }
      ]
    },
    {
      id: "PI5",
      title: "Number of functional LACAP",
      activities: [
        { id: "pi5_a1", name: "P/CPOC meetings", indicator: "# P/CPOC meetings participated", defaults: Array(12).fill(10) },
        { id: "pi5_a2", name: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted", defaults: Array(12).fill(45) },
        { id: "pi5_a3", name: "Operations against highway robbery", indicator: "# of opns against highway robbery conducted", defaults: Array(12).fill(1) },
        { id: "pi5_a4", name: "Operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted", defaults: Array(12).fill(55) }
      ]
    },
    {
      id: "PI6",
      title: "Number of police stations utilizing PIPS",
      activities: [
        { id: "pi6_a1", name: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted", defaults: Array(12).fill(53) },
        { id: "pi6_a2", name: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted", defaults: Array(12).fill(138) }
      ]
    },
    {
      id: "PI7",
      title: "Number of Internal Security Operations conducted",
      activities: [
        { id: "pi7_a1", name: "JPSCC meetings", indicator: "JPSCC meetings conducted", defaults: Array(12).fill(4) },
        { id: "pi7_a2", name: "PPSP", indicator: "PPSP conducted", defaults: Array(12).fill(30) }
      ]
    },
    {
      id: "PI8",
      title: "Number of target hardening measures conducted",
      activities: [
        { id: "pi8_a1", name: "Security Survey/Inspection", indicator: "# of Security Survey conducted", defaults: Array(12).fill(2) },
        { id: "pi8_a2", name: "CI check/validation", indicator: "# of CI check conducted", defaults: Array(12).fill(20) },
        { id: "pi8_a3", name: "Clearances issued to civilians", indicator: "# of Clearances issued", defaults: Array(12).fill(3500) }
      ]
    },
    {
      id: "PI9",
      title: "Percentage reduction of crimes involving foreign and domestic tourists",
      activities: [
        { id: "pi9_a1", name: "Maintenance of TPU", indicator: "# of TPU maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a2", name: "Maintenance of TAC", indicator: "# of TAC maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a3", name: "Maintenance of TAD", indicator: "# of TAD maintained", defaults: Array(12).fill(3) }
      ]
    },
    {
      id: "PI10",
      title: "Number of Police stations using COMPSTAT for crime prevention",
      activities: [
        { id: "pi10_a1", name: "Crime Information Reporting and Analysis", indicator: "No. of data recorded", defaults: Array(12).fill(300) },
        { id: "pi10_a2", name: "e-Wanted Persons Info System", indicator: "No. of Wanted Persons recorded", defaults: Array(12).fill(100) },
        { id: "pi10_a3", name: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded", defaults: Array(12).fill(180) }
      ]
    },
    {
      id: "PI11",
      title: "Number of threat group neutralized",
      activities: [
        { id: "pi11_a1", name: "COPLANs formulated", indicator: "No. formulated", defaults: [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0] },
        { id: "pi11_a2", name: "HVTs neutralized", indicator: "No. neutralized", defaults: Array(12).fill(4) }
      ]
    },
    {
      id: "PI12",
      title: "Number of utilized BINs",
      activities: [
        { id: "pi12_a1", name: "Inventory made", indicator: "# of inventory made", defaults: Array(12).fill(40) },
        { id: "pi12_a2", name: "BINs documented/registered", indicator: "# documented", defaults: Array(12).fill(40) }
      ]
    },
    {
      id: "PI13",
      title: "Number of criminal cases filed",
      activities: [
        { id: "pi13_a1", name: "Coordination with counterparts", indicator: "# of coordination conducted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI14",
      title: "Number of cases resulting to conviction/dismissal",
      activities: [
        { id: "pi14_a1", name: "Monitoring Cases Against Threat Group", indicator: "# monitored", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI15",
      title: "Percentage of Trained investigative personnel",
      activities: [
        { id: "pi15_a1", name: "CIC Inventory", indicator: "# in inventory", defaults: Array(12).fill(90) },
        { id: "pi15_a2", name: "IOBC Inventory", indicator: "# in inventory", defaults: Array(12).fill(13) }
      ]
    },
    {
      id: "PI16",
      title: "Percentage of investigative positions filled up with trained investigators",
      activities: [
        { id: "pi16_a1", name: "Screening and evaluation", indicator: "# of screenings conducted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI17",
      title: "Improvement in response time",
      activities: [
        { id: "pi17_a1", name: "Sports supervision", indicator: "No. of sessions", defaults: Array(12).fill(0) },
        { id: "pi17_a2", name: "Repair of patrol vehicles", indicator: "# repaired", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI18",
      title: "Percentage of dedicated investigators assigned to handle specific cases",
      activities: [
        { id: "pi18_a1", name: "Case build up and investigation", indicator: "% of cases handled", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI19",
      title: "Number of recipients of a. awards b. punished",
      activities: [
        { id: "pi19_a1", name: "Monday Flag Raising/Awarding", indicator: "# of ceremonies", defaults: Array(12).fill(4) },
        { id: "pi19_a2", name: "Issuing commendations", indicator: "# issued", defaults: Array(12).fill(150) }
      ]
    },
    {
      id: "PI20",
      title: "Percentage of investigative personnel equipped with standard systems",
      activities: [
        { id: "pi20_a1", name: "Attendance in specialized training", indicator: "% attended", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI21",
      title: "Percentage of Police Stations using e-based system",
      activities: [
        { id: "pi21_a1", name: "Crime Information Reporting and Analysis", indicator: "No. recorded", defaults: Array(12).fill(300) }
      ]
    },
    {
      id: "PI22",
      title: "Number of cases filed in court/total # of cases investigated",
      activities: [
        { id: "pi22_a1", name: "Index Crime Investigated", indicator: "No. investigated", defaults: Array(12).fill(30) },
        { id: "pi22_a2", name: "Non-Index crime investigated", indicator: "No. investigated", defaults: Array(12).fill(25) }
      ]
    },
    {
      id: "PI23",
      title: "Number of investigative infrastructure/equipment identified/accounted",
      activities: [
        { id: "pi23_a1", name: "Inventory, inspection & Accounting", indicator: "# conducted", defaults: Array(12).fill(1) }
      ]
    },
    {
      id: "PI24",
      title: "Percentage of fill-up of investigative equipment and infrastructure",
      activities: [
        { id: "pi24_a1", name: "Field investigative crime scene kit", indicator: "# accounted", defaults: Array(12).fill(21) },
        { id: "pi24_a2", name: "Police line", indicator: "# accounted", defaults: Array(12).fill(45) }
      ]
    },
    {
      id: "PI25",
      title: "Percentage of IT-compliant stations",
      activities: [
        { id: "pi25_a1", name: "Computer preventive maintenance", indicator: "# conducted", defaults: Array(12).fill(210) },
        { id: "pi25_a2", name: "Maintenance of printers", indicator: "# maintained", defaults: Array(12).fill(95) }
      ]
    },
    {
      id: "PI26",
      title: "Number of linkages established",
      activities: [
        { id: "pi26_a1", name: "JSCC meetings", indicator: "# conducted", defaults: Array(12).fill(1) },
        { id: "pi26_a2", name: "Liaising", indicator: "# conducted", defaults: Array(12).fill(15) }
      ]
    },
    {
      id: "PI27",
      title: "Number of community/stakeholders support generated",
      activities: [
        { id: "pi27_a1", name: "MOA/MOU signing", indicator: "# signing initiated", defaults: Array(12).fill(9) },
        { id: "pi27_a2", name: "Support to Makakalikasan", indicator: "# activities conducted", defaults: Array(12).fill(7) }
      ]
    },
    {
      id: "PI28",
      title: "Number of investigative activities funded",
      activities: [
        { id: "pi28_a1", name: "Monitoring of Sensational Crimes", indicator: "# monitored", defaults: Array(12).fill(3) },
        { id: "pi28_a2", name: "Filing of Specials laws", indicator: "# cases filed", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI29",
      title: "Number of special investigation cases requested for fund support",
      activities: [
        { id: "pi29_a1", name: "Creation and activation of SITG Cases", indicator: "# created", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0] }
      ]
    }
  ];

  return baseDefinitions.map(pi => {
    const storedIds = localStorage.getItem(`pi_activity_ids_${year}_${pi.id}`);
    let activityIds = storedIds ? JSON.parse(storedIds) : pi.activities.map(a => a.id);

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(year, pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(year, pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return {
      id: pi.id,
      title: getSharedPITitle(year, pi.id, pi.title),
      activities: fullActivities
    };
  });
};

const generateStructuredPIs = (
  year: string,
  subjectUser: User, 
  mode: 'normal' | 'zero' | 'consolidated' = 'normal',
  dashboardType: 'OPERATIONAL' | 'CHQ' | 'TACTICAL' = 'OPERATIONAL'
): PIData[] => {
  const allStationIds = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8', 'st-9', 'st-10', 'st-11'];
  const allChqIds = ['chq-1', 'chq-2', 'chq-3', 'chq-4', 'chq-5', 'chq-6', 'chq-7', 'chq-8', 'chq-9'];

  const definitions = getPIDefinitions(year, subjectUser.id, subjectUser.role);

  return definitions.map((def) => {
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

            targetIds.forEach(unitId => {
              totalValue += getSharedAccomplishment(year, unitId, def.id, act.id, mIdx, 0);
            });
            
            return {
              value: isPercentagePI ? Math.round(totalValue / targetIds.length) : totalValue,
              files: []
            };
          });
        } else if (mode === 'zero') {
          monthsData = MONTHS.map(() => ({ value: 0, files: [] }));
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
  title?: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User; 
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title = "OPERATIONAL DASHBOARD 2026", onBack, currentUser, subjectUser }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [exporting, setExporting] = useState(false);
  const [piData, setPiData] = useState<PIData[]>([]);
  const [dataMode, setDataMode] = useState<'normal' | 'zero' | 'consolidated'>('normal');
  
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingHeader, setEditingHeader] = useState<boolean>(false);
  const [editingLabel, setEditingLabel] = useState<{ rowIdx: number; field: 'activity' | 'indicator' } | null>(null);
  const [textEditValue, setTextEditValue] = useState<string>('');
  
  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
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

    if (isMainView && isAdmin) {
      mode = 'consolidated';
    }
    
    setDataMode(mode);
    setPiData(generateStructuredPIs(dashboardYear, subjectUser, mode, dashboardType));
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear, dashboardType]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const canEdit = (isSuperAdmin && dataMode !== 'consolidated') || (currentUser.role === UserRole.STATION && currentUser.id === subjectUser.id);
    if (canEdit) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEditValue = () => {
    if (!editingCell || !currentPI) return;
    const newValue = parseInt(editValue, 10) || 0;
    const activityId = currentPI.activities[editingCell.rowIdx].id;
    localStorage.setItem(`accomplishment_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}_${editingCell.monthIdx}`, String(newValue));
    refreshData();
    setEditingCell(null);
  };

  const handleAddActivity = () => {
    if (!isSuperAdmin || !currentPI) return;
    const newId = `custom_${Date.now()}`;
    const storedIds = localStorage.getItem(`pi_activity_ids_${dashboardYear}_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const updatedIds = [...activityIds, newId];
    localStorage.setItem(`pi_activity_ids_${dashboardYear}_${activeTab}`, JSON.stringify(updatedIds));
    localStorage.setItem(`pi_activity_name_${dashboardYear}_${activeTab}_${newId}`, "New Activity");
    localStorage.setItem(`pi_indicator_name_${dashboardYear}_${activeTab}_${newId}`, "New Indicator");
    
    refreshData();
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!isSuperAdmin || !window.confirm("Are you sure you want to delete this activity? This will remove it for ALL accounts.")) return;
    const storedIds = localStorage.getItem(`pi_activity_ids_${dashboardYear}_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const newIds = activityIds.filter((id: string) => id !== activityId);
    localStorage.setItem(`pi_activity_ids_${dashboardYear}_${activeTab}`, JSON.stringify(newIds));
    localStorage.removeItem(`pi_activity_name_${dashboardYear}_${activeTab}_${activityId}`);
    localStorage.removeItem(`pi_indicator_name_${dashboardYear}_${activeTab}_${activityId}`);
    
    refreshData();
  };

  const handleLabelEdit = (rowIdx: number, field: 'activity' | 'indicator', currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingLabel({ rowIdx, field });
    setTextEditValue(currentVal);
  };

  const saveLabel = () => {
    if (!editingLabel || !currentPI) return;
    const activityId = currentPI.activities[editingLabel.rowIdx].id;
    localStorage.setItem(`pi_${editingLabel.field}_name_${dashboardYear}_${activeTab}_${activityId}`, textEditValue);
    refreshData();
    setEditingLabel(null);
  };

  const handleHeaderEdit = () => {
    if (!isSuperAdmin) return;
    setEditingHeader(true);
    setTextEditValue(currentPI?.title || "");
  };

  const saveHeader = () => {
    if (!editingHeader) return;
    localStorage.setItem(`pi_title_${dashboardYear}_${activeTab}`, textEditValue);
    refreshData();
    setEditingHeader(false);
  };

  const handleExportPPT = async () => {
    if (!currentPI) return;
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.defineSlideMaster({
        title: "MASTER",
        background: { color: "FFFFFF" },
        objects: [
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 24, bold: true, align: "center" } } }
        ],
      });
      piData.forEach(pi => {
        const slide = pptx.addSlide({ masterName: "MASTER" });
        slide.addText(`PI #${pi.id.replace('PI', '')}: ${pi.title}`, { x: 0.5, y: 0.8, w: 12.3, fontSize: 14, bold: true, align: "center" });
        
        const tableData: any[][] = [[
          { text: "Activity", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
          { text: "Indicator", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
          ...MONTHS.map(m => ({ text: m, options: { fill: "00B0F0", color: "FFFFFF", bold: true, border: { pt: 1 } } })),
          { text: "Total", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } }
        ]];
        
        pi.activities.forEach(act => tableData.push([
          act.activity, act.indicator, ...act.months.map(m => String(m.value)), String(act.total)
        ]));
        
        slide.addTable(tableData, { x: 0.3, y: 1.2, w: 12.7, fontSize: 8 });
      });
      await pptx.writeFile({ fileName: `${title}.pptx` });
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  if (!currentPI) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-slate-200 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></div>
            Back to Overview
          </button>
          <div className="flex flex-wrap items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-widest">
                  {dataMode === 'consolidated' ? 'CONSOLIDATED VIEW' : `UNIT: ${subjectUser.name}`}
                </span>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition">PPT Export</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 whitespace-nowrap">
          {piData.map((pi) => (
            <button key={pi.id} onClick={() => setActiveTab(pi.id)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all border ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>PI {pi.id.replace('PI', '')}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-4 px-6 border-b border-slate-300 flex justify-center items-center text-center">
             {editingHeader ? (
               <input autoFocus className="max-w-xl flex-1 font-black text-slate-800 text-center uppercase border-b-2 border-blue-500 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveHeader} onKeyDown={(e) => e.key === 'Enter' && saveHeader()} />
             ) : (
               <h3 onClick={handleHeaderEdit} className={`inline-block font-black text-slate-800 text-base uppercase ${isSuperAdmin ? 'cursor-pointer hover:bg-blue-50 px-2 rounded transition' : ''}`}>
                 PI # {activeTab.replace('PI', '')} – {currentPI.title}
               </h3>
             )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} Accomplishment</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase text-slate-900">Total</th>
                {isSuperAdmin && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-24 font-bold uppercase">Action</th>}
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-bold text-[10px] w-11 uppercase text-slate-900">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => {
                const isPercent = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);
                return (
                  <tr key={row.id} className="hover:bg-blue-50/30 group">
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'activity', row.activity)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'activity' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.activity}
                    </td>
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'indicator', row.indicator)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'indicator' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.indicator}
                    </td>
                    {row.months.map((m, mIdx) => (
                      <td key={mIdx} className="border border-slate-300 p-1.5 text-center text-blue-700 font-bold group relative cursor-pointer hover:bg-blue-100" onClick={() => handleCellClick(rIdx, mIdx, m.value)}>
                        {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                          <input autoFocus className="w-center bg-white border border-blue-500 rounded px-0.5 outline-none font-black text-center" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <div className="flex flex-col items-center">
                            <span>{m.value}{isPercent ? '%' : ''}</span>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900 bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                    {isSuperAdmin && (
                      <td className="border border-slate-300 p-2 text-center bg-slate-50">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleLabelEdit(rIdx, 'activity', row.activity)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit Activity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteActivity(row.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition" title="Delete Activity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {isSuperAdmin && (
                <tr className="bg-slate-50/50">
                  <td colSpan={isSuperAdmin ? 16 : 15} className="border border-slate-300 p-4 text-center">
                    <button onClick={handleAddActivity} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition text-xs uppercase tracking-wider group">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </div>
                      Add New Activity Row
                    </button>
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
