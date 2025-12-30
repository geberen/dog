class DiscordHypeSquadManager {
    constructor() {
        this.selectedHouse = null;
        this.token = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedToken();
    }

    bindEvents() {
        // toggle butonu artık bir şey yapmıyor ama hata da vermez
        const toggleBtn = document.getElementById('toggleToken');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {});
        }

        document.getElementById('token')
            .addEventListener('input', this.onTokenChange.bind(this));

        document.querySelectorAll('.badge-option').forEach(option => {
            option.addEventListener('click', this.selectBadge.bind(this));
        });

        document.getElementById('setBadge')
            .addEventListener('click', this.setBadge.bind(this));

        document.getElementById('removeBadge')
            .addEventListener('click', this.removeBadge.bind(this));
    }

    loadSavedToken() {
        const savedToken = localStorage.getItem('discord_token');
        if (savedToken) {
            const sanitized = this.sanitizeToken(savedToken);
            const input = document.getElementById('token');
            input.type = 'text'; // HER ZAMAN TEXT
            input.value = sanitized;
            this.token = sanitized;
        }
    }

    onTokenChange(event) {
        this.token = this.sanitizeToken(event.target.value);
        localStorage.setItem('discord_token', this.token);
        this.updateSetButtonState();
    }

    selectBadge(event) {
        document.querySelectorAll('.badge-option').forEach(option => {
            option.classList.remove('selected');
        });

        const selectedOption = event.currentTarget;
        selectedOption.classList.add('selected');
        this.selectedHouse = parseInt(selectedOption.dataset.house);

        this.updateSetButtonState();
    }

    updateSetButtonState() {
        const setBadgeBtn = document.getElementById('setBadge');
        setBadgeBtn.disabled = !(this.token && this.selectedHouse);
    }

    async setBadge() {
        if (!this.token || !this.selectedHouse) {
            this.showStatus('Token ve rozet sec', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const houseIdMap = { 1: 3, 2: 1, 3: 2 };
            const apiHouseId = houseIdMap[this.selectedHouse] || this.selectedHouse;

            const response = await fetch(
                'https://discord.com/api/v9/hypesquad/online',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': this.token,
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    body: JSON.stringify({ house_id: apiHouseId })
                }
            );

            if (response.ok) {
                this.showStatus(
                    `${this.getHouseName(this.selectedHouse)} rozet eklendi`,
                    'success'
                );
            } else if (response.status === 401) {
                this.showStatus('Token yanlis', 'error');
            } else if (response.status === 429) {
                this.showStatus('Cok hizlisin', 'error');
            } else {
                const data = await response.json().catch(() => ({}));
                this.showStatus(data.message || 'Bilinmeyen hata', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showStatus('Internet yok', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async removeBadge() {
        if (!this.token) {
            this.showStatus('Token yok', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(
                'https://discord.com/api/v9/hypesquad/online',
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': this.token,
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            if (response.ok || response.status === 204) {
                this.showStatus('Rozet silindi', 'success');
                document.querySelectorAll('.badge-option').forEach(option => {
                    option.classList.remove('selected');
                });
                this.selectedHouse = null;
                this.updateSetButtonState();
            } else {
                this.showStatus('Silinemedi', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showStatus('Internet yok', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    getHouseName(id) {
        return {
            1: 'Balance',
            2: 'Bravery',
            3: 'Brilliance'
        }[id] || 'Unknown';
    }

    showStatus(message, type) {
        const el = document.getElementById('status');
        el.textContent = message;
        el.className = `status-message ${type}`;

        setTimeout(() => {
            el.textContent = '';
            el.className = 'status-message';
        }, 5000);
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const buttons = document.querySelectorAll('.action-btn');

        if (show) {
            loading.classList.remove('hidden');
            buttons.forEach(b => (b.disabled = true));
        } else {
            loading.classList.add('hidden');
            buttons.forEach(b => (b.disabled = false));
            this.updateSetButtonState();
        }
    }

    sanitizeToken(raw) {
        if (!raw) return '';
        let t = String(raw).trim();
        if (
            (t.startsWith('"') && t.endsWith('"')) ||
            (t.startsWith("'") && t.endsWith("'"))
        ) {
            t = t.slice(1, -1);
        }
        return t;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('token');
    if (input) input.type = 'text'; // KESINLIKLE GIZLENMEZ

    new DiscordHypeSquadManager();

    setTimeout(() => {
        const status = document.getElementById('status');
        status.textContent = 'Token gir, rozet sec';
        status.className = 'status-message info';
    }, 1000);
});

window.addEventListener('beforeunload', event => {
    const token = document.getElementById('token').value;
    if (token && !confirm('Token tarayicida kaydedilecek')) {
        event.preventDefault();
        event.returnValue = '';
    }
});
