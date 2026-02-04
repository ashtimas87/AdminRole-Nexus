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
  | 'deployment'
  | 'operational-dashboard' 
  | 'chq-operational-dashboard' 
  | 'tactical-dashboard'
  | 'user-selection';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [insight, setInsight] = useState<string>('');
  const [view, setView] = useState<ViewType>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '2026': true,
    '2025': false,
    '2024': false,
    '2023': false
  });
  
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
      <p className="text-xs text-slate-500 mb-6">{selectedOverviewUser ? `Currently viewing: ${selectedOverviewUser.name}` : roleConfig.desc}</p>
      
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
        
        {user.role === UserRole.SUPER_ADMIN && (
          <div className="space-y-2">
            <button 
              onClick={() => { setView('accounts'); setSelectedOverviewUser(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Accounts
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
            <button 
              onClick={() => { setView('deployment'); setSelectedOverviewUser(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center justify-between group ${view === 'deployment' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              Deployment
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>
          </div>
        )}

        {['2026', '2025', '2024', '2023'].map(year => (
          <div key={year} className="space-y-2 pt-1 border-t border-slate-100">
            <button onClick={() => toggleGroup(year)} className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold hover:bg-slate-100 flex items-center justify-between group text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {year}
              </div>
              <svg className={`w-3 h-3 transition-transform ${openGroups[year] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openGroups[year] && (
              <div className="pl-2 space-y-1.5">
                {user.role !== UserRole.STATION && (
                  <>
                    <button onClick={() => setDashboardView('operational-dashboard', year)} className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold ${view === 'operational-dashboard' && selectedYear === year ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>Operational Dashboard {year}</button>
                    <button onClick={() => setDashboardView('chq-operational-dashboard', year)} className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold ${view === 'chq-operational-dashboard' && selectedYear === year ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>CHQ Operational Dashboard {year}</button>
                  </>
                )}
                <button onClick={() => setDashboardView('tactical-dashboard', year)} className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold ${view === 'tactical-dashboard' && selectedYear === year ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>Tactical Dashboard {year}</button>
                
                {user.role !== UserRole.STATION && (
                  <button onClick={() => { setView('user-selection'); setSelectedYear(year); setSelectedOverviewUser(null); }} className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold ${view === 'user-selection' && selectedYear === year ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'}`}>Selection {year}</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${roleConfig.color}`}>{roleConfig.label} Access</div>
            <h2 className="text-3xl font-bold mb-2">Welcome Back, {user.name}!</h2>
            <div className="flex items-start gap-3 text-slate-300 max-w-2xl bg-white/5 border border-white/10 p-4 rounded-xl mt-4 min-h-[80px]">
              {insight ? (
                <p className="text-sm italic font-medium leading-relaxed animate-in fade-in duration-700">
                  <span className="text-blue-400 font-bold mr-2">NEXUS INSIGHT:</span> {insight}
                </p>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-400">Consulting Nexus intelligence protocols...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {managedUsers.slice(0, 3).map((statUser, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <p className="text-sm font-medium text-slate-500 mb-1">{statUser.name}</p>
              <h3 className="text-2xl font-bold text-slate-900">88%</h3>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Organizational Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 }, { name: 'Apr', value: 800 }, { name: 'May', value: 500 }, { name: 'Jun', value: 200 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[400,300,600,800,500,200].map((_, index) => (<Cell key={`cell-${index}`} fill={index === 3 ? '#0f172a' : '#cbd5e1'} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => { setView('overview'); setSelectedOverviewUser(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Account Management</h2>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl">Add New User</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">User</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Role</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {managedUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-full" />
                    <span className="font-semibold text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded uppercase ${ROLE_LABELS[u.role].color} text-white`}>{ROLE_LABELS[u.role].label}</span></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-blue-600 font-bold">Edit</button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 font-bold">Delete</button>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <button onClick={() => { setView('overview'); setSelectedOverviewUser(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Overview
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Netlify Deployment Hub</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Netlify Configuration</h3>
            </div>
            <p className="text-slate-600 mb-8 leading-relaxed">Your project is pre-configured for Netlify with custom SPA routing and optimized static asset delivery.</p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>SPA Routing: index.html Fallback Active</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Node Version: 20 (Production Optimized)</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Continuous Deployment Ready</span>
              </div>
            </div>
          </div>

          <a 
            href="https://app.netlify.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#25c2a0] hover:bg-[#1f9e83] text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-teal-200/50 flex items-center justify-center gap-3 text-lg"
          >
            Connect to Netlify Console
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Deployment Prerequisites
          </h3>
          <p className="text-slate-400 mb-8 text-sm">To ensure the Nexus intelligence protocols and dashboards function correctly in production, please configure these environment variables in your Netlify Site Settings.</p>
          
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Variable Key</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">REQUIRED</span>
              </div>
              <code className="text-lg font-mono font-bold text-white">API_KEY</code>
              <p className="mt-2 text-xs text-slate-500 font-medium">Your Google Gemini Pro API Key for role-based strategic insights.</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Variable Key</span>
                <span className="px-2 py-0.5 bg-slate-500/20 text-slate-500 rounded text-[10px] font-bold">OPTIONAL</span>
              </div>
              <code className="text-lg font-mono font-bold text-slate-300">NODE_VERSION</code>
              <p className="mt-2 text-xs text-slate-500 font-medium">Default set to 20 in netlify.toml</p>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h4 className="text-sm font-bold mb-3 uppercase tracking-tighter text-slate-400">Step-by-Step Connection:</h4>
              <ol className="space-y-3 text-sm text-slate-500 list-decimal pl-4 font-medium">
                <li>Log in to <a href="https://app.netlify.com" target="_blank" className="text-blue-400 underline">Netlify</a>.</li>
                <li>Click <strong>"Add new site"</strong> and select <strong>"Import an existing project"</strong>.</li>
                <li>Connect your Git provider and select this repository.</li>
                <li>Ensure build settings are default (Build command: blank, Publish directory: <code>.</code>).</li>
                <li>Go to <strong>Site configuration > Environment variables</strong> and add <code>API_KEY</code>.</li>
              </ol>
            </div>
          </div>
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
          <button onClick={() => { setView('overview'); setSelectedOverviewUser(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <h2 className="text-3xl font-black text-slate-900">District Overview {selectedYear}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">CHQ Accounts</h3>
            {chqUsers.map(u => (
              <button key={u.id} onClick={() => { setSelectedOverviewUser(u); setView(u.role === UserRole.CHQ ? 'chq-operational-dashboard' : 'tactical-dashboard'); }} className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border hover:border-emerald-500 transition group text-left">
                <img src={u.avatar} className="w-12 h-12 rounded-xl" />
                <div className="flex-1"><p className="font-bold text-slate-900">{u.name}</p></div>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Station Accounts</h3>
            {stationUsers.map(u => (
              <button key={u.id} onClick={() => { setSelectedOverviewUser(u); setView('tactical-dashboard'); }} className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border hover:border-orange-500 transition group text-left">
                <img src={u.avatar} className="w-12 h-12 rounded-xl" />
                <div className="flex-1"><p className="font-bold text-slate-900">{u.name}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">N</div>
          <h1 className="font-bold text-slate-900 leading-none">AdminRole Nexus</h1>
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
          {view === 'operational-dashboard' && <OperationalDashboard title={`OPERATIONAL DASHBOARD ${selectedYear}`} onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'chq-operational-dashboard' && <OperationalDashboard title={`CHQ OPERATIONAL DASHBOARD ${selectedYear}`} onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'tactical-dashboard' && <OperationalDashboard title={`TACTICAL DASHBOARD ${selectedYear}`} onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} currentUser={user} subjectUser={selectedOverviewUser || user} />}
        </div>
        <div className="lg:col-span-1">{renderSidebar()}</div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-md rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">{editingUser ? 'Edit Account' : 'New Account'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <input type="text" required placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border" />
              <input type="email" required placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border" />
              <input type="password" required placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold">{editingUser ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;