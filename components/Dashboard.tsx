
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import OperationalDashboard from './OperationalDashboard';
import { getRoleInsight } from '../services/geminiService';

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
  | 'chq-landing'
  | 'tactical-landing'
  | 'user-selection';

const YEAR_CONFIG = [
  { year: '2026', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { year: '2025', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { year: '2024', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
  { year: '2023', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' }
];

const Dashboard: React.FC<DashboardProps & { onLogout: () => void }> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewType>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(null);
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
  const [batchTarget, setBatchTarget] = useState<'CHQ' | 'STATION_1_10' | null>(null);
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
        setView('overview');
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

  const handleDeleteCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove the ${category} category? This will hide it for all users.`)) {
      setDeletedCategories(prev => [...prev, category]);
      if ((category === 'CHQ' && (view === 'chq-landing' || view === 'chq-operational-dashboard')) ||
          (category === 'TACTICAL' && (view === 'tactical-landing' || view === 'tactical-dashboard'))) {
        setView('overview');
      }
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
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-slate-900/5 rounded-full blur-3xl"></div>
        <h2 className="text-4xl font-black text-slate-900 mb-2">Welcome back, {user.name}</h2>
        <p className="text-slate-500 font-medium">Monitoring Unit Accomplishment & Performance Metrics</p>
        
        <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Gemini AI Strategic Insight</h4>
          </div>
          {isInsightLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <p className="text-slate-400 italic text-sm">Consulting tactical engine...</p>
            </div>
          ) : (
            <p className="text-lg font-medium leading-relaxed opacity-90">{insight}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {YEAR_CONFIG.map(cfg => (
          <button 
            key={cfg.year}
            onClick={() => { setSelectedOverviewUser(user); setDashboardView('operational-dashboard', cfg.year); }}
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-md transition group text-left"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{cfg.year} Performance</h3>
            <p className="text-slate-500 text-sm mt-1">Review full year data logs</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAccountManagement = () => (
    <div className="space-y-6">
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
                  <span className={`px-2 py-1 rounded text-[9px] font-black text-white uppercase ${ROLE_LABELS[u.role].color}`}>
                    {ROLE_LABELS[u.role].label}
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
    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
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

  const renderChqLanding = () => {
    const chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">CHQ Units Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chqUsers.map(u => (
            <div 
              key={u.id}
              onClick={() => { setSelectedOverviewUser(u); setDashboardView('chq-operational-dashboard', selectedYear); }}
              className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 cursor-pointer transition shadow-sm group"
            >
              <div className="flex items-center gap-4">
                <img src={u.avatar} className="w-12 h-12 rounded-xl border" />
                <div>
                  <h4 className="font-black text-slate-800">{u.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Unit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTacticalLanding = () => {
    const stationUsers = usersList.filter(u => u.role === UserRole.STATION);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tactical Units (Stations)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stationUsers.map(u => (
            <div 
              key={u.id}
              onClick={() => { setSelectedOverviewUser(u); setDashboardView('tactical-dashboard', selectedYear); }}
              className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-500 cursor-pointer transition shadow-sm group"
            >
              <div className="flex items-center gap-4">
                <img src={u.avatar} className="w-12 h-12 rounded-xl border" />
                <div>
                  <h4 className="font-black text-slate-800">{u.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {u.name === 'City Mobile Force Company' ? 'Special Unit' : 'Police Station'}
                  </p>
                </div>
              </div>
            </div>
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
        {user.role === UserRole.SUPER_ADMIN && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Management</p>
            <div className="space-y-1.5">
              <button 
                onClick={() => { setView('accounts'); setSelectedOverviewUser(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Accounts
                <svg className={`w-4 h-4 ${view === 'accounts' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </button>
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

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Monitoring</p>
          <div className="space-y-1.5">
            <button 
              onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Overview
              <svg className={`w-4 h-4 ${view === 'overview' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
          </div>
        </div>

        {(user.role !== UserRole.STATION) && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Regional Units</p>
            {!deletedCategories.includes('CHQ') && (
              <button 
                onClick={() => setView('chq-landing')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group relative ${view === 'chq-landing' || view === 'chq-operational-dashboard' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                CHQ Dashboards
                <div className="flex items-center gap-2">
                  {user.role === UserRole.SUPER_ADMIN && (
                    <span onClick={(e) => handleDeleteCategory('CHQ', e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                  )}
                  <svg className={`w-4 h-4 ${view === 'chq-landing' || view === 'chq-operational-dashboard' ? 'text-white' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1" /></svg>
                </div>
              </button>
            )}
            {!deletedCategories.includes('TACTICAL') && (
              <button 
                onClick={() => setView('tactical-landing')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group relative ${view === 'tactical-landing' || view === 'tactical-dashboard' ? 'bg-orange-600 text-white shadow-lg' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
              >
                Tactical Dashboards
                <div className="flex items-center gap-2">
                  {user.role === UserRole.SUPER_ADMIN && (
                    <span onClick={(e) => handleDeleteCategory('TACTICAL', e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                  )}
                  <svg className={`w-4 h-4 ${view === 'tactical-landing' || view === 'tactical-dashboard' ? 'text-white' : 'text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </button>
            )}
          </div>
        )}

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">System</p>
          <div className="space-y-1.5">
            <button 
              onClick={() => { setView('user-selection'); setSelectedOverviewUser(null); }} 
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'user-selection' ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Unit Select
              <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Inspect</span>
            </button>
            {user.role === UserRole.SUPER_ADMIN && deletedCategories.length > 0 && (
              <button 
                onClick={restoreSystemTabs}
                className="w-full text-left px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider text-blue-600 hover:bg-blue-50 transition"
              >
                Restore System Tabs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSelection = () => {
    const chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    const stationUsers = usersList.filter(u => u.role === UserRole.STATION);
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('overview')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          {isSuperAdmin && (
            <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-lg">New Unit Account</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {!deletedCategories.includes('CHQ') && (
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
                      onClick={() => { setSelectedOverviewUser(u); setDashboardView('chq-operational-dashboard', selectedYear); }} 
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
          {!deletedCategories.includes('TACTICAL') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xl font-black">Station Accounts</h3>
                {isSuperAdmin && (
                  <button 
                    onClick={() => { setBatchTarget('STATION_1_10'); setIsBatchPIModalOpen(true); }}
                    className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition"
                  >
                    STATION PI MGMT
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {stationUsers.map(u => (
                  <div key={u.id} className="relative group">
                    <div 
                      onClick={() => { setSelectedOverviewUser(u); setDashboardView('tactical-dashboard', selectedYear); }} 
                      className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-orange-500 transition-all text-left cursor-pointer shadow-sm group-hover:shadow-md"
                    >
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border" />
                      <div>
                        <p className="font-black text-slate-800">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          {u.name === 'City Mobile Force Company' ? 'SPECIAL UNIT' : 'STATION UNIT'}
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
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">A</div>
          <h1 className="font-bold text-slate-900">AdminRole</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
            <p className="text-xs text-slate-500 mt-1">{roleConfig.label}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 transition font-bold">Sign Out</button>
        </div>
      </nav>
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {view === 'overview' && renderOverview()}
          {view === 'accounts' && renderAccountManagement()}
          {view === 'deployment' && renderDeployment()}
          {view === 'user-selection' && renderUserSelection()}
          {view === 'chq-landing' && renderChqLanding()}
          {view === 'tactical-landing' && renderTacticalLanding()}
          {view === 'operational-dashboard' && <OperationalDashboard title={`OPERATIONAL DASHBOARD ${selectedYear}`} onBack={() => setView('overview')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'chq-operational-dashboard' && <OperationalDashboard title={`CHQ DASHBOARD ${selectedYear}`} onBack={() => setView('chq-landing')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'tactical-dashboard' && <OperationalDashboard title={`TACTICAL DASHBOARD ${selectedYear}`} onBack={() => setView('tactical-landing')} currentUser={user} subjectUser={selectedOverviewUser || user} />}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PI Tabbing Management Modal */}
      {isBatchPIModalOpen && batchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">PI Tabbing Management</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Affecting: <span className="font-bold text-indigo-600">{batchTarget === 'CHQ' ? 'Administrative (CHQ) Units' : 'Station Units (1-10)'}</span>
                </p>
              </div>
              <button onClick={() => setIsBatchPIModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl mb-8 border border-indigo-100 flex gap-3 items-start shadow-inner">
              <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                Changes applied here will ONLY affect {batchTarget === 'CHQ' ? 'CHQ Units' : 'Stations 1-10'}. 
                <br/>
                Station 11 (Special Unit) remains unaffected.
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
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${isHidden ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-indigo-500 text-indigo-600 shadow-sm'}`}
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
                  if (confirm(`Show ALL PIs for ${batchTarget === 'CHQ' ? 'CHQ' : 'Stations 1-10'}?`)) {
                    localStorage.setItem(`hidden_pis_${batchTarget}`, JSON.stringify([]));
                    window.dispatchEvent(new Event('storage'));
                  }
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition"
              >
                RESTORE ALL TABS
              </button>
              <button 
                onClick={() => setIsBatchPIModalOpen(false)} 
                className="flex-[2] px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg shadow-slate-100 hover:bg-slate-800 transition"
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
