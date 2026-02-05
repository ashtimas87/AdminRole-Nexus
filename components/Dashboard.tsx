
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
  | 'user-selection';

const Dashboard: React.FC<DashboardProps & { onLogout: () => void }> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewType>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedOverviewUser, setSelectedOverviewUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const roleConfig = ROLE_LABELS[user.role];

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
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Control Panel</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {selectedOverviewUser ? `Unit: ${selectedOverviewUser.name}` : `Role: ${roleConfig.label}`}
        </p>
      </div>
      
      <div className="space-y-8">
        {/* Core Management Section (Moved Above Monitoring) */}
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

        {/* Navigation Section */}
        <div>
          <button 
            onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 hover:text-slate-900 transition-colors flex items-center gap-2 group"
          >
            Monitoring
            <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
          
          <div className="space-y-1.5">
            <button 
              onClick={() => { setView('overview'); setSelectedOverviewUser(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Operational Dashboards
              <svg className={`w-4 h-4 ${view === 'overview' ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
          </div>
        </div>

        {/* Units Breakdown */}
        {user.role !== UserRole.STATION && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Administrative Units</p>
              <button 
                onClick={() => setDashboardView('chq-operational-dashboard', selectedYear)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'chq-operational-dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                CHQ Dashboard
                <svg className={`w-4 h-4 ${view === 'chq-operational-dashboard' ? 'text-white' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1" /></svg>
              </button>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tactical Units</p>
              <button 
                onClick={() => setDashboardView('tactical-dashboard', selectedYear)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'tactical-dashboard' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
              >
                Tactical Dashboard
                <svg className={`w-4 h-4 ${view === 'tactical-dashboard' ? 'text-white' : 'text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Administration */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">System</p>
          <button 
            onClick={() => { setView('user-selection'); setSelectedOverviewUser(null); }} 
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition flex items-center justify-between group ${view === 'user-selection' ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Account Overview
            <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Inspect</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    return (
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${roleConfig.color}`}>{roleConfig.label} Access</div>
            <h2 className="text-4xl font-black mb-1 tracking-tight">Operational Dashboards</h2>
            <p className="text-slate-400 font-medium">Welcome back, {user.name}</p>
          </div>
        </div>

        {/* Main Grid for Yearly Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { year: '2026', color: 'indigo', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { year: '2025', color: 'indigo', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { year: '2024', color: 'slate', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
            { year: '2023', color: 'slate', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' }
          ].map((item) => (
            <button 
              key={item.year}
              onClick={() => setDashboardView('operational-dashboard', item.year)}
              className={`group p-8 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden bg-white hover:shadow-2xl hover:shadow-${item.color}-100 border-slate-100 hover:border-${item.color}-500`}
            >
              <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500`}>
                <svg className={`w-24 h-24 text-${item.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              
              <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-${item.color}-100 group-hover:bg-${item.color}-600 group-hover:text-white transition-colors`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                </svg>
              </div>
              
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 group-hover:text-slate-900">
                Operational Dashboard {item.year}
              </h3>
              <p className="text-slate-500 font-medium text-sm">View and manage performance indicators for the fiscal year {item.year}.</p>
              
              <div className="mt-6 flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest text-${item.color}-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                  Access Report
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* AI Insight Section */}
        <div className="bg-white rounded-2xl border-2 border-indigo-50 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <svg className="w-16 h-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">AI Strategic Intelligence</h3>
          </div>
          
          {isInsightLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="relative">
              <p className="text-slate-600 leading-relaxed font-medium italic">
                "{insight}"
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Optimization Active</span>
              </div>
            </div>
          )}
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
      <div className="flex justify-between items-end">
        <div>
          <button onClick={() => { setView('overview'); setSelectedOverviewUser(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Overview
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Netlify Deployment Hub</h2>
          <p className="text-slate-500 text-sm mt-1">Manage infrastructure, environment variables, and production hosting.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest">Production Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 flex flex-col justify-between overflow-hidden relative border-t-4 border-t-teal-500">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="w-48 h-48 -rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#25c2a0] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">Netlify Production</h3>
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">Hosting & CDN</span>
              </div>
            </div>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm max-w-2xl">Your project is production-ready with Netlify. Automatic SSL, custom domain mapping, and lightning-fast edge delivery are available. The included <code>netlify.toml</code> ensures proper SPA routing.</p>
          </div>

          <a 
            href="https://app.netlify.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#25c2a0] hover:bg-[#1f9e83] text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-teal-200/50 flex items-center justify-center gap-3 text-lg"
          >
            Go to Netlify Console
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>
    </div>
  );

  const renderUserSelection = () => {
    const chqUsers = usersList.filter(u => u.role === UserRole.CHQ);
    const stationUsers = usersList.filter(u => u.role === UserRole.STATION);
    
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => { setView('overview'); setSelectedOverviewUser(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Account Overview</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Administrative Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#1e293b] tracking-wide border-b border-slate-200 pb-2">Administrative Units</h3>
            <div className="grid grid-cols-1 gap-3">
              {chqUsers.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => { setSelectedOverviewUser(u); setDashboardView('chq-operational-dashboard', selectedYear); }} 
                  className="group flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 text-left"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
                    <img src={u.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={u.name} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{u.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Operational Unit</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Station Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#1e293b] tracking-wide border-b border-slate-200 pb-2">Station Accounts</h3>
            <div className="grid grid-cols-1 gap-3">
              {stationUsers.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => { setSelectedOverviewUser(u); setDashboardView('tactical-dashboard', selectedYear); }} 
                  className="group flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300 text-left"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
                    <img src={u.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={u.name} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">{u.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Law Enforcement Node</p>
                  </div>
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
      <nav className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">A</div>
          <h1 className="font-bold text-slate-900 leading-none">AdminRole</h1>
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
          {view === 'chq-operational-dashboard' && <OperationalDashboard title={`CHQ DASHBOARD ${selectedYear}`} onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} currentUser={user} subjectUser={selectedOverviewUser || user} />}
          {view === 'tactical-dashboard' && <OperationalDashboard title={`TACTICAL DASHBOARD ${selectedYear}`} onBack={() => { setView('overview'); setSelectedOverviewUser(null); }} currentUser={user} subjectUser={selectedOverviewUser || user} />}
        </div>
        <div className="lg:col-span-1">{renderSidebar()}</div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
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
