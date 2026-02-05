import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Default empty for security testing
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Perform validation check
      if (foundUser && foundUser.password === password) {
        onLogin(foundUser);
      } else {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Login</h1>
            <p className="text-slate-500 mt-2">Sign in to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Email Address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right Side: Visual/Context */}
        <div className="hidden md:flex w-1/2 bg-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-8 border border-white/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Real-Time Monitoring System</h2>
            <p className="text-slate-400 text-lg">Managing of Unit Dashboard Accomplishment</p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 text-sm bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Status: Healthy</span>
            </div>
            <div className="text-slate-500 text-xs">
              © 2025 AdminRole System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;