import { rawClient, db } from './index.ts';
import { businesses, users, masters, services, appointments } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function initSqliteDb() {
  // Create tables if not exist
  await rawClient.execute(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      opens_at TEXT NOT NULL DEFAULT '09:00',
      closes_at TEXT NOT NULL DEFAULT '20:00',
      slot_minutes INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await rawClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  await rawClient.execute(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      business_id TEXT NOT NULL REFERENCES businesses(id),
      display_name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await rawClient.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      price INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await rawClient.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      master_id TEXT NOT NULL REFERENCES masters(id),
      service_id TEXT NOT NULL REFERENCES services(id),
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'booked',
      source TEXT NOT NULL DEFAULT 'qr',
      price_snapshot INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  const existingBiz = await db.select().from(businesses).limit(1);
  const nowIso = new Date().toISOString();

  if (existingBiz.length === 0) {
    // 1. Business
    await db.insert(businesses).values({
      id: 'b_barber_house_1',
      owner_id: 'u_owner_1',
      name: 'Barber House Tashkent',
      slug: 'barber-house',
      address: 'Toshkent sh., Chilonzor tumani, 9-mavze, 12-uy',
      phone: '+998 71 200 45 45',
      opens_at: '09:00',
      closes_at: '20:00',
      slot_minutes: 30,
      is_active: true,
      created_at: nowIso,
    });

    // 2. Users
    await db.insert(users).values([
      {
        id: 'u_owner_1',
        username: 'owner',
        password: 'owner123',
        name: 'Sardor Rahimiy (Ega)',
        role: 'owner',
        phone: '+998 90 123 45 67',
        created_at: nowIso,
      },
      {
        id: 'u_master_1',
        username: 'usta1',
        password: 'usta123',
        name: 'Bobur Mirzayev (Usta 1)',
        role: 'master',
        phone: '+998 93 111 22 33',
        created_at: nowIso,
      },
      {
        id: 'u_master_2',
        username: 'usta2',
        password: 'usta123',
        name: 'Jamshid Aliyev (Usta 2)',
        role: 'master',
        phone: '+998 94 222 33 44',
        created_at: nowIso,
      },
      {
        id: 'u_master_3',
        username: 'usta3',
        password: 'usta123',
        name: 'Davron Karimov (Usta 3)',
        role: 'master',
        phone: '+998 97 333 44 55',
        created_at: nowIso,
      },
    ]);

    // 3. Masters
    await db.insert(masters).values([
      {
        id: 'm_bobur_1',
        user_id: 'u_master_1',
        business_id: 'b_barber_house_1',
        display_name: 'Bobur Mirzayev',
        specialization: 'Klassik va Zamonaviy Fade',
        phone: '+998 93 111 22 33',
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 'm_jamshid_2',
        user_id: 'u_master_2',
        business_id: 'b_barber_house_1',
        display_name: 'Jamshid Aliyev',
        specialization: 'Soqol shakllantirish va SPA',
        phone: '+998 94 222 33 44',
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 'm_davron_3',
        user_id: 'u_master_3',
        business_id: 'b_barber_house_1',
        display_name: 'Davron Karimov',
        specialization: 'Bolalar va Premium uslub',
        phone: '+998 97 333 44 55',
        is_active: true,
        created_at: nowIso,
      },
    ]);

    // 4. Services
    await db.insert(services).values([
      {
        id: 's_haircut_1',
        business_id: 'b_barber_house_1',
        name: 'Erkaklar soch turmagi (Fade / Klassik)',
        duration_minutes: 30,
        price: 70000,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 's_beard_2',
        business_id: 'b_barber_house_1',
        name: 'Soqol olish va shakl berish',
        duration_minutes: 30,
        price: 40000,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 's_combo_3',
        business_id: 'b_barber_house_1',
        name: 'Kompleks: Soch + Soqol + Yuvish',
        duration_minutes: 60,
        price: 100000,
        is_active: true,
        created_at: nowIso,
      },
      {
        id: 's_vip_4',
        business_id: 'b_barber_house_1',
        name: 'VIP Xizmat: Soch, Soqol va Yuz parvarishi (Black mask)',
        duration_minutes: 60,
        price: 150000,
        is_active: true,
        created_at: nowIso,
      },
    ]);
  }
}
