import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import OperationalDashboard from './OperationalDashboard';
import { getRoleInsight } from '../services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  user: User;
}

type ViewType = 
  | 'overview' 
  | 'accounts' 
  | 'deployment'
  | 'operational-dashboard' 
  | 'chq-operational-dashboard' 
  | 'tactical-dashboard'
  | 'unit-landing'
  | 'user-selection';

const YEAR_CONFIG = [
  { year: '2026', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { year: '2025', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { year: '2024', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
  { year: '2023', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' }
];

// Mock data for the Main Dashboard chart
const MOCK_CHART_DATA = [
  { name: 'Jan', score: 85 },
  { name: 'Feb', score: 78 },
  { name: 'Mar', score: 92 },
  { name: 'Apr', score: 88 },
  { name: 'May', score: 95 },
  { name: 'Jun', score: 89 },
];

const Dashboard: React.FC<DashboardProps & { onLogout: () => void }> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewType>(() => {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN) return 'overview';
    return 'unit-landing';
  });

  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.SUB_ADMIN ? user : null);
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('adminrole_users_list');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('adminrole_deleted_categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchPIModalOpen, setIsBatchPIModalOpen] = useState(false);
  const [batchTarget, setBatchTarget] = useState<'CHQ' | 'STATION_1_10' | 'SPECIAL' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.STATION });

  const roleConfig = ROLE_LABELS[user.role];

  useEffect(() => {
    localStorage.setItem('adminrole_users_list', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('adminrole_deleted_categories', JSON.stringify(deletedCategories));
  }, [deletedCategories]);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsInsightLoading(true);
      try {
        const text = await getRoleInsight(user.role);
        setInsight(text);
      } catch (err) {
        console.error("Failed to fetch insight", err);
      } finally {
        setIsInsightLoading(false);
      }
    };
    fetchInsight();
  }, [user.role]);

  const setDashboardView = (newView: ViewType, year: string) => {
    setView(newView);
    setSelectedYear(year);
  };

  const managedUsers = user.role === UserRole.SUPER_ADMIN 
    ? usersList.filter(u => u.id !== user.id)
    : usersList.filter(u => u.role === UserRole.STATION);

  const handleOpenModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({ 
        name: userToEdit.name, 
        email: userToEdit.email, 
        password: userToEdit.password || '',
        role: userToEdit.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: UserRole.STATION });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updatedList = usersList.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
      setUsersList(updatedList);
      if (selectedOverviewUser?.id === editingUser.id) {
        setSelectedOverviewUser({ ...selectedOverviewUser, ...formData });
      }
    } else {
      const newUser: User = {
        id: `${formData.role === UserRole.CHQ ? 'chq' : 'st'}-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        avatar: `https://picsum.photos/seed/${formData.name}/100/100`
      };
      setUsersList(prev => [...prev, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (confirm('Are you sure you want to delete this account? This will remove this station/CHQ from the dashboard selection.')) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      if (selectedOverviewUser?.id === id) {
        setSelectedOverviewUser(null);
        setView('user-selection');
      }
    }
  };

  const handleResetUnitData = (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`WIPE ALL DATA: Are you sure you want to delete all accomplishment records for ${targetUser.name}? This cannot be undone.`)) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`accomplishment_`) || key.startsWith(`files_`)) && key.includes(`_${targetUser.id}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      alert(`All dashboard data for ${targetUser.name} has been cleared.`);
    }
  };

  const restoreSystemTabs = () => {
    if (confirm('Restore all hidden dashboard categories?')) {
      setDeletedCategories([]);
    }
  };

  const handleToggleBatchPI = (piId: string) => {
    if (!batchTarget) return;
    const storageKey = `hidden_pis_${batchTarget}`;
    const hidden = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newHidden = hidden.includes(piId) ? hidden.filter((id: string) => id !== piId) : [...hidden, piId];
    localStorage.setItem(storageKey, JSON.stringify(newHidden));
    window.dispatchEvent(new Event('storage'));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Main Command Header */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-slate-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black border-4 border-slate-100 shadow-xl">C</div>
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Cagayan de Oro City Police Office</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-2 opacity-70 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Strategic Command Hub • Operational Oversight
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-200 border border-slate-800">
                  SYSTEM READY
               </div>
            </div>
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent mb-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-lg transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">142</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase mt-4">Active & Synced</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-lg transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Compliance</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">100%</p>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-4 overflow-hidden">
                <div className="bg-blue-600 h-full w-full"></div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-lg transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Units</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">21</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">9 CHQ • 12 Field</p>
            </div>
            <div className="p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 flex flex-col justify-between text-white group hover:scale-[1.02] transition-all cursor-default">
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Security Level</p>
              <p className="text-3xl font-black tracking-tighter">ELITE</p>
              <p className="text-[9px] font-bold uppercase mt-4 opacity-70">Encrypted AES-256</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights Card */}
            <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center border border-blue-400/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-blue-400">Gemini Intelligence Hub</h4>
                </div>
                {isInsightLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded-lg w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded-lg w-4/6 animate-pulse"></div>
                  </div>
                ) : (
                  <p className="text-lg font-medium leading-relaxed opacity-90 italic">"{insight}"</p>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                 <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Real-time Tactical Engine</span>
                 <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500 opacity-50"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500 opacity-20"></div>
                 </div>
              </div>
            </div>

            {/* Performance Chart Card */}
            <div className="p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Operational Trend</h4>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12.5% vs Prev</span>
               </div>
               <div className="flex-1 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                      />
                      <Bar dataKey="score" radius={[6, 6, 6, 6]} barSize={32}>
                        {MOCK_CHART_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 4 ? '#2563eb' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Quick Command Shortcuts */}
          <div className="mt-12">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Command Center Shortcuts</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <button 
                 onClick={() => setView('user-selection')}
                 className="p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-slate-900 hover:shadow-xl transition-all group flex flex-col items-center gap-3 text-center"
               >
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Inspect Units</span>
               </button>
               <button 
                 onClick={() => setView('accounts')}
                 className="p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all group flex flex-col items-center gap-3 text-center"
               >
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Manage Access</span>
               </button>
               <button 
                 onClick={() => setView('deployment')}
                 className="p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all group flex flex-col items-center gap-3 text-center"
               >
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Asset Map</span>
               </button>
               <button 
                 onClick={onLogout}
                 className="p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-red-500 hover:shadow-xl transition-all group flex flex-col items-center gap-3 text-center"
               >
                 <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Lock Console</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountManagement = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Account Management</h2>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">New Unit Account</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {managedUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-lg" />
                    <span className="font-bold text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black text-white uppercase ${u.name === 'City Mobile Force Company' ? 'bg-indigo-600' : ROLE_LABELS[u.role].color}`}>
                    {u.name === 'City Mobile Force Company' ? 'Company User' : ROLE_LABELS[u.role].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-blue-600 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDeployment = () => (
    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Resource Deployment</h2>
      <p className="text-slate-500 max-w-sm mx-auto">This module manages the strategic allocation of units and logistics across the region.</p>
      <div className="pt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Units</p>
          <p className="text-2xl font-black text-slate-900">21</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
          <p className="text-2xl font-black text-slate-900">142</p>
        </div>
      </div>
    </div>
  );

  const renderUnitLanding = () => {
    if (!selectedOverviewUser) return null;
    const isChq = selectedOverviewUser.role === UserRole.CHQ;
    const isCompany = selectedOverviewUser.name === 'City Mobile Force Company';
    const dashboardType = isChq ? 'chq-operational-dashboard' : 'tactical-dashboard';
    
    const canGoBack = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {canGoBack && (
          <button onClick={() => setView('user-selection')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Units
          </button>
        )}

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
          <img src={selectedOverviewUser.avatar} className="w-20 h-20 rounded-2xl border-2 border-slate-100" />
          <div>
            <h2 className="text-4xl font-black text-slate-900">
              {selectedOverviewUser.name} {isChq ? 'Consolidated CHQ Dashboard' : (isCompany ? 'Company Dashboard' : 'Tactical Dashboard')}
            </h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mt-1">Select operational year to review unit performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {YEAR_CONFIG.map(cfg => (
            <button 
              key={cfg.year}
              onClick={() => { setDashboardView(dashboardType, cfg.year); }}
              className={`p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition group text-left relative overflow-hidden ${isChq ? 'hover:border-emerald-500' : (isCompany ? 'hover:border-indigo-500' : 'hover:border-orange-500')}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition ${isChq ? 'bg-emerald-500' : (isCompany ? 'bg-indigo-500' : 'bg-orange-500')}`}></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition group-hover:text-white ${isChq ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600' : (isCompany ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600')}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{isChq ? `${selectedOverviewUser.name} Consolidated Dashboard` : `${selectedOverviewUser.name} ${isCompany ? 'Company' : 'Dashboard'}`} {cfg.year}</h3>
              <p className="text-slate-500 text-sm mt-1">Unit specific data for fiscal year {cfg.year}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit sticky top-24">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Control Panel</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {selectedOverviewUser ? `Unit: ${selectedOverviewUser.name}` : `Role: ${roleConfig.label}`}
        </p>
      </div>
      
      <div className="space-y-8">
        {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN) && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Navigation</p>
            <div className="space-y-1.5">
              <button 
                onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Main Dashboard
                <svg className={`w-4 h-4 ${view === 'overview' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </button>
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3 px-1">Management</p>
            <div className="space-y-1.5">
              {user.role === UserRole.SUPER_ADMIN && (
                <button 
                  onClick={() => { setView('accounts'); setSelectedOverviewUser(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'accounts' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  Accounts
                  <svg className={`w-4 h-4 ${view === 'accounts' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </button>
              )}
              <button 
                onClick={() => { setView('deployment'); setSelectedOverviewUser(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'deployment' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                Deployment
                <svg className={`w-4 h-4 ${view === 'deployment' ? 'text-white' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </button>
            </div>
          </div>
        )}

        {user.role === UserRole.CHQ && (
           <button 
             onClick={() => { setSelectedOverviewUser(user); setView('unit-landing'); }} 
             className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'unit-landing' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
           >
             My Dashboard
             <svg className={`w-4 h-4 ${view === 'unit-landing' ? 'text-white' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           </button>
        )}

        {user.role === UserRole.STATION && (
          <button 
            onClick={() => { setSelectedOverviewUser(user); setView('unit-landing'); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'unit-landing' ? (user.name === 'City Mobile Force Company' ? 'bg-indigo-600' : 'bg-orange-600') + ' text-white shadow-lg' : (user.name === 'City Mobile Force Company' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700') + ' hover:bg-opacity-80'}`}
          >
            {user.name === 'City Mobile Force Company' ? 'My Company Dashboard' : 'My Station Dashboard'}
            <svg className={`w-4 h-4 ${view === 'unit-landing' ? 'text-white' : (user.name === 'City Mobile Force Company' ? 'text-indigo-400' : 'text-orange-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        )}
      </div>
    </div>
  );

  const renderUserSelection = () => {
    let chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    let stationUsers = usersList.filter(u => u.role === UserRole.STATION);
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Units Oversight</h2>
          {isSuperAdmin && (
            <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-lg">New Unit Account</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {(chqUsers.length > 0) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xl font-black">Administrative Units</h3>
                {isSuperAdmin && (
                  <button 
                    onClick={() => { setBatchTarget('CHQ'); setIsBatchPIModalOpen(true); }}
                    className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition"
                  >
                    CHQ PI MGMT
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {chqUsers.map(u => (
                  <div key={u.id} className="relative group">
                    <div 
                      onClick={() => { setSelectedOverviewUser(u); setView('unit-landing'); }} 
                      className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-indigo-500 transition-all text-left cursor-pointer shadow-sm group-hover:shadow-md"
                    >
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border" />
                      <div><p className="font-black text-slate-800">{u.name}</p><p className="text-[10px] font-black uppercase text-slate-400">CHQ UNIT</p></div>
                    </div>
                    {isSuperAdmin && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                          onClick={(e) => handleResetUnitData(u, e)}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition shadow-sm border border-amber-200"
                          title="Reset All Unit Data"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /><path d="M10 11v6m4-6v6" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(u); }} 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition shadow-sm border border-blue-200" 
                          title="Edit Unit/Role"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteUser(u.id, e)} 
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm border border-red-200" 
                          title="Delete Unit Account"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(stationUsers.length > 0) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xl font-black">Station Accounts</h3>
                {isSuperAdmin && (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => { setBatchTarget('STATION_1_10'); setIsBatchPIModalOpen(true); }}
                      className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition"
                    >
                      STATION PI MGMT
                    </button>
                    <button 
                      onClick={() => { setBatchTarget('SPECIAL'); setIsBatchPIModalOpen(true); }}
                      className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
                    >
                      COMPANY PI MGMT
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {stationUsers.map(u => (
                  <div key={u.id} className="relative group">
                    <div 
                      onClick={() => { setSelectedOverviewUser(u); setView('unit-landing'); }} 
                      className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-orange-500 transition-all text-left cursor-pointer shadow-sm group-hover:shadow-md"
                    >
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border" />
                      <div>
                        <p className="font-black text-slate-800">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          {u.name === 'City Mobile Force Company' ? 'COMPANY UNIT' : 'STATION UNIT'}
                        </p>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                          onClick={(e) => handleResetUnitData(u, e)}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition shadow-sm border border-amber-200"
                          title="Reset All Unit Data"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /><path d="M10 11v6m4-6v6" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(u); }} 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition shadow-sm border border-blue-200" 
                          title="Edit Unit/Role"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteUser(u.id, e)} 
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm border border-red-200" 
                          title="Delete Unit Account"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">A</div>
          <h1 className="font-black text-slate-900 tracking-tighter text-lg">AdminRole Hub</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user.name === 'City Mobile Force Company' ? 'Company User' : roleConfig.label}</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">Sign Out</button>
        </div>
      </nav>
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {view === 'overview' && renderOverview()}
          {view === 'accounts' && renderAccountManagement()}
          {view === 'deployment' && renderDeployment()}
          {view === 'user-selection' && renderUserSelection()}
          {view === 'unit-landing' && renderUnitLanding()}
          {view === 'operational-dashboard' && <OperationalDashboard title={`CONSOLIDATED ACCOMPLISHMENTS ${selectedYear}`} onBack={() => setView('user-selection')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'chq-operational-dashboard' && <OperationalDashboard title={`CHQ CONSOLIDATED DASHBOARD ${selectedYear}`} onBack={() => setView('user-selection')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'tactical-dashboard' && <OperationalDashboard title={`TACTICAL CONSOLIDATED DASHBOARD ${selectedYear}`} onBack={() => setView('user-selection')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
        </div>
        <div className="lg:col-span-1">{renderSidebar()}</div>
      </div>
      
      {/* Account Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6">{editingUser ? 'Edit Unit Account' : 'New Unit Account'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unit Name</label>
                <input type="text" required placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input type="email" required placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
                <input type="password" required placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Account Tabbing (Category)</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value={UserRole.STATION}>Station Account</option>
                  <option value={UserRole.CHQ}>CHQ (Administrative) Account</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PI Tabbing Management Modal */}
      {isBatchPIModalOpen && batchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">PI Tabbing Management</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Affecting: <span className="font-bold text-indigo-600">
                    {batchTarget === 'CHQ' ? 'Administrative (CHQ) Units' : 
                     batchTarget === 'STATION_1_10' ? 'Station Units (1-10)' : 
                     'Company Unit (CMFC)'}
                  </span>
                </p>
              </div>
              <button onClick={() => setIsBatchPIModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bg-indigo-50 p-5 rounded-3xl mb-8 border border-indigo-100 flex gap-4 items-start shadow-inner">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[11px] text-indigo-800 font-bold leading-relaxed">
                Changes applied here will ONLY affect the selected unit group. 
                <br/>
                {batchTarget === 'CHQ' ? 'Stations and Company Unit remain unaffected.' : 
                 batchTarget === 'STATION_1_10' ? 'CHQ and Company Unit remain unaffected.' : 
                 'CHQ and Stations 1-10 remain unaffected.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: 29 }).map((_, i) => {
                const piId = `PI${i + 1}`;
                const hidden = JSON.parse(localStorage.getItem(`hidden_pis_${batchTarget}`) || '[]');
                const isHidden = hidden.includes(piId);
                
                return (
                  <button 
                    key={piId}
                    onClick={() => handleToggleBatchPI(piId)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${isHidden ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-indigo-500 text-indigo-600 shadow-md active:scale-95'}`}
                  >
                    <span>PI {i + 1}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isHidden ? 'border-slate-300' : 'bg-indigo-600 border-indigo-600 text-white'}`}>
                       {!isHidden && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => {
                  if (confirm(`Show ALL PIs for this group?`)) {
                    localStorage.setItem(`hidden_pis_${batchTarget}`, JSON.stringify([]));
                    window.dispatchEvent(new Event('storage'));
                  }
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition"
              >
                RESTORE ALL
              </button>
              <button 
                onClick={() => setIsBatchPIModalOpen(false)} 
                className="flex-[2] px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition"
              >
                SAVE CONFIGURATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;