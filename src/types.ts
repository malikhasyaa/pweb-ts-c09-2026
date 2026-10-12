export type Role = 'admin' | 'moderator' | 'user';

export interface UserSession {
  token: string;
  role: Role;
  firstName: string;
}

export type Priority = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';

export type TicketStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

export interface QueueType {
  code: string; // e.g., 'A'
  name: string; // e.g., 'Poli Umum'
  isActive: boolean;
}

export interface Ticket {
  id: string; // e.g., 'A-001'
  queueCode: string;
  number: number;
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
}
