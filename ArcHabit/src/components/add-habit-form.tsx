import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useCreateHabit, ALL_HABITS_KEY } from "@/hooks/use-habits";
import { useQueryClient } from "@tanstack/react-query";
import { getNextHabitColor } from "@/lib/colors";
import { toast } from "sonner";

export function AddHabitForm({ currentColors, count }: { currentColors: string[]; count: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const createHabit = useCreateHabit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (count >= 10) { toast.error("Maximum 10 habits allowed"); return; }
    const color = getNextHabitColor(currentColors);
    createHabit.mutate({ data: { name: name.trim(), color } }, {
      onSuccess: () => {
        setName(""); setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: ALL_HABITS_KEY });
        toast.success("Habit created");
      },
      onError: () => toast.error("Failed to create habit"),
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground border-dashed"
        disabled={count >= 10}
        onClick={() => {
          if (count >= 10) { toast.error("Maximum 10 habits allowed"); return; }
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        {count >= 10 ? "Habit limit reached" : "Add a new habit..."}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)}
        placeholder="E.g. Read 10 pages" className="flex-1" disabled={createHabit.isPending} />
      <Button type="submit" disabled={!name.trim() || createHabit.isPending}>Add</Button>
      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={createHabit.isPending}>Cancel</Button>
    </form>
  );
}
