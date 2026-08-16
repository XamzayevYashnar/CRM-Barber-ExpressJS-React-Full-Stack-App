import {
  Appointment,
  AppointmentStatus,
  DailySummary,
  DayRevenue,
  Master,
  MasterDailyPerformance,
} from '../types';

/**
 * Ustaning bir kunlik navbatlari, start_at bo'yicha tartiblangan.
 */
export function getMasterDay(
  masterId: string,
  dayDateStr: string, // "YYYY-MM-DD"
  allAppointments: Appointment[]
): Appointment[] {
  return allAppointments
    .filter((app) => {
      if (app.master_id !== masterId) return false;
      const appDate = new Date(app.start_at).toISOString().slice(0, 10);
      return appDate === dayDateStr;
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}

/**
 * Mijozning oldida nechta aktiv navbat borligini qaytaradi.
 */
export function getQueuePosition(
  appointment: Appointment,
  allAppointments: Appointment[]
): {
  position: number; // 0 means currently being served or next, 1 = 1 person ahead, etc.
  isNext: boolean;
  isCurrent: boolean;
  estimatedWaitMinutes: number;
} {
  if (appointment.status === AppointmentStatus.IN_PROGRESS) {
    return {
      position: 0,
      isNext: false,
      isCurrent: true,
      estimatedWaitMinutes: 0,
    };
  }

  if (appointment.status !== AppointmentStatus.BOOKED) {
    return {
      position: 0,
      isNext: false,
      isCurrent: false,
      estimatedWaitMinutes: 0,
    };
  }

  const apptDateStr = new Date(appointment.start_at).toISOString().slice(0, 10);
  const apptStart = new Date(appointment.start_at).getTime();

  // Shu ustadagi bugungi barcha navbatlar
  const masterDayAppts = allAppointments.filter((app) => {
    if (app.master_id !== appointment.master_id) return false;
    const dateStr = new Date(app.start_at).toISOString().slice(0, 10);
    return dateStr === apptDateStr;
  });

  // Hozir xizmatda bo'lgan mijoz bormi?
  const inProgressAppt = masterDayAppts.find(
    (app) => app.status === AppointmentStatus.IN_PROGRESS
  );

  // Shu mijozdan oldingi BOOKED navbatlar
  const earlierBooked = masterDayAppts.filter((app) => {
    if (app.id === appointment.id) return false;
    if (app.status !== AppointmentStatus.BOOKED) return false;
    return new Date(app.start_at).getTime() < apptStart;
  });

  let position = earlierBooked.length;
  if (inProgressAppt) {
    position += 1;
  }

  const isNext = position === 0;
  const estimatedWaitMinutes = position * 30; // avg 30 min per client

  return {
    position,
    isNext,
    isCurrent: false,
    estimatedWaitMinutes,
  };
}

/**
 * Bir kunlik ko'rsatkichlar: tushum, navbatlar soni, kelmaganlar, ustalar kesimi.
 */
export function getDailySummary(
  businessId: string,
  dayDateStr: string, // "YYYY-MM-DD"
  allAppointments: Appointment[],
  masters: Master[]
): DailySummary {
  const dayAppointments = allAppointments.filter((app) => {
    if (app.business_id !== businessId) return false;
    const dateStr = new Date(app.start_at).toISOString().slice(0, 10);
    return dateStr === dayDateStr;
  });

  let revenue = 0;
  let done = 0;
  let booked = 0;
  let in_progress = 0;
  let no_show = 0;
  let cancelled = 0;

  dayAppointments.forEach((app) => {
    if (app.status === AppointmentStatus.DONE) {
      revenue += app.price_snapshot;
      done++;
    } else if (app.status === AppointmentStatus.BOOKED) {
      booked++;
    } else if (app.status === AppointmentStatus.IN_PROGRESS) {
      in_progress++;
    } else if (app.status === AppointmentStatus.NO_SHOW) {
      no_show++;
    } else if (app.status === AppointmentStatus.CANCELLED) {
      cancelled++;
    }
  });

  const total = dayAppointments.length;
  const activeAndDoneTotal = done + no_show + in_progress + booked;
  const no_show_rate =
    activeAndDoneTotal > 0 ? Math.round((no_show / activeAndDoneTotal) * 1000) / 10 : 0;

  const by_master: MasterDailyPerformance[] = masters.map((master) => {
    const masterAppts = dayAppointments.filter((a) => a.master_id === master.id);
    const mDone = masterAppts.filter((a) => a.status === AppointmentStatus.DONE);
    const mInProgress = masterAppts.filter((a) => a.status === AppointmentStatus.IN_PROGRESS);
    const mRevenue = mDone.reduce((sum, a) => sum + a.price_snapshot, 0);

    return {
      master_id: master.id,
      master_name: master.display_name,
      total_count: masterAppts.length,
      done_count: mDone.length,
      in_progress_count: mInProgress.length,
      revenue: mRevenue,
    };
  });

  return {
    date: dayDateStr,
    revenue,
    total,
    done,
    booked,
    in_progress,
    no_show,
    cancelled,
    no_show_rate,
    by_master,
  };
}

const UZ_DAY_NAMES = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

/**
 * Oxirgi 7 kunning kunlik tushumi — grafik uchun.
 */
export function getLast7Days(
  businessId: string,
  allAppointments: Appointment[],
  referenceDate: Date = new Date()
): DayRevenue[] {
  const result: DayRevenue[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = UZ_DAY_NAMES[d.getDay()];

    const dayAppointments = allAppointments.filter((app) => {
      if (app.business_id !== businessId) return false;
      const appDateStr = new Date(app.start_at).toISOString().slice(0, 10);
      return appDateStr === dateStr;
    });

    const doneAppts = dayAppointments.filter((a) => a.status === AppointmentStatus.DONE);
    const revenue = doneAppts.reduce((sum, a) => sum + a.price_snapshot, 0);

    result.push({
      date: dateStr,
      day_name: dayName,
      revenue,
      count: dayAppointments.length,
      done_count: doneAppts.length,
    });
  }

  return result;
}
