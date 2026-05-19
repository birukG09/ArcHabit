import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, habitsTable, habitEntriesTable, CreateHabitBody, UpdateHabitBody, IdParam, ToggleBody } from "../db.js";

const router = Router();

function computeStreak(completedDays: Set<number>): number {
  let streak = 0;
  for (let d = 90; d >= 1; d--) {
    if (completedDays.has(d)) streak++;
    else break;
  }
  if (streak === 0) {
    let current = 0;
    for (let d = 1; d <= 90; d++) {
      if (completedDays.has(d)) {
        current++;
        streak = Math.max(streak, current);
      } else {
        current = 0;
      }
    }
  }
  return streak;
}

router.get("/habits", async (_req, res): Promise<void> => {
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.createdAt);
  res.json(habits);
});

router.get("/habits/data/all", async (_req, res): Promise<void> => {
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.createdAt);
  const allEntries = await db.select().from(habitEntriesTable);
  const result = habits.map((habit) => {
    const entries = allEntries.filter((e) => e.habitId === habit.id);
    const completedDays = new Set(entries.filter((e) => e.completed).map((e) => e.day));
    return {
      ...habit,
      entries,
      streak: computeStreak(completedDays),
      completionPercent: Math.round((completedDays.size / 90) * 100),
      completedDays: completedDays.size,
    };
  });
  res.json(result);
});

router.get("/habits/data/export", async (_req, res): Promise<void> => {
  const habits = await db.select().from(habitsTable).orderBy(habitsTable.createdAt);
  const allEntries = await db.select().from(habitEntriesTable);
  const result = habits.map((habit) => {
    const entries = allEntries.filter((e) => e.habitId === habit.id);
    const completedDays = new Set(entries.filter((e) => e.completed).map((e) => e.day));
    return { ...habit, entries, streak: computeStreak(completedDays), completionPercent: Math.round((completedDays.size / 90) * 100) };
  });
  res.json({ exportedAt: new Date().toISOString(), habits: result });
});

router.post("/habits", async (req, res): Promise<void> => {
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await db.select().from(habitsTable);
  if (existing.length >= 10) { res.status(400).json({ error: "Maximum 10 habits allowed" }); return; }
  const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6","#f97316","#06b6d4"];
  const color = parsed.data.color ?? COLORS[existing.length % COLORS.length];
  const [habit] = await db.insert(habitsTable).values({ name: parsed.data.name, color }).returning();
  res.status(201).json(habit);
});

router.patch("/habits/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const update: Partial<{ name: string; color: string }> = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.color) update.color = parsed.data.color;
  const [habit] = await db.update(habitsTable).set(update).where(eq(habitsTable.id, params.data.id)).returning();
  if (!habit) { res.status(404).json({ error: "Not found" }); return; }
  res.json(habit);
});

router.delete("/habits/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [habit] = await db.delete(habitsTable).where(eq(habitsTable.id, params.data.id)).returning();
  if (!habit) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/habits/:id/toggle", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ToggleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { id } = params.data;
  const { day } = parsed.data;
  const [existing] = await db.select().from(habitEntriesTable).where(and(eq(habitEntriesTable.habitId, id), eq(habitEntriesTable.day, day)));
  if (existing) {
    const [updated] = await db.update(habitEntriesTable).set({ completed: !existing.completed }).where(eq(habitEntriesTable.id, existing.id)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(habitEntriesTable).values({ habitId: id, day, completed: true }).returning();
    res.json(created);
  }
});

export default router;
