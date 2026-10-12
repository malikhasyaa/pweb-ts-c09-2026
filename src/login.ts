import { Storage } from './utils/storage.js';
import { UserSession, Role } from './types.js';

const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Memproses...';
    errorMessage.style.display = 'none';

    try {
        const response = await fetch('https://dummyjson.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                // expiresInMins: 60, // optional
            })
        });

        if (!response.ok) {
            throw new Error('Username atau password salah.');
        }

        const data = await response.json();
        const accessToken: string = data.accessToken || data.token;

        // POST /auth/login tidak mengembalikan role,
        // ambil role asli dari GET /auth/me memakai Bearer token.
        let role: Role = 'user';
        let firstName: string = data.firstName;
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
        }

        const session: UserSession = {
            token: accessToken,
            role: role,
            firstName: firstName
        };

        Storage.saveSession(session);

        // Redirect based on role (moderator ikut ke dashboard admin seperti semula)
        if (session.role === 'admin' || session.role === 'moderator') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'operator.html';
        }

    } catch (error: any) {
        errorMessage.textContent = error.message || 'Terjadi kesalahan koneksi.';
        errorMessage.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Masuk';
    }
});
