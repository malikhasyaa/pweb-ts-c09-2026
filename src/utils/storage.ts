import { UserSession, QueueType, Ticket } from '../types.js';

const KEYS = {
  SESSION: 'hospital_session',
  QUEUE_TYPES: 'hospital_queue_types',
  TICKETS: 'hospital_tickets'
};

export const Storage = {
  // Session
  saveSession: (session: UserSession) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  },
  getSession: (): UserSession | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  // Queue Types
  saveQueueTypes: (types: QueueType[]) => {
    localStorage.setItem(KEYS.QUEUE_TYPES, JSON.stringify(types));
  },
  getQueueTypes: (): QueueType[] => {
    const data = localStorage.getItem(KEYS.QUEUE_TYPES);
    return data ? JSON.parse(data) : [];
  },

  // Tickets
  saveTickets: (tickets: Ticket[]) => {
    localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  },
  getTickets: (): Ticket[] => {
    const data = localStorage.getItem(KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },
  
  clearAll: () => {
    localStorage.clear();
  }
};
