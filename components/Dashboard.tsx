
import React, { useEffect, useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS, MOCK_USERS } from '../constants';
import OperationalDashboard from './OperationalDashboard';
import { DatabaseService } from '../services/dbService';

type ViewType = 
  | 'accounts' 
  | 'deployment'
  | 'status-terminal'
  | 'unit-oversight'
  | 'operational-dashboard'
  | 'target-outlook'
  | 'target-outlook-landing'
  | 'db-hub'
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
  const [dbStatus, setDbStatus] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>(localStorage.getItem('db_last_sync_out') || 'Never');

  const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN;

  useEffect(() => {
    const checkDb = async () => {
      const ok = await DatabaseService.checkConnection();
      setDbStatus(ok);
    };
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderDbHub = () => {
    const settings = DatabaseService.getSettings();
    const [config, setConfig] = useState(settings);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const handleSave = async () => {
      DatabaseService.saveSettings(config);
      setMsg({ text: 'Settings Updated Locally.', type: 'info' });
      const ok = await DatabaseService.checkConnection();
      setDbStatus(ok);
    };

    const handleSyncNow = async (dir: 'push' | 'pull') => {
      setMsg({ text: `Initializing ${dir}...`, type: 'info' });
      const result = dir === 'push' ? await DatabaseService.pushToRemote() : await DatabaseService.pullFromRemote();
      setMsg({ text: result.message, type: result.success ? 'success' : 'error' });
      if (result.timestamp) setLastSync(result.timestamp);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3.5 3s3.5-1 3.5-3V7c0-2-1.5-3-3.5-3S4 5 4 7zm9 0v10c0 2 1.5 3 3.5 3s3.5-1 3.5-3V7c0-2-1.5-3-3.5-3S13 5 13 7z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hostinger Database Hub</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Remote Persistence Management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Endpoint (e.g., https://yourdomain.com/api.php)</label>
              <input type="text" value={config.endpoint} onChange={e => setConfig({...config, endpoint: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Access Token</label>
              <input type="password" value={config.token} onChange={e => setConfig({...config, token: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 outline-none font-bold" />
            </div>
            
            {msg.text && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${msg.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                {msg.text}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition">Save Settings</button>
              <button onClick={() => handleSyncNow('push')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg">Push Data</button>
              <button onClick={() => handleSyncNow('pull')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg">Restore Data</button>
            </div>
          </div>
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
          <>
            <button 
              onClick={() => setView('accounts')}
              className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'accounts' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              Account Management
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </button>
            <button 
              onClick={() => setView('db-hub')}
              className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'db-hub' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              Database Hub
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>
          </>
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
            className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'operational-dashboard' && selectedOverviewUser?.id === user.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Operational Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
        )}

        <button 
          onClick={() => setView('target-outlook-landing')}
          className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view.startsWith('target') ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Target Outlook
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>

        <button 
          onClick={() => setView('unit-oversight')}
          className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'unit-oversight' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Unit Oversight
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </button>

        <button 
          onClick={() => setView('deployment')}
          className={`w-full text-left px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-between group ${view === 'deployment' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Deployment
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </button>
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
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dbStatus ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${dbStatus ? 'text-emerald-600' : 'text-slate-400'}`}>
                {dbStatus ? 'Hostinger Connected' : 'Local Only'}
              </span>
            </div>
            <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Last Sync: {lastSync}</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Terminal Active</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">Sign Out</button>
        </div>
      </nav>
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 order-first">{renderSidebar()}</div>
        <div className="lg:col-span-2 space-y-6">
          {view === 'accounts' && <div>Existing account logic here</div>}
          {view === 'db-hub' && renderDbHub()}
          {view === 'deployment' && <div>Deployment Terminal Content</div>}
          {view === 'status-terminal' && <div>Status Terminal Content</div>}
          {view === 'unit-oversight' && <div>Oversight Content</div>}
          {view === 'target-outlook-landing' && <div>Outlook Landing Content</div>}
          {view === 'operational-dashboard' && selectedOverviewUser && (
            <OperationalDashboard 
              title="Dashboard" 
              onBack={() => setView('unit-oversight')} 
              currentUser={user} 
              subjectUser={selectedOverviewUser}
              allUnits={usersList} 
            />
          )}
          {view === 'target-outlook' && selectedOverviewUser && (
            <OperationalDashboard 
              title="Target Outlook" 
              onBack={() => setView('target-outlook-landing')} 
              currentUser={user} 
              subjectUser={selectedOverviewUser} 
              allUnits={usersList} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
