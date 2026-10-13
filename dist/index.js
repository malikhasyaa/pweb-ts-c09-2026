import { Storage } from './utils/storage.js';
// 1. Auth Guard & Role Guard
function checkAuthAndRole() {
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
    }
    catch (err) {
        console.error('Error verifikasi auth:', err);
        window.location.href = 'login.html';
        return false;
    }
}
// 2. Fitur Logout
function setupLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            Storage.clearSession();
            window.location.href = 'login.html';
        });
    }
}
// Inisialisasi Data Default jika localStorage masih kosong
function initDefaultQueueTypes() {
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
function renderQueueTypes() {
    const container = document.getElementById('queue-types-list');
    const dropdownLayanan = document.getElementById('select-queue-type');
    if (!container)
        return;
    const queueTypes = Storage.getQueueTypes() || [];
    const tickets = Storage.getTickets() || [];
    container.innerHTML = '';
    if (dropdownLayanan) {
        dropdownLayanan.innerHTML = '<option value="">Pilih jenis antrian</option>';
    }
    if (queueTypes.length === 0) {
        container.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 15px;">Belum ada jenis antrian. Tambahkan di atas.</div>';
        return;
    }
    queueTypes.forEach((qt) => {
        const waitingCount = tickets.filter((t) => t.queueCode === qt.code && t.status === 'Menunggu').length;
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
            const code = e.target.getAttribute('data-code');
            if (code)
                toggleQueueStatus(code);
        });
    });
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.getAttribute('data-code');
            if (code)
                deleteQueueType(code);
        });
    });
}
function addQueueType(code, name) {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanCode || !cleanName) {
        alert('Kode dan Nama Layanan tidak boleh kosong!');
        return;
    }
    const queueTypes = Storage.getQueueTypes() || [];
    const codeExists = queueTypes.some((q) => q.code.toUpperCase() === cleanCode);
    const nameExists = queueTypes.some((q) => q.name.toLowerCase() === cleanName.toLowerCase());
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
function toggleQueueStatus(code) {
    const queueTypes = Storage.getQueueTypes() || [];
    const target = queueTypes.find((q) => q.code === code);
    if (target) {
        target.isActive = !target.isActive;
        Storage.saveQueueTypes(queueTypes);
        renderQueueTypes();
    }
}
function deleteQueueType(code) {
    if (!confirm('Apakah Anda yakin ingin menghapus jenis antrian ini?'))
        return;
    const queueTypes = Storage.getQueueTypes().filter((q) => q.code !== code);
    Storage.saveQueueTypes(queueTypes);
    renderQueueTypes();
}
// 4. Reset Antrian
function setupResetAntrian() {
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
function setupTicketIssuance() {
    const form = document.getElementById('form-issue-ticket');
    if (!form)
        return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectQueue = document.getElementById('select-queue-type');
        const selectPriority = document.getElementById('select-priority');
        const queueCode = selectQueue.value;
        const priority = selectPriority.value;
        if (!queueCode) {
            alert('Pilih jenis antrian terlebih dahulu!');
            return;
        }
        const queueTypes = Storage.getQueueTypes() || [];
        const targetQueue = queueTypes.find((q) => q.code === queueCode);
        if (!targetQueue)
            return;
        const tickets = Storage.getTickets() || [];
        const sameTypeTickets = tickets.filter((t) => t.queueCode === queueCode);
        const nextNum = sameTypeTickets.length + 1;
        const formattedId = `${targetQueue.code}-${String(nextNum).padStart(3, '0')}`;
        const newTicket = {
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
function renderTicketsList() {
    const container = document.getElementById('issued-tickets-list');
    if (!container)
        return;
    const tickets = Storage.getTickets() || [];
    container.innerHTML = '';
    if (tickets.length === 0) {
        container.innerHTML = '<div style="color: #6c757d; font-size: 13px; text-align: center; margin-top: 15px;">Belum ada tiket terbit.</div>';
        return;
    }
    tickets.slice().reverse().forEach((t) => {
        const div = document.createElement('div');
        div.className = 'card-item ticket-row';
        let statusColor = '#f59e0b';
        if (t.status === 'Dipanggil')
            statusColor = '#3b82f6';
        if (t.status === 'Selesai')
            statusColor = '#10b981';
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
function init() {
    const isAuthorized = checkAuthAndRole();
    if (!isAuthorized)
        return;
    setupLogout();
    setupResetAntrian();
    initDefaultQueueTypes();
    renderQueueTypes();
    setupTicketIssuance();
    renderTicketsList();
    const addForm = document.getElementById('form-add-queue-type');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Menghentikan reload HTML native
            const codeInput = document.getElementById('input-code');
            const nameInput = document.getElementById('input-name');
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
}
else {
    init();
}
//# sourceMappingURL=index.js.map