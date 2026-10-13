import { Storage } from './utils/storage.js';
import { announceTicket } from './utils/speech.js';
function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Elemen #${id} tidak ditemukan di layar.html.`);
    }
    return el;
}
// Elements
const liveClockDisplay = getRequiredElement('liveClock');
const lastUpdatedDisplay = getRequiredElement('lastUpdated');
const fullscreenBtn = getRequiredElement('fullscreenBtn');
const soundToggle = getRequiredElement('soundToggle');
const layarGrid = getRequiredElement('layarGrid');
const latestCallBanner = getRequiredElement('latestCallBanner');
const latestTicketSpan = getRequiredElement('latestTicket');
const latestServiceSpan = getRequiredElement('latestService');
// State to track tickets already announced to avoid repeating every 2s
let lastAnnouncedTicketId = null;
// Digital Clock updater
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    liveClockDisplay.textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();
// Fullscreen API toggle
fullscreenBtn.addEventListener('click', async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            fullscreenBtn.textContent = '⤓ Keluar Layar Penuh';
        }
        else {
            await document.exitFullscreen();
            fullscreenBtn.textContent = '⤢ Layar Penuh';
        }
    }
    catch (err) {
        console.warn('Gagal mengubah mode layar penuh:', err);
    }
});
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = '⤓ Keluar Layar Penuh';
    }
    else {
        fullscreenBtn.textContent = '⤢ Layar Penuh';
    }
});
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
// Seed default queue types if storage is empty
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
// Render active queue display cards
function renderLayar() {
    const queueTypes = Storage.getQueueTypes().filter((t) => t.isActive);
    const tickets = Storage.getTickets();
    // Update timestamp
    const now = new Date();
    lastUpdatedDisplay.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
    layarGrid.innerHTML = '';
    if (queueTypes.length === 0) {
        layarGrid.innerHTML = '<p class="empty-state">Tidak ada layanan aktif saat ini.</p>';
        latestCallBanner.style.display = 'none';
        return;
    }
    // Find most recently called ticket overall for top banner
    const allCalledTickets = tickets
        .filter((t) => t.status === 'Dipanggil')
        .sort((a, b) => b.createdAt - a.createdAt);
    if (allCalledTickets.length > 0) {
        const topCalled = allCalledTickets[0];
        const topService = queueTypes.find((t) => t.code === topCalled.queueCode);
        const serviceName = topService ? topService.name : `Poli ${topCalled.queueCode}`;
        latestTicketSpan.textContent = topCalled.id;
        latestServiceSpan.textContent = serviceName;
        latestCallBanner.style.display = 'flex';
        // Play sound on the display monitor if ticket changed and sound is enabled
        if (soundToggle.checked && lastAnnouncedTicketId !== topCalled.id) {
            lastAnnouncedTicketId = topCalled.id;
            announceTicket(topCalled.id, serviceName);
        }
    }
    else {
        latestCallBanner.style.display = 'none';
    }
    queueTypes.forEach((type) => {
        const typeTickets = tickets.filter((t) => t.queueCode === type.code);
        const currentCalled = typeTickets.find((t) => t.status === 'Dipanggil');
        const waitingCount = typeTickets.filter((t) => t.status === 'Menunggu').length;
        const card = document.createElement('div');
        card.className = `layar-card ${currentCalled ? 'has-active-call' : ''}`;
        const cardHeader = `
      <div class="layar-card-header">
        <span class="layar-code-badge">${type.code}</span>
        <h3 class="layar-service-name">${type.name}</h3>
      </div>
    `;
        const cardBody = currentCalled
            ? `
      <div class="layar-card-body">
        <div class="layar-status-label">SEDANG DIPANGGIL</div>
        <div class="layar-number animate-pulse">${currentCalled.id}</div>
        <div class="layar-priority">
          <span class="priority-badge ${getPriorityBadgeClass(currentCalled.priority)}">
            Prioritas: ${currentCalled.priority}
          </span>
        </div>
      </div>
      `
            : `
      <div class="layar-card-body body-empty">
        <div class="layar-status-label">SEDANG DIPANGGIL</div>
        <div class="layar-number-empty">Belum ada nomor dipanggil</div>
      </div>
      `;
        const cardFooter = `
      <div class="layar-card-footer">
        <span class="waiting-count-badge">⏳ ${waitingCount} tiket menunggu</span>
      </div>
    `;
        card.innerHTML = `${cardHeader}${cardBody}${cardFooter}`;
        layarGrid.appendChild(card);
    });
}
// Initial render
ensureSeedData();
renderLayar();
// Real-time polling every 2 seconds
setInterval(() => {
    renderLayar();
}, 2000);
//# sourceMappingURL=layar.js.map