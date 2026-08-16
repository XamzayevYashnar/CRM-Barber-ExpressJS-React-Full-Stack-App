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

export const DEMO_USERS: User[] = [
  {
    id: 'user_owner',
    username: 'owner',
    name: 'Bekzod Rahimov',
    role: UserRole.OWNER,
    phone: '+998 90 111 22 33',
  },
  {
    id: 'user_usta1',
    username: 'usta1',
    name: 'Sardor Aliyev',
    role: UserRole.MASTER,
    phone: '+998 93 501 23 45',
  },
  {
    id: 'user_usta2',
    username: 'usta2',
    name: 'Jasur Toshmatov',
    role: UserRole.MASTER,
    phone: '+998 97 712 34 56',
  },
  {
    id: 'user_usta3',
    username: 'usta3',
    name: 'Otabek Qodirov',
    role: UserRole.MASTER,
    phone: '+998 99 823 45 67',
  },
];

export const DEMO_BUSINESS: Business = {
  id: 'biz_barber_house',
  owner_id: 'user_owner',
  name: 'Barber House',
  slug: 'barber-house',
  address: 'Toshkent sh., Chilonzor 9-mavze, 12-uy (Metro Chilonzor yonida)',
  phone: '+998 90 123 45 67',
  opens_at: '09:00',
  closes_at: '20:00',
  slot_minutes: 30,
  is_active: true,
  created_at: '2026-01-01T09:00:00.000Z',
};

export const DEMO_MASTERS: Master[] = [
  {
    id: 'master_1',
    user_id: 'user_usta1',
    business_id: 'biz_barber_house',
    display_name: 'Sardor Aliyev',
    specialization: 'Erkaklar sochi va soqoli ustasi (Klassik & Fade)',
    is_active: true,
    phone: '+998 93 501 23 45',
    rating: 4.9,
  },
  {
    id: 'master_2',
    user_id: 'user_usta2',
    business_id: 'biz_barber_house',
    display_name: 'Jasur Toshmatov',
    specialization: 'Top-barber, Fade va Zamonaviy ukladka',
    is_active: true,
    phone: '+998 97 712 34 56',
    rating: 4.85,
  },
  {
    id: 'master_3',
    user_id: 'user_usta3',
    business_id: 'biz_barber_house',
    display_name: 'Otabek Qodirov',
    specialization: 'Bolalar va kattalar sartaroshi, Soqol korreksiyasi',
    is_active: true,
    phone: '+998 99 823 45 67',
    rating: 4.95,
  },
];

export const DEMO_SERVICES: Service[] = [
  {
    id: 'srv_1',
    business_id: 'biz_barber_house',
    name: 'Soch olish',
    duration_minutes: 30,
    price: 50000,
    is_active: true,
    category: 'Soch',
  },
  {
    id: 'srv_2',
    business_id: 'biz_barber_house',
    name: 'Soqol olish',
    duration_minutes: 20,
    price: 30000,
    is_active: true,
    category: 'Soqol',
  },
  {
    id: 'srv_3',
    business_id: 'biz_barber_house',
    name: 'Soch + Soqol kompleksi',
    duration_minutes: 50,
    price: 70000,
    is_active: true,
    category: 'Kompleks',
  },
  {
    id: 'srv_4',
    business_id: 'biz_barber_house',
    name: 'Bolalar sochi (12 yoshgacha)',
    duration_minutes: 30,
    price: 40000,
    is_active: true,
    category: 'Bolalar',
  },
  {
    id: 'srv_5',
    business_id: 'biz_barber_house',
    name: 'Soch ukladka va styling',
    duration_minutes: 20,
    price: 35000,
    is_active: true,
    category: 'Parvarish',
  },
  {
    id: 'srv_6',
    business_id: 'biz_barber_house',
    name: 'Yuz tozalash va parvarish',
    duration_minutes: 40,
    price: 60000,
    is_active: true,
    category: 'Parvarish',
  },
];

