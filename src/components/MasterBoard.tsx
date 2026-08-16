import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentSource, AppointmentStatus, Service, UserRole } from '../types';
import { store } from '../lib/store';
import { getMasterDay } from '../lib/selectors';
import { transitionStatus, createAppointment } from '../lib/services';
import { formatMoney, formatTime, formatDateUz } from '../lib/utils';
import { 
  Scissors, 
  Clock, 
  User as UserIcon, 
  Phone, 
  CheckCircle2, 
  Play, 
  XCircle, 
  UserX, 
  Plus, 
  Sparkles, 
  AlertCircle,
  X,
  QrCode,
  Store,
  RefreshCw
} from 'lucide-react';

interface MasterBoardProps {
  onOpenLogin: () => void;
}

export const MasterBoard: React.FC<MasterBoardProps> = ({ onOpenLogin }) => {
  const currentUser = store.getCurrentUser();
  const business = store.getBusiness();
  const services = store.getServices();

  // If not logged in as master, guard
  const userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : '';
  if (!currentUser || userRole !== 'master') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Scissors className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Usta hisobi talab qilinadi</h2>
        <p className="text-xs text-stone-500 mb-6">
          Usta taxtasini ko'rish uchun iltimos, o'z usta hisobingiz (masalan: usta1 / usta123) orqali tizimga kiring.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
        >
          Usta sifatida kirish
        </button>
      </div>
    );
  }

  // Get logged-in master profile directly (NO master chooser selector!)
  const master = store.getMasterByUserId(currentUser.id) || store.getMasters()[0];

  const todayStr = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'booked' | 'done' | 'other'>('all');
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string>('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isPollingAnimation, setIsPollingAnimation] = useState(false);

  // Walk-in form states (strictly for THIS master)
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('+998 90 ');
  const [walkInService, setWalkInService] = useState<Service>(services[0]);
  const [walkInTime, setWalkInTime] = useState<string>('');

  // Load and subscribe
  useEffect(() => {
    const refresh = () => {
      const allAppts = store.getAppointments();
      const masterAppts = getMasterDay(master.id, todayStr, allAppts);
      setAppointments(masterAppts);
      setLastSync(new Date());
    };

    refresh();
    const unsubscribe = store.subscribe(refresh);

    // HTMX-like polling every 5s
    const timer = setInterval(() => {
      setIsPollingAnimation(true);
      refresh();
      setTimeout(() => setIsPollingAnimation(false), 400);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [master.id, todayStr]);

  // Handle status transition
  const handleTransition = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    setActionError('');
    try {
      const statusLower = newStatus.toLowerCase();
      await store.updateAppointmentStatus(appointment.id, statusLower);
    } catch (err: any) {
      setActionError(err.message || "Holatni o'zgartirishda xatolik yuz berdi.");
    }
  };

  // Handle Walk-in submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!walkInName.trim()) {
      setActionError("Iltimos, mijoz ismini kiriting.");
      return;
    }

    try {
      // Calculate start time
      let startTimeDate = new Date();
      if (walkInTime) {
        const [h, m] = walkInTime.split(':').map(Number);
        startTimeDate.setHours(h, m, 0, 0);
      }

      await store.createAppointment({
        master_id: master.id,
        service_id: walkInService.id,
        client_name: walkInName,
        client_phone: walkInPhone,
        start_at: startTimeDate.toISOString(),
        source: 'walk_in',
        note: 'Sartaroshxonaga joyida kelgan mijoz',
      });

      setIsWalkInModalOpen(false);
      setWalkInName('');
      setWalkInPhone('+998 90 ');
    } catch (err: any) {
      setActionError(err.message || "Joyida yozishda xatolik yuz berdi.");
    }
  };

  // Find currently active in-progress client
  const currentInProgress = appointments.find(
    (a) => a.status === AppointmentStatus.IN_PROGRESS
  );

  // Find next booked client
  const nextBooked = appointments.find(
    (a) => a.status === AppointmentStatus.BOOKED
  );

  // Filtered appointments list
  const filteredAppointments = appointments.filter((app) => {
    if (activeFilter === 'booked') return app.status === AppointmentStatus.BOOKED;
    if (activeFilter === 'done') return app.status === AppointmentStatus.DONE;
    if (activeFilter === 'other')
      return (
        app.status === AppointmentStatus.CANCELLED ||
        app.status === AppointmentStatus.NO_SHOW
      );
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Master Top Profile Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-emerald-400 font-bold flex items-center justify-center text-base shadow-sm">
            {master.display_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {master.display_name}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Usta taxtasi
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {master.specialization} • Bugun, {formatDateUz(todayStr)}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className={`w-2 h-2 rounded-full ${isPollingAnimation ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span>Jonli taxta: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Quick Walk-In Button */}
          <button
            id="master-walkin-btn"
            onClick={() => {
              const now = new Date();
              const h = now.getHours().toString().padStart(2, '0');
              const m = now.getMinutes().toString().padStart(2, '0');
              setWalkInTime(`${h}:${m}`);
              setIsWalkInModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Joyida kelgan (Walk-in)</span>
          </button>

        </div>
      </div>

      {/* Global Error Banner if any */}
      {actionError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-400 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP SPOTLIGHT CARD: Currently in Progress or Ready for Next */}
      <div className="mb-6">
        {currentInProgress ? (
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Hozir xizmatda
                </span>
                <span className="text-xs font-bold text-amber-100 font-mono">
                  {formatTime(currentInProgress.start_at)} dan boshlangan
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-2">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {currentInProgress.client_name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-amber-100 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5" />
                      {store.getServiceById(currentInProgress.service_id)?.name || 'Xizmat'}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-white tabular-nums text-sm">
                      {formatMoney(currentInProgress.price_snapshot)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {currentInProgress.client_phone}
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons for In Progress */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="finish-client-btn"
                    onClick={() => handleTransition(currentInProgress, AppointmentStatus.DONE)}
                    className="min-h-12 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Tugatdim (DONE)</span>
                  </button>

                  <button
                    onClick={() => handleTransition(currentInProgress, AppointmentStatus.CANCELLED)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors"
                    title="Navbatni bekor qilish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 pointer-events-none">
              <Scissors className="w-40 h-40" />
            </div>
          </div>
        ) : nextBooked ? (
          <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider mb-2">
                Keyingi kutilayotgan mijoz
              </span>
              <h2 className="text-xl font-bold mt-1">
                {nextBooked.client_name} — {store.getServiceById(nextBooked.service_id)?.name}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Vaqti: <span className="text-white font-bold">{formatTime(nextBooked.start_at)}</span> • Tel: {nextBooked.client_phone} • {formatMoney(nextBooked.price_snapshot)}
              </p>
            </div>

            <button
              id="start-next-client-btn"
              onClick={() => handleTransition(nextBooked, AppointmentStatus.IN_PROGRESS)}
              className="min-h-12 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Boshladim (Qabul qilish)</span>
            </button>
          </div>
        ) : (
          <div className="bg-stone-100 rounded-3xl p-6 border border-stone-200 text-center">
            <p className="text-sm font-bold text-stone-700">
              Hozirda faol xizmatdagi mijoz yo'q
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Yangi mijoz kelsa "+ Joyida kelgan" tugmasi orqali tezkor qo'shishingiz mumkin.
            </p>
          </div>
        )}
      </div>

      {/* Queue List Header & Filter Tabs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Bugungi navbatlar jurnali ({appointments.length} ta)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Barcha o'zgarishlar mijoz chiptasi va ega hisobotida jonli yangilanadi.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'Barchasi' },
              { key: 'booked', label: 'Navbatda' },
              { key: 'done', label: 'Yakunlandi' },
              { key: 'other', label: 'Bekor/Kelmadi' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeFilter === tab.key
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-3">
            {filteredAppointments.map((appt) => {
              const srv = store.getServiceById(appt.service_id);
              const isBooked = appt.status === AppointmentStatus.BOOKED;
              const isInProg = appt.status === AppointmentStatus.IN_PROGRESS;
              const isDone = appt.status === AppointmentStatus.DONE;
              const isNoShow = appt.status === AppointmentStatus.NO_SHOW;
              const isCancelled = appt.status === AppointmentStatus.CANCELLED;

              return (
                <div
                  key={appt.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isInProg
                      ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30'
                      : isDone
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isNoShow || isCancelled
                      ? 'border-stone-200 bg-stone-50/50 opacity-60'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Time & Client Info */}
                    <div className="flex items-start gap-3">
                      
                      {/* Time Badge */}
                      <div className="px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-center shrink-0">
                        <span className="text-xs font-extrabold text-stone-900 tabular-nums block">
                          {formatTime(appt.start_at)}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium block">
                          {formatTime(appt.end_at)}
                        </span>
                      </div>

                      {/* Client details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-stone-900">
                            {appt.client_name}
                          </h3>
                          {appt.source === AppointmentSource.WALK_IN ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              Walk-in
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              QR
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 mt-0.5">
                          {srv?.name || 'Xizmat'} • <span className="font-semibold text-stone-900">{formatMoney(appt.price_snapshot)}</span> • <span className="font-mono">{appt.client_phone}</span>
                        </p>
                      </div>

                    </div>

                    {/* Right: Status badge & Transition buttons */}
                    <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                      
                      {/* Status indicator */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isBooked
                          ? 'bg-stone-100 text-stone-700'
                          : isInProg
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isNoShow
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        {isBooked && 'Navbatda'}
                        {isInProg && 'Xizmatda'}
                        {isDone && 'Yakunlandi'}
                        {isNoShow && 'Kelmadi'}
                        {isCancelled && 'Bekor qilindi'}
                      </span>

                      {/* Action buttons matching ALLOWED_TRANSITIONS */}
                      {isBooked && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTransition(appt, AppointmentStatus.IN_PROGRESS)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Boshladim</span>
                          </button>

                          <button
                            onClick={() => handleTransition(appt, AppointmentStatus.NO_SHOW)}
                            title="Kelmadi deb belgilash"
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Kelmadi
                          </button>

                          <button
                            onClick={() => handleTransition(appt, AppointmentStatus.CANCELLED)}
                            title="Bekor qilish"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {isInProg && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTransition(appt, AppointmentStatus.DONE)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tugatdim</span>
                          </button>

                          <button
                            onClick={() => handleTransition(appt, AppointmentStatus.CANCELLED)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-stone-400">
            Tanlangan filtr bo'yicha hech qanday navbat mavjud emas.
          </div>
        )}

      </div>

      {/* WALK-IN MODAL (Strictly for THIS logged-in master!) */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsWalkInModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Joyida kelgan mijozni yozish</span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                Usta: {master.display_name}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Mijoz navbatini darhol tizimga kiritish
              </p>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Mijoz ismi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Jahongir"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Xizmat turi *
                </label>
                <select
                  value={walkInService.id}
                  onChange={(e) => {
                    const s = services.find((x) => x.id === e.target.value);
                    if (s) setWalkInService(s);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.duration_minutes} daq ({formatMoney(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Boshlanish vaqti
                </label>
                <input
                  type="time"
                  value={walkInTime}
                  onChange={(e) => setWalkInTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Qo'shish
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
