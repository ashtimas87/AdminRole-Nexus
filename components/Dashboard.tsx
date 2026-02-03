
import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import { getRoleInsight } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import OperationalDashboard from './OperationalDashboard';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewType = 
  | 'overview' 
  | 'accounts' 
  | 'operational-dashboard' 
  | 'chq-operational-dashboard' 
  | 'tactical-dashboard'
  | 'user-selection';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [insight, setInsight] = useState<string>('Loading AI insights...');
  const [view, setView] = useState<ViewType>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Accordion States
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '2026': true,
    '2025': false,
    '2024': false,
    '2023': false
  });
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const roleConfig = ROLE_LABELS[user.role];

  useEffect(() => {
    const fetchInsight = async () => {
      const text = await getRoleInsight(user.role);
      setInsight(text);
    };
    fetchInsight();
  }, [user.role]);

  const toggleGroup = (year: string) => {
    setOpenGroups(prev => ({ ...prev, [year]: !prev[year] }));
  };

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
        password: userToEdit.password || '' 
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      const newUser: User = {
        id: `st-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: UserRole.STATION,
        avatar: `https://picsum.photos/seed/${formData.name}/100/100`
      };
      setUsersList(prev => [...prev, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      setUsersList(prev => prev.filter(u => u.id !== id));
    }
  };

  const renderSidebar = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit sticky top-24">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Control Panel</h3>
      <p className="text-xs text-slate-500 mb-6">{selectedOverviewUser ? `Currently viewing accomplishments for: ${selectedOverviewUser.name}` : roleConfig.desc}</p>
      
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
        
        {user.role === UserRole.SUPER_ADMIN && (
          <button 
            onClick={() => { setView('accounts'); setSelectedOverviewUser(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Account Management
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        )}

        {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN) && (
          <button 
            onClick={() => { setView('user-selection'); setSelectedOverviewUser(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between group shadow-lg shadow-orange-500/10 ${view === 'user-selection' ? 'bg-gradient-to-r from-orange-600 to-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Stations and CHQ Overview
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {['2026', '2025', '2024', '2023'].map(year => (
          <div key={year} className="space-y-2 pt-1 border-t border-slate-100">
            <button 
              onClick={() => toggleGroup(year)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold hover:bg-slate-100 transition flex items-center justify-between group text-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dashboard {year}
              </div>
              <svg className={`w-3 h-3 transition-transform duration-300 ${openGroups[year] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openGroups[year] && (
              <div className="pl-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN || (selectedOverviewUser && (selectedOverviewUser.role === UserRole.SUPER_ADMIN || selectedOverviewUser.role === UserRole.SUB_ADMIN))) && (
                  <button 
                    onClick={() => setDashboardView('operational-dashboard', year)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-between group ${view === 'operational-dashboard' && selectedYear === year ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  >
                    Operational Dashboard {year}
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN || user.role === UserRole.CHQ || (selectedOverviewUser && selectedOverviewUser.role === UserRole.CHQ)) && (
                  <button 
                    onClick={() => setDashboardView('chq-operational-dashboard', year)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-between group ${view === 'chq-operational-dashboard' && selectedYear === year ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                  >
                    CHQ Operational Dashboard {year}
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                <button 
                  onClick={() => setDashboardView('tactical-dashboard', year)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-between group ${view === 'tactical-dashboard' && selectedYear === year ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Tactical Dashboard {year}
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${roleConfig.color}`}>
            {roleConfig.label} Access
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome Back, {user.name}!</h2>
          <div className="flex items-start gap-3 text-slate-300 max-w-2xl bg-white/5 border border-white/10 p-4 rounded-xl mt-4">
            <div className="mt-1">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm italic font-medium leading-relaxed">
              <span className="text-blue-400 font-bold">AI Insight:</span> {insight}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent flex items-center justify-center opacity-20 pointer-events-none">
           <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
           </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {managedUsers.slice(0, 3).map((statUser, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm font-medium text-slate-500 mb-1">{statUser.name}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900">88%</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                On Track
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Organizational Flow</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 },
              { name: 'Apr', value: 800 }, { name: 'May', value: 500 }, { name: 'Jun', value: 200 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {[400,300,600,800,500,200].map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 3 ? '#0f172a' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderAccountManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Main Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-900">User Account Management</h2>
          <p className="text-slate-500 font-medium">Full visibility and control over all organizational credentials.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition border border-slate-200 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {managedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-8 h-8 rounded-full bg-slate-100" />
                      <span className="font-semibold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded uppercase ${ROLE_LABELS[u.role].color} text-white tracking-wider`}>
                      {ROLE_LABELS[u.role].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-blue-600 transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUserSelection = () => {
    const chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    const stationUsers = usersList.filter(u => u.role === UserRole.STATION);

    return (
      <div className="space-y-8">
        <div>
          <button 
            onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Main Dashboard
          </button>
          <h2 className="text-3xl font-black text-slate-900">Stations and CHQ Overview</h2>
          <p className="text-slate-500 font-medium">Select a specific entity to view their accomplishments. Use the Control Panel on the right to switch years.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              CHQ Accounts ({chqUsers.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {chqUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedOverviewUser(u);
                    setView(u.role === UserRole.CHQ ? 'chq-operational-dashboard' : 'tactical-dashboard');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition group text-left"
                >
                  <img src={u.avatar} className="w-12 h-12 rounded-xl bg-slate-50" alt={u.name} />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition">{u.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              Station Accounts ({stationUsers.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {stationUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedOverviewUser(u);
                    setView('tactical-dashboard');
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition group text-left"
                >
                  <img src={u.avatar} className="w-12 h-12 rounded-xl bg-slate-50" alt={u.name} />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 group-hover:text-orange-600 transition">{u.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">N</div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Welcome {user.name}!</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monitoring System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
            <p className="text-xs text-slate-500 mt-1">{roleConfig.label}</p>
          </div>
          <img src={user.avatar} className="w-10 h-10 rounded-xl border border-slate-200" />
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Sign Out">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {view === 'overview' && renderOverview()}
          {view === 'accounts' && renderAccountManagement()}
          {view === 'user-selection' && renderUserSelection()}
          {view === 'operational-dashboard' && (
            <OperationalDashboard 
              title={`OPERATIONAL DASHBOARD ${selectedYear}`} 
              onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} 
              userRole={selectedOverviewUser?.role || user.role} 
              selectedUser={selectedOverviewUser || undefined}
            />
          )}
          {view === 'chq-operational-dashboard' && (
            <OperationalDashboard 
              title={`CHQ OPERATIONAL DASHBOARD ${selectedYear}`} 
              onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} 
              userRole={selectedOverviewUser?.role || user.role} 
              selectedUser={selectedOverviewUser || undefined}
            />
          )}
          {view === 'tactical-dashboard' && (
            <OperationalDashboard 
              title={`TACTICAL DASHBOARD ${selectedYear}`} 
              onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} 
              userRole={selectedOverviewUser?.role || user.role} 
              selectedUser={selectedOverviewUser || undefined}
            />
          )}
        </div>
        
        <div className="lg:col-span-1">
          {renderSidebar()}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit Account' : 'New Station Account'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Access Password</label>
                <input type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