export function generateSeedAppointments(): Appointment[] {
  const appointments: Appointment[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 1. Bugungi navbatlar (~18 ta)
  const todayRecords = [
    // Usta 1 (Sardor)
    {
      m: 'master_1',
      s: 'srv_1',
      client: 'Aziz Karimov',
      phone: '+998 90 912 34 56',
      time: '09:00',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_1',
      s: 'srv_3',
      client: 'Shohruh Tursunov',
      phone: '+998 93 123 78 90',
      time: '09:30',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_1',
      s: 'srv_2',
      client: 'Dilshod Ergashev',
      phone: '+998 94 456 12 34',
      time: '10:30',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.WALK_IN,
    },
    {
      m: 'master_1',
      s: 'srv_1',
      client: 'Rustam Xoliqov',
      phone: '+998 91 234 56 78',
      time: '11:00',
      status: AppointmentStatus.IN_PROGRESS,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_1',
      s: 'srv_3',
      client: 'Sanjarbek Shokirov',
      phone: '+998 90 345 67 89',
      time: '15:30',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_1',
      s: 'srv_1',
      client: 'Sherzod Hakimov',
      phone: '+998 97 123 99 88',
      time: '17:00',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_1',
      s: 'srv_4',
      client: 'Eldorbek Vohidov',
      phone: '+998 99 444 55 66',
      time: '18:30',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.WALK_IN,
    },

    // Usta 2 (Jasur)
    {
      m: 'master_2',
      s: 'srv_1',
      client: 'Javohir Yo\'ldoshev',
      phone: '+998 90 777 88 99',
      time: '09:30',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_2',
      s: 'srv_5',
      client: 'Bobur Mirzayev',
      phone: '+998 93 333 22 11',
      time: '10:00',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_2',
      s: 'srv_3',
      client: 'Jamshid Rahmonov',
      phone: '+998 94 555 66 77',
      time: '11:00',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_2',
      s: 'srv_2',
      client: 'Nodirbek Yusupov',
      phone: '+998 91 888 77 66',
      time: '12:00',
      status: AppointmentStatus.NO_SHOW,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_2',
      s: 'srv_1',
      client: 'Bekzod Alimov',
      phone: '+998 97 456 78 12',
      time: '15:00',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_2',
      s: 'srv_6',
      client: 'Anvar Toirov',
      phone: '+998 90 123 00 11',
      time: '16:30',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.QR,
    },

    // Usta 3 (Otabek)
    {
      m: 'master_3',
      s: 'srv_4',
      client: 'Farhod Saidov',
      phone: '+998 99 111 44 77',
      time: '09:00',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_3',
      s: 'srv_1',
      client: 'Ulug\'bek Normatov',
      phone: '+998 93 222 33 44',
      time: '09:30',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_3',
      s: 'srv_2',
      client: 'Sarvar Ergashev',
      phone: '+998 94 777 12 34',
      time: '10:30',
      status: AppointmentStatus.CANCELLED,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_3',
      s: 'srv_1',
      client: 'Ilhom Zokirov',
      phone: '+998 90 666 55 44',
      time: '11:00',
      status: AppointmentStatus.DONE,
      src: AppointmentSource.QR,
    },
    {
      m: 'master_3',
      s: 'srv_4',
      client: 'Murod Qosimov',
      phone: '+998 97 999 88 11',
      time: '14:30',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.WALK_IN,
    },
    {
      m: 'master_3',
      s: 'srv_3',
      client: 'Jahongir Olimov',
      phone: '+998 91 333 44 55',
      time: '16:00',
      status: AppointmentStatus.BOOKED,
      src: AppointmentSource.QR,
    },
  ];

  todayRecords.forEach((item, index) => {
    const srv = DEMO_SERVICES.find((s) => s.id === item.s)!;
    const start = new Date(`${todayStr}T${item.time}:00`);
    const end = new Date(start.getTime() + srv.duration_minutes * 60 * 1000);

    appointments.push({
      id: `appt_today_${index + 1}`,
      public_id: `t_demo_${index + 1}`,
      business_id: 'biz_barber_house',
      master_id: item.m,
      service_id: srv.id,
      client_name: item.client,
      client_phone: item.phone,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: item.status,
      source: item.src,
      price_snapshot: srv.price,
      note: item.src === AppointmentSource.WALK_IN ? 'Sartaroshxonaga to\'g\'ridan-to\'g\'ri kelgan' : 'QR kod orqali band qilingan',
      created_at: new Date(start.getTime() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  // 2. O'tgan 6 kun uchun tarixiy ma'lumotlar (kunlik tushum grafigi to'laqonli ko'rinishi uchun)
  const pastClients = [
    'Botir Qodirov', 'Samandar Islomov', 'Mansur Ergashev', 'Shavkat Karimov',
    'Akbar Saidov', 'Sunnatbek Fayziyev', 'Davronbek Tojiyev', 'Hasanboy Rustamov',
    'Husanboy Rustamov', 'Timur Abdullayev', 'Zafarbek Yoqubov', 'Sanjar Xolmatov',
    'Kamronbek Jo\'rayev', 'Muzaffar Mahmudov', 'Umidjon Sotvoldiyev', 'Shukrullo Oripov'
  ];

  for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - dayOffset);
    const pastDateStr = pastDate.toISOString().slice(0, 10);

    // Har kunga 10-14 ta yakunlangan navbat
    const dailyCount = 11 + ((dayOffset * 3) % 4);
    for (let k = 0; k < dailyCount; k++) {
      const srvIndex = (k + dayOffset) % DEMO_SERVICES.length;
      const srv = DEMO_SERVICES[srvIndex];
      const masterIndex = k % DEMO_MASTERS.length;
      const master = DEMO_MASTERS[masterIndex];
      const clientName = pastClients[(k + dayOffset * 2) % pastClients.length];

      const hour = 9 + Math.floor(k / 2);
      const min = (k % 2) * 30;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      const minStr = min === 0 ? '00' : '30';

      const start = new Date(`${pastDateStr}T${hourStr}:${minStr}:00`);
      const end = new Date(start.getTime() + srv.duration_minutes * 60 * 1000);

      appointments.push({
        id: `appt_hist_${dayOffset}_${k}`,
        public_id: `t_hist_${dayOffset}_${k}`,
        business_id: 'biz_barber_house',
        master_id: master.id,
        service_id: srv.id,
        client_name: clientName,
        client_phone: `+998 90 ${100 + k * 10} ${20 + dayOffset * 5} ${30 + k}`,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        status: AppointmentStatus.DONE,
        source: k % 3 === 0 ? AppointmentSource.WALK_IN : AppointmentSource.QR,
        price_snapshot: srv.price,
        note: 'Tarixiy navbat',
        created_at: new Date(start.getTime() - 4 * 3600 * 1000).toISOString(),
        updated_at: start.toISOString(),
      });
    }
  }

  return appointments;
}
