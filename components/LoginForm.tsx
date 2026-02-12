import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate authentication check
    setTimeout(() => {
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (foundUser && foundUser.password === password) {
        onLogin(foundUser);
      } else {
        setError('Invalid credentials. Please verify your email and access key.');
        setLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = (user: User) => {
    setEmail(user.email);
    setPassword(user.password || '');
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd] p-4 sm:p-6 font-sans antialiased text-slate-900">
      <div className="w-full max-w-[420px] bg-white p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl mb-6 shadow-xl shadow-slate-200">
            <span className="text-white text-2xl font-bold tracking-tighter">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to Monitoring</h1>
          <p className="text-slate-500 text-sm mt-2">Enter your credentials to access the terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all text-[15px] text-slate-900 placeholder:text-slate-300"
              placeholder="e.g. name@office.gov"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Access Key</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-slate-900 focus:bg-white outline-none transition-all text-[15px] text-slate-900 placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 text-[13px] font-medium rounded-xl border border-red-100 text-center animate-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-4 rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50">
          <button 
            onClick={() => setShowDemo(!showDemo)}
            className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showDemo ? 'Hide Demo Access' : 'Show Demo Accounts (22 Units)'}
          </button>

          {showDemo && (
            <div className="mt-4 p-2 bg-slate-50/50 rounded-2xl border border-slate-100 max-h-[220px] overflow-y-auto custom-scrollbar">
               {MOCK_USERS.map(u => (
                 <div 
                   key={u.id} 
                   onClick={() => handleQuickLogin(u)}
                   className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100 group"
                 >
                   <div className="flex flex-col">
                     <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900">{u.name}</span>
                     <span className="text-[10px] text-slate-400 font-medium">{u.email}</span>
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-colors">
                     {u.role.replace('_', ' ')}
                   </span>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2 opacity-40">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Storage Gateway</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-slate-400">Production Node Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;