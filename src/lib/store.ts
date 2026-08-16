import {
  Appointment,
  Business,
  Master,
  Service,
  User,
  UserRole,
} from '../types';
import {
  DEMO_BUSINESS,
  DEMO_MASTERS,
  DEMO_SERVICES,
} from './demoData';
import { api } from './api';

const STORAGE_KEY_USER = 'navbat_current_user_v1';

type Listener = () => void;

class AppStore {
  private appointments: Appointment[] = [];
  private currentUser: User | null = null;
  private business: Business = DEMO_BUSINESS;
  private masters: Master[] = DEMO_MASTERS;
  private services: Service[] = DEMO_SERVICES;
  private listeners: Set<Listener> = new Set();
  private isLoadedFromBackend = false;

  constructor() {
    this.loadUser();
    this.syncFromBackend();
  }

  public async syncFromBackend() {
    try {
      const [biz, mastersList, servicesList, appts] = await Promise.all([
        api.getBusiness().catch(() => null),
        api.getMasters().catch(() => null),
        api.getServices().catch(() => null),
        api.getAppointments().catch(() => null),
      ]);

      if (biz) this.business = biz;
      if (mastersList && mastersList.length > 0) this.masters = mastersList;
      if (servicesList && servicesList.length > 0) this.services = servicesList;
      if (appts) this.appointments = appts;

      this.isLoadedFromBackend = true;
      this.notify();
    } catch (err) {
      console.warn('Backend sync failed, will retry on next action:', err);
    }
  }

  private loadUser() {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.role) {
          parsed.role = parsed.role.toLowerCase();
        }
        this.currentUser = parsed;
      }
    } catch {
      this.currentUser = null;
    }
  }

  private saveUser() {
    try {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (err) {
      console.error('Failed to save user', err);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public getAppointments(): Appointment[] {
    return [...this.appointments];
  }

  public getAppointmentByPublicId(publicId: string): Appointment | undefined {
    return this.appointments.find((a) => a.public_id === publicId);
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getBusiness(): Business {
    return this.business;
  }

  public getMasters(): Master[] {
    return [...this.masters];
  }

  public getMasterByUserId(userId: string): Master | undefined {
    return this.masters.find((m) => m.user_id === userId);
  }

  public getMasterById(masterId: string): Master | undefined {
    return this.masters.find((m) => m.id === masterId);
  }

  public getServices(): Service[] {
    return [...this.services];
  }

  public getServiceById(serviceId: string): Service | undefined {
    return this.services.find((s) => s.id === serviceId);
  }

  // Async Actions linked to Express + PostgreSQL Backend
  public async createAppointment(payload: {
    master_id: string;
    service_id: string;
    client_name: string;
    client_phone: string;
    start_at: string;
    source?: string;
    note?: string;
  }): Promise<Appointment> {
    const newAppt = await api.createAppointment(payload);
    this.appointments.unshift(newAppt);
    this.notify();
    return newAppt;
  }

  public async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const updated = await api.updateAppointmentStatus(id, status);
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.appointments[idx] = updated;
    } else {
      this.appointments.unshift(updated);
    }
    this.notify();
    return updated;
  }

  public addAppointment(appointment: Appointment) {
    this.appointments.unshift(appointment);
    this.notify();
  }

  public updateAppointment(updated: Appointment) {
    const idx = this.appointments.findIndex((a) => a.id === updated.id);
    if (idx !== -1) {
      this.appointments[idx] = updated;
      this.notify();
    }
  }

  public async refreshAppointments() {
    try {
      const appts = await api.getAppointments();
      this.appointments = appts;
      this.notify();
    } catch (err) {
      console.warn('Failed to refresh appointments:', err);
    }
  }

  public setCurrentUser(user: User | null) {
    if (user && user.role) {
      user.role = (String(user.role).toLowerCase()) as UserRole;
    }
    this.currentUser = user;
    this.saveUser();
    this.notify();
  }

  public async loginWithApi(username: string, password: string): Promise<User> {
    const res = await api.login(username, password);
    this.setCurrentUser(res.user);
    await this.syncFromBackend();
    return res.user;
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public clearAppointments() {
    this.appointments = [];
    this.notify();
  }
}

export const store = new AppStore();
