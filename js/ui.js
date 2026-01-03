// UI rendering and interaction functions
import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS } from './config.js';
import { calculateNextDue, getAllNextDueDates } from './tasks.js';

const HUMIDITY_KEY = STORAGE_KEYS.legacy.humidity;

export function renderMaintenanceTasks() {
    const container = document.getElementById('maintenanceContainer');
    if (!container) return;

    container.innerHTML = '';

    const categories = [
        { key: 'daily', label: '🟢 Daily Tasks (After Each Session)', color: '--color-daily' },
        { key: 'weekly', label: '🔵 Weekly Tasks', color: '--color-weekly' },
        { key: 'eightweek', label: '🟠 8-Week Tasks (String Change & Deep Clean)', color: '--color-8week' },
        { key: 'quarterly', label: '🔴 Quarterly Tasks (Every 12 Weeks)', color: '--color-quarterly' },
        { key: 'annual', label: '🟣 Annual Tasks', color: '--color-annual' }
    ];

    categories.forEach(category => {
        const tasks = MAINTENANCE_TASKS[category.key];
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percent = Math.round((completed / total) * 100);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid var(${category.color})`;
        card.innerHTML = `
            <h3>${category.label}</h3>
            <div class="progress-bar" style="margin-bottom: 16px;">
                <div class="progress-fill" style="background-color: var(${category.color}); width: ${percent}%"></div>
            </div>
            <div class="task-list" id="tasks-${category.key}"></div>
        `;
        container.appendChild(card);

        const taskList = document.getElementById(`tasks-${category.key}`);
        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted).toLocaleDateString() : 'Never';
            const nextDue = calculateNextDue(task, category.key);

            taskEl.innerHTML = `
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                    <div class="task-info">
                        <div class="task-name">${task.name}</div>
                        <div class="task-duration">⏱️ ${task.duration}</div>
                        <div class="task-dates">
                            <div><strong>Last:</strong> ${lastCompleted}</div>
                            <div><strong>Next Due:</strong> ${nextDue}</div>
                        </div>
                    </div>
                </div>
                <button class="expand-btn">+ Why & How</button>
                <div class="expand-content">
                    <div class="expand-section">
                        <div class="expand-label">WHY</div>
                        <div class="expand-text">${task.why}</div>
                    </div>
                    <div class="expand-section">
                        <div class="expand-label">HOW</div>
                        <div class="expand-text">${task.how}</div>
                    </div>
                </div>
            `;
            taskList.appendChild(taskEl);
        });
    });
}

export function toggleExpand(btn) {
    const content = btn.nextElementSibling;
    content.classList.toggle('show');
    btn.textContent = content.classList.contains('show') ? '- Hide' : '+ Why & How';
}

export function renderInventoryChecklist() {
    const container = document.getElementById('inventoryChecklist');
    if (!container) return;

    container.innerHTML = '';

    EQUIPMENT_ITEMS.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'checklist-item';
        el.innerHTML = `
            <input type="checkbox" id="eq-${index}">
            <div class="checklist-content">
                <div class="checklist-label">${item}</div>
            </div>
        `;
        container.appendChild(el);
    });
}

export function updateDashboard() {
    // Calculate overall completion
    let totalTasks = 0, completedTasks = 0;
    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
        });
    }
    const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overallCompletionEl = document.getElementById('overallCompletion');
    const overallBarEl = document.getElementById('overallBar');
    if (overallCompletionEl) overallCompletionEl.textContent = overallPercent + '%';
    if (overallBarEl) overallBarEl.style.width = overallPercent + '%';

    // Period completion
    updatePeriodCompletion('daily', '--color-daily');
    updatePeriodCompletion('weekly', '--color-weekly');
    updatePeriodCompletion('eightweek', '--color-8week');
    updatePeriodCompletion('quarterly', '--color-quarterly');
    updatePeriodCompletion('annual', '--color-annual');

    // Humidity stats
    const readings = JSON.parse(localStorage.getItem(HUMIDITY_KEY) || '[]');
    if (readings.length > 0) {
        const latest = readings[0];
        const humidity = latest.humidity;

        const currentHumidityEl = document.getElementById('currentHumidity');
        const latestHumidityEl = document.getElementById('latestHumidity');
        const latestTimeEl = document.getElementById('latestTime');

        if (currentHumidityEl) currentHumidityEl.textContent = humidity + '%';
        if (latestHumidityEl) latestHumidityEl.textContent = humidity + '%';

        const date = new Date(latest.timestamp);
        if (latestTimeEl) latestTimeEl.textContent = date.toLocaleString();

        let status = '✓ Safe (45-50%)';
        let className = 'safe';
        if (humidity > 55) {
            status = '🔴 DANGER (>55%)';
            className = 'danger';
        } else if (humidity < 40) {
            status = '⚠️ Low (<40%)';
            className = 'warning';
        } else if (humidity > 50) {
            status = '⚠️ Slightly High';
            className = 'warning';
        }

        const humidityStatusEl = document.getElementById('humidityStatus');
        if (humidityStatusEl) humidityStatusEl.textContent = status;
        if (currentHumidityEl) currentHumidityEl.className = `humidity-display ${className}`;

        // 24h change
        const oneDayAgo = new Date(date.getTime() - 24 * 60 * 60 * 1000);
        const prevReading = readings.find(r => new Date(r.timestamp) <= oneDayAgo);
        const humidity24hChangeEl = document.getElementById('humidity24hChange');
        if (prevReading && humidity24hChangeEl) {
            const change = humidity - prevReading.humidity;
            const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
            humidity24hChangeEl.textContent = changeStr;
        } else if (humidity24hChangeEl) {
            humidity24hChangeEl.textContent = '—';
        }

        // 7-day range
        const sevenDaysAgo = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentReadings = readings.filter(r => new Date(r.timestamp) >= sevenDaysAgo).map(r => r.humidity);
        if (recentReadings.length > 0) {
            const high = Math.max(...recentReadings);
            const low = Math.min(...recentReadings);
            const humidity7dHighEl = document.getElementById('humidity7dHigh');
            const humidity7dLowEl = document.getElementById('humidity7dLow');
            if (humidity7dHighEl) humidity7dHighEl.textContent = high.toFixed(1) + '%';
            if (humidity7dLowEl) humidity7dLowEl.textContent = low.toFixed(1) + '%';
        }
    }

    // String change counter
    let stringChangeDate = null;
    for (let task of MAINTENANCE_TASKS.eightweek) {
        if (task.id === '8w-8' && task.lastCompleted) {
            stringChangeDate = new Date(task.lastCompleted);
            break;
        }
    }

    const daysSinceChangeEl = document.getElementById('daysSinceChange');
    if (stringChangeDate && daysSinceChangeEl) {
        const today = new Date();
        const daysSince = Math.floor((today - stringChangeDate) / (1000 * 60 * 60 * 24));
        daysSinceChangeEl.textContent = daysSince + ' days';

        if (daysSince > 56) {
            daysSinceChangeEl.style.color = 'var(--color-error)';
        } else if (daysSince > 49) {
            daysSinceChangeEl.style.color = 'var(--color-warning)';
        } else {
            daysSinceChangeEl.style.color = 'var(--color-success)';
        }
    }

    // Calendar
    renderCalendar();
}

function updatePeriodCompletion(category, colorVar) {
    const tasks = MAINTENANCE_TASKS[category];
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const percentEl = document.getElementById(category + 'Percent');
    const barEl = document.getElementById(category + 'Bar');

    if (percentEl) percentEl.textContent = percent + '%';
    if (barEl) barEl.style.width = percent + '%';
}

export function renderCalendar() {
    const container = document.getElementById('maintenanceCalendar');
    if (!container) return;

    container.innerHTML = '';

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.fontSize = '11px';
        header.style.fontWeight = '600';
        header.style.padding = '4px';
        header.textContent = day;
        container.appendChild(header);
    });

    const nextDueDates = getAllNextDueDates();
    let current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (current.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
            dayEl.textContent = current.getDate();
        } else if (nextDueDates.some(d => d.toDateString() === current.toDateString())) {
            dayEl.classList.add('upcoming');
            dayEl.textContent = current.getDate();
        } else if (current.getMonth() === month) {
            dayEl.textContent = current.getDate();
        } else {
            dayEl.style.opacity = '0.3';
            dayEl.textContent = current.getDate();
        }

        container.appendChild(dayEl);
        current.setDate(current.getDate() + 1);
    }
}

export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabContent = document.getElementById(tabName);
    if (tabContent) tabContent.classList.add('active');

    // Find and activate the corresponding tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.split('-')[0])) {
            btn.classList.add('active');
        }
    });
}

export function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

export function openBridgeRecommendations() {
    const modal = document.getElementById('bridgeModal');
    if (modal) modal.classList.add('show');
}

export function closeBridgeModal() {
    const modal = document.getElementById('bridgeModal');
    if (modal) modal.classList.remove('show');
}

export function openActionRecommendations() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.classList.add('show');
}

export function closeActionModal() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.classList.remove('show');
}

export function openFretRecommendations() {
    const modal = document.getElementById('fretModal');
    if (modal) modal.classList.add('show');
}

export function closeFretModal() {
    const modal = document.getElementById('fretModal');
    if (modal) modal.classList.remove('show');
}
