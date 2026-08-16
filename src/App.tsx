import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { store } from './lib/store';
import { Navbar } from './components/Navbar';
import { ClientBooking } from './components/ClientBooking';
import { ClientTicket } from './components/ClientTicket';
import { MasterBoard } from './components/MasterBoard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { LoginModal } from './components/LoginModal';
import { QRPosterModal } from './components/QRPosterModal';

export default function App() {
  const currentUser = store.getCurrentUser();
  const [currentView, setCurrentView] = useState<string>(() => {
    if (currentUser?.role === UserRole.OWNER) return 'owner-dashboard';
    if (currentUser?.role === UserRole.MASTER) return 'master-board';
    return 'client-booking';
  });
  const [ticketPublicId, setTicketPublicId] = useState<string>('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [loginRequiredMessage, setLoginRequiredMessage] = useState('');
  const [, setRerender] = useState(0);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setRerender((v) => v + 1);
    });
    return () => unsubscribe();
  }, []);

  // Sync view when user auth changes
  useEffect(() => {
    const user = store.getCurrentUser();
    const role = user?.role ? String(user.role).toLowerCase() : '';
    if (role === 'owner') {
      setCurrentView('owner-dashboard');
    } else if (role === 'master') {
      setCurrentView('master-board');
    } else if (!ticketPublicId) {
      setCurrentView('client-booking');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Parse path / hash on initial mount
  useEffect(() => {
    const parseUrl = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.startsWith('/t/') || hash.startsWith('#/t/')) {
        const id = (path.startsWith('/t/') ? path.slice(3) : hash.slice(4)).replace(/\/$/, '');
        if (id) {
          setTicketPublicId(id);
          setCurrentView('client-ticket');
          return;
        }
      }

      if (path === '/master' || path === '/master/' || hash === '#/master') {
        const user = store.getCurrentUser();
        if (user?.role === UserRole.MASTER) {
          setCurrentView('master-board');
        } else {
          setLoginRequiredMessage("Usta taxtasiga kirish uchun usta hisobingizga kiring.");
          setIsLoginOpen(true);
        }
        return;
      }

      if (path === '/dashboard' || path === '/dashboard/' || hash === '#/dashboard') {
        const user = store.getCurrentUser();
        if (user?.role === UserRole.OWNER) {
          setCurrentView('owner-dashboard');
        } else {
          setLoginRequiredMessage("Ega boshqaruviga kirish uchun ega hisobingizga kiring.");
          setIsLoginOpen(true);
        }
        return;
      }

      if (path === '/dashboard/qr' || hash === '#/dashboard/qr') {
        setIsQROpen(true);
      }
    };

    parseUrl();
  }, []);

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === 'client-booking') {
      setCurrentView('client-booking');
      setTicketPublicId('');
      window.history.pushState({}, '', '/b/barber-house/');
    } else if (view === 'client-ticket' && params?.publicId) {
      setTicketPublicId(params.publicId);
      setCurrentView('client-ticket');
      window.history.pushState({}, '', `/t/${params.publicId}/`);
    } else if (view === 'master-board') {
      const user = store.getCurrentUser();
      if (user?.role === UserRole.MASTER) {
        setCurrentView('master-board');
        window.history.pushState({}, '', '/master/');
      } else {
        setLoginRequiredMessage("Usta taxtasiga kirish uchun usta hisobingizga kiring.");
        setIsLoginOpen(true);
      }
    } else if (view === 'owner-dashboard') {
      const user = store.getCurrentUser();
      if (user?.role === UserRole.OWNER) {
        setCurrentView('owner-dashboard');
        window.history.pushState({}, '', '/dashboard/');
      } else {
        setLoginRequiredMessage("Ega boshqaruviga kirish uchun ega hisobingizga kiring.");
        setIsLoginOpen(true);
      }
    }
  };

  const handleBookingSuccess = (publicId: string) => {
    setTicketPublicId(publicId);
    setCurrentView('client-ticket');
    window.history.pushState({}, '', `/t/${publicId}/`);
  };

  const handleLoginSuccess = (role: UserRole | string) => {
    const r = String(role).toLowerCase();
    if (r === 'owner') {
      setCurrentView('owner-dashboard');
      window.history.pushState({}, '', '/dashboard/');
    } else if (r === 'master') {
      setCurrentView('master-board');
      window.history.pushState({}, '', '/master/');
    }
  };

  // Determine active screen based on authentication
  const renderActiveScreen = () => {
    const userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : '';
    if (userRole === 'owner') {
      return (
        <OwnerDashboard
          onOpenLogin={() => {
            setLoginRequiredMessage("Ega hisobi orqali kiring.");
            setIsLoginOpen(true);
          }}
          onOpenQR={() => setIsQROpen(true)}
        />
      );
    }

    if (userRole === 'master') {
      return (
        <MasterBoard
          onOpenLogin={() => {
            setLoginRequiredMessage("Usta hisobi orqali kiring.");
            setIsLoginOpen(true);
          }}
        />
      );
    }

    // Default: Client flow
    if (currentView === 'client-ticket' && ticketPublicId) {
      return (
        <ClientTicket
          publicId={ticketPublicId}
          onBackToBooking={() => handleNavigate('client-booking')}
        />
      );
    }

    return <ClientBooking onBookingSuccess={handleBookingSuccess} />;
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenLogin={() => {
          setLoginRequiredMessage('');
          setIsLoginOpen(true);
        }}
        onOpenQR={() => setIsQROpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderActiveScreen()}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 bg-white text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            © 2026 <span className="font-bold text-stone-800">NAVBAT</span> — Mahalla sartaroshxonasi uchun CRM
          </p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Barber House • Chilonzor 9-mavze</span>
            <span>•</span>
            <span>+998 90 123 45 67</span>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        requiredRoleMessage={loginRequiredMessage}
      />

      {/* Door QR Poster Modal */}
      <QRPosterModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
      />

    </div>
  );
}
