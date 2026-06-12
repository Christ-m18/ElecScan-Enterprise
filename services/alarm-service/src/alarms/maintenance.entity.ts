import { randomUUID } from 'node:crypto';

export interface MaintenanceWindow {
  id: string;
  deviceId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  createdAt: string;
}

export function makeWindow(data: Omit<MaintenanceWindow, 'id' | 'createdAt'>): MaintenanceWindow {
  return { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
}

export function isWindowActive(w: MaintenanceWindow): boolean {
  const now = Date.now();
  return now >= new Date(w.startsAt).getTime() && now <= new Date(w.endsAt).getTime();
}
