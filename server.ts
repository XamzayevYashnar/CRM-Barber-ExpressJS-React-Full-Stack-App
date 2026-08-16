import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { businesses, users, masters, services, appointments } from './src/db/schema.ts';
import { initSqliteDb } from './src/db/init.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for localhost / cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol kiritilishi shart' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const userList = await db.select().from(users).where(eq(users.username, cleanUsername)).limit(1);

    if (userList.length === 0 || userList[0].password !== String(password).trim()) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const user = userList[0];
    let masterRecord = null;
    if (user.role === 'master') {
      const masterList = await db.select().from(masters).where(eq(masters.user_id, user.id)).limit(1);
      if (masterList.length > 0) {
        masterRecord = masterList[0];
      }
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        masterId: masterRecord ? masterRecord.id : undefined,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Tizimga kirishda xatolik yuz berdi' });
  }
});

// Business by slug or default
app.get('/api/business/:slug?', async (req, res) => {
  try {
    const slug = req.params.slug || 'barber-house';
    const bizList = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    
    if (bizList.length === 0) {
      const allBiz = await db.select().from(businesses).limit(1);
      if (allBiz.length === 0) {
        return res.status(404).json({ error: 'Sartaroshxona topilmadi' });
      }
      return res.json(allBiz[0]);
    }

    return res.json(bizList[0]);
  } catch (error: any) {
    console.error('Get business error:', error);
    return res.status(500).json({ error: 'Ma\'lumotlarni olishda xatolik' });
  }
});

// Masters list
app.get('/api/masters', async (req, res) => {
  try {
    const activeMasters = await db.select().from(masters).where(eq(masters.is_active, true));
    return res.json(activeMasters);
  } catch (error: any) {
    console.error('Get masters error:', error);
    return res.status(500).json({ error: 'Ustalarni yuklashda xatolik' });
  }
});

// Services list
app.get('/api/services', async (req, res) => {
  try {
    const activeServices = await db.select().from(services).where(eq(services.is_active, true));
    return res.json(activeServices);
  } catch (error: any) {
    console.error('Get services error:', error);
    return res.status(500).json({ error: 'Xizmatlarni yuklashda xatolik' });
  }
});

// Get slots for a master and date
app.get('/api/slots', async (req, res) => {
  try {
    const { masterId, date } = req.query;
    if (!masterId || !date) {
      return res.status(400).json({ error: 'masterId va date parametri talab qilinadi' });
    }

    const dateStr = String(date);
    const mId = String(masterId);

    // Business working hours
    const bizList = await db.select().from(businesses).limit(1);
    const biz = bizList[0] || { opens_at: '09:00', closes_at: '20:00', slot_minutes: 30 };

    // Get appointments on this date for this master that are not cancelled
    const appts = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.master_id, mId),
          gte(appointments.start_at, `${dateStr}T00:00:00`),
          lte(appointments.start_at, `${dateStr}T23:59:59`)
        )
      );

    const activeAppts = appts.filter((a) => a.status !== 'cancelled');

    // Generate slots
    const [openHour, openMin] = biz.opens_at.split(':').map(Number);
    const [closeHour, closeMin] = biz.closes_at.split(':').map(Number);
    const slotDuration = biz.slot_minutes || 30;

    const slots: { time: string; start_at: string; end_at: string; available: boolean; appointmentId?: string }[] = [];

    const startTotal = openHour * 60 + openMin;
    const endTotal = closeHour * 60 + closeMin;

    for (let current = startTotal; current + slotDuration <= endTotal; current += slotDuration) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      const timeStr = `${hStr}:${mStr}`;

      const endH = Math.floor((current + slotDuration) / 60);
      const endM = (current + slotDuration) % 60;
      const endHStr = String(endH).padStart(2, '0');
      const endMStr = String(endM).padStart(2, '0');
      const endTimeStr = `${endHStr}:${endMStr}`;

      const slotStartIso = `${dateStr}T${timeStr}:00`;
      const slotEndIso = `${dateStr}T${endTimeStr}:00`;

      const matchedAppt = activeAppts.find((a) => {
        const apptStart = a.start_at.slice(0, 16);
        return apptStart === `${dateStr}T${timeStr}`;
      });

      slots.push({
        time: timeStr,
        start_at: slotStartIso,
        end_at: slotEndIso,
        available: !matchedAppt,
        appointmentId: matchedAppt ? matchedAppt.id : undefined,
      });
    }

    return res.json({ slots });
  } catch (error: any) {
    console.error('Get slots error:', error);
    return res.status(500).json({ error: 'Vaqtlarni hisoblashda xatolik' });
  }
});

// Get appointments (with filtering)
app.get('/api/appointments', async (req, res) => {
  try {
    const { masterId, status, date } = req.query;

    let query = db.select().from(appointments);
    const conditions = [];

    if (masterId) {
      conditions.push(eq(appointments.master_id, String(masterId)));
    }
    if (status) {
      conditions.push(eq(appointments.status, String(status)));
    }
    if (date) {
      conditions.push(gte(appointments.start_at, `${date}T00:00:00`));
      conditions.push(lte(appointments.start_at, `${date}T23:59:59`));
    }

    let results;
    if (conditions.length > 0) {
      results = await query.where(and(...conditions)).orderBy(desc(appointments.start_at));
    } else {
      results = await query.orderBy(desc(appointments.start_at));
    }

    return res.json(results);
  } catch (error: any) {
    console.error('Get appointments error:', error);
    return res.status(500).json({ error: 'Navbatlarni olishda xatolik' });
  }
});

