import { useQuery, useMutation } from "@tanstack/react-query";

export const ALL_HABITS_KEY = ["habits", "all"] as const;

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined;
  return res.json();
}

export function useGetAllHabitsData() {
  return useQuery({ queryKey: ALL_HABITS_KEY, queryFn: () => apiFetch("/api/habits/data/all") });
}

export function useCreateHabit() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; color: string } }) =>
      apiFetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
}

export function useUpdateHabit() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string } }) =>
      apiFetch(`/api/habits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
}

export function useDeleteHabit() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => apiFetch(`/api/habits/${id}`, { method: "DELETE" }),
  });
}

export function useToggleHabitDay() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { day: number } }) =>
      apiFetch(`/api/habits/${id}/toggle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
}
