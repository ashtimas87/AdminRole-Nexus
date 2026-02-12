import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, PIActivity } from '../types';
import { dbService } from '../services/dbService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_VARIANTS: Record<string, string[]> = {
  'Jan': ['january', 'jan', 'month 1', '01'],
  'Feb': ['february', 'feb', 'month 2', '02'],
  'Mar': ['march', 'mar', 'month 3', '03'],
  'Apr': ['april', 'apr', 'month 4', '04'],
  'May': ['may', 'month 5', '05'],
  'Jun': ['june', 'jun', 'month 6', '06'],
  'Jul': ['july', 'jul', 'month 7', '07'],
  'Aug': ['august', 'aug', 'month 8', '08'],
  'Sep': ['september', 'sep', 'sept', 'month 9', '09'],
  'Oct': ['october', 'oct', 'month 10', '10'],
  'Nov': ['november', 'nov', 'month 11', '11'],
  'Dec': ['december', 'dec', 'month 12', '12']
};

const sanitize = (val: any, fallback: string): string => {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return fallback;
  return s;
};

const getExcelValue = (row: any, keywords: string[], fallback: string): string => {
  const rowKeys = Object.keys(row);
  for (const keyword of keywords) {
    const target = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = String(row[foundKey]).trim();
      if (val && val.toLowerCase() !== 'undefined') return val;
    }
  }
  for (const keyword of keywords) {
    const target = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => {
      const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedKey.includes(target) || target.includes(normalizedKey);
    });
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = String(row[foundKey]).trim();
      if (val && val.toLowerCase() !== 'undefined') return val;
    }
  }
  return fallback;
};

const getMonthValue = (row: any, monthKey: string): number => {
  const variants = MONTH_VARIANTS[monthKey];
  const rowKeys = Object.keys(row);
  for (const variant of variants) {
    const foundKey = rowKeys.find(k => k.toLowerCase().trim() === variant);
    if (foundKey !== undefined) {
      const val = String(row[foundKey]).replace(/[^0-9.]/g, '');
      return parseInt(val, 10) || 0;
    }
  }
  const val = String(row[monthKey] || row[monthKey.toUpperCase()] || row[monthKey.toLowerCase()] || '0');
  return parseInt(val.replace(/[^0-9.]/g, ''), 10) || 0;
};

const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (prefix === 'target' && (role === UserRole.SUB_ADMIN || role === UserRole.SUPER_ADMIN)) {
    return 'sa-1';
  }
  return userId || 'unknown';
};

const MySQLIcon = () => (
  <svg viewBox="0 0 512 512" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.9 0-208-93.1-208-208S141.1 48 256 48s208 93.1 208 208-93.1 208-208 208z" fill="#00758F"/>
    <path d="M256 80c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176S353.2 80 256 80z" fill="#F29111" opacity="0.4"/>
  </svg>
);

const PaperclipIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${active ? 'text-emerald-500' : 'text-slate-300'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits?: User[];
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [activeFileCell, setActiveFileCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState('');
  
  const masterImportRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = useMemo(() => getEffectiveUserId(subjectUser.id, subjectUser.role, prefix), [subjectUser.id, subjectUser.role, prefix]);
  
  const currentPI = useMemo(() => {
    if (!piData || piData.length === 0) return null;
    return piData.find(pi => pi.id === activeTab) || piData[0];
  }, [piData, activeTab]);

  const canModifyData = currentUser.id === subjectUser.id || currentUser.role === UserRole.SUPER_ADMIN;

  const loadData = async (manualRetry = false) => {
    setSyncStatus('syncing');
    setErrorMessage('');
    
    try {
      const dbRows = await dbService.fetchUnitData(prefix, year, effectiveId);
      
      const dbMap: Record<string, any> = {};
      dbRows.forEach((row: any) => {
        const key = `${row.pi_id}_${row.activity_id}_${row.month_idx}`;
        dbMap[key] = row;
      });

      const dbPiIds = Array.from(new Set(dbRows.map(r => String(r.pi_id || '')))).filter(id => id !== '');
      const uniquePiIds = dbPiIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      const structuredData: PIData[] = uniquePiIds.map(piId => {
        const piRows = dbRows.filter((r: any) => r.pi_id === piId);
        const combinedActivityIds = Array.from(new Set(piRows.map(r => String(r.activity_id || '')))).filter(id => id !== '');

        const activities: PIActivity[] = combinedActivityIds.map(aid => {
          const meta = piRows.find((r: any) => r.activity_id === aid && r.activity_name && r.activity_name !== 'Unnamed Activity') || piRows.find(r => r.activity_id === aid);
          
          return {
            id: aid,
            activity: sanitize(meta?.activity_name, "Unnamed Activity"),
            indicator: sanitize(meta?.indicator_name, "Units"),
            months: Array.from({ length: 12 }).map((_, mIdx) => {
              const rowKey = `${piId}_${aid}_${mIdx}`;
              const rowData = dbMap[rowKey];
              let files = [];
              try { files = rowData?.files_json ? JSON.parse(rowData.files_json) : []; } catch(e) { files = []; }
              return { value: parseInt(rowData?.value || 0, 10), files };
            }),
            total: 0
          };
        });

        const piMeta = piRows.find(r => r.pi_title && r.pi_title !== `Performance Indicator ${piId}`);
        
        return {
          id: piId,
          title: sanitize(piMeta?.pi_title, `Goal: ${piId}`),
          activities: activities.map(a => ({ ...a, total: a.months.reduce((sum, m) => sum + m.value, 0) }))
        };
      });

      setPiData(structuredData);
      
      if (!activeTab || !uniquePiIds.includes(activeTab)) {
        setActiveTab(uniquePiIds.length > 0 ? uniquePiIds[0] : null);
      }
      
      setSyncStatus('idle');
    } catch (err: any) {
      setSyncStatus('error');
      setErrorMessage(err.message === 'FETCH_BLOCKED_BY_BROWSER' ? 'Handshake Denied' : 'Cloud Sync Fault');
    }
  };

  useEffect(() => { loadData(); }, [prefix, year, effectiveId]);

  const handleImportMasterTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncStatus('syncing');
    setSyncProgress(0);
    setImportStatusText('Establishing Connection...');
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);
      const data = rawData.filter(row => Object.values(row).some(v => v !== null && v !== ''));

      if (data.length === 0) {
        setSyncStatus('error');
        setErrorMessage('Import failed: Source file empty.');
        return;
      }

      const totalSteps = data.length;
      let currentStep = 0;
      const importedPiIds: string[] = [];

      const piKeywords = ['pi', 'goal', 'performanceindicator', 'strategic', 'no', 'objective', 'id', 'pino'];
      const activityKeywords = ['activity', 'description', 'task', 'name', 'activities', 'action', 'item'];
      const indicatorKeywords = ['indicator', 'unit', 'measure', 'performance_indicator', 'target', 'metric'];

      for (const row of data) {
        currentStep++;
        setSyncProgress(Math.round((currentStep / totalSteps) * 100));
        setImportStatusText(`Injecting Row ${currentStep}/${totalSteps}...`);

        let piId = getExcelValue(row, piKeywords, '').toUpperCase().replace(/\s/g, '');
        if (!piId) piId = 'PI-1';
        if (piId && !piId.startsWith('PI') && /^\d/.test(piId)) piId = 'PI' + piId;

        let aid = getExcelValue(row, ['activityid', 'aid', 'act_id', 'no', 'id', 'sequence'], '');
        if (!aid) aid = `ACT-${currentStep}`;

        const activityName = getExcelValue(row, activityKeywords, 'Unnamed Activity');
        const indicatorName = getExcelValue(row, indicatorKeywords, 'Units');
        const piTitle = getExcelValue(row, ['pi_title', 'goal_title', 'pi_description', 'strategic_objective', 'objective_title'], `Performance Goal ${piId}`);

        if (!importedPiIds.includes(piId)) importedPiIds.push(piId);

        const savePromises = [];
        for (let i = 0; i < 12; i++) {
          const val = getMonthValue(row, MONTHS[i]);
          savePromises.push(dbService.saveActivityValue({
            prefix, year, userId: effectiveId, piId, activityId: aid, monthIdx: i, value: val,
            activityName, indicatorName, piTitle
          }));
        }
        await Promise.all(savePromises);
      }
      
      setImportStatusText('Syncing Persistence...');
      // Crucial: Wait for the database write buffer to settle on shared hosting
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setImportStatusText('Refreshing Terminal Data...');
      setPiData([]); // Clear old state to ensure visual update
      await loadData();
      
      if (importedPiIds.length > 0) {
        const sorted = importedPiIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setActiveTab(sorted[0]);
      }
      
      setSyncStatus('complete');
      setTimeout(() => setSyncStatus('idle'), 1500);
    };
    reader.readAsBinaryString(file);
    if (masterImportRef.current) masterImportRef.current.value = '';
  };

  const saveEdit = async () => {
    if (!editingCell || !currentPI) return;
    const val = parseInt(editValue, 10) || 0;
    const act = currentPI.activities[editingCell.rowIdx];
    
    setSyncStatus('syncing');
    try {
      const success = await dbService.saveActivityValue({
        prefix, year, userId: effectiveId, piId: activeTab || currentPI.id, activityId: act.id, monthIdx: editingCell.monthIdx, value: val,
        activityName: act.activity, indicatorName: act.indicator, piTitle: currentPI.title
      });
      if (success) {
        setEditingCell(null);
        await loadData();
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      setSyncStatus('error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeFileCell || !currentPI) return;
    
    setSyncStatus('syncing');
    const act = currentPI.activities[activeFileCell.rowIdx];
    const currentFiles = [...act.months[activeFileCell.monthIdx].files];

    try {
      for (const file of Array.from(files)) {
        const url = await dbService.uploadFileToServer(file, { userId: effectiveId, type: 'evidence' });
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

      await dbService.saveActivityValue({
        prefix, year, userId: effectiveId, piId: activeTab || currentPI.id, activityId: act.id, 
        monthIdx: activeFileCell.monthIdx, value: act.months[activeFileCell.monthIdx].value,
        filesJson: JSON.stringify(currentFiles),
        activityName: act.activity, indicatorName: act.indicator, piTitle: currentPI.title
      });
      await loadData();
    } catch (err) {
      setSyncStatus('error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20 relative">
      {syncStatus === 'syncing' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white p-12 rounded-[3rem] shadow-2xl space-y-6 text-center max-w-sm w-full border border-slate-100">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <MySQLIcon />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Cloud Sync Active</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{importStatusText || 'Connecting...'}</p>
              
              {syncProgress > 0 && (
                <div className="space-y-3">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                  </div>
                  <p className="text-sm font-black text-slate-900">{syncProgress}% COMPLETE</p>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Terminal Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${syncStatus === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {syncStatus === 'error' ? `Link Failed: ${errorMessage}` : 'Encrypted Connection Active'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => masterImportRef.current?.click()} 
            className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all border-2 border-slate-900 hover:border-blue-500"
          >
            Cloud Import Master
          </button>
          <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth min-h-[58px]">
        {piData.map(pi => (
          <button
            key={pi.id}
            onClick={() => setActiveTab(pi.id)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {pi.id}
          </button>
        ))}
        {piData.length === 0 && syncStatus !== 'syncing' && (
          <div className="px-6 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest italic animate-pulse">
            Terminal Idle... Waiting for Data Injection
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-[240px]">Activity Description</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-[160px]">Performance Indicator</th>
              {MONTHS.map(m => <th key={m} className="px-1 py-5 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest w-[50px]">{m}</th>)}
              <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest w-[80px]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!currentPI || currentPI.activities.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-6 py-32 text-center">
                   <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <MySQLIcon />
                      </div>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                        List empty. Use Cloud Import to populate data or refresh connection.
                      </p>
                      <button onClick={() => loadData(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Forced Refresh</button>
                   </div>
                </td>
              </tr>
            ) : (
              currentPI.activities.map((act, rIdx) => (
                <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 align-top border-r border-slate-50">
                    <div className="text-sm font-bold text-slate-900 leading-tight break-words">{act.activity}</div>
                  </td>
                  <td className="px-6 py-5 align-top border-r border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider opacity-60 break-words">{act.indicator}</div>
                  </td>
                  {act.months.map((m, mIdx) => (
                    <td key={mIdx} className="px-0 py-5 text-center">
                      {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          className="w-10 px-1 py-1 bg-white border-2 border-slate-900 rounded text-center text-xs font-black shadow-lg"
                        />
                      ) : (
                        <div className="relative inline-block">
                          <div
                            onClick={() => { if(canModifyData) { setEditingCell({ rowIdx: rIdx, monthIdx: mIdx }); setEditValue(String(m.value)); } }}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer hover:bg-slate-100 ${m.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}
                          >
                            {m.value}
                          </div>
                          {m.files.length > 0 && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); setActiveFileCell({ rowIdx: rIdx, monthIdx: mIdx }); setIsFilesModalOpen(true); }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer scale-75 hover:scale-100 transition-transform"
                            >
                              <PaperclipIcon active />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-5 text-center">
                    <div className="text-sm font-black text-slate-900 bg-slate-100/50 py-2.5 rounded-xl">{act.total}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFilesModalOpen && activeFileCell && currentPI && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <MySQLIcon />
                 <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight leading-none">Evidence Vault</h3>
              </div>
              <button onClick={() => setIsFilesModalOpen(false)} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors border px-3 py-1.5 rounded-xl">Close</button>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-black uppercase text-[10px]">No evidence stored on cloud.</div>
              ) : (
                currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-500 hover:bg-blue-50/20 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                       <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                       </div>
                       <div className="truncate pr-4">
                         <span className="text-sm font-bold text-slate-900 block truncate">{f.name}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Synced: {new Date(f.uploadedAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-slate-900 px-5 py-2 rounded-xl text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-md">Open File</a>
                  </div>
                ))
              )}
            </div>
            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/30">
              <button 
                disabled={syncStatus === 'syncing' || !canModifyData}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${syncStatus === 'syncing' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {syncStatus === 'syncing' ? 'Syncing to Cloud...' : 'Upload Evidence'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;