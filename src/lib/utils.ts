import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calendar utility functions
export const pad = (n: number): string => String(n).padStart(2, '0');

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fmtDate = (d: string | Date): string => {
  return new Date(d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
};

export const ymd = (date: string | Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const minutesBetween = (t1: string, t2: string): number => {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

export const addMinutes = (t: string, mins: number): string => {
  let [h, m] = t.split(':').map(Number);
  let tot = h * 60 + m + mins;
  if (tot < 0) tot = 0;
  return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`;
};

export const splitTags = (s: string): string[] => {
  return (s || '').split(/\s+/).filter(x => x.startsWith('#'));
};

export const formatTime = (ms: number): string => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(m)}:${pad(s)}`;
};

export const startOfMonth = (dt: Date): Date => {
  return new Date(dt.getFullYear(), dt.getMonth(), 1);
};

export const endOfMonth = (dt: Date): Date => {
  return new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
};

export const weeksMatrix = (dt: Date): Date[] => {
  const start = startOfMonth(dt);
  const end = endOfMonth(dt);
  const startDow = (start.getDay() + 7) % 7; // 0=Dom
  const daysInMonth = end.getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const firstDate = new Date(start);
  firstDate.setDate(1 - startDow);
  
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(firstDate);
    d.setDate(d.getDate() + i);
    return d;
  });
};

export const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const downloadFile = (name: string, content: string, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
