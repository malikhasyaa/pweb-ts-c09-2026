import { Storage } from './utils/storage.js';
import { UserSession, Role } from './types.js';

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Elemen #${id} tidak ditemukan di login.html.`);
    }
    return el as T;
}

const loginForm = getRequiredElement<HTMLFormElement>('loginForm');
const usernameInput = getRequiredElement<HTMLInputElement>('username');
const passwordInput = getRequiredElement<HTMLInputElement>('password');
const loginBtn = getRequiredElement<HTMLButtonElement>('loginBtn');
const errorMessage = getRequiredElement<HTMLDivElement>('errorMessage');
// Opsional: indikator loading terpisah (ada di login.html revisi).
// Tetap null-safe agar tidak crash bila elemen belum ada.
const loginLoading = document.getElementById('loginLoading') as HTMLParagraphElement | null;

const DEFAULT_BTN_TEXT = loginBtn.textContent ?? 'Masuk';

function showLoading(): void {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Memproses...';
    if (loginLoading) loginLoading.style.display = 'block';
}

function hideLoading(): void {
    loginBtn.disabled = false;
    loginBtn.textContent = DEFAULT_BTN_TEXT;
    if (loginLoading) loginLoading.style.display = 'none';
}

function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError(): void {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === '' || password === '') {
        showError('Username dan Password Wajib diisi.');
        return;
    }

    hideError();
    showLoading();

    try {
        // Autentikasi: POST ke API DummyJSON
        const response = await fetch('https://dummyjson.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            // API mengembalikan {"message":"Invalid credentials"} utk kredensial salah
            throw new Error('Username atau password salah.');
        }

        const data = await response.json();
        const accessToken: string = data.accessToken || data.token;
        if (!accessToken) {
            throw new Error('Username atau password salah.');
        }

        // Validasi role: POST /auth/login TIDAK mengembalikan role,
        // jadi ambil role asli via GET /auth/me (admin | moderator | user).
        let role: Role = 'user';
        let firstName: string = data.firstName ?? '';
        try {
            const meRes = await fetch('https://dummyjson.com/auth/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (meRes.ok) {
                const me = await meRes.json();
                if (me.role === 'admin' || me.role === 'moderator' || me.role === 'user') {
                    role = me.role;
                }
                if (me.firstName) firstName = me.firstName;
            } else if (data.role === 'admin' || data.role === 'moderator' || data.role === 'user') {
                role = data.role;
            }
        } catch {
            if (data.role === 'admin' || data.role === 'moderator' || data.role === 'user') {
                role = data.role;
            }
            // firstName fallback tetap dari /auth/login bila /auth/me gagal (offline dsb.)
        }

        // Session Storage: simpan token + role + firstName setelah auth berhasil
        const session: UserSession = { token: accessToken, role, firstName };
        Storage.saveSession(session);

        // Auto redirect berdasarkan role:
        // moderator disamakan hak aksesnya dengan admin -> index.html (Dashboard Admin).
        // role user (operator) -> operator.html.
        if (session.role === 'admin' || session.role === 'moderator') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'operator.html';
        }
    } catch (error: any) {
        // Error handling visual: kredensial salah ATAU koneksi jaringan gagal
        if (error instanceof TypeError) {
            showError('Gagal terhubung ke server. Periksa koneksi jaringan Anda.');
        } else {
            showError(error?.message || 'Terjadi kesalahan saat login.');
        }
    } finally {
        hideLoading();
    }
});
