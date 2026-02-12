import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (role === UserRole.SUB_ADMIN && prefix === 'target') {
    return 'sa-1';
  }
  return userId;
};

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
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);

    if (stored !== null) {
      value = parseInt(stored, 10);
    } else if (isConsolidated && units.length > 0) {
      value = units.reduce((sum, unit) => {
        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);

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
        { id: "pi3_a7", name: "PNP Good Deeds", indicator: "No. of Good Deeds conducted", defaults: Array(12).fill(120) }
      ]
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
    allDefinitions.sort((a, b) => customOrder.indexOf(a.id) - customOrder.indexOf(b.id));
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
        
        // Ensure CHQ, Station, and Company users start with 0 for accomplishment data
        if (prefix === 'accomplishment' && (role === UserRole.CHQ || role === UserRole.STATION)) {
          effectiveDefaults = Array(12).fill(0);
        }

        return {
          id: aid,
          activity: getSharedActivityName(prefix, year, effectiveId, pi.id, aid, base?.name || "New Activity"),
          indicator: getSharedIndicatorName(prefix, year, effectiveId, pi.id, aid, base?.indicator || "New Indicator"),
          months: createMonthsForActivity(prefix, year, effectiveId, pi.id, aid, effectiveDefaults, role, isConsolidated, units),
          total: 0
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

interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits: User[];
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser, allUnits }) => {
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
  const allPIsImportRef = useRef<HTMLInputElement>(null);
  const allPIsDescriptionImportRef = useRef<HTMLInputElement>(null);
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
  
  // Consolidated accomplishment views are read-only for all users, including super admin.
  const isReadOnlyConsolidatedView = isConsolidated && prefix === 'accomplishment';

  const canModifyData = 
    !isReadOnlyConsolidatedView && (
      (isOwner && currentUser.role !== UserRole.SUPER_ADMIN) || 
      (currentUser.role === UserRole.SUB_ADMIN && (subjectUser.role === UserRole.STATION || subjectUser.role === UserRole.CHQ)) ||
      (currentUser.role === UserRole.SUPER_ADMIN && (subjectUser.role === UserRole.STATION || subjectUser.role === UserRole.CHQ))
    );
  
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

    if (data.length > 0 && !data.find(d => d.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, activeTab, allUnits]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const checkIsPercent = (indicator: string) => {
    const lower = indicator.toLowerCase();
    if (lower.includes('percentage') || lower.includes('%') || lower.includes('rate') || lower.includes('ratio')) {
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
    if (!editingCell || !currentPI || !canModifyData) return; 
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
    if (!canModifyData) return;
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
    if (!canModifyData || !activeFileCell || !currentPI) return;
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

  const handleExportAllPIs = () => {
    const wb = XLSX.utils.book_new();
    piData.forEach(pi => {
      const exportData = pi.activities.map(act => {
        const row: any = { 
          'Activity ID': act.id, 
          'Activity': act.activity, 
          'Performance Indicator': act.indicator 
        };
        MONTHS.forEach((m, i) => { row[m] = act.months[i].value; });
        row['Total'] = act.total;
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, pi.id);
    });
    const filename = `${subjectUser.name}_All_PI_Data_${year}_${prefix}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleImportAllPIs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
        alert("Access Denied. Only Super Admins can import data.");
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });

            wb.SheetNames.forEach(piId => {
                if (piData.some(p => p.id === piId)) {
                    const ws = wb.Sheets[piId];
                    const data: any[] = XLSX.utils.sheet_to_json(ws);

                    data.forEach(row => {
                        const aid = row['Activity ID'];
                        if (aid) {
                            MONTHS.forEach((m, i) => {
                                const val = row[m];
                                if (val !== undefined && val !== null) {
                                    saveDataWithSync(piId, aid, i, parseInt(String(val), 10) || 0);
                                }
                            });
                        }
                    });
                }
            });

            alert("All PI data has been imported successfully.");
            refresh();
        } catch (error) {
            console.error("Error importing PI data:", error);
            alert("An error occurred while importing the file. Please check the file format and ensure it includes 'Activity ID'.");
        }
    };
    reader.readAsBinaryString(file);

    if (e.target) {
        e.target.value = '';
    }
  };

  const handleImportAllPIDescriptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
        alert("Access Denied. Only Super Admins can perform this action.");
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });

            wb.SheetNames.forEach(piId => {
                if (piData.some(p => p.id === piId)) {
                    const ws = wb.Sheets[piId];
                    const data: any[] = XLSX.utils.sheet_to_json(ws);

                    data.forEach(row => {
                        const aid = row['Activity ID'];
                        const activityName = row['Activity'];
                        const indicatorName = row['Performance Indicator'];

                        if (aid) {
                            if (activityName) {
                                localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, activityName);
                            }
                            if (indicatorName) {
                                localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, indicatorName);
                            }
                        }
                    });
                }
            });

            alert("All PI descriptions have been updated successfully.");
            refresh();
        } catch (error) {
            console.error("Error importing PI descriptions:", error);
            alert("An error occurred while importing the file. Please ensure it has the correct format with 'Activity ID', 'Activity', and 'Performance Indicator' columns.");
        }
    };
    reader.readAsBinaryString(file);

    if (e.target) {
        e.target.value = '';
    }
  };

  const handleExportMasterTemplate = () => {
    if (!canEditStructure) return;
    const allData: any[] = [];
    piData.forEach(pi => {
      pi.activities.forEach(act => {
        const row: any = { 'PI ID': pi.id, 'Activity ID': act.id, 'PI Title': pi.title, 'Activity': act.activity, 'Performance Indicator': act.indicator };
        MONTHS.forEach((m, i) => { row[m] = act.months[i].value; });
        allData.push(row);
      });
    });
    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Template");
    XLSX.writeFile(wb, `Master_Template_${year}.xlsx`);
  };

  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditStructure) return;
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
        if (piId && aid) {
          if (row['Activity']) localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${piId}_${aid}`, row['Activity']);
          if (row['Performance Indicator']) localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${piId}_${aid}`, row['Performance Indicator']);
          MONTHS.forEach((m, i) => { 
            if (row[m] !== undefined) saveDataWithSync(piId, aid, i, parseInt(row[m], 10) || 0); 
          });
        }
      });
      refresh();
    };
    reader.readAsBinaryString(file);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    if (type.includes('pdf')) return <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    return <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  };

  const vaultFolders = useMemo(() => {
    const units = new Set(vaultData.map((f: any) => f.unitName));
    return Array.from(units).sort();
  }, [vaultData]);

  const filteredVaultFiles = useMemo(() => {
    if (!vaultFolder) return [];
    return vaultData.filter((f: any) => f.unitName === vaultFolder).reverse();
  }, [vaultData, vaultFolder]);

  const showImportDescriptionsButton = useMemo(() => 
    currentUser.role === UserRole.SUPER_ADMIN && (isTargetOutlook || (!isTargetOutlook && subjectUser.role === UserRole.CHQ)),
  [currentUser.role, isTargetOutlook, subjectUser.role]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Return to Terminal
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">Unit: {subjectUser.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditStructure && (
            <>
              <button onClick={handleExportMasterTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">Export Master</button>
              <button onClick={() => masterImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">Import Master</button>
              <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
            </>
          )}
          {currentUser.role === UserRole.SUPER_ADMIN && (
            <button onClick={() => setVaultOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"><GoogleDriveIcon /> Unit Drive Vault</button>
          )}
          <button onClick={handleExportExcel} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-sm">Export Current PI</button>
          
          {canAccessFiles && (subjectUser.role === UserRole.CHQ || subjectUser.role === UserRole.STATION || (currentUser.role === UserRole.SUPER_ADMIN && isConsolidated)) && (
            <button onClick={handleExportAllPIs} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export All Tab PI's
            </button>
          )}
          {currentUser.role === UserRole.SUPER_ADMIN && (isConsolidated || isTargetOutlook) && (
              <>
                  <button onClick={() => allPIsImportRef.current?.click()} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2">
                      <UploadIcon />
                      Import Data
                  </button>
                  <input type="file" ref={allPIsImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportAllPIs} />
              </>
          )}
          {showImportDescriptionsButton && (
              <>
                  <button 
                      onClick={() => allPIsDescriptionImportRef.current?.click()} 
                      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2"
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Import Descriptions
                  </button>
                  <input type="file" ref={allPIsDescriptionImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportAllPIDescriptions} />
              </>
          )}
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {piData.map(pi => (
          <button 
            key={pi.id} 
            onClick={() => setActiveTab(pi.id)} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            {getSharedTabLabel(prefix, year, effectiveId, pi.id, pi.id)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <h2 className="text-2xl font-black uppercase tracking-tighter">{activeTab} - {currentPI?.title}</h2>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Activity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[150px]">Performance Indicator</th>
                {MONTHS.map(m => <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[70px]">{m}</th>)}
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest">Total</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPI?.activities.map((act, rIdx) => {
                const rowIsPercent = checkIsPercent(act.indicator);
                return (
                  <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      {editingActivityField?.aid === act.id && editingActivityField?.field === 'activity' ? (
                        <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => { localStorage.setItem(`${prefix}_pi_act_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName); setEditingActivityField(null); refresh(); }} className="w-full px-2 py-1 bg-slate-50 border rounded text-sm font-bold" />
                      ) : ( <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'activity' }), setEditFieldName(act.activity))} className={`text-sm font-bold text-slate-900 ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>{act.activity}</div> )}
                    </td>
                    <td className="px-6 py-4">
                      {editingActivityField?.aid === act.id && editingActivityField?.field === 'indicator' ? (
                        <input autoFocus value={editFieldName} onChange={e => setEditFieldName(e.target.value)} onBlur={() => { localStorage.setItem(`${prefix}_pi_ind_name_${year}_${effectiveId}_${activeTab}_${act.id}`, editFieldName); setEditingActivityField(null); refresh(); }} className="w-full px-2 py-1 bg-slate-50 border rounded text-xs font-medium" />
                      ) : ( <div onClick={() => canEditStructure && (setEditingActivityField({ aid: act.id, field: 'indicator' }), setEditFieldName(act.indicator))} className={`text-xs font-medium text-slate-500 ${canEditStructure ? 'cursor-pointer hover:text-blue-600' : ''}`}>{act.indicator}</div> )}
                    </td>
                    {act.months.map((m, mIdx) => (
                      <td key={mIdx} className="px-1 py-4 group/cell">
                        <div className="flex items-center justify-center gap-0.5">
                          {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                            <input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} className="w-12 px-1 py-1 bg-white border-2 border-slate-900 rounded text-center text-xs font-black outline-none" />
                          ) : ( 
                            <div onClick={() => handleCellClick(rIdx, mIdx, m.value)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                              {m.value}{rowIsPercent ? '%' : ''}
                            </div> 
                          )}
                          <button onClick={(e) => handleOpenFiles(e, rIdx, mIdx)} className={`flex items-center justify-center w-6 h-6 rounded-md transition-all ${m.files.length > 0 ? 'bg-emerald-50' : 'opacity-0 group-hover/cell:opacity-100 hover:bg-slate-100'}`}>
                            <PaperclipIcon active={m.files.length > 0} />
                          </button>
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center text-sm font-black text-slate-900">{act.total}{rowIsPercent ? '%' : ''}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={(e) => handleOpenFiles(e, rIdx, 0)} className={`p-2 rounded-xl transition-all ${act.months.some(m => m.files.length > 0) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-slate-900'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {vaultOpen && currentUser.role === UserRole.SUPER_ADMIN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-emerald-900 p-10 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4"><GoogleDriveIcon /> Unit Drive Vault</h3>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2">Global Access Point</p>
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
                            <div className="w-20 h-20 text-blue-300 group-hover:text-blue-500 transition-colors"><FolderIcon /></div>
                            <p className="font-black text-slate-900 text-sm truncate max-w-[150px]">{folder}</p>
                         </div>
                      )) : (
                        <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No unit folders created yet</div>
                      )}
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredVaultFiles.map((file: any) => (
                        <div key={file.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:border-emerald-500 transition-all flex flex-col justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 border">{getFileIcon(file.type)}</div>
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
          <div className="bg-white w-full max-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-8 border-b flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">MOVs & Documents</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Unit: {subjectUser.name} • {MONTHS[activeFileCell.monthIdx]} {year}</p>
               </div>
               <button onClick={() => setIsFilesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white border rounded-xl text-xs font-black">CLOSE</button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 gap-3">
                {currentPI.activities[activeFileCell.rowIdx].months[activeFileCell.monthIdx].files.map(file => (
                  <div key={file.id} className="p-5 bg-white border rounded-[1.5rem] flex items-center justify-between hover:border-indigo-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-500">{getFileIcon(file.type)}</div>
                      <div className="truncate">
                        <p className="text-sm font-black text-slate-900 truncate">{file.name}</p>
                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Mirror Secure</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={file.url} download={file.name} className="p-2.5 text-slate-400 hover:text-indigo-600 transition text-xs font-black">LINK</a>
                      {canModifyData && <button onClick={() => removeFile(file.id)} className="p-2.5 text-slate-400 hover:text-rose-600 transition text-xs font-black">DELETE</button>}
                    </div>
                  </div>
                ))}
              </div>
              {canModifyData && (
                <div className="pt-6 border-t">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl transition-all flex items-center justify-center gap-3">
                    <UploadIcon /> {syncStatus === 'idle' ? 'Upload & Sync' : 'Synchronizing...'}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
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