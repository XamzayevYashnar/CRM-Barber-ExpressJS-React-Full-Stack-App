import React, { useState, useEffect } from 'react';
import { AppointmentStatus, DailySummary, DayRevenue, UserRole } from '../types';
import { store } from '../lib/store';
import { getDailySummary, getLast7Days } from '../lib/selectors';
import { formatMoney, formatTime, formatDateUz } from '../lib/utils';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  UserX, 
  QrCode, 
  Calendar, 
  Scissors, 
  Download, 
  ArrowUpRight,
  Sparkles,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';

interface OwnerDashboardProps {
  onOpenLogin: () => void;
  onOpenQR: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onOpenLogin,
  onOpenQR,
}) => {
  const currentUser = store.getCurrentUser();
  const business = store.getBusiness();
  const masters = store.getMasters();

  // Protect Owner access
  const userRole = currentUser?.role ? String(currentUser.role).toLowerCase() : '';
  if (!currentUser || userRole !== 'owner') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Ega hisobi talab qilinadi</h2>
        <p className="text-xs text-stone-500 mb-6">
          Ega boshqaruv panelini ko'rish uchun iltimos, ega hisobi (owner / owner123) orqali kiring.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
        >
          Ega sifatida kirish
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [last7Days, setLast7Days] = useState<DayRevenue[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const refreshData = () => {
      const allAppts = store.getAppointments();
      const s = getDailySummary(business.id, selectedDate, allAppts, masters);
      const hist = getLast7Days(business.id, allAppts);
      setSummary(s);
      setLast7Days(hist);
    };

    refreshData();
    const unsubscribe = store.subscribe(refreshData);
    return () => unsubscribe();
  }, [selectedDate, business.id, masters]);

  if (!summary) return null;

  // Max revenue in 7 days for chart scaling
  const maxRev = Math.max(...last7Days.map((d) => d.revenue), 100000);

  // Filtered appointments for selected day
  const allDayAppointments = store.getAppointments().filter((a) => {
    const dStr = new Date(a.start_at).toISOString().slice(0, 10);
    return dStr === selectedDate && a.business_id === business.id;
  });

  const filteredDayAppts = allDayAppointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const m = store.getMasterById(a.master_id)?.display_name.toLowerCase() || '';
      const s = store.getServiceById(a.service_id)?.name.toLowerCase() || '';
      return (
        a.client_name.toLowerCase().includes(q) ||
        a.client_phone.includes(q) ||
        m.includes(q) ||
        s.includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Vaqt', 'Mijoz', 'Telefon', 'Usta', 'Xizmat', 'Narx (so\'m)', 'Holat'];
    const rows = filteredDayAppts.map((a) => {
      const m = store.getMasterById(a.master_id)?.display_name || '';
      const s = store.getServiceById(a.service_id)?.name || '';
      return [
        formatTime(a.start_at),
        `"${a.client_name.replace(/"/g, '""')}"`,
        `"${a.client_phone}"`,
        `"${m.replace(/"/g, '""')}"`,
        `"${s.replace(/"/g, '""')}"`,
        a.price_snapshot,
        `"${a.status}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `navbat-hisobot-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">
              Ega boshqaruv paneli
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono">
              {business.name}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Hisobot: {formatDateUz(selectedDate)} holatiga ko'ra
          </p>
        </div>

        {/* Date Selector and Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <Calendar className="w-4 h-4 text-stone-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-stone-800 bg-transparent focus:outline-none"
            />
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              selectedDate === todayStr
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            Bugun
          </button>

          <button
            onClick={handleExportCSV}
            title="Kunlik hisobotni CSV formatida yuklab olish"
            className="px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Eksport (CSV)</span>
          </button>

          <button
            id="owner-door-qr-btn"
            onClick={onOpenQR}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Eshik QR stendi</span>
          </button>

        </div>
      </div>

      {/* 4 HIGH-IMPACT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs relative overflow-hidden">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Kunlik sof tushum
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
              {formatMoney(summary.revenue)}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{summary.done} ta to'langan xizmatdan</span>
          </p>
        </div>

        {/* Card 2: Total Appointments */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Jami navbatlar
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
              {summary.total}
            </span>
            <span className="text-xs text-stone-400 font-bold">ta navbat</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-2">
            {summary.booked} ta kutilmoqda • {summary.in_progress} ta xizmatda
          </p>
        </div>

        {/* Card 3: Completed Services */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Yakunlandi (DONE)
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 tabular-nums">
              {summary.done}
            </span>
            <span className="text-xs text-emerald-600 font-bold">ta mijoz</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-2">
            Muvaffaqiyatli xizmat ko'rsatildi
          </p>
        </div>

        {/* Card 4: No-show rate */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Kelmaganlar foizi
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
              {summary.no_show_rate}%
            </span>
            <span className="text-xs text-rose-500 font-bold">({summary.no_show} ta)</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-2">
            {summary.cancelled} ta bekor qilingan
          </p>
        </div>

      </div>

      {/* SECTION 2: 7-KUNLIK TUSHUM DINAMIKASI (CSS BAR CHART) */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Oxirgi 7 kunlik tushum dinamikasi
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Kunlar bo'yicha tushum va qabul qilingan mijozlar soni
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Jami 7 kun: {formatMoney(last7Days.reduce((s, d) => s + d.revenue, 0))}
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-8 pb-2 h-56 border-b border-stone-100">
          {last7Days.map((d) => {
            const heightPercent = Math.max(Math.round((d.revenue / maxRev) * 100), 8);
            const isSelected = d.date === selectedDate;

            return (
              <div
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="text-[11px] font-bold text-stone-900 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white px-2 py-0.5 rounded-md whitespace-nowrap shadow-md pointer-events-none">
                  {formatMoney(d.revenue)} ({d.done_count} ta)
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[48px] bg-stone-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isSelected
                        ? 'bg-emerald-600 ring-2 ring-emerald-600/30 shadow-sm'
                        : 'bg-stone-800 group-hover:bg-emerald-500'
                    }`}
                  ></div>
                </div>

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span className={`text-xs font-bold block ${isSelected ? 'text-emerald-700' : 'text-stone-700'}`}>
                    {d.day_name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {d.date.slice(8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: USTALAR KESIMI JADVALI */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-stone-900">
            Ustalar bo'yicha yuklama va tushum ({formatDateUz(selectedDate)})
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Har bir ustaning qabul qilgan mijozlari va keltirgan tushumi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Usta</th>
                <th className="py-3 px-3">Mutaxassisligi</th>
                <th className="py-3 px-3 text-center">Jami navbat</th>
                <th className="py-3 px-3 text-center">Yakunlangan</th>
                <th className="py-3 px-3 text-center">Hozir xizmatda</th>
                <th className="py-3 px-3 text-right">Tushum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {summary.by_master.map((m) => {
                const masterProfile = store.getMasterById(m.master_id);
                return (
                  <tr key={m.master_id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {m.master_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{m.master_name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">{masterProfile?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-stone-500">
                      {masterProfile?.specialization}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-stone-900 tabular-nums">
                      {m.total_count} ta
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-700 tabular-nums">
                      {m.done_count} ta
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-600 tabular-nums">
                      {m.in_progress_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          1 ta band
                        </span>
                      ) : (
                        <span className="text-stone-400 font-normal">Bo'sh</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-stone-900 tabular-nums text-sm">
                      {formatMoney(m.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: KUNLIK BARCHA NAVBATLAR JURNALI */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Shu kundagi barcha navbatlar ({filteredDayAppts.length} ta)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Qidiruv va holatlar bo'yicha saralash
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Mijoz, usta yoki xizmat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none font-medium"
            >
              <option value="all">Barcha holatlar</option>
              <option value={AppointmentStatus.DONE}>Yakunlandi</option>
              <option value={AppointmentStatus.IN_PROGRESS}>Xizmatda</option>
              <option value={AppointmentStatus.BOOKED}>Navbatda</option>
              <option value={AppointmentStatus.NO_SHOW}>Kelmadi</option>
              <option value={AppointmentStatus.CANCELLED}>Bekor qilindi</option>
            </select>
          </div>
        </div>

        {filteredDayAppts.length > 0 ? (
          <div className="divide-y divide-stone-100 text-xs">
            {filteredDayAppts.map((a) => {
              const m = store.getMasterById(a.master_id);
              const s = store.getServiceById(a.service_id);
              return (
                <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-stone-900 font-mono w-12 shrink-0">
                      {formatTime(a.start_at)}
                    </span>
                    <div>
                      <p className="font-bold text-stone-900">{a.client_name}</p>
                      <p className="text-stone-500 text-[11px]">
                        Usta: <span className="font-medium text-stone-800">{m?.display_name}</span> • {s?.name} ({formatMoney(a.price_snapshot)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-stone-500 font-mono hidden sm:inline">{a.client_phone}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.status === AppointmentStatus.DONE
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status === AppointmentStatus.IN_PROGRESS
                        ? 'bg-amber-100 text-amber-800'
                        : a.status === AppointmentStatus.BOOKED
                        ? 'bg-stone-100 text-stone-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {a.status === AppointmentStatus.DONE && 'Yakunlandi'}
                      {a.status === AppointmentStatus.IN_PROGRESS && 'Xizmatda'}
                      {a.status === AppointmentStatus.BOOKED && 'Navbatda'}
                      {a.status === AppointmentStatus.NO_SHOW && 'Kelmadi'}
                      {a.status === AppointmentStatus.CANCELLED && 'Bekor'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400">
            Hech qanday navbat topilmadi.
          </div>
        )}

      </div>

    </div>
  );
};
