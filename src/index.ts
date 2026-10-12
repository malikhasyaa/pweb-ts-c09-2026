import { Storage } from './utils/storage.js';

const userNameSpan = document.getElementById('userName');
const userRoleSpan = document.getElementById('userRole');
const logoutBtn = document.getElementById('logoutBtn');

const session = Storage.getSession();

if (!session) {
    window.location.href = 'login.html';
} else {
    if (userNameSpan) userNameSpan.textContent = session.firstName;
    if (userRoleSpan) userRoleSpan.textContent = session.role;
}

logoutBtn?.addEventListener('click', () => {
    Storage.clearSession();
    window.location.href = 'login.html';
});
