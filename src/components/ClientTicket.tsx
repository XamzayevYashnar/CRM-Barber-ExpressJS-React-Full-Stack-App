import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { store } from '../lib/store';
import { getQueuePosition } from '../lib/selectors';
import { cancelByClient } from '../lib/services';
import { formatMoney, formatTime, formatDateUz } from '../lib/utils';
import { 
  Scissors, 
  Clock, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Share2, 
  ArrowLeft,
  Sparkles,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ClientTicketProps {
  publicId: string;
  onBackToBooking: () => void;
}

export const ClientTicket: React.FC<ClientTicketProps> = ({
  publicId,
  onBackToBooking,
}) => {
  const [appointment, setAppointment] = useState<Appointment | undefined>(() =>
    store.getAppointmentByPublicId(publicId)
  );
  const [queueInfo, setQueueInfo] = useState<{
    position: number;
    isNext: boolean;
    isCurrent: boolean;
    estimatedWaitMinutes: number;
  }>({ position: 0, isNext: false, isCurrent: false, estimatedWaitMinutes: 0 });

  const [cancelError, setCancelError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync listener + Polling simulation (every 5 seconds)
  useEffect(() => {
    const refreshTicket = () => {
      const appt = store.getAppointmentByPublicId(publicId);
      setAppointment(appt);
      if (appt) {
        const allAppts = store.getAppointments();
        const info = getQueuePosition(appt, allAppts);
        setQueueInfo(info);
      }
      setLastSyncTime(new Date());
    };

    refreshTicket();
    const unsubscribe = store.subscribe(refreshTicket);

    const interval = setInterval(() => {
      setIsRefreshing(true);
      refreshTicket();
      setTimeout(() => setIsRefreshing(false), 500);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [publicId]);

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Chipta topilmadi</h2>
        <p className="text-xs text-stone-500 mb-6">
          Bunday raqamli chipta mavjud emas yoki muddati o'tgan.
        </p>
        <button
          onClick={onBackToBooking}
          className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors"
        >
          Yangi navbat olish
        </button>
      </div>
    );
  }

  const business = store.getBusiness();
  const master = store.getMasterById(appointment.master_id);
  const service = store.getServiceById(appointment.service_id);

  const handleCancel = async () => {
    setCancelError('');
    if (!window.confirm("Rostdan ham ushbu navbatni bekor qilmoqchimisiz?")) {
      return;
    }

    try {
      await store.updateAppointmentStatus(appointment.id, 'cancelled');
    } catch (err: any) {
      setCancelError(err.message || "Bekor qilishda xatolik yuz berdi.");
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Status visual themes
  const isBooked = appointment.status === AppointmentStatus.BOOKED;
  const isInProgress = appointment.status === AppointmentStatus.IN_PROGRESS;
  const isDone = appointment.status === AppointmentStatus.DONE;
  const isCancelled = appointment.status === AppointmentStatus.CANCELLED;
  const isNoShow = appointment.status === AppointmentStatus.NO_SHOW;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Top back action & live indicator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToBooking}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bosh sahifaga qaytish</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
          <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></span>
          <span>Jonli yangilanish: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden relative">
        
        {/* Ticket Header Banner */}
        <div className={`p-6 sm:p-7 text-center relative overflow-hidden transition-colors ${
          isInProgress
            ? 'bg-amber-500 text-white'
            : isDone
            ? 'bg-emerald-600 text-white'
            : isCancelled || isNoShow
            ? 'bg-stone-800 text-white'
            : 'bg-stone-900 text-white'
        }`}>
          
          <div className="relative z-10">
            
            {/* Status pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-white/20 backdrop-blur-xs text-white">
              {isInProgress && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isCancelled && <XCircle className="w-3.5 h-3.5" />}
              <span>
                {isBooked && 'Navbatda'}
                {isInProgress && 'Hozir xizmatda'}
                {isDone && 'Xizmat yakunlandi'}
                {isCancelled && 'Bekor qilindi'}
                {isNoShow && 'Kelmadi'}
              </span>
            </div>

            {/* Huge Queue Hero Metric */}
            {isBooked && (
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-300 font-medium mb-1">
                  Navbatdagi o'rningiz
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight">
                    {queueInfo.position === 0 ? '0' : `${queueInfo.position}`}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-stone-300">
                    {queueInfo.position === 0 ? "Navbatingiz keldi!" : `kishi sizdan oldinda`}
                  </span>
                </div>

                <div className="mt-3 inline-block px-4 py-1.5 bg-white/10 backdrop-blur-xs rounded-xl text-xs font-semibold text-emerald-300">
                  {queueInfo.position === 0 ? (
                    <span>🚀 Iltimos, sartaroshxonaga yaqinlashing!</span>
                  ) : (
                    <span>⏱️ Taxminiy kutish vaqti: ~{queueInfo.estimatedWaitMinutes} daqiqa</span>
                  )}
                </div>
              </div>
            )}

            {isInProgress && (
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Hozir sizning navbatingiz!
                </h2>
                <p className="text-xs text-amber-100 mt-1">
                  Usta {master?.display_name} sizga xizmat ko'rsatmoqda.
                </p>
              </div>
            )}

            {isDone && (
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Xizmatingiz yakunlandi
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  Tashrifingiz uchun rahmat! Salomat bo'ling.
                </p>
              </div>
            )}

            {(isCancelled || isNoShow) && (
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {isCancelled ? "Navbat bekor qilindi" : "Belgilangan vaqtda kelinmadi"}
                </h2>
                <p className="text-xs text-stone-300 mt-1">
                  Istalgan vaqtda yangi navbatga yozilishingiz mumkin.
                </p>
              </div>
            )}

          </div>

          {/* Background Scissors watermark */}
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <Scissors className="w-48 h-48" />
          </div>
        </div>

        {/* Ticket Perforated Divider */}
        <div className="relative flex items-center justify-between px-2 bg-white">
          <div className="w-5 h-5 -ml-4 rounded-full bg-stone-50 border-r border-stone-200"></div>
          <div className="flex-1 border-b-2 border-dashed border-stone-200 mx-2"></div>
          <div className="w-5 h-5 -mr-4 rounded-full bg-stone-50 border-l border-stone-200"></div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 sm:p-7 space-y-4">
          
          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-stone-100">
            <div>
              <p className="text-stone-400 font-medium">Mijoz</p>
              <p className="font-bold text-stone-900 text-sm mt-0.5">{appointment.client_name}</p>
              <p className="text-stone-500 font-mono">{appointment.client_phone}</p>
            </div>
            <div>
              <p className="text-stone-400 font-medium">Usta</p>
              <p className="font-bold text-stone-900 text-sm mt-0.5">{master?.display_name || 'Usta'}</p>
              <p className="text-stone-500">{master?.specialization}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-stone-100">
            <div>
              <p className="text-stone-400 font-medium">Xizmat</p>
              <p className="font-bold text-stone-900 text-sm mt-0.5">{service?.name || 'Xizmat'}</p>
              <p className="text-stone-500">{service?.duration_minutes} daqiqa</p>
            </div>
            <div>
              <p className="text-stone-400 font-medium">To'lov (Kassada)</p>
              <p className="font-extrabold text-stone-900 text-base tabular-nums mt-0.5 text-emerald-700">
                {formatMoney(appointment.price_snapshot)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-stone-100">
            <div>
              <p className="text-stone-400 font-medium">Belgilangan vaqt</p>
              <p className="font-bold text-stone-900 text-sm mt-0.5">
                {formatDateUz(appointment.start_at)}
              </p>
              <p className="text-emerald-700 font-bold text-sm">
                Soat {formatTime(appointment.start_at)} - {formatTime(appointment.end_at)}
              </p>
            </div>
            <div>
              <p className="text-stone-400 font-medium">Sartaroshxona</p>
              <p className="font-bold text-stone-900 text-sm mt-0.5">{business.name}</p>
              <p className="text-stone-500 text-[11px] leading-tight">{business.address}</p>
            </div>
          </div>

          {/* Cancellation error message */}
          {cancelError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {cancelError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            
            {/* Share / Copy Ticket Link */}
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Chipta havolasi nusxalandi!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-stone-500" />
                  <span>Chipta havolasini nusxalash</span>
                </>
              )}
            </button>

            {/* Cancel button if eligible */}
            {isBooked && (
              <button
                onClick={handleCancel}
                id="cancel-ticket-btn"
                className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-stone-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-all"
              >
                Navbatni bekor qilish
              </button>
            )}

            {/* New booking button if completed/cancelled */}
            {(isDone || isCancelled || isNoShow) && (
              <button
                onClick={onBackToBooking}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Yangi navbat olish
              </button>
            )}

          </div>

        </div>

      </div>

      <div className="text-center mt-6 text-xs text-stone-400">
        <p>Chipta kodi: <span className="font-mono text-stone-600 font-semibold">{appointment.public_id}</span></p>
        <p className="mt-1">Sahifani yopishingiz mumkin, havolani saqlab qo'ysangiz istalgan payt ko'ra olasiz.</p>
      </div>

    </div>
  );
};
