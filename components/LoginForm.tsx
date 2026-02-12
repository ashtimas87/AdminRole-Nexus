import React, { useState } from 'react';
import { MOCK_USERS } from '../constants.ts';
import { User } from '../types.ts';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulated verification delay
    setTimeout(() => {
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (foundUser && foundUser.password === password) {
        onLogin(foundUser);
      } else {
        setError('Verification Failed. Invalid Access Credentials.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sans">
      <div className="w-full max-w-[400px] bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-500 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-slate-900/20 active:scale-95 transition-transform cursor-pointer">
            C
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">HUB Login</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.25em] mt-3 opacity-60">Cagayan de Oro Monitoring Storage</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Initialize Terminal
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Cloud Gateway Active</span>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.1em]">Terminal v2.5.0-R2026</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;