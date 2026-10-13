import { Storage } from './utils/storage.js';
import { sortWaitingTickets } from './utils/priority.js';
import { announceTicket } from './utils/speech.js';
// Auth Guard: ensure user is logged in
const session = Storage.getSession();
if (!session) {
    window.location.href = 'login.html';
}
function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Elemen #${id} tidak ditemukan di operator.html.`);
    }
    return el;
}
// UI Elements
const userNameSpan = getRequiredElement('operatorUserName');
const userRoleSpan = getRequiredElement('operatorUserRole');
const logoutBtn = getRequiredElement('operatorLogoutBtn');
const operatorGrid = getRequiredElement('operatorGrid');
const soundToggle = getRequiredElement('soundToggle');
// Display active session credentials
if (session) {
    userNameSpan.textContent = session.firstName;
    userRoleSpan.textContent = session.role;
}
// Logout handler
logoutBtn.addEventListener('click', () => {
    Storage.clearSession();
    window.location.href = 'login.html';
});
// Seed default queue types if empty
function ensureSeedData() {
    const types = Storage.getQueueTypes();
    if (types.length === 0) {
        const initialTypes = [
            { code: 'A', name: 'Poli Umum', isActive: true },
            { code: 'B', name: 'Poli Gigi', isActive: true },
            { code: 'C', name: 'Poli Anak', isActive: true }
        ];
        Storage.saveQueueTypes(initialTypes);
    }
}
function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'VIP':
            return 'badge-vip';
        case 'Disabilitas':
            return 'badge-disabilitas';
        case 'Lansia':
            return 'badge-lansia';
        case 'Normal':
        default:
            return 'badge-normal';
    }
}
// Render queue control cards for each active queue type
function renderOperatorPanel() {
    const queueTypes = Storage.getQueueTypes().filter((t) => t.isActive);
    const allTickets = Storage.getTickets();
    operatorGrid.innerHTML = '';
    if (queueTypes.length === 0) {
        operatorGrid.innerHTML = '<p class="empty-state">Tidak ada jenis antrean aktif saat ini.</p>';
        return;
    }
    queueTypes.forEach((type) => {
        const typeTickets = allTickets.filter((t) => t.queueCode === type.code);
        const currentCalled = typeTickets.find((t) => t.status === 'Dipanggil');
        const waitingTickets = sortWaitingTickets(typeTickets.filter((t) => t.status === 'Menunggu'));
        const nextTicket = waitingTickets[0] ?? null;
        const card = document.createElement('div');
        card.className = 'operator-card';
        // Header with service code, name, and waiting count
        const headerHtml = `
      <div class="card-header">
        <div class="card-title">
          <span class="service-code">${type.code}</span>
          <span class="service-name">${type.name}</span>
        </div>
        <span class="waiting-badge">${waitingTickets.length} Menunggu</span>
      </div>
    `;
        // Active & Next ticket details
        const activeTicketHtml = currentCalled
            ? `<div class="ticket-call-box active-call">
          <div class="call-label">SEDANG DIPANGGIL</div>
          <div class="call-number">${currentCalled.id}</div>
          <span class="priority-badge ${getPriorityBadgeClass(currentCalled.priority)}">
            Prioritas: ${currentCalled.priority}
          </span>
        </div>`
            : `<div class="ticket-call-box active-empty">
          <div class="call-label">SEDANG DIPANGGIL</div>
          <div class="call-number text-muted">-</div>
          <span class="call-subtext">Belum ada panggilan</span>
        </div>`;
        const nextTicketHtml = nextTicket
            ? `<div class="ticket-call-box next-call">
          <div class="call-label">BERIKUTNYA</div>
          <div class="call-number">${nextTicket.id}</div>
          <span class="priority-badge ${getPriorityBadgeClass(nextTicket.priority)}">
            ${nextTicket.priority}
          </span>
        </div>`
            : `<div class="ticket-call-box next-empty">
          <div class="call-label">BERIKUTNYA</div>
          <div class="call-number text-muted">-</div>
          <span class="call-subtext">Antrean kosong</span>
        </div>`;
        // Action buttons
        const actionButtonsHtml = `
      <div class="card-actions">
        <button class="btn btn-primary btn-call" data-code="${type.code}" ${waitingTickets.length === 0 && !currentCalled ? 'disabled' : ''}>
          Panggil Berikutnya
        </button>
        <div class="action-subgroup">
          <button class="btn btn-warning btn-skip" data-code="${type.code}" ${!currentCalled ? 'disabled' : ''}>
            Lewati
          </button>
          <button class="btn btn-secondary btn-done" data-code="${type.code}" ${!currentCalled ? 'disabled' : ''}>
            Selesai
          </button>
          <button class="btn btn-outline btn-repeat" data-code="${type.code}" title="Panggil Ulang Suara" ${!currentCalled ? 'disabled' : ''}>
            🔊 Ulang
          </button>
        </div>
      </div>
    `;
        card.innerHTML = `
      ${headerHtml}
      <div class="call-status-grid">
        ${activeTicketHtml}
        ${nextTicketHtml}
      </div>
      ${actionButtonsHtml}
    `;
        // Attach button event listeners
        const callBtn = card.querySelector('.btn-call');
        const skipBtn = card.querySelector('.btn-skip');
        const doneBtn = card.querySelector('.btn-done');
        const repeatBtn = card.querySelector('.btn-repeat');
        callBtn?.addEventListener('click', () => handleCallNext(type.code, type.name));
        skipBtn?.addEventListener('click', () => handleSkip(type.code));
        doneBtn?.addEventListener('click', () => handleFinish(type.code));
        repeatBtn?.addEventListener('click', () => handleRepeatVoice(type.code, type.name));
        operatorGrid.appendChild(card);
    });
}
/**
 * Panggil Berikutnya:
 * 1. Completes previous 'Dipanggil' ticket for this queue.
 * 2. Takes the highest priority waiting ticket (VIP > Disabilitas > Lansia > Normal, FIFO).
 * 3. Sets its status to 'Dipanggil'.
 * 4. Triggers voice announcement if sound is enabled.
 */
