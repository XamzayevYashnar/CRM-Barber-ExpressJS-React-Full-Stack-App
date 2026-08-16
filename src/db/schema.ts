import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  owner_id: text('owner_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  opens_at: text('opens_at').notNull().default('09:00'),
  closes_at: text('closes_at').notNull().default('20:00'),
  slot_minutes: integer('slot_minutes').notNull().default(30),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'owner' | 'master' | 'client'
  phone: text('phone').notNull().default(''),
  created_at: text('created_at').notNull(),
});

export const masters = sqliteTable('masters', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  business_id: text('business_id').notNull().references(() => businesses.id),
  display_name: text('display_name').notNull(),
  specialization: text('specialization').notNull(),
  phone: text('phone').notNull().default(''),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull(),
});

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  business_id: text('business_id').notNull().references(() => businesses.id),
  name: text('name').notNull(),
  duration_minutes: integer('duration_minutes').notNull().default(30),
  price: integer('price').notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull(),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  public_id: text('public_id').notNull().unique(),
  business_id: text('business_id').notNull().references(() => businesses.id),
  master_id: text('master_id').notNull().references(() => masters.id),
  service_id: text('service_id').notNull().references(() => services.id),
  client_name: text('client_name').notNull(),
  client_phone: text('client_phone').notNull(),
  start_at: text('start_at').notNull(),
  end_at: text('end_at').notNull(),
  status: text('status').notNull().default('booked'), // 'booked' | 'in_progress' | 'done' | 'cancelled' | 'no_show'
  source: text('source').notNull().default('qr'), // 'qr' | 'walk_in' | 'manual'
  price_snapshot: integer('price_snapshot').notNull(),
  note: text('note').notNull().default(''),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});
