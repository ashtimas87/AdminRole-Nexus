
import React, { useEffect, useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import OperationalDashboard from './OperationalDashboard';
import { dbService } from '../services/dbService';

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
    if (user.role === UserRole.SUPER_ADMIN) return 'accounts';
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
  const [setupStatus, setSetupStatus] = useState<{ message: string; type: 'idle' | 'loading' | 'success' | 'error' }>({ message: '', type: 'idle' });

  const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN;
  const canSeeOversight = isAdmin || user.role === UserRole.CHQ || user.role === UserRole.STATION;

  useEffect(() => {
    localStorage.setItem('adminrole_users_list', JSON.stringify(usersList));
  }, [usersList]);

  const handleRunSetup = async () => {
    setSetupStatus({ message: 'Initializing MySQL Terminal...', type: 'loading' });
    const result = await dbService.setupDatabase();
    if (result.status === 'success') {
      setSetupStatus({ message: result.message || 'Database Terminal Ready.', type: 'success' });
    } else {
      setSetupStatus({ message: result.message || 'Setup Failed.', type: 'error' });
    }
    setTimeout(() => setSetupStatus({ message: '', type: 'idle' }), 5000);
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

  const renderAccountManagement = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Accounts</h2>
        <div className="flex gap-3">
          {user.role === UserRole.SUPER_ADMIN && (
             <button 
               onClick={handleRunSetup}
               disabled={setupStatus.type === 'loading'}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${setupStatus.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
             >
               {setupStatus.type === 'loading' ? 'Setting up...' : setupStatus.type === 'success' ? 'Terminal Active' : 'Setup DB Terminal'}
             </button>
          )}
          <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">New Account</button>
        </div>
      </div>

      {setupStatus.message && (
        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-2 ${setupStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
          {setupStatus.message}
        </div>
      )}

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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    if (user.role === UserRole.CHQ) {
      stationUsers = []; specialUsers = []; subAdminUsers = [];
      chqUsers = chqUsers.filter(u => u.id === user.id);
    }
    return { subAdminUsers, chqUsers, specialUsers, stationUsers };
  };

  const renderUnitOversight = () => {
    const { chqUsers, specialUsers, stationUsers } = getFilteredUnits();
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
          {YEAR_CONFIG.map(cfg => (
            <button
              key={cfg.year}
              onClick={() => setSelectedYear(cfg.year)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === cfg.year ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cfg.year}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...chqUsers, ...stationUsers, ...specialUsers].map(u => (
            <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('operational-dashboard'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-slate-900 transition-all text-left cursor-pointer shadow-sm hover:shadow-md group">
              <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate">{u.name}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operational Oversight</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTargetOutlookLanding = () => {
    const { chqUsers, specialUsers, stationUsers } = getFilteredUnits();
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
              onClick={() => setSelectedYear(cfg.year)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === cfg.year ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cfg.year}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...chqUsers, ...stationUsers, ...specialUsers].map(u => (
            <div key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('target-outlook'); }} className="w-full flex items-center gap-5 p-4 bg-white rounded-2xl border hover:border-amber-600 transition-all text-left cursor-pointer shadow-sm group">
              <img src={u.avatar} className="w-12 h-12 rounded-xl border group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate">{u.name}</p>
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Target Projections</p>
              </div>
            </div>
          ))}
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
        {user.role === UserRole.SUPER_ADMIN && (
          <button onClick={() => setView('accounts')} className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>Account Management</button>
        )}
        <button onClick={() => setView('status-terminal')} className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'status-terminal' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>System Status</button>
        {canSeeOversight && (
          <>
            <button onClick={() => setView('target-outlook-landing')} className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'target-outlook' || view === 'target-outlook-landing' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-500'}`}>Target Outlook</button>
            <button onClick={() => setView('unit-oversight')} className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'unit-oversight' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500'}`}>Unit Oversight</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">C</div>
          <h1 className="font-black text-slate-900 tracking-tighter text-lg">COCPO Hub</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onLogout} className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">Sign Out</button>
        </div>
      </nav>
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 order-first">{renderSidebar()}</div>
        <div className="lg:col-span-2 space-y-6">
          {view === 'accounts' && renderAccountManagement()}
          {view === 'status-terminal' && renderStatusTerminal()}
          {view === 'unit-oversight' && renderUnitOversight()}
          {view === 'target-outlook-landing' && renderTargetOutlookLanding()}
          {view === 'operational-dashboard' && selectedOverviewUser && (
            <OperationalDashboard title={`${selectedOverviewUser.name} ${selectedYear} Accomplishment`} onBack={() => setView('unit-oversight')} currentUser={user} subjectUser={selectedOverviewUser} />
          )}
          {view === 'target-outlook' && selectedOverviewUser && (
            <OperationalDashboard title={`Operational Target Outlook ${selectedYear}`} onBack={() => setView('target-outlook-landing')} currentUser={user} subjectUser={selectedOverviewUser} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