// Get single appointment by publicId (Client ticket view)
app.get('/api/appointments/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const list = await db
      .select()
      .from(appointments)
      .where(eq(appointments.public_id, publicId))
      .limit(1);

    if (list.length === 0) {
      return res.status(404).json({ error: 'Chipta topilmadi' });
    }

    const appt = list[0];
    // Calculate live position in queue for today
    const apptDate = appt.start_at.slice(0, 10);
    const dayAppts = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.master_id, appt.master_id),
          gte(appointments.start_at, `${apptDate}T00:00:00`),
          lte(appointments.start_at, `${apptDate}T23:59:59`)
        )
      );

    const aheadCount = dayAppts.filter(
      (a) =>
        a.id !== appt.id &&
        (a.status === 'booked' || a.status === 'in_progress') &&
        new Date(a.start_at).getTime() < new Date(appt.start_at).getTime()
    ).length;

    const inProgressAppt = dayAppts.find((a) => a.status === 'in_progress');

    return res.json({
      appointment: appt,
      queueInfo: {
        aheadCount,
        isCurrentTurn: appt.status === 'in_progress',
        currentServingName: inProgressAppt ? inProgressAppt.client_name : null,
      },
    });
  } catch (error: any) {
    console.error('Get appointment error:', error);
    return res.status(500).json({ error: 'Chipta ma\'lumotini olishda xatolik' });
  }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      master_id,
      service_id,
      client_name,
      client_phone,
      start_at,
      source = 'qr',
      note = '',
    } = req.body;

    if (!master_id || !service_id || !client_name || !client_phone || !start_at) {
      return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
    }

    // Fetch service for duration & price
    const serviceList = await db.select().from(services).where(eq(services.id, service_id)).limit(1);
    if (serviceList.length === 0) {
      return res.status(400).json({ error: 'Xizmat turi topilmadi' });
    }
    const service = serviceList[0];

    // Fetch business
    const bizList = await db.select().from(businesses).limit(1);
    const business_id = bizList[0]?.id || 'b_barber_house_1';

    // Calculate end_at
    const startDate = new Date(start_at);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Vaqt formati noto\'g\'ri' });
    }
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
    const end_at = endDate.toISOString();

    // Check for double booking
    const overlapping = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.master_id, master_id),
          eq(appointments.start_at, start_at)
        )
      );

    const activeOverlap = overlapping.filter((a) => a.status !== 'cancelled');
    if (activeOverlap.length > 0) {
      return res.status(409).json({ error: 'Bu vaqt oraliq allaqachon band qilingan' });
    }

    // Generate random friendly publicId e.g. T-842
    const randomCode = Math.floor(100 + Math.random() * 900);
    const public_id = `T-${randomCode}`;
    const nowIso = new Date().toISOString();
    const id = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newAppointment = {
      id,
      public_id,
      business_id,
      master_id,
      service_id,
      client_name: String(client_name).trim(),
      client_phone: String(client_phone).trim(),
      start_at,
      end_at,
      status: 'booked',
      source,
      price_snapshot: service.price,
      note: String(note || ''),
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.insert(appointments).values(newAppointment);

    return res.status(201).json(newAppointment);
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ error: 'Navbat yaratishda xatolik yuz berdi' });
  }
});

// Update appointment status
app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['booked', 'in_progress', 'done', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Noto\'g\'ri status' });
    }

    const apptList = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (apptList.length === 0) {
      return res.status(404).json({ error: 'Navbat topilmadi' });
    }

    const nowIso = new Date().toISOString();
    await db
      .update(appointments)
      .set({
        status,
        updated_at: nowIso,
      })
      .where(eq(appointments.id, id));

    const updated = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return res.json(updated[0]);
  } catch (error: any) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Statusni yangilashda xatolik' });
  }
});

// Owner analytics and stats
app.get('/api/owner/stats', async (req, res) => {
  try {
    const allAppts = await db.select().from(appointments);
    const allMasters = await db.select().from(masters);
    const allServices = await db.select().from(services);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAppts = allAppts.filter((a) => a.start_at.startsWith(todayStr));

    const completedToday = todayAppts.filter((a) => a.status === 'done');
    const todayRevenue = completedToday.reduce((sum, a) => sum + (a.price_snapshot || 0), 0);

    const totalRevenue = allAppts
      .filter((a) => a.status === 'done')
      .reduce((sum, a) => sum + (a.price_snapshot || 0), 0);

    const completedCount = allAppts.filter((a) => a.status === 'done').length;
    const cancelledCount = allAppts.filter((a) => a.status === 'cancelled').length;

    // Master stats breakdown
    const masterStats = allMasters.map((m) => {
      const mAppts = allAppts.filter((a) => a.master_id === m.id);
      const mDone = mAppts.filter((a) => a.status === 'done');
      const mRevenue = mDone.reduce((sum, a) => sum + (a.price_snapshot || 0), 0);
      return {
        id: m.id,
        name: m.display_name,
        specialization: m.specialization,
        totalBookings: mAppts.length,
        completedCount: mDone.length,
        revenue: mRevenue,
      };
    });

    return res.json({
      today: {
        total: todayAppts.length,
        completed: completedToday.length,
        revenue: todayRevenue,
      },
      overall: {
        totalBookings: allAppts.length,
        completedCount,
        cancelledCount,
        totalRevenue,
      },
      masters: masterStats,
      mastersCount: allMasters.length,
      servicesCount: allServices.length,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Statistikani olishda xatolik' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  try {
    await initSqliteDb();
    console.log('✅ SQLite database initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize SQLite database:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NAVBAT Express + SQLite Server running on port ${PORT}`);
  });
}

startServer();
