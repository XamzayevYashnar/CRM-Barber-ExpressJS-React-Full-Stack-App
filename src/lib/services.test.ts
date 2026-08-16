import {
  createAppointment,
  getAvailableSlots,
  transitionStatus,
  cancelByClient,
} from './services';
import {
  PastSlotError,
  SlotUnavailableError,
  InvalidStatusTransitionError,
  PermissionDeniedError,
} from './exceptions';
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

// Mock Data for testing
const mockBusiness: Business = {
  id: 'biz_1',
  owner_id: 'owner_1',
  name: 'Barber House',
  slug: 'barber-house',
  address: 'Chilonzor',
  phone: '+998 90 123 45 67',
  opens_at: '09:00',
  closes_at: '20:00',
  slot_minutes: 30,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

const mockMaster1: Master = {
  id: 'master_1',
  user_id: 'user_usta1',
  business_id: 'biz_1',
  display_name: 'Sardor Aliyev',
  specialization: 'Klassik',
  is_active: true,
  phone: '+998 93 501 23 45',
};

const mockMaster2: Master = {
  id: 'master_2',
  user_id: 'user_usta2',
  business_id: 'biz_1',
  display_name: 'Jasur Toshmatov',
  specialization: 'Fade',
  is_active: true,
  phone: '+998 97 712 34 56',
};

const mockService1: Service = {
  id: 'srv_1',
  business_id: 'biz_1',
  name: 'Soch olish',
  duration_minutes: 30,
  price: 50000,
  is_active: true,
};

const mockServiceComplex: Service = {
  id: 'srv_3',
  business_id: 'biz_1',
  name: 'Soch+Soqol',
  duration_minutes: 50,
  price: 70000,
  is_active: true,
};

const mockUserMaster1: User = {
  id: 'user_usta1',
  username: 'usta1',
  name: 'Sardor Aliyev',
  role: UserRole.MASTER,
  phone: '+998 93 501 23 45',
};

const mockUserMaster2: User = {
  id: 'user_usta2',
  username: 'usta2',
  name: 'Jasur Toshmatov',
  role: UserRole.MASTER,
  phone: '+998 97 712 34 56',
};

const mockUserOwner: User = {
  id: 'owner_1',
  username: 'owner',
  name: 'Bekzod Rahimov',
  role: UserRole.OWNER,
  phone: '+998 90 111 22 33',
};

export function runAllTests() {
  console.log('--- STARTING NAVBAT BUSINESS LOGIC TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    } else {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    }
  }

  const fixedNow = new Date('2026-08-16T08:00:00.000Z');
  const dayStr = '2026-08-16';

  // 1. test_create_appointment_success
  {
    const appt = createAppointment({
      business: mockBusiness,
      master: mockMaster1,
      service: mockService1,
      client_name: 'Aziz Karimov',
      client_phone: '+998 90 912 34 56',
      start_at: '2026-08-16T10:00:00.000Z',
      allAppointments: [],
      now: fixedNow,
    });
    assert(appt.status === AppointmentStatus.BOOKED, 'test_create_appointment_success - status BOOKED');
    assert(appt.price_snapshot === 50000, 'test_create_appointment_success - price snapshot locked');
    assert(appt.client_name === 'Aziz Karimov', 'test_create_appointment_success - client name');
  }

  // 2. test_create_appointment_rejects_busy_slot -> SlotUnavailableError
  {
    const existingAppt: Appointment = {
      id: 'appt_1',
      public_id: 't_1',
      business_id: 'biz_1',
      master_id: 'master_1',
      service_id: 'srv_1',
      client_name: 'Shohruh',
      client_phone: '+998 90 111 11 11',
      start_at: '2026-08-16T10:00:00.000Z',
      end_at: '2026-08-16T10:30:00.000Z',
      status: AppointmentStatus.BOOKED,
      source: AppointmentSource.QR,
      price_snapshot: 50000,
      note: '',
      created_at: '2026-08-16T08:00:00.000Z',
      updated_at: '2026-08-16T08:00:00.000Z',
    };

    let caughtError = false;
    try {
      createAppointment({
        business: mockBusiness,
        master: mockMaster1,
        service: mockService1,
        client_name: 'Aziz Karimov',
        client_phone: '+998 90 912 34 56',
        start_at: '2026-08-16T10:00:00.000Z',
        allAppointments: [existingAppt],
        now: fixedNow,
      });
    } catch (err: any) {
      if (err instanceof SlotUnavailableError) {
        caughtError = true;
      }
    }
    assert(caughtError, 'test_create_appointment_rejects_busy_slot');
  }

  // 3. test_create_appointment_rejects_past_slot -> PastSlotError
  {
    let caughtPast = false;
    try {
      createAppointment({
        business: mockBusiness,
        master: mockMaster1,
        service: mockService1,
        client_name: 'Aziz Karimov',
        client_phone: '+998 90 912 34 56',
        start_at: '2026-08-16T07:00:00.000Z',
        allAppointments: [],
        now: new Date('2026-08-16T09:00:00.000Z'),
      });
    } catch (err: any) {
      if (err instanceof PastSlotError) {
        caughtPast = true;
      }
    }
    assert(caughtPast, 'test_create_appointment_rejects_past_slot');
  }

  // 4. test_available_slots_exclude_booked
  {
    const bookedAppt: Appointment = {
      id: 'appt_2',
      public_id: 't_2',
      business_id: 'biz_1',
      master_id: 'master_1',
      service_id: 'srv_1',
      client_name: 'Dilshod',
      client_phone: '+998 90 222 22 22',
      start_at: '2026-08-16T15:00:00.000Z',
      end_at: '2026-08-16T15:30:00.000Z',
      status: AppointmentStatus.BOOKED,
      source: AppointmentSource.QR,
      price_snapshot: 50000,
      note: '',
      created_at: '2026-08-16T08:00:00.000Z',
      updated_at: '2026-08-16T08:00:00.000Z',
    };

    const slots = getAvailableSlots(
      mockBusiness,
      mockMaster1,
      mockService1,
      dayStr,
      [bookedAppt],
      fixedNow
    );

    const hasBookedSlot = slots.some((s) => s.includes('15:00'));
    assert(!hasBookedSlot, 'test_available_slots_exclude_booked');
  }

  // 5. test_invalid_status_transition -> DONE to BOOKED is forbidden
  {
    const doneAppt: Appointment = {
      id: 'appt_3',
      public_id: 't_3',
      business_id: 'biz_1',
      master_id: 'master_1',
      service_id: 'srv_1',
      client_name: 'Bobur',
      client_phone: '+998 90 333 33 33',
      start_at: '2026-08-16T09:00:00.000Z',
      end_at: '2026-08-16T09:30:00.000Z',
      status: AppointmentStatus.DONE,
      source: AppointmentSource.QR,
      price_snapshot: 50000,
      note: '',
      created_at: '2026-08-16T08:00:00.000Z',
      updated_at: '2026-08-16T09:30:00.000Z',
    };

    let caughtTransitionError = false;
    try {
      transitionStatus({
        appointment: doneAppt,
        newStatus: AppointmentStatus.BOOKED,
        byUser: mockUserOwner,
      });
    } catch (err: any) {
      if (err instanceof InvalidStatusTransitionError) {
        caughtTransitionError = true;
      }
    }
    assert(caughtTransitionError, 'test_invalid_status_transition');
  }

  // 6. test_cancelled_slot_becomes_free_again
  {
    const cancelledAppt: Appointment = {
      id: 'appt_4',
      public_id: 't_4',
      business_id: 'biz_1',
      master_id: 'master_1',
      service_id: 'srv_1',
      client_name: 'Sarvar',
      client_phone: '+998 90 444 44 44',
      start_at: '2026-08-16T15:00:00.000Z',
      end_at: '2026-08-16T15:30:00.000Z',
      status: AppointmentStatus.CANCELLED,
      source: AppointmentSource.QR,
      price_snapshot: 50000,
      note: '',
      created_at: '2026-08-16T08:00:00.000Z',
      updated_at: '2026-08-16T10:00:00.000Z',
    };

    const slots = getAvailableSlots(
      mockBusiness,
      mockMaster1,
      mockService1,
      dayStr,
      [cancelledAppt],
      fixedNow
    );

    const has1500 = slots.some((s) => s.includes('15:00'));
    assert(has1500, 'test_cancelled_slot_becomes_free_again');
  }

  // 7. test_permission_check_for_master (Master 2 cannot modify Master 1's appointment)
  {
    const master1Appt: Appointment = {
      id: 'appt_5',
      public_id: 't_5',
      business_id: 'biz_1',
      master_id: 'master_1',
      service_id: 'srv_1',
      client_name: 'Farhod',
      client_phone: '+998 90 555 55 55',
      start_at: '2026-08-16T16:00:00.000Z',
      end_at: '2026-08-16T16:30:00.000Z',
      status: AppointmentStatus.BOOKED,
      source: AppointmentSource.QR,
      price_snapshot: 50000,
      note: '',
      created_at: '2026-08-16T08:00:00.000Z',
      updated_at: '2026-08-16T08:00:00.000Z',
    };

    let caughtPerm = false;
    try {
      transitionStatus({
        appointment: master1Appt,
        newStatus: AppointmentStatus.IN_PROGRESS,
        byUser: mockUserMaster2,
        master: mockMaster2,
      });
    } catch (err: any) {
      if (err instanceof PermissionDeniedError) {
        caughtPerm = true;
      }
    }
    assert(caughtPerm, 'test_permission_check_for_master');
  }

  console.log(`\n🎉 ALL ${passed}/${total} TESTS PASSED PERFECTLY!\n`);
  return { passed, total };
}

// Auto-run if executed via tsx/node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('services.test')) {
  runAllTests();
}
