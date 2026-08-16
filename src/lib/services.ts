import {
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  Business,
  Master,
  Service,
  User,
  UserRole,
} from '../types';
import {
  BookingError,
  InvalidStatusTransitionError,
  OutsideWorkingHoursError,
  PastSlotError,
  PermissionDeniedError,
  SlotUnavailableError,
} from './exceptions';

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.BOOKED]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_PROGRESS]: [
    AppointmentStatus.DONE,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.DONE]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

/**
 * Berilgan kun uchun ustaning bo'sh vaqt oraliqlarini qaytaradi.
 */
export function getAvailableSlots(
  business: Business,
  master: Master,
  service: Service,
  dayDateStr: string, // "YYYY-MM-DD"
  allAppointments: Appointment[],
  now: Date = new Date()
): string[] {
  const [openHour, openMin] = business.opens_at.split(':').map(Number);
  const [closeHour, closeMin] = business.closes_at.split(':').map(Number);

  const startOfDay = new Date(`${dayDateStr}T00:00:00`);
  const openTime = new Date(startOfDay);
  openTime.setHours(openHour, openMin, 0, 0);

  const closeTime = new Date(startOfDay);
  closeTime.setHours(closeHour, closeMin, 0, 0);

  // Ustaning shu kundagi aktiv navbatlarini olish
  const masterActiveAppts = allAppointments.filter((app) => {
    if (app.master_id !== master.id) return false;
    if (app.status === AppointmentStatus.CANCELLED || app.status === AppointmentStatus.NO_SHOW) {
      return false;
    }
    const appStart = new Date(app.start_at);
    return appStart.toISOString().slice(0, 10) === dayDateStr;
  });

  const slots: string[] = [];
  const durationMs = service.duration_minutes * 60 * 1000;
  const stepMs = business.slot_minutes * 60 * 1000;

  let currentSlotStart = new Date(openTime);

  while (currentSlotStart.getTime() + durationMs <= closeTime.getTime()) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMs);

    // O'tib ketgan vaqt bo'lsa (faqat bugun uchun tekshirish)
    const isPast = currentSlotStart.getTime() <= now.getTime();

    if (!isPast) {
      // Kesishuvni tekshirish
      const hasConflict = masterActiveAppts.some((app) => {
        const appStart = new Date(app.start_at).getTime();
        const appEnd = new Date(app.end_at).getTime();
        const slotStart = currentSlotStart.getTime();
        const slotEnd = currentSlotEnd.getTime();
        return slotStart < appEnd && slotEnd > appStart;
      });

      if (!hasConflict) {
        slots.push(currentSlotStart.toISOString());
      }
    }

    currentSlotStart = new Date(currentSlotStart.getTime() + stepMs);
  }

  return slots;
}

/**
 * Yangi navbat yaratadi; band yoki noto'g'ri vaqt bo'lsa BookingError ko'taradi.
 */
export function createAppointment({
  business,
  master,
  service,
  client_name,
  client_phone,
  start_at,
  source = AppointmentSource.QR,
  note = '',
  allAppointments,
  now = new Date(),
}: {
  business: Business;
  master: Master;
  service: Service;
  client_name: string;
  client_phone: string;
  start_at: string; // ISO string
  source?: AppointmentSource;
  note?: string;
  allAppointments: Appointment[];
  now?: Date;
}): Appointment {
  const startDate = new Date(start_at);
  if (isNaN(startDate.getTime())) {
    throw new PastSlotError("Vaqt noto'g'ri formatda berilgan.");
  }

  // 1. O'tmishdagi vaqtni tekshirish
  if (startDate.getTime() < now.getTime() - 60000) {
    // 1 min margin
    throw new PastSlotError("O'tib ketgan vaqtga navbat olib bo'lmaydi.");
  }

  // 2. Ish vaqti ichidami
  const [openHour, openMin] = business.opens_at.split(':').map(Number);
  const [closeHour, closeMin] = business.closes_at.split(':').map(Number);

  const slotOpen = new Date(startDate);
  slotOpen.setHours(openHour, openMin, 0, 0);

  const slotClose = new Date(startDate);
  slotClose.setHours(closeHour, closeMin, 0, 0);

  const endDate = new Date(startDate.getTime() + service.duration_minutes * 60 * 1000);

  if (startDate.getTime() < slotOpen.getTime() || endDate.getTime() > slotClose.getTime()) {
    throw new OutsideWorkingHoursError("Tanlangan vaqt sartaroshxona ish vaqtidan tashqarida.");
  }

  // 3. Usta shu vaqtda bo'shmi tekshirish
  const hasOverlap = allAppointments.some((app) => {
    if (app.master_id !== master.id) return false;
    if (app.status === AppointmentStatus.CANCELLED || app.status === AppointmentStatus.NO_SHOW) {
      return false;
    }
    const appStart = new Date(app.start_at).getTime();
    const appEnd = new Date(app.end_at).getTime();
    const newStart = startDate.getTime();
    const newEnd = endDate.getTime();
    return newStart < appEnd && newEnd > appStart;
  });

  if (hasOverlap) {
    throw new SlotUnavailableError("Tanlangan vaqt oralig'i band. Iltimos, boshqa vaqtni tanlang.");
  }

  const newAppointment: Appointment = {
    id: 'appt_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    public_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 't_' + Math.random().toString(36).substring(2, 12),
    business_id: business.id,
    master_id: master.id,
    service_id: service.id,
    client_name: client_name.trim(),
    client_phone: client_phone.trim(),
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    status: AppointmentStatus.BOOKED,
    source,
    price_snapshot: service.price,
    note: note.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return newAppointment;
}

/**
 * Navbat holatini o'zgartiradi, faqat ruxsat etilgan o'tishlarga yo'l qo'yadi.
 */
export function transitionStatus({
  appointment,
  newStatus,
  byUser,
  master,
}: {
  appointment: Appointment;
  newStatus: AppointmentStatus;
  byUser: User;
  master?: Master;
}): Appointment {
  // Huquqni tekshirish
  if (byUser.role === UserRole.MASTER) {
    if (master && appointment.master_id !== master.id) {
      throw new PermissionDeniedError("Usta faqat o'ziga tegishli navbatlarni o'zgartira oladi.");
    }
  } else if (byUser.role !== UserRole.OWNER) {
    throw new PermissionDeniedError("Ushbu amalni bajarish uchun ruxsat berilmagan.");
  }

  // Ruxsat etilgan holat o'tishlarini tekshirish
  const allowed = ALLOWED_TRANSITIONS[appointment.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidStatusTransitionError(
      `"${appointment.status}" holatidan "${newStatus}" holatiga o'tish taqiqlangan.`
    );
  }

  return {
    ...appointment,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Mijoz o'z navbatini public_id orqali bekor qiladi (login talab qilinmaydi).
 */
export function cancelByClient({
  appointment,
  now = new Date(),
}: {
  appointment: Appointment;
  now?: Date;
}): Appointment {
  if (appointment.status !== AppointmentStatus.BOOKED) {
    throw new InvalidStatusTransitionError("Faqat kutilayotgan navbatni bekor qilish mumkin.");
  }

  const apptStart = new Date(appointment.start_at).getTime();
  const diffMinutes = (apptStart - now.getTime()) / (60 * 1000);

  if (diffMinutes < 15) {
    throw new BookingError("Navbat boshlanishiga 15 daqiqadan kam vaqt qolganda uni onlayn bekor qilib bo'lmaydi.");
  }

  return {
    ...appointment,
    status: AppointmentStatus.CANCELLED,
    updated_at: new Date().toISOString(),
  };
}
