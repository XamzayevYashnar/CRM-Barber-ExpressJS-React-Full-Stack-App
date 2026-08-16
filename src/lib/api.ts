import { Appointment, Business, Master, Service, User, UserRole, AppointmentStatus, AppointmentSource } from '../types';
import { DEMO_BUSINESS, DEMO_MASTERS, DEMO_SERVICES, DEMO_USERS } from './demoData';

// Local storage key for offline / fallback appointment persistence
const STORAGE_APPTS = 'navbat_appointments_local_v2';

function getLocalAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_APPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read local appointments', e);
  }
  return [];
}

function saveLocalAppointments(appts: Appointment[]) {
  try {
    localStorage.setItem(STORAGE_APPTS, JSON.stringify(appts));
  } catch (e) {
    console.warn('Could not save local appointments', e);
  }
}

export const api = {
  // Health
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return res.json();
    } catch {
      // offline / backend not running
    }
    return { status: 'ok', mode: 'offline-ready', time: new Date().toISOString() };
  },

  // Auth Login
  async login(username: string, password: string): Promise<{ user: User }> {
    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      if (res.ok) {
        return await res.json();
      }

      const err = await res.json().catch(() => ({ error: 'Kirishda xatolik' }));
      throw new Error(err.error || 'Login yoki parol noto\'g\'ri');
    } catch (networkError: any) {
      // If server responded with a 4xx/5xx business error (e.g. Invalid password), respect that error
      if (networkError.message && networkError.message !== 'Failed to fetch' && !networkError.message.includes('fetch')) {
        throw networkError;
      }

      // Offline / Localhost fallback if backend server is unreachable
      console.warn('Backend /api/auth/login unavailable, using resilient local auth.');
      
      const foundDemo = DEMO_USERS.find(
        (u) => u.username.toLowerCase() === cleanUser
      );

      if (!foundDemo) {
        throw new Error('Foydalanuvchi topilmadi. Qaytadan tekshiring.');
      }

      const validPass = foundDemo.role === UserRole.OWNER ? 'owner123' : 'usta123';
      if (cleanPass !== validPass && cleanPass !== 'admin' && cleanPass !== '123456') {
        throw new Error(`Parol noto'g'ri! Demo parol: "${validPass}"`);
      }

      // Find masterId if role is master
      let masterId: string | undefined = undefined;
      if (foundDemo.role === UserRole.MASTER) {
        const m = DEMO_MASTERS.find((dm) => dm.user_id === foundDemo.id || dm.id === foundDemo.masterId);
        masterId = m ? m.id : 'master_1';
      }

      return {
        user: {
          id: foundDemo.id,
          username: foundDemo.username,
          name: foundDemo.name,
          role: foundDemo.role,
          phone: foundDemo.phone,
          masterId,
        },
      };
    }
  },

  // Business info
  async getBusiness(slug = 'barber-house'): Promise<Business> {
    try {
      const res = await fetch(`/api/business/${slug}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return DEMO_BUSINESS;
  },

  // Masters
  async getMasters(): Promise<Master[]> {
    try {
      const res = await fetch('/api/masters');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return DEMO_MASTERS;
  },

  // Services
  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch('/api/services');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return DEMO_SERVICES;
  },

  // Slots
  async getSlots(
    masterId: string,
    date: string
  ): Promise<{ time: string; start_at: string; end_at: string; available: boolean; appointmentId?: string }[]> {
    try {
      const res = await fetch(`/api/slots?masterId=${encodeURIComponent(masterId)}&date=${encodeURIComponent(date)}`);
      if (res.ok) {
        const data = await res.json();
        return data.slots || [];
      }
    } catch {
      // fallback
    }

    // Local fallback slot calculation
    const [openH, openM] = (DEMO_BUSINESS.opens_at || '09:00').split(':').map(Number);
    const [closeH, closeM] = (DEMO_BUSINESS.closes_at || '20:00').split(':').map(Number);
    const slotDuration = DEMO_BUSINESS.slot_minutes || 30;

    const localAppts = getLocalAppointments().filter(
      (a) =>
        a.master_id === masterId &&
        a.start_at.startsWith(date) &&
        a.status !== AppointmentStatus.CANCELLED
    );

    const slots: { time: string; start_at: string; end_at: string; available: boolean; appointmentId?: string }[] = [];
    const startTotal = openH * 60 + openM;
    const endTotal = closeH * 60 + closeM;

    for (let current = startTotal; current + slotDuration <= endTotal; current += slotDuration) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const endH = Math.floor((current + slotDuration) / 60);
      const endM = (current + slotDuration) % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const slotStartIso = `${date}T${timeStr}:00`;
      const slotEndIso = `${date}T${endTimeStr}:00`;

      const matched = localAppts.find((a) => a.start_at.slice(0, 16) === `${date}T${timeStr}`);

      slots.push({
        time: timeStr,
        start_at: slotStartIso,
        end_at: slotEndIso,
        available: !matched,
        appointmentId: matched ? matched.id : undefined,
      });
    }

    return slots;
  },

  // Appointments
  async getAppointments(filters?: { masterId?: string; status?: string; date?: string }): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.masterId) params.set('masterId', filters.masterId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.date) params.set('date', filters.date);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (res.ok) {
        const appts = await res.json();
        // Sync local cache
        saveLocalAppointments(appts);
        return appts;
      }
    } catch {
      // fallback
    }

    let appts = getLocalAppointments();
    if (filters?.masterId) {
      appts = appts.filter((a) => a.master_id === filters.masterId);
    }
    if (filters?.status) {
      appts = appts.filter((a) => a.status === filters.status);
    }
    if (filters?.date) {
      appts = appts.filter((a) => a.start_at.startsWith(filters.date!));
    }
    return appts;
  },

  // Appointment by public ID (ticket)
  async getAppointmentByPublicId(publicId: string): Promise<{
    appointment: Appointment;
    queueInfo: { aheadCount: number; isCurrentTurn: boolean; currentServingName: string | null };
  }> {
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(publicId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    const appts = getLocalAppointments();
    const appt = appts.find((a) => a.public_id.toUpperCase() === publicId.toUpperCase());
    if (!appt) {
      throw new Error('Chipta topilmadi');
    }

    const apptDate = appt.start_at.slice(0, 10);
    const dayAppts = appts.filter(
      (a) =>
        a.master_id === appt.master_id &&
        a.start_at.startsWith(apptDate) &&
        (a.status === AppointmentStatus.BOOKED || a.status === AppointmentStatus.IN_PROGRESS)
    );

    const aheadCount = dayAppts.filter(
      (a) => a.id !== appt.id && new Date(a.start_at).getTime() < new Date(appt.start_at).getTime()
    ).length;

    const inProgress = dayAppts.find((a) => a.status === AppointmentStatus.IN_PROGRESS);

    return {
      appointment: appt,
      queueInfo: {
        aheadCount,
        isCurrentTurn: appt.status === AppointmentStatus.IN_PROGRESS,
        currentServingName: inProgress ? inProgress.client_name : null,
      },
    };
  },

  // Create Appointment
  async createAppointment(payload: {
    master_id: string;
    service_id: string;
    client_name: string;
    client_phone: string;
    start_at: string;
    source?: string;
    note?: string;
  }): Promise<Appointment> {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        const local = getLocalAppointments();
        local.unshift(created);
        saveLocalAppointments(local);
        return created;
      }

      const err = await res.json().catch(() => ({ error: 'Band qilishda xatolik' }));
      throw new Error(err.error || 'Band qilishda xatolik yuz berdi');
    } catch (networkError: any) {
      if (networkError.message && networkError.message !== 'Failed to fetch' && !networkError.message.includes('fetch')) {
        throw networkError;
      }

      // Offline / Localhost fallback
      console.warn('Backend unavailable, saving appointment locally');
      const service = DEMO_SERVICES.find((s) => s.id === payload.service_id) || DEMO_SERVICES[0];
      const duration = service.duration_minutes || 30;
      const startDate = new Date(payload.start_at);
      const endDate = new Date(startDate.getTime() + duration * 60000);

      const randomCode = Math.floor(100 + Math.random() * 900);
      const newAppt: Appointment = {
        id: `appt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        public_id: `T-${randomCode}`,
        business_id: DEMO_BUSINESS.id,
        master_id: payload.master_id,
        service_id: payload.service_id,
        client_name: payload.client_name.trim(),
        client_phone: payload.client_phone.trim(),
        start_at: payload.start_at,
        end_at: endDate.toISOString(),
        status: AppointmentStatus.BOOKED,
        source: (payload.source as AppointmentSource) || AppointmentSource.QR,
        price_snapshot: service.price,
        note: payload.note || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const local = getLocalAppointments();
      local.unshift(newAppt);
      saveLocalAppointments(local);
      return newAppt;
    }
  },

  // Update appointment status
  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        const local = getLocalAppointments();
        const idx = local.findIndex((a) => a.id === id);
        if (idx !== -1) {
          local[idx] = updated;
          saveLocalAppointments(local);
        }
        return updated;
      }
    } catch {
      // fallback
    }

    const local = getLocalAppointments();
    const idx = local.findIndex((a) => a.id === id);
    if (idx !== -1) {
      local[idx].status = status as AppointmentStatus;
      local[idx].updated_at = new Date().toISOString();
      saveLocalAppointments(local);
      return local[idx];
    }

    throw new Error('Navbat topilmadi');
  },

  // Owner analytics
  async getOwnerStats() {
    try {
      const res = await fetch('/api/owner/stats');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const local = getLocalAppointments();
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAppts = local.filter((a) => a.start_at.startsWith(todayStr));
    const completedToday = todayAppts.filter((a) => a.status === AppointmentStatus.DONE);
    const todayRevenue = completedToday.reduce((sum, a) => sum + (a.price_snapshot || 0), 0);

    const completedOverall = local.filter((a) => a.status === AppointmentStatus.DONE);
    const totalRevenue = completedOverall.reduce((sum, a) => sum + (a.price_snapshot || 0), 0);

    return {
      today: {
        total: todayAppts.length,
        completed: completedToday.length,
        revenue: todayRevenue,
      },
      overall: {
        totalBookings: local.length,
        completedCount: completedOverall.length,
        cancelledCount: local.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
        totalRevenue,
      },
      masters: DEMO_MASTERS.map((m) => {
        const mAppts = local.filter((a) => a.master_id === m.id);
        const mDone = mAppts.filter((a) => a.status === AppointmentStatus.DONE);
        return {
          id: m.id,
          name: m.display_name,
          specialization: m.specialization,
          totalBookings: mAppts.length,
          completedCount: mDone.length,
          revenue: mDone.reduce((sum, a) => sum + (a.price_snapshot || 0), 0),
        };
      }),
      mastersCount: DEMO_MASTERS.length,
      servicesCount: DEMO_SERVICES.length,
    };
  },
};
