import { Storage } from './utils/storage.js';
import type { QueueType, Ticket, Priority } from './types.js';

// 1. Auth Guard & Role Guard
function checkAuthAndRole(): boolean {
  try {
    const session = Storage.getSession();
    
    // Jika tidak ada data login atau rolenya bukan admin/moderator -> lempar ke login.html
    if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
      window.location.href = 'login.html';
      return false;
    }

    const userInfoElem = document.getElementById('user-info');
    if (userInfoElem) {
      const name = session.firstName || 'Admin';
      const roleStr = (session.role || 'ADMIN').toUpperCase();
      userInfoElem.textContent = `${name} (${roleStr})`;
    }
    return true;
  } catch (err) {
    console.error('Error verifikasi auth:', err);
    window.location.href = 'login.html';
    return false;
  }
}

// 2. Fitur Logout
function setupLogout(): void {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      Storage.clearSession();
      window.location.href = 'login.html';
    });
  }
}

// Inisialisasi Data Default jika localStorage masih kosong
function initDefaultQueueTypes(): QueueType[] {
  let queueTypes = Storage.getQueueTypes();
  if (!queueTypes || queueTypes.length === 0) {
    queueTypes = [
      { code: 'A', name: 'Poli Umum', isActive: true },
      { code: 'B', name: 'Poli Gigi', isActive: true },
      { code: 'C', name: 'Poli Anak', isActive: true }
    ];
    Storage.saveQueueTypes(queueTypes);
  }
  return queueTypes;
}

// 3. Manajemen Jenis Antrian (CRUD)
function renderQueueTypes(): void {
  const container = document.getElementById('queue-types-list');
  const dropdownLayanan = document.getElementById('select-queue-type') as HTMLSelectElement | null;
  if (!container) return;

  const queueTypes: QueueType[] = Storage.getQueueTypes() || [];
  const tickets: Ticket[] = Storage.getTickets() || [];

  container.innerHTML = '';
  if (dropdownLayanan) {
    dropdownLayanan.innerHTML = '<option value="">Pilih jenis antrian</option>';
  }

  if (queueTypes.length === 0) {
    container.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 15px;">Belum ada jenis antrian. Tambahkan di atas.</div>';
    return;
  }

  queueTypes.forEach((qt: QueueType) => {
    const waitingCount = tickets.filter((t: Ticket) => t.queueCode === qt.code && t.status === 'Menunggu').length;

    const div = document.createElement('div');
    div.className = 'card-item queue-item';
    div.innerHTML = `
      <div class="queue-info">
        <div class="queue-title">${qt.name} <span>(${qt.code})</span></div>
        <div class="queue-waiting">${waitingCount} menunggu</div>
      </div>
      <div class="queue-actions">
        <button type="button" class="btn-sm ${qt.isActive ? 'btn-warning' : 'btn-secondary'} btn-toggle" data-code="${qt.code}">
          ${qt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
        <button type="button" class="btn-sm btn-danger btn-delete" data-code="${qt.code}">
          Hapus
        </button>
      </div>
    `;
    container.appendChild(div);

    if (dropdownLayanan && qt.isActive) {
      const opt = document.createElement('option');
      opt.value = qt.code;
      opt.textContent = `${qt.name} (${qt.code})`;
      dropdownLayanan.appendChild(opt);
    }
  });

  // Listener Toggle Status & Hapus
  container.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = (e.target as HTMLElement).getAttribute('data-code');
      if (code) toggleQueueStatus(code);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = (e.target as HTMLElement).getAttribute('data-code');
      if (code) deleteQueueType(code);
    });
  });
}

function addQueueType(code: string, name: string): void {
  const cleanCode = code.trim().toUpperCase();
  const cleanName = name.trim();

  if (!cleanCode || !cleanName) {
    alert('Kode dan Nama Layanan tidak boleh kosong!');
    return;
  }

  const queueTypes: QueueType[] = Storage.getQueueTypes() || [];
  const codeExists = queueTypes.some((q: QueueType) => q.code.toUpperCase() === cleanCode);
  const nameExists = queueTypes.some((q: QueueType) => q.name.toLowerCase() === cleanName.toLowerCase());

  if (codeExists || nameExists) {
    alert('Kode atau Nama Antrian sudah digunakan!');
    return;
  }

  queueTypes.push({
    code: cleanCode,
    name: cleanName,
    isActive: true
  });

  Storage.saveQueueTypes(queueTypes);
  renderQueueTypes();
}

