export enum UserRole {
  OWNER = 'owner',
  MASTER = 'master',
  CLIENT = 'client',
}

export enum AppointmentStatus {
  BOOKED = 'booked',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentSource {
  QR = 'qr',
  WALK_IN = 'walk_in',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  masterId?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  opens_at: string; // e.g. "09:00"
  closes_at: string; // e.g. "20:00"
  slot_minutes: number; // 30
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number; // in so'm (Decimal equivalent)
  is_active: boolean;
  category?: string;
  icon?: string;
}

export interface Master {
  id: string;
  user_id: string;
  business_id: string;
  display_name: string;
  specialization: string;
  is_active: boolean;
  phone: string;
  rating?: number;
  avatar?: string;
}

export interface Appointment {
  id: string;
  public_id: string; // UUID for client ticket URL
  business_id: string;
  master_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  start_at: string; // ISO String (UTC/Local)
  end_at: string; // ISO String
  status: AppointmentStatus;
  source: AppointmentSource;
  price_snapshot: number; // Price locked at booking
  note: string;
  created_at: string;
  updated_at: string;
}

export interface MasterDailyPerformance {
  master_id: string;
  master_name: string;
  total_count: number;
  done_count: number;
  in_progress_count: number;
  revenue: number;
}

export interface DailySummary {
  date: string;
  revenue: number;
  total: number;
  done: number;
  booked: number;
  in_progress: number;
  no_show: number;
  cancelled: number;
  no_show_rate: number;
  by_master: MasterDailyPerformance[];
}

export interface DayRevenue {
  date: string;
  day_name: string;
  revenue: number;
  count: number;
  done_count: number;
}
