
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData } from '../types';
import pptxgen from "pptxgenjs";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Shared persistence helpers for Activities
const getSharedActivityName = (piId: string, activityIdx: number, defaultName: string): string => {
  const stored = localStorage.getItem(`shared_activity_${piId}_${activityIdx}`);
  return stored || defaultName;
};

const setSharedActivityName = (piId: string, activityIdx: number, newName: string) => {
  localStorage.setItem(`shared_activity_${piId}_${activityIdx}`, newName);
};

// Shared persistence helpers for Indicators
const getSharedIndicatorName = (piId: string, activityIdx: number, defaultIndicator: string): string => {
  const stored = localStorage.getItem(`shared_indicator_${piId}_${activityIdx}`);
  return stored || defaultIndicator;
};

const setSharedIndicatorName = (piId: string, activityIdx: number, newIndicator: string) => {
  localStorage.setItem(`shared_indicator_${piId}_${activityIdx}`, newIndicator);
};

/**
 * Enhanced mock data generator. 
 * Reads both activity and indicator names from shared storage to ensure Super Admin edits propagate.
 */
const generateStructuredPIs = (baseValue: number = 0): PIData[] => {
  const titles = [
    "Number of Community Awareness/Information Activities Initiated",
    "Number of sectoral groups/BPATs mobilized/organized",
    "Number of participating respondents",
    "Percentage of accounted loose firearms against the estimated baseline data",
    "Number of functional LACAP",
    "Number of police stations utilizing PIPS",
    "Number of Internal Security Operations conducted",
    "Number of target hardening measures conducted",
    "Percentage reduction of crimes involving foreign and domestic tourists",
    "Number of Police stations using COMPSTAT for crime prevention",
    "Number of threat group neutralized",
    "Number of utilized BINs",
    "Number of criminal cases filed",
    "Number of cases resulting to conviction/dismissal",
    "Percentage of Trained investigative personnel/ Percentage of certified investigative personnel",
    "Percentage of investigative positions filled up with trained investigators",
    "Improvement in response time",
    "Percentage of dedicated investigators assigned to handle specific cases",
    "Number of recipients of a. awards b. punished",
    "Percentage of investigative personnel equipped with standard investigative systems and procedures",
    "Percentage of Police Stations using e-based system",
    "Number of cases filed in court/total # of cases investigated",
    "Number of investigative infrastructure/equipment identified/accounted",
    "Percentage of fill-up of investigative equipment and infrastructure",
    "Percentage of IT-compliant stations",
    "Number of linkages established",
    "Number of community/ stakeholders support generated",
    "Number of investigative activities funded",
    "Number of special investigation cases requested for fund support"
  ];

  const pi1Activities = [
    { name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snapshot formulated" },
    { name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted" },
    { name: "Implementation of IO", indicator: "No. of activities conducted" },
    { name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted" },
    { name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies" },
    { name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed" },
    { name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted" },
    { name: "Dissemination of related news articles involving the PNP in region...", indicator: "No. of emails and SMS sent" },
    { name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers" }
  ];

  const pi2Activities = [
    { name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs...", indicator: "No. of collaborative efforts with NGOs, CSOs, GAs..." }
  ];

  const pi3Activities = [
    { name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted" },
    { name: "Convening of IO Working Group", indicator: "No. of activities conducted" },
    { name: "Activation of SyncCom during major events", indicator: "No. of activities conducted" },
    { name: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted" },
    { name: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted" },
    { name: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted" }
  ];

  return Array.from({ length: 29 }).map((_, i) => {
    const piNumber = i + 1;
    const piId = `PI${piNumber}`;
    let baseActivities: { name: string; indicator: string }[] = [];

    if (piNumber === 1) baseActivities = pi1Activities;
    else if (piNumber === 2) baseActivities = pi2Activities;
    else if (piNumber === 3) baseActivities = pi3Activities;
    else {
      baseActivities = [
        { name: "Standard Operational Procedure Implementation", indicator: "Number of evaluations completed" },
        { name: "Personnel Training and Readiness", indicator: "Percentage of compliant staff" },
        { name: "Equipment Maintenance Logs", indicator: "No. of units serviced" }
      ];
    }

    return {
      id: piId,
      title: titles[i] || `Performance Indicator #${piNumber}`,
      activities: baseActivities.map((act, idx) => {
        const monthsData: MonthData[] = Array.from({ length: 12 }).map(() => ({
          value: baseValue,
          files: []
        }));
        return {
          activity: getSharedActivityName(piId, idx, act.name),
          indicator: getSharedIndicatorName(piId, idx, act.indicator),
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
  userRole: UserRole;
  selectedUser?: User; 
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title = "OPERATIONAL DASHBOARD 2026", onBack, userRole, selectedUser }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [exporting, setExporting] = useState(false);
  
  // Data State
  const [piData, setPiData] = useState<PIData[]>([]);
  
  // Interaction States
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editActivityName, setEditActivityName] = useState<string>('');
  
  const [editingIndicator, setEditingIndicator] = useState<number | null>(null);
  const [editIndicatorName, setEditIndicatorName] = useState<string>('');
  
  const [fileViewerCell, setFileViewerCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;

  useEffect(() => {
    refreshData();
  }, [title, userRole, selectedUser]);

  const refreshData = () => {
    const isTactical = title === "TACTICAL DASHBOARD 2026";
    const isOperational2026 = title === "OPERATIONAL DASHBOARD 2026";
    const isCHQDashboard = title.includes("CHQ OPERATIONAL DASHBOARD");
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.SUB_ADMIN;
    const isCHQ = userRole === UserRole.CHQ;

    let baseVal = 0;
    
    if (!selectedUser) {
      if (isAdmin) {
        if (isOperational2026) baseVal = 19;
        else if (isTactical) baseVal = 11;
        else if (isCHQDashboard) baseVal = 8;
      } else if (isCHQ) {
        if (isTactical) baseVal = 11;
        else if (isCHQDashboard) baseVal = 1; 
      }
    }

    setPiData(generateStructuredPIs(baseVal));
  };

  const currentPI = useMemo(() => {
    return piData.find(pi => pi.id === activeTab) || piData[0];
  }, [piData, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.SUB_ADMIN;
    if (isAdmin) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    } else {
      setFileViewerCell({ rowIdx, monthIdx });
    }
  };

  // Activity Name Editing (Super Admin Only)
  const startEditingActivity = (rowIdx: number, name: string) => {
    if (!isSuperAdmin) return;
    setEditingActivity(rowIdx);
    setEditActivityName(name);
  };

  const saveActivityName = () => {
    if (editingActivity === null) return;
    setSharedActivityName(activeTab, editingActivity, editActivityName);
    setEditingActivity(null);
    refreshData(); 
  };

  // Indicator Name Editing (Super Admin Only)
  const startEditingIndicator = (rowIdx: number, indicator: string) => {
    if (!isSuperAdmin) return;
    setEditingIndicator(rowIdx);
    setEditIndicatorName(indicator);
  };

  const saveIndicatorName = () => {
    if (editingIndicator === null) return;
    setSharedIndicatorName(activeTab, editingIndicator, editIndicatorName);
    setEditingIndicator(null);
    refreshData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileViewerCell || !e.target.files?.length) return;
    const uploadedFiles: MonthFile[] = Array.from(e.target.files as FileList).map((f: File) => ({
      id: Math.random().toString(36).substring(2, 11),
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
      uploadedAt: new Date().toISOString()
    }));

    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[fileViewerCell.rowIdx] };
      const newMonths = [...activity.months];
      const monthData = { ...newMonths[fileViewerCell.monthIdx] };
      monthData.files = [...monthData.files, ...uploadedFiles];
      if (userRole === UserRole.STATION || userRole === UserRole.CHQ) {
        monthData.value = monthData.files.length;
      }
      newMonths[fileViewerCell.monthIdx] = monthData;
      activity.months = newMonths;
      activity.total = newMonths.reduce((a, b) => a + b.value, 0);
      newActivities[fileViewerCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
  };

  const removeFile = (fileId: string) => {
    if (!fileViewerCell) return;
    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[fileViewerCell.rowIdx] };
      const newMonths = [...activity.months];
      const monthData = { ...newMonths[fileViewerCell.monthIdx] };
      monthData.files = monthData.files.filter(f => f.id !== fileId);
      if (userRole === UserRole.STATION || userRole === UserRole.CHQ) {
        monthData.value = monthData.files.length;
      }
      newMonths[fileViewerCell.monthIdx] = monthData;
      activity.months = newMonths;
      activity.total = newMonths.reduce((a, b) => a + b.value, 0);
      newActivities[fileViewerCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
  };

  const saveEditValue = () => {
    if (!editingCell) return;
    const newValue = parseInt(editValue, 10);
    if (isNaN(newValue)) {
      setEditingCell(null);
      return;
    }
    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[editingCell.rowIdx] };
      const newMonths = [...activity.months];
      newMonths[editingCell.monthIdx].value = newValue;
      activity.total = newMonths.reduce((a, b) => a + b.value, 0);
      newActivities[editingCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
    setEditingCell(null);
  };

  const handleExportPPT = async () => {
    if (!currentPI) return;
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.defineSlideMaster({
        title: "OPERATIONAL_DASHBOARD_MASTER",
        background: { color: "FFFFFF" },
        objects: [
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 28, bold: true, color: "0f172a", align: "center" } } },
          { text: { text: `Nexus Admin - Performance Monitoring System${selectedUser ? ` - ${selectedUser.name}` : ''}`, options: { x: 0.5, y: 0.6, w: 12.3, fontSize: 10, color: "64748b", align: "center" } } }
        ],
      });

      piData.forEach((pi, index) => {
        const slide = pptx.addSlide({ masterName: "OPERATIONAL_DASHBOARD_MASTER" });
        const piNum = index + 1;
        slide.addText(`Performance Indicator #${piNum}: ${pi.title}`, {
          x: 0.5, y: 0.9, w: 12.3, fontSize: 14, bold: true, color: "334155", align: "center"
        });
        const tableData = [];
        tableData.push([
          { text: "Activity", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" }, rowspan: 2 } },
          { text: "Performance Indicator", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" }, rowspan: 2 } },
          { text: "Accomplishment", options: { fill: "00B0F0", bold: true, align: "center", color: "FFFFFF", border: { pt: 1, color: "cbd5e1" }, colspan: 13 } }
        ]);
        tableData.push([
          ...MONTHS.map(m => ({ text: m, options: { fill: "FFFF00", italic: true, align: "center", border: { pt: 1, color: "cbd5e1" } } })),
          { text: "Total", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" } } }
        ]);
        pi.activities.forEach((act) => {
          tableData.push([
            { text: act.activity, options: { border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } },
            { text: act.indicator, options: { border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } },
            ...act.months.map(m => ({ text: String(m.value), options: { align: "center", color: "1d4ed8", border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } })),
            { text: String(act.total), options: { bold: true, align: "center", fill: "F8FAFC", border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } }
          ]);
        });
        const totalSum = pi.activities.reduce((acc, row) => acc + row.total, 0);
        tableData.push([
          { text: "TOTAL", options: { bold: true, fill: "F1F5F9", border: { pt: 1, color: "cbd5e1" }, colspan: 2 } },
          ...MONTHS.map((_, mIdx) => {
            const mSum = pi.activities.reduce((acc, row) => acc + row.months[mIdx].value, 0);
            return { text: String(mSum), options: { bold: true, align: "center", color: "1d4ed8", fill: "F1F5F9", border: { pt: 1, color: "cbd5e1" } } };
          }),
          { text: String(totalSum), options: { bold: true, align: "center", fill: "E2E8F0", border: { pt: 1, color: "cbd5e1" } } }
        ]);
        slide.addTable(tableData, {
          x: 0.3, y: 1.3, w: 12.7, fontSize: 8, border: { pt: 0.5, color: "cbd5e1" }
        });
      });
      await pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setExporting(false);
    }
  };

  if (!currentPI) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-slate-200 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            Back to Overview
          </button>
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             {selectedUser && (
               <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-widest">
                 Unit View: {selectedUser.name}
               </span>
             )}
          </div>
          <p className="text-slate-500 font-medium">Accomplishment tracking based on actual activity file uploads.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportPPT} disabled={exporting} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-600/20 disabled:opacity-50">
            {exporting ? 'Exporting...' : 'Export PPT'}
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
            Full Report (.xlsx)
          </button>
        </div>
      </div>

      {/* PI Tabs Selection */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 whitespace-nowrap">
          {piData.map((pi, index) => (
            <button
              key={pi.id}
              onClick={() => setActiveTab(pi.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === pi.id 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              PI {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-3 px-6 border-b border-slate-300 flex justify-between items-center">
          <h3 className="flex-1 text-center font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">
            Performance Indicator # {activeTab.replace('PI', '')} – {currentPI.title}
          </h3>
          <div className="text-[10px] text-slate-400 font-bold uppercase italic">
            {isSuperAdmin ? "* Double-click Activity/Indicator to edit" : "* Upload files to update data"}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase">Indicator</th>
                <th colSpan={13} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">Accomplishment</th>
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center italic w-11 font-medium">{m}</th>
                ))}
                <th className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-black w-16 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-blue-50/30 transition-colors">
                  {/* Activity Column */}
                  <td 
                    className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'cursor-pointer group' : ''}`}
                    onDoubleClick={() => startEditingActivity(rowIdx, row.activity)}
                  >
                    {editingActivity === rowIdx ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          className="flex-1 bg-white border border-blue-500 rounded px-1 py-0.5 outline-none font-bold text-blue-900"
                          value={editActivityName}
                          onChange={(e) => setEditActivityName(e.target.value)}
                          onBlur={saveActivityName}
                          onKeyDown={(e) => e.key === 'Enter' && saveActivityName()}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        {row.activity}
                        {isSuperAdmin && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Indicator Column */}
                  <td 
                    className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'cursor-pointer group' : ''}`}
                    onDoubleClick={() => startEditingIndicator(rowIdx, row.indicator)}
                  >
                    {editingIndicator === rowIdx ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          className="flex-1 bg-white border border-blue-500 rounded px-1 py-0.5 outline-none font-bold text-blue-900"
                          value={editIndicatorName}
                          onChange={(e) => setEditIndicatorName(e.target.value)}
                          onBlur={saveIndicatorName}
                          onKeyDown={(e) => e.key === 'Enter' && saveIndicatorName()}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        {row.indicator}
                        {isSuperAdmin && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Months Columns */}
                  {row.months.map((m, monthIdx) => (
                    <td 
                      key={monthIdx} 
                      className="border border-slate-300 p-1.5 text-center text-blue-700 font-medium cursor-pointer transition-colors hover:bg-blue-100 group relative"
                      onClick={() => handleCellClick(rowIdx, monthIdx, m.value)}
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.monthIdx === monthIdx ? (
                        <input
                          autoFocus
                          className="w-full text-center bg-white border border-blue-500 rounded px-0.5 outline-none font-bold text-blue-900"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEditValue}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditValue()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="underline decoration-blue-700/30">{m.value}</span>
                          {m.files.length > 0 && (
                            <span className="text-[8px] text-slate-400 font-bold block mt-0.5">({m.files.length} 📄)</span>
                          )}
                          {(userRole === UserRole.STATION || userRole === UserRole.CHQ) && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-600/10 transition-opacity">
                               <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                               </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-900 bg-slate-50/50">{row.total}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-400 uppercase text-slate-900">
                <td colSpan={2} className="border border-slate-300 p-2">TOTAL</td>
                {MONTHS.map((_, midx) => (
                  <td key={midx} className="border border-slate-300 p-1.5 text-center text-blue-800">
                    {currentPI.activities.reduce((acc, row) => acc + row.months[midx].value, 0)}
                  </td>
                ))}
                <td className="border border-slate-300 p-1.5 text-center font-black bg-slate-100">
                  {currentPI.activities.reduce((acc, row) => acc + row.total, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* File Manager Modal */}
      {fileViewerCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Actual Accomplishment Attachments</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {MONTHS[fileViewerCell.monthIdx]} - {currentPI.activities[fileViewerCell.rowIdx].activity.substring(0, 50)}...
                </p>
              </div>
              <button onClick={() => setFileViewerCell(null)} className="p-2 text-slate-400 hover:text-slate-600 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Uploaded Files ({currentPI.activities[fileViewerCell.rowIdx].months[fileViewerCell.monthIdx].files.length})</h4>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Upload New File
                </button>
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {currentPI.activities[fileViewerCell.rowIdx].months[fileViewerCell.monthIdx].files.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium italic">No files uploaded yet for this period.</p>
                  </div>
                ) : (
                  currentPI.activities[fileViewerCell.rowIdx].months[fileViewerCell.monthIdx].files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>
                        <button onClick={() => removeFile(file.id)} className="p-2 text-slate-400 hover:text-red-600 transition">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
              <button onClick={() => setFileViewerCell(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;
