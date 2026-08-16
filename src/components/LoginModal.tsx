import React, { useState } from 'react';
import { UserRole } from '../types';
import { store } from '../lib/store';
import { DEMO_USERS } from '../lib/demoData';
import { X, Lock, User, KeyRound, ShieldAlert, CheckCircle2, Scissors, Crown } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole) => void;
  requiredRoleMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  requiredRoleMessage,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await store.loginWithApi(username, password);
      onLoginSuccess(loggedInUser.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login yoki parol noto\'g\'ri!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (uName: string, pass: string) => {
    setError('');
    setIsLoading(true);
    try {
      const loggedInUser = await store.loginWithApi(uName, pass);
      onLoginSuccess(loggedInUser.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Tizimga kirish</h2>
          <p className="text-xs text-stone-500 mt-1">
            Usta yoki Ega hisobiga kirish (Mijozlar uchun login talab qilinmaydi)
          </p>
        </div>

        {/* Warning notification if redirected */}
        {requiredRoleMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{requiredRoleMessage}</p>
              <p className="text-amber-700 mt-0.5">
                Ushbu sahifaga o'tish uchun tegishli hisob orqali kiring.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Quick 1-Click Demo Login */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
            Tezkor demo login (1-bosishda):
          </p>
          <div className="grid grid-cols-2 gap-2">
            
            {/* Ega */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('owner', 'owner123')}
              className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700">
                  Sardor (Ega)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono">owner / owner123</p>
            </button>

            {/* Usta 1 */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('usta1', 'usta123')}
              className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700">
                  Bobur (Usta 1)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono">usta1 / usta123</p>
            </button>

            {/* Usta 2 */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('usta2', 'usta123')}
              className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="w-4 h-4 text-stone-600" />
                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700">
                  Jasur (Usta 2)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono">usta2 / usta123</p>
            </button>

            {/* Usta 3 */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('usta3', 'usta123')}
              className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="w-4 h-4 text-stone-600" />
                <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700">
                  Davron (Usta 3)
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono">usta3 / usta123</p>
            </button>

          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-400 font-medium">yoki qo'lda kiritish</span>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Foydalanuvchi nomi (Login)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="masalan: usta1 yoki owner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Parol
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm mt-2"
          >
            Kirish
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            Mijozlar hech qanday login qilmasdan bevosita navbatga yozilishlari mumkin.
          </p>
        </div>

      </div>
    </div>
  );
};
