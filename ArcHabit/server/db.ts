import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const habitEntriesTable = pgTable("habit_entries", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const db = drizzle(pool, { schema: { habitsTable, habitEntriesTable } });

export const CreateHabitBody = z.object({ name: z.string().min(1), color: z.string().optional() });
export const UpdateHabitBody = z.object({ name: z.string().min(1).optional(), color: z.string().optional() });
export const IdParam = z.object({ id: z.coerce.number().int().positive() });
export const ToggleBody = z.object({ day: z.number().int().min(1).max(90) });
