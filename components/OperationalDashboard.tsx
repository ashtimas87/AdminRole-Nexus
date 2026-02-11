
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import { DatabaseService } from '../services/dbService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns the effective ID for storage, ensuring each unit and dashboard type has its own scope.
 */
const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string): string => {
  if (role === UserRole.SUB_ADMIN && prefix === 'target') {
    return 'sa-1';
  }
  return userId;
};

const OperationalDashboard: React.FC<{
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits: User[];
}> = ({ title, onBack, currentUser, subjectUser, allUnits }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = title.toUpperCase().includes("TARGET OUTLOOK");
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix);
  const canModifyData = currentUser.id === subjectUser.id || currentUser.role === UserRole.SUPER_ADMIN;

  const refresh = () => {
    // Logic to load piData from localStorage...
  };

  useEffect(() => { refresh(); }, [activeTab, subjectUser.id, year]);

  const saveEdit = async () => {
    if (!editingCell) return;
    const val = parseInt(editValue, 10) || 0;
    const aid = `act-${editingCell.rowIdx}`; // Simplified ID for example
    
    // 1. Save locally
    const storageKey = `${prefix}_data_${year}_${effectiveId}_${activeTab}_${aid}_${editingCell.monthIdx}`;
    localStorage.setItem(storageKey, String(val));
    
    // 2. Trigger Database Sync if enabled
    const settings = DatabaseService.getSettings();
    if (settings.autoSync || settings.endpoint) {
      console.log('Syncing data to Hostinger database...');
      DatabaseService.pushToRemote();
    }
    
    setEditingCell(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">{activeTab} - Strategic Priority</h2>
          <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl">Back</button>
        </div>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Unit: {subjectUser.name} • Sync Terminal v2.0</p>
      </div>
      
      {/* Table implementation omitted for brevity, would use saveEdit */}
      <div className="p-20 text-center bg-white border border-slate-200 rounded-[2rem]">
         <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Ready for data entry. Remote sync active.</p>
      </div>
    </div>
  );
};

export default OperationalDashboard;
