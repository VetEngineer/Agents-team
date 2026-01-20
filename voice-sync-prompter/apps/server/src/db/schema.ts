import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core'

// Users (Supabase Auth와 연동)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Supabase Auth user id
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').notNull().default('free'), // free, pro, team
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  whisperMinutesUsed: integer('whisper_minutes_used').notNull().default(0),
  whisperMinutesLimit: integer('whisper_minutes_limit').notNull().default(0), // 0 = unlimited local only
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Scripts (대본)
export const scripts = pgTable('scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  metadata: jsonb('metadata').$type<{
    wordCount?: number
    estimatedDuration?: number
    lastPosition?: number
    tags?: string[]
  }>(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Transcriptions (음성 인식 기록)
export const transcriptions = pgTable('transcriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scriptId: uuid('script_id').references(() => scripts.id, { onDelete: 'set null' }),
  text: text('text').notNull(),
  segments: jsonb('segments').$type<{
    id: number
    start: number
    end: number
    text: string
  }[]>(),
  duration: integer('duration').notNull(), // seconds
  language: text('language').notNull().default('ko'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Usage logs (사용량 추적)
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // transcription, script_create, etc.
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Script = typeof scripts.$inferSelect
export type NewScript = typeof scripts.$inferInsert
export type Transcription = typeof transcriptions.$inferSelect
export type NewTranscription = typeof transcriptions.$inferInsert
