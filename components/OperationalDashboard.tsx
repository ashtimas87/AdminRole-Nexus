
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import { dbService } from '../services/dbService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Maps users to a shared Super Admin ID for Target Outlook views if needed.
 */
const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (role === UserRole.SUB_ADMIN && prefix === 'target') {
    return 'sa-1';
  }
  return userId;
};

const PaperclipIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${active ? 'text-emerald-500' : 'text-slate-300'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterImportRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id, subjectUser.role, prefix), [subjectUser.id, subjectUser.role, prefix]);
  
  const canModifyData = currentUser.id === subjectUser.id || currentUser.role === UserRole.SUPER_ADMIN;

  const loadData = async () => {
    setSyncStatus('syncing');
    try {
      // 1. Fetch values and metadata from Hostinger MySQL
      const dbRows = await dbService.fetchUnitData(prefix, year, effectiveId);
      
      // Transform DB rows into a lookup map
      const dbMap: Record<string, any> = {};
      dbRows.forEach((row: any) => {
        const key = `${row.pi_id}_${row.activity_id}_${row.month_idx}`;
        dbMap[key] = row;
      });

      // 2. Build the UI structure
      const basePIs = Array.from({ length: 29 }, (_, i) => `PI${i + 1}`);
      const structuredData: PIData[] = basePIs.map(piId => {
        const activityIds: string[] = Array.from(new Set(
          dbRows.filter((r: any) => r.pi_id === piId).map((r: any) => String(r.activity_id))
        ));

        // Fallback for activity IDs if DB empty
        if (activityIds.length === 0) {
          const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
          const localIds: string[] = JSON.parse(localStorage.getItem(actIdsKey) || '[]');
          localIds.forEach((id: string) => activityIds.push(id));
        }

        const activities: PIActivity[] = activityIds.map(aid => {
          const meta = dbRows.find((r: any) => r.pi_id === piId && r.activity_id === aid);
          
          return {
            id: aid,
            activity: meta?.activity_name || localStorage.getItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`) || "Unnamed Activity",
            indicator: meta?.indicator_name || localStorage.getItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`) || "Units",
            months: Array.from({ length: 12 }).map((_, mIdx) => {
              const rowKey = `${piId}_${aid}_${mIdx}`;
              const rowData = dbMap[rowKey];
              const val = rowData?.value || 0;
              // Priority: DB files -> Local fallback (for backward compatibility)
              const files = rowData?.files_json ? JSON.parse(rowData.files_json) : JSON.parse(localStorage.getItem(`${prefix}_files_${year}_${effectiveId}_${piId}_${aid}_${mIdx}`) || '[]');
              return {
                value: val,
                files: Array.isArray(files) ? files : []
              };
            }),
            total: 0
          };
        });

        const piMeta = dbRows.find((r: any) => r.pi_id === piId);
        return {
          id: piId,
          title: piMeta?.pi_title || localStorage.getItem(`${prefix}_pi_title_${year}_${effectiveId}_${piId}`) || `Performance Indicator ${piId}`,
          activities: activities.map(a => ({
            ...a,
            total: a.months.reduce((sum, m) => sum + m.value, 0)
          }))
        };
      });

      setPiData(structuredData.filter(pi => pi.activities.length > 0 || pi.id === activeTab));
    } catch (err) {
      console.error("Dashboard component load failed:", err);
    } finally {
      setSyncStatus('idle');
    }
  };

  useEffect(() => { loadData(); }, [prefix, year, subjectUser.id]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleImportMasterTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncStatus('syncing');
    await dbService.uploadFileToServer(file, { userId: 'sa-1', type: 'master' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      for (const row of data) {
        const piId = String(row['PI ID'] || row['pi_id'] || '').trim().toUpperCase();
        const aid = String(row['Activity ID'] || row['activity_id'] || '').trim();
        const activityName = row['Activity'] || row['Activity Name'];
        const indicatorName = row['Performance Indicator'] || row['Indicator'];
        const piTitle = row['PI Title'] || row['Strategic Goal'];

        if (!piId || !aid) continue;

        // Save local metadata keys for structural lookups
        localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, String(activityName));
        localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, String(indicatorName));
        localStorage.setItem(`${prefix}_pi_title_${year}_${effectiveId}_${piId}`, String(piTitle));
        
        const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
        const currentIds = JSON.parse(localStorage.getItem(actIdsKey) || '[]');
        if (!currentIds.includes(aid)) {
          localStorage.setItem(actIdsKey, JSON.stringify([...currentIds, aid]));
        }

        // Save Jan to Dec values to MySQL
        for (let i = 0; i < 12; i++) {
          const mName = MONTHS[i];
          const val = parseInt(row[mName], 10) || 0;
          await dbService.saveActivityValue({
            prefix, year, userId: effectiveId, piId, activityId: aid, monthIdx: i, value: val,
            activityName: String(activityName), indicatorName: String(indicatorName), piTitle: String(piTitle)
          });
        }
      }
      
      await loadData();
      setSyncStatus('complete');
      setTimeout(() => setSyncStatus('idle'), 2000);
    };
    reader.readAsBinaryString(file);
  };

  const saveEdit = async () => {
    if (!editingCell || !currentPI) return;
    const val = parseInt(editValue, 10) || 0;
    const act = currentPI.activities[editingCell.rowIdx];
    
    setSyncStatus('syncing');
    await dbService.saveActivityValue({
      prefix, year, userId: effectiveId, piId: activeTab, activityId: act.id, monthIdx: editingCell.monthIdx, value: val,
      filesJson: JSON.stringify(act.months[editingCell.monthIdx].files),
      activityName: act.activity, indicatorName: act.indicator, piTitle: currentPI.title
    });
    setEditingCell(null);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeFileCell || !currentPI) return;
    
    setSyncStatus('syncing');
    const act = currentPI.activities[activeFileCell.rowIdx];
    const aid = act.id;
    const currentFiles = [...act.months[activeFileCell.monthIdx].files];

    for (const file of Array.from(files)) {
      const url = await dbService.uploadFileToServer(file, { userId: effectiveId, type: 'mov' });
      if (url) {
        currentFiles.push({ 
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
          name: file.name, 
          url, 
          type: file.type, 
          uploadedAt: new Date().toISOString() 
        });
      }
    }

    // Push updated file list to Database Cell
    await dbService.saveActivityValue({
      prefix, year, userId: effectiveId, piId: activeTab, activityId: aid, 
      monthIdx: activeFileCell.monthIdx, 
      value: act.months[activeFileCell.monthIdx].value,
      filesJson: JSON.stringify(currentFiles),
      activityName: act.activity, indicatorName: act.indicator, piTitle: currentPI.title
    });

    setSyncStatus('idle');
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Terminal
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {syncStatus === 'syncing' ? 'Syncing to Hostinger Database...' : 'Permanent MySQL Storage Connected'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
            <UploadIcon /> Import Master (Auto-Save)
          </button>
          <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {piData.map(pi => (
          <button
            key={pi.id}
            onClick={() => setActiveTab(pi.id)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {pi.id}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-1/4">Activity & Indicator</th>
              {MONTHS.map(m => <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{m}</th>)}
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPI?.activities.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-6 py-24 text-center">
                  <div className="max-w-xs mx-auto space-y-3">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No Unit Data Found</p>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Import a Master Excel file to populate this Terminal with permanent data.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentPI?.activities.map((act, rIdx) => (
                <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 leading-tight">{act.activity}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-wider opacity-60">{act.indicator}</div>
                  </td>
                  {act.months.map((m, mIdx) => (
                    <td key={mIdx} className="px-1 py-4 text-center">
                      {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          className="w-12 px-1 py-1 bg-white border-2 border-slate-900 rounded text-center text-xs font-black shadow-lg"
                        />
                      ) : (
                        <div className="relative inline-block">
                          <div
                            onClick={() => { if(canModifyData) { setEditingCell({ rowIdx: rIdx, monthIdx: mIdx }); setEditValue(String(m.value)); } }}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer hover:bg-slate-100 ${m.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}
                          >
                            {m.value}
                          </div>
                          {m.files.length > 0 && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); setActiveFileCell({ rowIdx: rIdx, monthIdx: mIdx }); setIsFilesModalOpen(true); }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
                            >
                              <PaperclipIcon active />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-black text-slate-900 bg-slate-100/50 py-2 rounded-xl">{act.total}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFilesModalOpen && activeFileCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Hostinger File Vault</h3>
              <button onClick={() => setIsFilesModalOpen(false)} className="text-slate-400 font-black hover:text-slate-900 transition-colors">CLOSE</button>
            </div>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length === 0 ? (
                 <p className="text-center text-slate-300 text-[10px] font-black uppercase py-8">No evidence uploaded yet.</p>
              ) : (
                currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-colors">
                    <span className="text-sm font-bold text-slate-900 truncate flex-1 pr-4">{f.name}</span>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="bg-white border px-3 py-1 rounded-lg text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">View</a>
                  </div>
                ))
              )}
            </div>
            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/50">
              <button 
                disabled={syncStatus === 'syncing' || !canModifyData}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${syncStatus === 'syncing' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'}`}
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 'Upload New Evidence'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
              {!canModifyData && <p className="text-[9px] font-black text-slate-400 uppercase mt-4">Viewing Mode (Read-Only)</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;
