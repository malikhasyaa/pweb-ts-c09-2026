const KEYS = {
    SESSION: 'hospital_session',
    QUEUE_TYPES: 'hospital_queue_types',
    TICKETS: 'hospital_tickets'
};
export const Storage = {
    // Session
    saveSession: (session) => {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    },
    getSession: () => {
        const data = localStorage.getItem(KEYS.SESSION);
        return data ? JSON.parse(data) : null;
    },
    clearSession: () => {
        localStorage.removeItem(KEYS.SESSION);
    },
    // Queue Types
    saveQueueTypes: (types) => {
        localStorage.setItem(KEYS.QUEUE_TYPES, JSON.stringify(types));
    },
    getQueueTypes: () => {
        const data = localStorage.getItem(KEYS.QUEUE_TYPES);
        return data ? JSON.parse(data) : [];
    },
    // Tickets
    saveTickets: (tickets) => {
        localStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
    },
    getTickets: () => {
        const data = localStorage.getItem(KEYS.TICKETS);
        return data ? JSON.parse(data) : [];
    },
    clearAll: () => {
        localStorage.clear();
    }
};
//# sourceMappingURL=storage.js.map