import React, { useState, useEffect } from 'react';
import { Master, Service } from '../types';
import { store } from '../lib/store';
import { createAppointment, getAvailableSlots } from '../lib/services';
import { formatMoney, formatTime, formatDateUz } from '../lib/utils';
import { 
  Scissors, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  User as UserIcon, 
  Check, 
  Sparkles, 
  AlertCircle,
  ChevronRight,
  Star,
  ShieldCheck
} from 'lucide-react';

interface ClientBookingProps {
  onBookingSuccess: (publicId: string) => void;
}

export const ClientBooking: React.FC<ClientBookingProps> = ({ onBookingSuccess }) => {
  const business = store.getBusiness();
  const masters = store.getMasters();
  const services = store.getServices();

  const [selectedService, setSelectedService] = useState<Service>(services[2] || services[0]); // Default "Soch+Soqol"
  const [selectedMaster, setSelectedMaster] = useState<Master>(masters[0]); // Default Sardor Aliyev
  
  // Dates: Bugun, Ertaga, Indinga
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().slice(0, 10)
  );

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [clientName, setClientName] = useState<string>('Aziz Karimov');
  const [clientPhone, setClientPhone] = useState<string>('+998 90 912 34 56');
  const [clientNote, setClientNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Re-calculate available slots whenever master, service, or date changes, or store updates
  useEffect(() => {
    const updateSlots = () => {
      const allAppts = store.getAppointments();
      const slots = getAvailableSlots(
        business,
        selectedMaster,
        selectedService,
        selectedDateStr,
        allAppts
      );
      setAvailableSlots(slots);
      if (slots.length > 0) {
        // If current selected slot is not in new slots, select the first available or a preferred slot
        if (!slots.includes(selectedSlot)) {
          // Prefer slot around 15:30 if available, else first
          const preferred = slots.find((s) => s.includes('T15:30:00')) || slots[0];
          setSelectedSlot(preferred);
        }
      } else {
        setSelectedSlot('');
      }
    };

    updateSlots();
    const unsubscribe = store.subscribe(updateSlots);
    return () => unsubscribe();
  }, [selectedMaster, selectedService, selectedDateStr, business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedSlot) {
      setErrorMessage("Iltimos, o'zingizga qulay vaqt oralig'ini tanlang.");
      return;
    }

    if (!clientName.trim()) {
      setErrorMessage("Iltimos, ismingizni kiriting.");
      return;
    }

    if (!clientPhone.trim()) {
      setErrorMessage("Iltimos, telefon raqamingizni kiriting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newAppointment = await store.createAppointment({
        master_id: selectedMaster.id,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        start_at: selectedSlot,
        note: clientNote,
        source: 'qr',
      });

      setIsSubmitting(false);
      onBookingSuccess(newAppointment.public_id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Navbatga yozilishda xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      
      {/* Barber Shop Hero Card */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
          <Scissors className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Onlayn navbat ochiq
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>4.9 / 5.0</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {business.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-md">
            Mahalla sartaroshxonasi — navbat kutmasdan, o'zingizga qulay vaqtda keling.
          </p>

          <div className="mt-4 pt-4 border-t border-stone-800 flex flex-wrap gap-y-2 gap-x-4 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{business.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Ish vaqti: {business.opens_at} - {business.closes_at}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{business.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* STEP 1: Xizmatni tanlash */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h2 className="text-base font-bold text-stone-900">Xizmatni tanlang</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
              const isSelected = selectedService.id === service.id;
              return (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-stone-900 leading-snug">
                      {service.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration_minutes} daqiqa
                    </span>
                    <span className="font-bold text-stone-900 tabular-nums text-sm">
                      {formatMoney(service.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Ustani tanlash */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="text-base font-bold text-stone-900">Ustani tanlang</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {masters.map((master) => {
              const isSelected = selectedMaster.id === master.id;
              return (
                <button
                  type="button"
                  key={master.id}
                  onClick={() => setSelectedMaster(master)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold text-xs">
                      {master.display_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 leading-tight">
                        {master.display_name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-0.5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{master.rating || '4.9'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                    {master.specialization}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Sana va Bo'sh vaqtlarni tanlash */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h2 className="text-base font-bold text-stone-900">Sana va vaqtni tanlang</h2>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { label: 'Bugun', dateStr: today.toISOString().slice(0, 10), dateObj: today },
              { label: 'Ertaga', dateStr: tomorrow.toISOString().slice(0, 10), dateObj: tomorrow },
              { label: 'Indinga', dateStr: dayAfter.toISOString().slice(0, 10), dateObj: dayAfter },
            ].map((d) => {
              const isSelected = selectedDateStr === d.dateStr;
              return (
                <button
                  type="button"
                  key={d.dateStr}
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className="ml-1.5 opacity-70 font-normal">({d.dateObj.getDate()}-kun)</span>
                </button>
              );
            })}
          </div>

          {/* Available Slots Grid */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2.5 flex items-center justify-between">
              <span>Mavjud bo'sh vaqtlar ({availableSlots.length} ta):</span>
              <span className="text-[11px] font-normal text-stone-400">
                Usta: {selectedMaster.display_name}
              </span>
            </p>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slotIso) => {
                  const isSelected = selectedSlot === slotIso;
                  const timeFormatted = formatTime(slotIso);
                  return (
                    <button
                      type="button"
                      key={slotIso}
                      onClick={() => setSelectedSlot(slotIso)}
                      className={`py-2.5 px-2 rounded-xl text-center text-xs font-bold tabular-nums transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/30'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-white hover:border-emerald-400'
                      }`}
                    >
                      {timeFormatted}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                Ushbu kunda barcha vaqtlar band yoki ish vaqti tugagan. Iltimos, boshqa kun yoki boshqa ustani tanlang.
              </div>
            )}
          </div>
        </div>

        {/* STEP 4: Mijoz ma'lumotlari */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
              4
            </div>
            <h2 className="text-base font-bold text-stone-900">Mijoz ma'lumotlari</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Ismingiz *
              </label>
              <input
                type="text"
                required
                placeholder="masalan: Aziz Karimov"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Telefon raqamingiz *
              </label>
              <input
                type="tel"
                required
                placeholder="+998 90 123 45 67"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-stone-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Qo'shimcha istak yoki izoh (ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="masalan: Soch oldirish va soqol tekislash"
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-stone-700"
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary and Submit Button */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400">Tanlangan xizmat va vaqt:</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {selectedService.name} • {selectedMaster.display_name}
            </p>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              {formatDateUz(selectedDateStr)} • {selectedSlot ? formatTime(selectedSlot) : '--:--'} ({formatMoney(selectedService.price)})
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSlot}
            id="book-submit-btn"
            className="w-full sm:w-auto min-h-14 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Scissors className="w-5 h-5" />
            <span>{isSubmitting ? "Yozilmoqda..." : "Navbatga yozilish"}</span>
          </button>
        </div>

        <div className="text-center text-xs text-stone-500 pt-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hech qanday ro'yxatdan o'tish talab qilinmaydi. To'lov sartaroshxonada amalga oshiriladi.</span>
          </p>
        </div>

      </form>
    </div>
  );
};
