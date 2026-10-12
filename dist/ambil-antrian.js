import { Storage } from './utils/storage.js';
function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Elemen #${id} tidak ditemukan di ambil-antrian.html.`);
    }
    return el;
}
const queueTypesGrid = getRequiredElement('queueTypesGrid');
const prioritySelect = getRequiredElement('priority');
const ticketModal = getRequiredElement('ticketModal');
const ticketNumberDisplay = getRequiredElement('ticketNumber');
const ticketTypeDisplay = getRequiredElement('ticketType');
const ticketPriorityDisplay = getRequiredElement('ticketPriority');
const closeModalBtn = getRequiredElement('closeModalBtn');
// Initial seed data if empty
function seedData() {
    const currentTypes = Storage.getQueueTypes();
    if (currentTypes.length === 0) {
        const initialTypes = [
            { code: 'A', name: 'Poli Umum', isActive: true },
            { code: 'B', name: 'Poli Gigi', isActive: true },
            { code: 'C', name: 'Poli Anak', isActive: true }
        ];
        Storage.saveQueueTypes(initialTypes);
    }
}
function renderQueueTypes() {
    const types = Storage.getQueueTypes().filter(t => t.isActive);
    queueTypesGrid.innerHTML = '';
    if (types.length === 0) {
        queueTypesGrid.innerHTML = '<p>Tidak ada layanan aktif saat ini.</p>';
        return;
    }
    types.forEach(type => {
        const card = document.createElement('div');
        card.className = 'queue-card';
        card.innerHTML = `
            <h3>${type.code}</h3>
            <p>${type.name}</p>
        `;
        card.addEventListener('click', () => createTicket(type));
        queueTypesGrid.appendChild(card);
    });
}
function createTicket(type) {
    const priority = prioritySelect.value;
    const tickets = Storage.getTickets();
    // Find next number for this queue code
    const sameCodeTickets = tickets.filter(t => t.queueCode === type.code);
    const lastNumber = sameCodeTickets.reduce((max, t) => Math.max(max, t.number), 0);
    const nextNumber = lastNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const ticketId = `${type.code}-${paddedNumber}`;
    const newTicket = {
        id: ticketId,
        queueCode: type.code,
        number: nextNumber,
        priority: priority,
        status: 'Menunggu',
        createdAt: Date.now()
    };
    tickets.push(newTicket);
    Storage.saveTickets(tickets);
    showTicket(newTicket, type.name);
}
function showTicket(ticket, typeName) {
    ticketNumberDisplay.textContent = ticket.id;
    ticketTypeDisplay.textContent = typeName;
    ticketPriorityDisplay.textContent = `Prioritas: ${ticket.priority}`;
    ticketModal.style.display = 'flex';
}
closeModalBtn.addEventListener('click', () => {
    ticketModal.style.display = 'none';
});
// Polling for updates (every 3 seconds)
setInterval(() => {
    renderQueueTypes();
}, 3000);
// Init
seedData();
renderQueueTypes();
//# sourceMappingURL=ambil-antrian.js.map