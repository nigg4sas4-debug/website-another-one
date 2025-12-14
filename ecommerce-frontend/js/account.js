(function () {
    const form = document.getElementById('account-form');
    const status = document.getElementById('account-status');
    const resetBtn = document.getElementById('reset-account');
    const logoutBtn = document.getElementById('logout-account');

    const DEFAULTS = {
        fullName: 'Jane Doe',
        email: localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).email : 'you@example.com',
        phone: '+1 555 0000',
        city: 'San Francisco',
        address1: '123 Market St',
        address2: '',
        postal: '94103',
        country: 'USA'
    };

    function loadProfile() {
        const saved = JSON.parse(localStorage.getItem('accountProfile') || 'null');
        return { ...DEFAULTS, ...(saved || {}) };
    }

    function saveProfile(data) {
        localStorage.setItem('accountProfile', JSON.stringify(data));
    }

    function fillForm(data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = value || '';
        });
    }

    function setStatus(text, tone = 'soft') {
        if (!status) return;
        status.textContent = text;
        status.className = `pill ${tone}`;
    }

    if (form) {
        fillForm(loadProfile());
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            const profile = Object.fromEntries(fd.entries());
            saveProfile(profile);
            setStatus('Saved', 'soft');
        });
    }

    resetBtn?.addEventListener('click', () => {
        saveProfile(DEFAULTS);
        fillForm(DEFAULTS);
        setStatus('Reset to defaults', 'warning');
    });

    logoutBtn?.addEventListener('click', () => {
        if (!confirm('Log out of this account?')) return;
        window.apiClient?.setToken(null);
        localStorage.removeItem('profile');
        window.location.href = './login.html';
    });
})();
