import React from 'react';
import { UserRole } from '../types';
import { store } from '../lib/store';
import { 
  Scissors, 
  QrCode, 
  LogOut, 
  LogIn
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onOpenLogin: () => void;
  onOpenQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView: _currentView,
  onNavigate,
  onOpenLogin,
  onOpenQR,
}) => {
  const currentUser = store.getCurrentUser();
  const business = store.getBusiness();

  const handleLogout = () => {
    store.logout();
    onNavigate('client-booking');
  };

  const userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : '';

  const handleLogoClick = () => {
    if (!currentUser) {
      onNavigate('client-booking');
    } else if (userRole === 'owner') {
      onNavigate('owner-dashboard');
    } else if (userRole === 'master') {
      onNavigate('master-board');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
                <Scissors className="w-5 h-5 text-emerald-400 rotate-90" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-stone-900">NAVBAT</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    CRM
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  {business.name}
                </p>
              </div>
            </button>
          </div>

          {/* Right Action buttons: Door QR & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Door QR Modal trigger */}
            <button
              onClick={onOpenQR}
              title="Eshik uchun QR kod stendini ochish va chop etish"
              className="px-3 py-1.5 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-stone-800" />
              <span className="hidden sm:inline">Eshik QR stendi</span>
            </button>

            {/* Auth section */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs ring-1 ring-emerald-300">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-stone-900 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {userRole === 'owner' ? '👑 Ega hisobi' : '✂️ Usta hisobi'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Tizimdan chiqish"
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chiqish</span>
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Tizimga kirish</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
