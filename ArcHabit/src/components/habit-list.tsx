import { useGetAllHabitsData, useDeleteHabit, useUpdateHabit, ALL_HABITS_KEY } from "@/hooks/use-habits";
import { AddHabitForm } from "./add-habit-form";
import { Trash2, Edit2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function HabitList() {
  const { data: habits } = useGetAllHabitsData();
  const deleteHabit = useDeleteHabit();
  const queryClient = useQueryClient();
  const currentColors = habits?.map((h: any) => h.color) || [];

  const handleDelete = (id: number) => {
    if (!confirm("Delete this habit? All history will be lost.")) return;
    deleteHabit.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ALL_HABITS_KEY });
        toast.success("Habit deleted");
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-serif mb-1">Your Journey</h2>
        <p className="text-muted-foreground text-sm">Commit to small daily changes.</p>
      </div>
      <div className="space-y-3">
        {habits?.map((habit: any) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-3 rounded-xl bg-card border shadow-sm group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
              <div>
                <h3 className="font-medium text-sm">{habit.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {habit.completionPercent}% done · {habit.streak} day streak
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditHabitDialog habit={habit}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Name
                  </DropdownMenuItem>
                </EditHabitDialog>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(habit.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {habits?.length === 0 && (
          <div className="p-6 text-center border border-dashed rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground">Your habit list is empty.</p>
          </div>
        )}
      </div>
      <div className="pt-2">
        <AddHabitForm currentColors={currentColors} count={habits?.length || 0} />
      </div>
    </div>
  );
}

function EditHabitDialog({ habit, children }: { habit: any; children: React.ReactNode }) {
  const [name, setName] = useState(habit.name);
  const [open, setOpen] = useState(false);
  const updateHabit = useUpdateHabit();
  const queryClient = useQueryClient();

  const handleSave = () => {
    if (!name.trim()) return;
    updateHabit.mutate({ id: habit.id, data: { name: name.trim() } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ALL_HABITS_KEY });
        setOpen(false);
        toast.success("Habit updated");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Habit</DialogTitle></DialogHeader>
        <div className="py-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateHabit.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
