import { HabitRing } from "@/components/habit-ring";
import { HabitList } from "@/components/habit-list";
import { useGetAllHabitsData } from "@/hooks/use-habits";
import { Download, Moon, Sun, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function StreakBar({ habits }: { habits: any[] }) {
  const totalStreak = habits.reduce((a, h) => a + h.streak, 0);
  const avgCompletion = habits.length
    ? Math.round(habits.reduce((a, h) => a + h.completionPercent, 0) / habits.length)
    : 0;
  const bestStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;

  return (
    <div className="border-b bg-card/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-3">
        {/* Summary row */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">{totalStreak}</span>
            <span className="text-xs text-muted-foreground">total streak days</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-foreground">{bestStreak}</span>
            <span className="text-xs text-muted-foreground">best streak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{avgCompletion}%</span>
            <span className="text-xs text-muted-foreground">avg completion</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {habits.length} habit{habits.length !== 1 ? "s" : ""} · 90-day plan
          </div>
        </div>

        {/* Per-habit streak cards */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {habits.map((habit) => {
            const pct = habit.completionPercent;
            return (
              <div
                key={habit.id}
                className="flex-shrink-0 flex items-center gap-3 bg-background/70 border rounded-xl px-4 py-2.5 min-w-[180px]"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: habit.color }}
                >
                  {habit.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{habit.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="text-xs text-orange-500 font-semibold">{habit.streak}d</span>
                    <span className="text-xs text-muted-foreground ml-1">· {pct}%</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: habit.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: habits, isLoading } = useGetAllHabitsData();
  const { theme, setTheme } = useTheme();

  const handleExport = async () => {
    try {
      const response = await fetch("/api/habits/data/export");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habits-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export successful");
    } catch {
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-serif text-lg tracking-tight text-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            Circular · 90-Day Tracker
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex h-8">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Streak tracking bar */}
      {!isLoading && habits && habits.length > 0 && <StreakBar habits={habits} />}
      {isLoading && (
        <div className="border-b bg-card/60 py-4 px-6">
          <div className="max-w-7xl mx-auto flex gap-3">
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-16 w-48 rounded-xl" />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Left: habit list */}
        <div className="xl:sticky xl:top-[120px]">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-14 w-full mt-4" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <HabitList />
          )}
        </div>

        {/* Right: large circle */}
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <Skeleton className="w-full aspect-square max-w-[800px] rounded-full" />
          ) : (
            <HabitRing />
          )}
        </div>
      </main>
    </div>
  );
}
