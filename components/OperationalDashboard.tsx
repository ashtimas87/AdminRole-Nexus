
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to get shared definitions
const getSharedActivityName = (piId: string, activityId: string, defaultName: string): string => {
  const stored = localStorage.getItem(`pi_activity_name_${piId}_${activityId}`);
  return stored || defaultName;
};

const getSharedIndicatorName = (piId: string, activityId: string, defaultIndicator: string): string => {
  const stored = localStorage.getItem(`pi_indicator_name_${piId}_${activityId}`);
  return stored || defaultIndicator;
};

const getSharedPITitle = (piId: string, defaultTitle: string): string => {
  const stored = localStorage.getItem(`pi_title_${piId}`);
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
        { id: "pi1_a1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snapshot formulated", defaults: Array(12).fill(1) },
        { id: "pi1_a2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: [13, 13, 13, 12, 9, 13, 13, 13, 13, 13, 13, 13] },
        { id: "pi1_a3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: [10, 9, 9, 9, 9, 9, 9, 10, 9, 9, 10, 11] }
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
        { id: "pi3_a2", name: "Convening of IO Working Group", indicator: "No. of activities conducted", defaults: [5, 6, 6, 6, 6, 6, 5, 6, 6, 6, 6, 6] }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of Personnel Attendance in Training",
      activities: [
        { id: "pi4_a1", name: "Basic Skills Training", indicator: "% of personnel trained", defaults: [85, 88, 90, 92, 95, 94, 91, 89, 92, 93, 95, 96] }
      ]
    },
    {
      id: "PI5",
      title: "Number of Logistical Reports Submitted",
      activities: [
        { id: "pi5_a1", name: "Inventory Audit Reports", indicator: "No. of reports submitted", defaults: Array(12).fill(2) }
      ]
    },
    {
      id: "PI6",
      title: "Number of Intelligence Briefings Conducted",
      activities: [
        { id: "pi6_a1", name: "Weekly Intelligence Review", indicator: "No. of briefings", defaults: [4, 4, 4, 5, 4, 4, 4, 4, 4, 5, 4, 4] }
      ]
    },
    {
      id: "PI7",
      title: "Public Information Dissemination Efficiency",
      activities: [
        { id: "pi7_a1", name: "Press Release Distribution", indicator: "No. of releases dispatched", defaults: [12, 10, 15, 14, 11, 13, 12, 15, 14, 13, 12, 16] }
      ]
    },
    {
      id: "PI8",
      title: "Unit Operational Readiness Inspection",
      activities: [
        { id: "pi8_a1", name: "Facility Readiness Audit", indicator: "No. of audits performed", defaults: Array(12).fill(1) }
      ]
    },
    {
      id: "PI9",
      title: "Community Outreach Program Reach",
      activities: [
        { id: "pi9_a1", name: "Barangay Consultation Meetings", indicator: "No. of participants (thousands)", defaults: [2, 3, 2, 4, 3, 2, 3, 3, 4, 2, 3, 5] }
      ]
    },
    {
      id: "PI10",
      title: "Case Resolution and Documentation",
      activities: [
        { id: "pi10_a1", name: "Final Investigation Reports", indicator: "No. of cases resolved", defaults: [22, 19, 25, 30, 24, 21, 23, 26, 28, 25, 22, 31] }
      ]
    },
    {
      id: "PI11",
      title: "Conduct of Police-Community Relations Activities",
      activities: [
        { id: "pi11_a1", name: "PCR Seminars and Workshops", indicator: "No. of activities conducted", defaults: Array(12).fill(3) }
      ]
    },
    {
      id: "PI12",
      title: "Implementation of Anti-Criminality Operations",
      activities: [
        { id: "pi12_a1", name: "Target Hardening Operations", indicator: "No. of operations conducted", defaults: [5, 5, 6, 4, 7, 5, 6, 5, 6, 8, 5, 7] }
      ]
    },
    {
      id: "PI13",
      title: "Success Rate of Operational Missions",
      activities: [
        { id: "pi13_a1", name: "Mission Objective Completion", indicator: "% success rate", defaults: Array(12).fill(95) }
      ]
    },
    {
      id: "PI14",
      title: "Number of Suspects Apprehended",
      activities: [
        { id: "pi14_a1", name: "Arrest Warrant Execution", indicator: "No. of individuals apprehended", defaults: [12, 15, 10, 18, 14, 11, 13, 16, 12, 14, 15, 19] }
      ]
    },
    {
      id: "PI15",
      title: "Completion rate of specialized training",
      activities: [
        { id: "pi15_a1", name: "Advanced Tactical Training", indicator: "% completion rate", defaults: [80, 82, 85, 88, 90, 92, 95, 93, 91, 89, 92, 94] }
      ]
    },
    {
      id: "PI16",
      title: "Customer Satisfaction Index",
      activities: [
        { id: "pi16_a1", name: "Public Trust Survey", indicator: "% satisfaction score", defaults: [88, 89, 90, 91, 92, 91, 90, 89, 90, 91, 92, 93] }
      ]
    },
    {
      id: "PI17",
      title: "Number of Press Conferences Held",
      activities: [
        { id: "pi17_a1", name: "Strategic Media Briefings", indicator: "No. of media events", defaults: Array(12).fill(2) }
      ]
    },
    {
      id: "PI18",
      title: "Efficiency of Resource Allocation",
      activities: [
        { id: "pi18_a1", name: "Budget Utilization Monitoring", indicator: "% of budget utilized", defaults: [75, 78, 80, 82, 85, 88, 90, 92, 94, 96, 98, 100] }
      ]
    },
    {
      id: "PI19",
      title: "Number of Security Surveys and Inspections",
      activities: [
        { id: "pi19_a1", name: "Facility Vulnerability Assessment", indicator: "No. of inspections", defaults: Array(12).fill(4) }
      ]
    },
    {
      id: "PI20",
      title: "Adherence to Standard Operating Procedures",
      activities: [
        { id: "pi20_a1", name: "Internal Compliance Audit", indicator: "% adherence rate", defaults: [98, 99, 98, 97, 99, 99, 98, 98, 99, 99, 100, 100] }
      ]
    },
    {
      id: "PI21",
      title: "Data Privacy Compliance Rate",
      activities: [
        { id: "pi21_a1", name: "Data Security Review", indicator: "% compliance rate", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI22",
      title: "Number of Technical Support Requests Resolved",
      activities: [
        { id: "pi22_a1", name: "IT Helpdesk Resolution", indicator: "No. of requests resolved", defaults: [45, 42, 50, 48, 55, 60, 52, 50, 48, 53, 58, 62] }
      ]
    },
    {
      id: "PI23",
      title: "Intelligence Networking Activities",
      activities: [
        { id: "pi23_a1", name: "Liaison with External Agencies", indicator: "No. of networking sessions", defaults: Array(12).fill(3) }
      ]
    },
    {
      id: "PI24",
      title: "Strategic Communications Impact",
      activities: [
        { id: "pi24_a1", name: "Message Resonance Analysis", indicator: "% positive sentiment", defaults: [70, 72, 75, 74, 76, 78, 80, 79, 77, 75, 78, 82] }
      ]
    },
    {
      id: "PI25",
      title: "Infrastructure Availability",
      activities: [
        { id: "pi25_a1", name: "System Uptime Tracking", indicator: "% availability", defaults: Array(12).fill(99) }
      ]
    },
    {
      id: "PI26",
      title: "Crisis Management Exercises Conducted",
      activities: [
        { id: "pi26_a1", name: "Simulated Disaster Response", indicator: "No. of drills", defaults: [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 2] }
      ]
    },
    {
      id: "PI27",
      title: "Legal Assistance Documentation",
      activities: [
        { id: "pi27_a1", name: "Personnel Legal Support", indicator: "No. of cases documented", defaults: Array(12).fill(2) }
      ]
    },
    {
      id: "PI28",
      title: "Number of Community Service Projects",
      activities: [
        { id: "pi28_a1", name: "Local Development Initiatives", indicator: "No. of projects completed", defaults: [2, 1, 2, 2, 3, 2, 2, 3, 2, 2, 1, 4] }
      ]
    },
    {
      id: "PI29",
      title: "Administrative Oversight Inspections",
      activities: [
        { id: "pi29_a1", name: "Unit Management Audit", indicator: "No. of inspections conducted", defaults: Array(12).fill(1) }
      ]
    }
  ];

  return baseDefinitions.map(pi => {
    const storedIds = localStorage.getItem(`pi_activity_ids_${pi.id}`);
    let activityIds = storedIds ? JSON.parse(storedIds) : pi.activities.map(a => a.id);

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return {
      id: pi.id,
      title: getSharedPITitle(pi.id, pi.title),
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
            // Operational consolidates ALL. Tactical consolidates ONLY STATIONS. CHQ consolidates ONLY CHQS.
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
  const [fileViewerCell, setFileViewerCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);

  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const dashboardType = useMemo(() => {
    if (title.toUpperCase().includes("CHQ")) return 'CHQ';
    if (title.toUpperCase().includes("TACTICAL")) return 'TACTICAL';
    return 'OPERATIONAL';
  }, [title]);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;
  const is2026 = dashboardYear === '2026';
  const isOperational2026 = is2026 && dashboardType === 'OPERATIONAL';

  const refreshData = () => {
    // If an Admin is viewing their OWN view (via the Quick Actions), it should be consolidated
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
    const storedIds = localStorage.getItem(`pi_activity_ids_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    activityIds.push(newId);
    localStorage.setItem(`pi_activity_ids_${activeTab}`, JSON.stringify(activityIds));
    localStorage.setItem(`pi_activity_name_${activeTab}_${newId}`, "New Activity");
    localStorage.setItem(`pi_indicator_name_${activeTab}_${newId}`, "New Indicator");
    
    refreshData();
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!isSuperAdmin || !window.confirm("Are you sure you want to delete this activity? This will remove it for ALL accounts.")) return;
    const storedIds = localStorage.getItem(`pi_activity_ids_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const newIds = activityIds.filter((id: string) => id !== activityId);
    localStorage.setItem(`pi_activity_ids_${activeTab}`, JSON.stringify(newIds));
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
    localStorage.setItem(`pi_${editingLabel.field}_name_${activeTab}_${activityId}`, textEditValue);
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
    localStorage.setItem(`pi_title_${activeTab}`, textEditValue);
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
                {dataMode === 'consolidated' && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-200">
                    Live Data Aggregation
                  </span>
                )}
             </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && isOperational2026 && (
            <button onClick={handleAddActivity} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">+ Add Activity</button>
          )}
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
                {isSuperAdmin && isOperational2026 && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-12 font-bold uppercase">Action</th>}
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} Accomplishment</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase text-slate-900">Total</th>
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
                    {isSuperAdmin && isOperational2026 && (
                      <td className="border border-slate-300 p-2 text-center">
                        <button onClick={() => handleDeleteActivity(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Row">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    )}
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
                          <input autoFocus className="w-center bg-white border border-blue-500 rounded px-0.5 outline-none font-black" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <div className="flex flex-col items-center">
                            <span>{m.value}{isPercent ? '%' : ''}</span>
                            {dataMode !== 'consolidated' && (currentUser.role === UserRole.STATION || isSuperAdmin) && (
                              <button onClick={(e) => { e.stopPropagation(); setFileViewerCell({ rowIdx: rIdx, monthIdx: mIdx }); }} className="mt-1 text-[8px] opacity-0 group-hover:opacity-100 text-blue-500 font-black">{m.files.length > 0 ? `(${m.files.length} 📄)` : '+'}</button>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900 bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationalDashboard;