function handleCallNext(queueCode, serviceName) {
    const tickets = Storage.getTickets();
    // Mark currently active ticket as Selesai
    const currentActiveIndex = tickets.findIndex((t) => t.queueCode === queueCode && t.status === 'Dipanggil');
    if (currentActiveIndex !== -1) {
        tickets[currentActiveIndex].status = 'Selesai';
    }
    // Find next waiting ticket according to priority hierarchy
    const waitingForQueue = sortWaitingTickets(tickets.filter((t) => t.queueCode === queueCode && t.status === 'Menunggu'));
    if (waitingForQueue.length > 0) {
        const nextInLine = waitingForQueue[0];
        const ticketIndex = tickets.findIndex((t) => t.id === nextInLine.id);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = 'Dipanggil';
            // Play audio announcement if sound toggle is enabled
            if (soundToggle.checked) {
                announceTicket(tickets[ticketIndex].id, serviceName);
            }
        }
    }
    Storage.saveTickets(tickets);
    renderOperatorPanel();
}
/**
 * Lewati:
 * Marks currently active ticket as 'Dilewati'.
 */
function handleSkip(queueCode) {
    const tickets = Storage.getTickets();
    const currentActive = tickets.find((t) => t.queueCode === queueCode && t.status === 'Dipanggil');
    if (currentActive) {
        currentActive.status = 'Dilewati';
        Storage.saveTickets(tickets);
        renderOperatorPanel();
    }
}
/**
 * Selesai:
 * Marks currently active ticket as 'Selesai' without calling the next ticket.
 */
function handleFinish(queueCode) {
    const tickets = Storage.getTickets();
    const currentActive = tickets.find((t) => t.queueCode === queueCode && t.status === 'Dipanggil');
    if (currentActive) {
        currentActive.status = 'Selesai';
        Storage.saveTickets(tickets);
        renderOperatorPanel();
    }
}
/**
 * Panggil Ulang (Repeat Audio):
 * Re-announces the currently called ticket.
 */
function handleRepeatVoice(queueCode, serviceName) {
    const tickets = Storage.getTickets();
    const currentActive = tickets.find((t) => t.queueCode === queueCode && t.status === 'Dipanggil');
    if (currentActive) {
        announceTicket(currentActive.id, serviceName);
    }
}
// Initial setup
ensureSeedData();
renderOperatorPanel();
// Real-time polling every 2.5 seconds to catch new tickets from kiosk
setInterval(() => {
    renderOperatorPanel();
}, 2500);
//# sourceMappingURL=operator.js.map