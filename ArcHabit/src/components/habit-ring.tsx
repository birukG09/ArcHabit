import { useMemo, useState, useCallback } from "react";
import { useToggleHabitDay, useGetAllHabitsData, ALL_HABITS_KEY } from "@/hooks/use-habits";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

const TOTAL_DAYS = 90;
const SVG_SIZE = 760;
const CENTER = SVG_SIZE / 2;
const INNER_RADIUS = 90;
const RING_WIDTH = 26;
const RING_GAP = 7;
const SEGMENT_GAP_DEG = 0.9;
const DEG_PER_DAY = 360 / TOTAL_DAYS;

const STORAGE_KEY = "habit_tracker_start_date";

function getStartDate(): Date | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function saveStartDate(date: Date) {
  localStorage.setItem(STORAGE_KEY, date.toISOString().split("T")[0]);
}

function getTodayDay(start: Date | null): number | null {
  if (!start) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - s.getTime()) / 86400000) + 1;
  return diff >= 1 && diff <= TOTAL_DAYS ? diff : null;
}

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function arcPath(innerR: number, outerR: number, a1: number, a2: number) {
  const p1 = polar(outerR, a1);
  const p2 = polar(outerR, a2);
  const p3 = polar(innerR, a2);
  const p4 = polar(innerR, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 ${lg} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A${innerR.toFixed(2)} ${innerR.toFixed(2)} 0 ${lg} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}Z`;
}

export function HabitRing() {
  const { data: habits } = useGetAllHabitsData();
  const toggleDay = useToggleHabitDay();
  const queryClient = useQueryClient();
  const [startDate, setStartDateState] = useState<Date | null>(getStartDate);
  const todayDay = getTodayDay(startDate);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; day: number; done: boolean } | null>(null);

  const handleToggle = useCallback(
    (habitId: number, day: number) => {
      toggleDay.mutate(
        { id: habitId, data: { day } },
        {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ALL_HABITS_KEY }),
          onError: () => toast.error("Failed to update"),
        }
      );
    },
    [toggleDay, queryClient]
  );

  const handleStart = () => {
    const d = new Date();
    saveStartDate(d);
    setStartDateState(d);
    toast.success("90-day journey started!");
  };

  const segments = useMemo(() => {
    if (!habits?.length) return [];
    return (habits as any[]).flatMap((habit, hIdx) => {
      const innerR = INNER_RADIUS + hIdx * (RING_WIDTH + RING_GAP);
      const outerR = innerR + RING_WIDTH;
      return Array.from({ length: TOTAL_DAYS }, (_, i) => {
        const day = i + 1;
        const isCompleted = habit.entries?.some((e: any) => e.day === day && e.completed) ?? false;
        return {
          key: `${habit.id}-${day}`,
          habitId: habit.id,
          habitName: habit.name,
          day,
          color: habit.color || "#6366f1",
          isCompleted,
          isToday: todayDay === day,
          isPast: todayDay !== null && day < todayDay,
          isFuture: todayDay !== null && day > todayDay,
          innerR,
          outerR,
          startDeg: (day - 1) * DEG_PER_DAY + SEGMENT_GAP_DEG / 2,
          endDeg: day * DEG_PER_DAY - SEGMENT_GAP_DEG / 2,
        };
      });
    });
  }, [habits, todayDay]);

  if (!habits?.length) {
    return (
      <div className="w-full aspect-square max-w-[800px] flex flex-col items-center justify-center border-2 border-dashed rounded-full text-muted-foreground opacity-40">
        <p className="text-sm text-center px-12">No habits yet. Add one to start your 90-day journey.</p>
      </div>
    );
  }

  const habitCount = (habits as any[]).length;
  const outerMostR = INNER_RADIUS + habitCount * (RING_WIDTH + RING_GAP);
  const overallPercent = Math.round(
    (habits as any[]).reduce((a: number, h: any) => a + h.completionPercent, 0) / habitCount
  );

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="w-3.5 h-3.5" />
        {startDate ? (
          <span>
            Day {todayDay ?? "—"} of 90 · started{" "}
            {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            <button
              className="ml-2 underline underline-offset-2 hover:text-foreground"
              onClick={handleStart}
            >
              reset
            </button>
          </span>
        ) : (
          <button
            className="underline underline-offset-2 hover:text-foreground font-medium"
            onClick={handleStart}
          >
            Start your 90-day journey today →
          </button>
        )}
      </div>

      <div className="relative w-full aspect-square">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          onMouseLeave={() => setTooltip(null)}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const day = (i + 1) * 7;
            if (day > TOTAL_DAYS) return null;
            const ang = day * DEG_PER_DAY;
            const p1 = polar(INNER_RADIUS - 3, ang);
            const p2 = polar(outerMostR + 3, ang);
            return (
              <line
                key={i}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="currentColor" strokeWidth="0.5"
                className="text-border/70"
              />
            );
          })}

          {todayDay && (() => {
            const a1 = (todayDay - 1) * DEG_PER_DAY;
            const a2 = todayDay * DEG_PER_DAY;
            return (
              <path
                d={arcPath(INNER_RADIUS - 6, outerMostR + 6, a1, a2)}
                fill="currentColor"
                className="text-foreground/[0.06] pointer-events-none"
              />
            );
          })()}

          {segments.map((seg) => {
            const hasFill = seg.isCompleted || seg.isToday;
            return (
              <path
                key={seg.key}
                d={arcPath(seg.innerR, seg.outerR, seg.startDeg, seg.endDeg)}
                fill={hasFill ? seg.color : "currentColor"}
                opacity={seg.isCompleted ? 1 : seg.isToday ? 0.3 : 1}
                className={
                  hasFill
                    ? "cursor-pointer hover:brightness-110"
                    : seg.isPast
                    ? "cursor-pointer text-red-400/20 hover:text-red-400/40"
                    : "cursor-pointer text-muted-foreground/[0.22] hover:text-muted-foreground/40"
                }
                style={seg.isToday && !seg.isCompleted ? { stroke: seg.color, strokeWidth: 0.8 } : undefined}
                onClick={() => handleToggle(seg.habitId, seg.day)}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const scale = rect.width / SVG_SIZE;
                  const mid = polar(seg.innerR + RING_WIDTH / 2, (seg.startDeg + seg.endDeg) / 2);
                  setTooltip({ x: mid.x * scale, y: mid.y * scale, label: seg.habitName, day: seg.day, done: seg.isCompleted });
                }}
              />
            );
          })}

          {todayDay && (() => {
            const ang = (todayDay - 0.5) * DEG_PER_DAY;
            const p1 = polar(INNER_RADIUS - 8, ang);
            const p2 = polar(outerMostR + 10, ang);
            const tip = polar(outerMostR + 22, ang);
            return (
              <g>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeWidth="1.5" className="text-foreground" strokeDasharray="3 2" />
                <text x={tip.x} y={tip.y} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="600" className="fill-foreground uppercase tracking-wider select-none">Today</text>
              </g>
            );
          })()}

          {(habits as any[]).map((habit: any, hIdx: number) => {
            const midR = INNER_RADIUS + hIdx * (RING_WIDTH + RING_GAP) + RING_WIDTH / 2;
            const pos = polar(midR, 93);
            const label = habit.name.length > 4 ? habit.name.slice(0, 3) + "…" : habit.name;
            return (
              <text
                key={habit.id}
                x={pos.x} y={pos.y}
                textAnchor="start" dominantBaseline="middle"
                fontSize="7" fontWeight="500"
                fill={habit.color}
                className="select-none pointer-events-none"
                style={{ paintOrder: "stroke", stroke: "var(--color-card)", strokeWidth: 3 }}
              >
                {label}
              </text>
            );
          })}

          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((day) => {
            const tickAng = day * DEG_PER_DAY;
            const labelAng = (day - 5) * DEG_PER_DAY;
            const t1 = polar(outerMostR + 4, tickAng);
            const t2 = polar(outerMostR + 10, tickAng);
            const lp = polar(outerMostR + 22, labelAng);
            return (
              <g key={day}>
                <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground" />
                <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fontFamily="monospace" className="fill-muted-foreground select-none">{day}</text>
              </g>
            );
          })}

          {(() => {
            const p = polar(outerMostR + 22, -4);
            return (
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fontFamily="monospace" className="fill-muted-foreground select-none">1</text>
            );
          })()}

          <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 6} fill="var(--color-card)" />
          <text x={CENTER} y={CENTER - 10} textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="300" className="fill-foreground">{overallPercent}%</text>
          <text x={CENTER} y={CENTER + 8} textAnchor="middle" dominantBaseline="middle" fontSize="7" className="fill-muted-foreground uppercase tracking-[0.12em]">of 90 days</text>
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 bg-popover border shadow-md rounded-lg px-2.5 py-1.5 text-xs -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            <p className="font-medium">{tooltip.label}</p>
            <p className="text-muted-foreground">Day {tooltip.day}{tooltip.done ? " · ✓ done" : " · not done"}</p>
          </div>
        )}
      </div>

      {startDate && (
        <div className="flex items-center gap-5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/40 inline-block" /> Missed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 inline-block" /> Upcoming</span>
        </div>
      )}
    </div>
  );
}
