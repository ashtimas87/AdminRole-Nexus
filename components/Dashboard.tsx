
import React, { useEffect, useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import OperationalDashboard from './OperationalDashboard';

type ViewType = 
  | 'accounts' 
  | 'deployment'
  | 'status-terminal'
  | 'unit-oversight'
  | 'operational-dashboard'
  | 'target-outlook'
  | 'target-outlook-landing'
  | 'unit-landing'
  | 'progress';

const YEAR_CONFIG = [
  { year: '2026', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { year: '2025', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { year: '2024', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
  { year: '2023', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' }
];

const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewType>(() => {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN) return 'accounts';
    return 'status-terminal';
  });

  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.SUB_ADMIN ? user : null);
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('adminrole_users_list');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.STATION });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const roleConfig = ROLE_LABELS[user.role];
  const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN;
  const canSeeOversight = isAdmin || user.role === UserRole.CHQ || user.role === UserRole.STATION;

  useEffect(() => {
    localStorage.setItem('adminrole_users_list', JSON.stringify(usersList));
  }, [usersList]);

  const calculateUserTotal = (userId: string, year: string, prefix: 'target' | 'accomplishment') => {
    let total = 0;
    const matchPrefix = `${prefix}_data_${year}_${userId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(matchPrefix)) {
        const val = parseInt(localStorage.getItem(key) || '0', 10);
        total += val;
      }
    }
    return total;
  };

  const calculateConsolidatedTotal = (units: User[], year: string, prefix: 'target' | 'accomplishment') => {
    return units.reduce((sum, u) => sum + calculateUserTotal(u.id, year, prefix), 0);
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
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this account?')) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      if (selectedOverviewUser?.id === id) {
        setSelectedOverviewUser(null);
      }
    }
  };

  const renderAccountManagement = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Accounts</h2>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">New Account</button>
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
    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Resource Deployment</h2>
      <p className="text-slate-500 max-w-sm mx-auto">Asset management and strategic resource allocation terminal.</p>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Progress</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Overall Synchronization</h3>
            <p className="text-4xl font-black text-slate-900">92.4%</p>
          </div>
          <div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92.4%' }}></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Unit Submissions</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">STATION UNITS</span>
                <span className="text-xs font-black text-slate-900">11/11</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">CHQ UNITS</span>
                <span className="text-xs font-black text-slate-900">8/9</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">SPECIAL UNITS</span>
                <span className="text-xs font-black text-slate-900">1/1</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatusTerminal = () => (
    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl shadow-slate-200/50">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
        <div className="relative w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl">
          {user.name.charAt(0)}
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Access Active</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">Unit: {user.name} • Security Level: High</p>
      </div>
      <p className="text-slate-600 max-w-sm mx-auto font-medium leading-relaxed">
        Welcome to the Cagayan de Oro City Police Office access terminal. Your account is verified and the system is monitoring activity logs.
      </p>
    </div>
  );

  const getFilteredUnits = () => {
    let subAdminUsers = usersList.filter(u => u.role === UserRole.SUB_ADMIN);
    let chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    let specialUsers = usersList.filter(u => u.name === 'City Mobile Force Company');
    let stationUsers = usersList.filter(u => u.role === UserRole.STATION && u.name !== 'City Mobile Force Company');
    
    if (user.role === UserRole.STATION) {
      specialUsers = specialUsers.filter(u => u.id === user.id);
      stationUsers = stationUsers.filter(u => u.id === user.id);
      chqUsers = [];
      subAdminUsers = [];
    }

    if (user.role === UserRole.CHQ && selectedYear !== '2023') {
      chqUsers = chqUsers.filter(u => u.id === user.id);
      subAdminUsers = [];
    }

    return { subAdminUsers, chqUsers, specialUsers, stationUsers };
  };

  const renderUnitOversight = () => {
    if (!canSeeOversight) return null;
    const { subAdminUsers, chqUsers, specialUsers, stationUsers } = getFilteredUnits();
    
    // For CHQ Users, consolidation should NOT reflect data from stations.
    const relevantForConsolidation = user.role === UserRole.CHQ 
      ? chqUsers 
      : [...chqUsers, ...stationUsers, ...specialUsers];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Units Oversight</h2>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
          {YEAR_CONFIG.map(cfg => (
            <button
              key={cfg.year}
              onClick={() => { setSelectedYear(cfg.year); setRefreshTrigger(t => t + 1); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === cfg.year ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cfg.year}
            </button>
          ))}
        </div>

        {(isAdmin || (user.role === UserRole.CHQ && selectedYear === '2023')) && (
          <div className="space-y-4">
            <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              {user.role === UserRole.CHQ ? 'CHQ Units Consolidation' : 'Consolidation of CHQ & Tactical'}
            </h3>
            <div 
              onClick={() => { setSelectedOverviewUser(user); setView('operational-dashboard'); }} 
              className="w-full flex items-center gap-5 p-6 bg-slate-900 rounded-3xl border-2 border-slate-800 hover:border-emerald-500 transition-all text-left cursor-pointer shadow-xl group"
            >
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-xl font-black text-white">{user.role === UserRole.CHQ ? `CHQ Accomplishment ${selectedYear}` : `CHQ & Tactical Consolidated ${selectedYear}`}</p>
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">ACTIVITY DATA ACCOMPLISHMENT</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Accomplishment</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-black text-lg">
                  {calculateConsolidatedTotal(relevantForConsolidation, selectedYear, 'accomplishment').toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {chqUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Administrative Units (CHQ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chqUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'accomplishment');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('operational-dashboard'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-indigo-500 transition-all text-left cursor-pointer shadow-sm hover:shadow-md group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">CHQ ACCOMPLISHMENT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stationUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Station Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stationUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'accomplishment');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('operational-dashboard'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-orange-500 transition-all text-left cursor-pointer shadow-sm hover:shadow-md group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">TACTICAL ACCOMPLISHMENT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-orange-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {specialUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Force Units (Company)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specialUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'accomplishment');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('operational-dashboard'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-indigo-500 transition-all text-left cursor-pointer shadow-sm hover:shadow-md group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">COMPANY ACCOMPLISHMENT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTargetOutlookLanding = () => {
    const { subAdminUsers, chqUsers, specialUsers, stationUsers } = getFilteredUnits();
    
    // For CHQ Users, consolidation should NOT reflect data from stations.
    const relevantForConsolidation = user.role === UserRole.CHQ 
      ? chqUsers 
      : [...chqUsers, ...stationUsers, ...specialUsers];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center border-2 border-amber-200">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Target Outlook System</h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mt-1">Strategic projections oversight terminal</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
          {YEAR_CONFIG.map(cfg => (
            <button
              key={cfg.year}
              onClick={() => { setSelectedYear(cfg.year); setRefreshTrigger(t => t + 1); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === cfg.year ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cfg.year}
            </button>
          ))}
        </div>

        {(isAdmin || (user.role === UserRole.CHQ && selectedYear === '2023')) && (
          <div className="space-y-4">
            {user.role === UserRole.SUPER_ADMIN && (
              <div 
                onClick={() => { setSelectedOverviewUser(user); setView('target-outlook'); }} 
                className="w-full flex items-center gap-5 p-6 bg-slate-900 rounded-3xl border-2 border-slate-800 hover:border-amber-400 transition-all text-left cursor-pointer shadow-xl group"
              >
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-black text-white">Operational Dashboard Target Outlook</p>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">MASTER SYSTEM OVERVIEW</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Target</p>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg font-black text-lg">
                    {calculateConsolidatedTotal(usersList, selectedYear, 'target').toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">{user.role === UserRole.CHQ ? 'CHQ Units Target Consolidation' : 'Consolidation of CHQ & Tactical'}</h3>
            <div 
              onClick={() => { setSelectedOverviewUser(user); setView('target-outlook'); }} 
              className="w-full flex items-center gap-5 p-6 bg-amber-900 rounded-3xl border-2 border-amber-800 hover:border-amber-400 transition-all text-left cursor-pointer shadow-xl group"
            >
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/30 group-hover:scale-105 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-xl font-black text-white">{user.role === UserRole.CHQ ? `CHQ Target Outlook ${selectedYear}` : `Operational Target Outlook ${selectedYear}`}</p>
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">OFFICE MASTER PROJECTIONS</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Total Target</p>
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-lg font-black text-lg">
                  {calculateConsolidatedTotal(relevantForConsolidation, selectedYear, 'target').toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {chqUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Administrative Units (CHQ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chqUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'target');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('target-outlook'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-amber-500 transition-all text-left cursor-pointer shadow-sm group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-amber-600">CHQ TARGET OUTLOOK</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Target</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stationUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Station Units</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stationUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'target');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('target-outlook'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-amber-600 transition-all text-left cursor-pointer shadow-sm group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-amber-600">STATION TARGET OUTLOOK</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Target</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {specialUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black border-b pb-2 text-slate-800 uppercase tracking-tight">Force Units (Company)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specialUsers.map(u => {
                  const unitTotal = calculateUserTotal(u.id, selectedYear, 'target');
                  return (
                    <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('target-outlook'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-amber-500 transition-all text-left cursor-pointer shadow-sm group">
                      <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] font-black uppercase text-amber-600">COMPANY TARGET OUTLOOK</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Target</p>
                        <p className={`text-sm font-black ${unitTotal > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{unitTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit lg:sticky lg:top-24">
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">System Terminal</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.name}</p>
      </div>
      
      <div className="space-y-4">
        {isAdmin && (
          <button 
            onClick={() => setView('accounts')}
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Account Management
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </button>
        )}

        {!isAdmin && (
          <button 
            onClick={() => setView('status-terminal')}
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'status-terminal' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            System Status
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => { setSelectedOverviewUser(user); setView('operational-dashboard'); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'operational-dashboard' && selectedOverviewUser?.id === user.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Operational Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
        )}

        {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.CHQ || user.role === UserRole.STATION) && (
          <button 
            onClick={() => { setView('target-outlook-landing'); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'target-outlook' || view === 'target-outlook-landing' ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Target Outlook
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
        )}

        {canSeeOversight && (
          <button 
            onClick={() => setView('unit-oversight')}
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'unit-oversight' || (view === 'operational-dashboard' && selectedOverviewUser && selectedOverviewUser.id !== user.id) ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Unit Oversight
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </button>
        )}

        <button 
          onClick={() => setView('deployment')}
          className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'deployment' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Deployment
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </button>
      </div>
    </div>
  );

  const getDashboardTitle = (targetUser: User, year: string, isOutlook: boolean) => {
    const isSelf = targetUser.id === user.id;
    const isSubAdminUnit = targetUser.role === UserRole.SUB_ADMIN;

    if (isOutlook) {
      if (isSelf) {
        if (user.role === UserRole.STATION) return `Tactical ${year} Target Outlook`;
        if (user.role === UserRole.CHQ) return `CHQ ${year} Target Outlook`;
      }
      if (isSubAdminUnit || (isSelf && user.role === UserRole.SUPER_ADMIN)) {
         return `Operational Target Outlook ${year}`;
      }
      return `${targetUser.name} ${year} Target Outlook`;
    } else {
      // Accomplishment
      if (isSelf) {
        if (user.role === UserRole.STATION) return `Tactical ${year} Accomplishment`;
        if (user.role === UserRole.CHQ) return `CHQ ${year} Accomplishment`;
      }
      if (isSubAdminUnit || (isSelf && user.role === UserRole.SUPER_ADMIN)) {
        return user.role === UserRole.CHQ ? `CHQ Units Accomplishment ${year}` : `CHQ & Tactical Consolidation ${year} Accomplishment`;
      }
      const typeLabel = targetUser.role === UserRole.STATION ? 'Tactical Accomplishment' : 'CHQ Accomplishment';
      return `${targetUser.name} ${year} ${typeLabel}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">C</div>
          <h1 className="font-black text-slate-900 tracking-tighter text-lg">COCPO Hub</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{roleConfig.label}</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">Sign Out</button>
        </div>
      </nav>
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 order-first">{renderSidebar()}</div>
        <div className="lg:col-span-2 space-y-6">
          {view === 'accounts' && renderAccountManagement()}
          {view === 'deployment' && renderDeployment()}
          {view === 'progress' && isAdmin && renderProgress()}
          {view === 'status-terminal' && renderStatusTerminal()}
          {view === 'unit-oversight' && canSeeOversight && renderUnitOversight()}
          {view === 'target-outlook-landing' && renderTargetOutlookLanding()}
          {view === 'operational-dashboard' && selectedOverviewUser && (
            <OperationalDashboard 
              title={getDashboardTitle(selectedOverviewUser, selectedYear, false)} 
              onBack={() => { setView(canSeeOversight ? 'unit-oversight' : 'status-terminal'); setRefreshTrigger(t => t + 1); }} 
              currentUser={user} 
              subjectUser={selectedOverviewUser}
              allUnits={usersList.filter(u => {
                if (user.role === UserRole.CHQ) return u.role === UserRole.CHQ;
                return u.role === UserRole.STATION || u.role === UserRole.CHQ;
              })} 
            />
          )}
          {view === 'target-outlook' && selectedOverviewUser && (
            <OperationalDashboard 
              title={getDashboardTitle(selectedOverviewUser, selectedYear, true)} 
              onBack={() => { setView('target-outlook-landing'); setRefreshTrigger(t => t + 1); }} 
              currentUser={user} 
              subjectUser={selectedOverviewUser} 
              allUnits={usersList.filter(u => {
                if (user.role === UserRole.CHQ) return u.role === UserRole.CHQ;
                return u.role === UserRole.STATION || u.role === UserRole.CHQ;
              })} 
            />
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">{editingUser ? 'Edit Account' : 'New Account'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit Name</label>
                <input type="text" required placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" required placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                <input type="password" required placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Role Type</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-slate-900 bg-white transition-colors"
                >
                  <option value={UserRole.STATION}>Station Account</option>
                  <option value={UserRole.CHQ}>CHQ Account</option>
                  {user.role === UserRole.SUPER_ADMIN && <option value={UserRole.SUB_ADMIN}>Sub Admin</option>}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