function toggleQueueStatus(code: string): void {
  const queueTypes: QueueType[] = Storage.getQueueTypes() || [];
  const target = queueTypes.find((q: QueueType) => q.code === code);
  if (target) {
    target.isActive = !target.isActive;
    Storage.saveQueueTypes(queueTypes);
    renderQueueTypes();
  }
}

function deleteQueueType(code: string): void {
  if (!confirm('Apakah Anda yakin ingin menghapus jenis antrian ini?')) return;
  const queueTypes: QueueType[] = Storage.getQueueTypes().filter((q: QueueType) => q.code !== code);
  Storage.saveQueueTypes(queueTypes);
  renderQueueTypes();
}

// 4. Reset Antrian
function setupResetAntrian(): void {
  const btnReset = document.getElementById('btn-reset-antrian');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Yakin ingin mereset seluruh antrian? Urutan nomor akan kembali dari awal.')) {
        Storage.saveTickets([]);
        renderQueueTypes();
        renderTicketsList();
        alert('Seluruh antrian berhasil di-reset!');
      }
    });
  }
}

// 5. Penerbitan Tiket Manual
function setupTicketIssuance(): void {
  const form = document.getElementById('form-issue-ticket') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectQueue = document.getElementById('select-queue-type') as HTMLSelectElement;
    const selectPriority = document.getElementById('select-priority') as HTMLSelectElement;

    const queueCode = selectQueue.value;
    const priority = selectPriority.value as Priority;

    if (!queueCode) {
      alert('Pilih jenis antrian terlebih dahulu!');
      return;
    }

    const queueTypes: QueueType[] = Storage.getQueueTypes() || [];
    const targetQueue = queueTypes.find((q: QueueType) => q.code === queueCode);
    if (!targetQueue) return;

    const tickets: Ticket[] = Storage.getTickets() || [];
    const sameTypeTickets = tickets.filter((t: Ticket) => t.queueCode === queueCode);
    const nextNum = sameTypeTickets.length + 1;
    const formattedId = `${targetQueue.code}-${String(nextNum).padStart(3, '0')}`;

    const newTicket: Ticket = {
      id: formattedId,
      queueCode: targetQueue.code,
      number: nextNum,
      priority: priority,
      status: 'Menunggu',
      createdAt: Date.now()
    };

    tickets.push(newTicket);
    Storage.saveTickets(tickets);

    renderQueueTypes();
    renderTicketsList();
    alert(`Tiket ${formattedId} (${priority}) berhasil diterbitkan!`);
  });
}

function renderTicketsList(): void {
  const container = document.getElementById('issued-tickets-list');
  if (!container) return;

  const tickets: Ticket[] = Storage.getTickets() || [];
  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = '<div style="color: #6c757d; font-size: 13px; text-align: center; margin-top: 15px;">Belum ada tiket terbit.</div>';
    return;
  }

  tickets.slice().reverse().forEach((t: Ticket) => {
    const div = document.createElement('div');
    div.className = 'card-item ticket-row';

    let statusColor = '#f59e0b';
    if (t.status === 'Dipanggil') statusColor = '#3b82f6';
    if (t.status === 'Selesai') statusColor = '#10b981';

    div.innerHTML = `
      <div class="ticket-info">
        <span class="ticket-num">${t.id}</span>
        <span class="ticket-prio">${t.priority}</span>
      </div>
      <div class="ticket-status" style="color: ${statusColor};">${t.status}</div>
    `;
    container.appendChild(div);
  });
}

// Inisialisasi Utama
function init(): void {
  const isAuthorized = checkAuthAndRole();
  if (!isAuthorized) return;

  setupLogout();
  setupResetAntrian();
  initDefaultQueueTypes();
  renderQueueTypes();
  setupTicketIssuance();
  renderTicketsList();

  const addForm = document.getElementById('form-add-queue-type') as HTMLFormElement | null;
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Menghentikan reload HTML native
      const codeInput = document.getElementById('input-code') as HTMLInputElement;
      const nameInput = document.getElementById('input-name') as HTMLInputElement;
      if (codeInput && nameInput) {
        addQueueType(codeInput.value, nameInput.value);
        codeInput.value = '';
        nameInput.value = '';
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}