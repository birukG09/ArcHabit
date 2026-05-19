Orbit90                                                                                                       
A full-stack habit tracker built around a circular SVG visualization. Each habit gets its own concentric ring divided into 90 clickable arc segments — one per day. Click a segment to mark that day done.

---

## What It Does

- **90-day circular tracker** — up to 10 habits, each as a color-coded ring with 90 arc segments
- **Click any segment** to toggle a day complete or incomplete
- **Streak tracking bar** at the top shows live flame streaks, best streak, avg completion, and a mini progress bar per habit
- **Start your journey** — set Day 1 to activate today/past/future color coding on the circle
- **Past days** (uncompleted) show in faint red — so missed days are immediately visible
- **Today's needle** — a dashed marker shows exactly which day you're on
- **Hover tooltips** — mouse over any segment to see the habit name and day number
- **Add / edit / delete habits** from the left panel
- **Dark mode** toggle in the header
- **JSON export** of all your data

---

## Your Study Plan (pre-loaded)

| Habit | Daily Goal | Color |
|---|---|---|
| Programming | 2 hours | Indigo |
| Reading | 3 hours | Amber |
| Projects | 1 hour | Green |
| Other Learning | 1 hour | Pink |

**Total: 7 hours/day · 90-day commitment**

---

## How to Use

1. Open the app and click **"Start your 90-day journey today →"** on the circle to set Day 1
2. Each day, click the segment for that day on each habit ring to mark it done
3. Watch your streaks grow in the bar at the top
4. Add new habits anytime with **"Add a new habit…"** in the left panel
5. Export your full 90-day data as JSON with the **Export** button

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Visualization | SVG (hand-crafted arc geometry) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| API contract | OpenAPI 3 → Orval codegen |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
artifacts/
  habit-tracker/       # React + Vite frontend
  api-server/          # Express 5 REST API
lib/
  db/                  # Drizzle schema + migrations
  api-spec/            # OpenAPI spec + codegen config
  api-client-react/    # Generated React Query hooks + Zod schemas
```

---

## Key Commands

```bash
# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/habit-tracker run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Full typecheck
pnpm run typecheck
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/habits` | List all habits |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id` | Update habit name/color |
| DELETE | `/api/habits/:id` | Delete a habit |
| POST | `/api/habits/:id/toggle` | Toggle a day complete |
| GET | `/api/habits/data/all` | All habits with entries + stats |
| GET | `/api/habits/data/export` | Full JSON export |

---

## Database Schema

**habits** — `id, name, color, created_at`

**habit_entries** — `id, habit_id, day (1–90), completed`
