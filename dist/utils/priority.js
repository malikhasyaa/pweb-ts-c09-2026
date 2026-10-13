/**
 * Priority weighting according to assignment specification:
 * VIP > Disabilitas > Lansia > Normal
 */
export const PRIORITY_WEIGHTS = {
    VIP: 4,
    Disabilitas: 3,
    Lansia: 2,
    Normal: 1
};
/**
 * Sorts waiting tickets based on the required priority hierarchy:
 * 1. Priority weight (VIP > Disabilitas > Lansia > Normal)
 * 2. Earlier createdAt timestamp (FIFO)
 * 3. Ticket sequence number (FIFO tie-breaker)
 */
export function sortWaitingTickets(tickets) {
    return [...tickets].sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.priority] ?? 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] ?? 0;
        if (weightB !== weightA) {
            return weightB - weightA; // Higher priority first
        }
        if (a.createdAt !== b.createdAt) {
            return a.createdAt - b.createdAt; // Earlier ticket first
        }
        return a.number - b.number;
    });
}
//# sourceMappingURL=priority.js.map