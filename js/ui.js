/**
 * Guitar Tracker - UI Module
 * Handles DOM manipulation, rendering, and user interface
 */

import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, CATEGORY_CONFIG } from './config.js';
import { loadHumidityReadings, saveTheme, getTheme, loadInspectionData, saveInspectionData } from './storage.js';
import { calculateNextDue, getCategoryCompletion, getOverallCompletion, calculateStringLife, getDaysSinceStringChange, getAllNextDueDates, calculateInspectionDueDate } from './tasks.js';
import { getHumidityStats, drawHumidityChart } from './humidity.js';

/**
 * Render maintenance tasks
 */
export function renderMaintenanceTasks() {
    const container = document.getElementById('maintenanceContainer');
    if (!container) return;

    container.innerHTML = '';

    const categories = [
        { key: 'daily', label: 'Daily Tasks (After Each Session)', color: '--color-daily' },
        { key: 'weekly', label: 'Weekly Tasks', color: '--color-weekly' },
        { key: 'eightweek', label: '8-Week Tasks (String Change & Deep Clean)', color: '--color-8week' },
        { key: 'quarterly', label: 'Quarterly Tasks (Every 12 Weeks)', color: '--color-quarterly' },
        { key: 'annual', label: 'Annual Tasks', color: '--color-annual' }
    ];

    categories.forEach(category => {
        const tasks = MAINTENANCE_TASKS[category.key];
        if (!tasks) return;

        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percent = Math.round((completed / total) * 100);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid var(${category.color})`;
        card.style.marginBottom = '20px';
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

/**
 * Render equipment inventory checklist
 */
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

/**
 * Render humidity table
 */
export function renderHumidityTable() {
    const tbody = document.getElementById('humidityTable');
    if (!tbody) return;

    const readings = loadHumidityReadings();
    tbody.innerHTML = '';

    readings.slice(0, 20).forEach(reading => {
        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let statusBadge = '<span class="badge badge-success">✓ Safe</span>';
        if (reading.humidity > 55) {
            statusBadge = '<span class="badge badge-danger"> High Risk</span>';
        } else if (reading.humidity < 40) {
            statusBadge = '<span class="badge badge-warning">⚠️ Low</span>';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateStr} ${timeStr}</td>
            <td><strong>${reading.humidity}%</strong></td>
            <td>${reading.temp ? reading.temp + '°F' : '—'}</td>
            <td>${reading.location === 'case' ? 'Case' : 'Out'}</td>
            <td>${statusBadge}</td>
            <td><button class="btn-secondary delete-humidity-btn" data-id="${reading.id}" style="padding: 4px 8px; font-size: 12px;">×</button></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Update the dashboard display
 */
export function updateDashboard() {
    // Overall completion
    const overallPercent = getOverallCompletion();
    const overallEl = document.getElementById('overallCompletion');
    const overallBar = document.getElementById('overallBar');
    if (overallEl) overallEl.textContent = overallPercent + '%';
    if (overallBar) overallBar.style.width = overallPercent + '%';

    // Period completion
    updatePeriodCompletion('daily');
    updatePeriodCompletion('weekly');
    updatePeriodCompletion('eightweek');
    updatePeriodCompletion('quarterly');
    updatePeriodCompletion('annual');

    // Humidity stats
    const stats = getHumidityStats();
    if (stats.hasData) {
        const currentHumidity = document.getElementById('currentHumidity');
        const humidityStatus = document.getElementById('humidityStatus');
        const latestHumidity = document.getElementById('latestHumidity');
        const latestTime = document.getElementById('latestTime');

        if (currentHumidity) {
            currentHumidity.textContent = stats.latest.humidity + '%';
            currentHumidity.className = `humidity-display ${stats.status.class}`;
        }
        if (humidityStatus) {
            humidityStatus.textContent = stats.status.message;
        }
        if (latestHumidity) {
            latestHumidity.textContent = stats.latest.humidity + '%';
        }
        if (latestTime) {
            latestTime.textContent = new Date(stats.latest.timestamp).toLocaleString();
        }

        // 24h change
        const change24hEl = document.getElementById('humidity24hChange');
        if (change24hEl) {
            if (stats.change24h !== null) {
                const changeStr = stats.change24h > 0 ? `+${stats.change24h.toFixed(1)}%` : `${stats.change24h.toFixed(1)}%`;
                change24hEl.textContent = changeStr;
            } else {
                change24hEl.textContent = '—';
            }
        }

        // 7-day range
        if (stats.range7d) {
            const high7d = document.getElementById('humidity7dHigh');
            const low7d = document.getElementById('humidity7dLow');
            if (high7d) high7d.textContent = stats.range7d.high.toFixed(1) + '%';
            if (low7d) low7d.textContent = stats.range7d.low.toFixed(1) + '%';
        }
    }

    // String change counter
    const daysSince = getDaysSinceStringChange();
    const daysSinceEl = document.getElementById('daysSinceChange');
    if (daysSinceEl) {
        if (daysSince !== null) {
            daysSinceEl.textContent = daysSince + ' days';
            if (daysSince > 56) {
                daysSinceEl.style.color = 'var(--color-error)';
            } else if (daysSince > 42) {
                daysSinceEl.style.color = 'var(--color-warning)';
            } else {
                daysSinceEl.style.color = 'var(--color-success)';
            }
        } else {
            daysSinceEl.textContent = '—';
        }
    }

    // String life calculator
    const stringLife = calculateStringLife();
    const stringLifeFill = document.getElementById('stringLifeFill');
    const stringLifeText = document.getElementById('stringLifeText');
    const stringLifeEstimate = document.getElementById('stringLifeEstimate');

    if (stringLifeFill) {
        stringLifeFill.style.width = stringLife.percent + '%';
        stringLifeFill.className = `string-life-fill ${stringLife.status}`;
    }
    if (stringLifeText) {
        stringLifeText.textContent = `Strings at ${stringLife.percent}% life`;
    }
    if (stringLifeEstimate) {
        stringLifeEstimate.textContent = stringLife.estimate;
    }

    // Calendar
    renderCalendar();
}

/**
 * Update period completion display
 * @param {string} category - The category name
 */
function updatePeriodCompletion(category) {
    const percent = getCategoryCompletion(category);
    // Handle the naming difference for 8-week (old: sixweek)
    const elementId = category === 'eightweek' ? 'eightweek' : category;
    const percentEl = document.getElementById(category + 'Percent');
    const barEl = document.getElementById(category + 'Bar');

    if (percentEl) percentEl.textContent = percent + '%';
    if (barEl) barEl.style.width = percent + '%';
}

/**
 * Render maintenance calendar
 */
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
        } else if (nextDueDates.some(d => d.toDateString() === current.toDateString())) {
            dayEl.classList.add('upcoming');
        } else if (current.getMonth() !== month) {
            dayEl.style.opacity = '0.3';
        }

        dayEl.textContent = current.getDate();
        container.appendChild(dayEl);
        current.setDate(current.getDate() + 1);
    }
}

/**
 * Render alerts
 * @param {Object[]} alerts - Array of alert objects
 */
export function renderAlerts(alerts) {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    container.innerHTML = '';

    alerts.forEach(alert => {
        const el = document.createElement('div');
        el.className = `alert-banner ${alert.type}`;
        el.innerHTML = `
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h3>${alert.title}</h3>
                <p style="font-size: 12px; margin: 0;">${alert.message}</p>
            </div>
        `;
        container.appendChild(el);
    });
}

/**
 * Switch to a tab
 * @param {string} tabName - The tab name to switch to
 * @param {HTMLElement} clickedBtn - The clicked button element
 */
export function switchTab(tabName, clickedBtn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabContent = document.getElementById(tabName);
    if (tabContent) tabContent.classList.add('active');
    if (clickedBtn) clickedBtn.classList.add('active');

    // Redraw chart when switching to humidity tab
    if (tabName === 'humidity') {
        const canvas = document.getElementById('humidityChart');
        const container = document.getElementById('humidityChartContainer');
        if (canvas && container) {
            drawHumidityChart(canvas, container);
        }
    }
}

/**
 * Toggle theme between light and dark
 */
export function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    saveTheme(newTheme);

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = newTheme === 'dark' ? '☀️ Light Mode' : ' Dark Mode';
    }
}

/**
 * Apply saved theme on load
 */
export function applyTheme() {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : ' Dark Mode';
    }
}

/**
 * Toggle expand/collapse for task details
 * @param {HTMLElement} btn - The expand button
 */
export function toggleExpand(btn) {
    const content = btn.nextElementSibling;
    content.classList.toggle('show');
    btn.textContent = content.classList.contains('show') ? '- Hide' : '+ Why & How';
}

/**
 * Open a modal
 * @param {string} modalId - The modal element ID
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

/**
 * Close a modal
 * @param {string} modalId - The modal element ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

/**
 * Show confirmation message
 * @param {string} elementId - The confirmation element ID
 * @param {number} duration - Duration in ms
 */
export function showConfirmation(elementId, duration = 3000) {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, duration);
    }
}

/**
 * Show Just Played button feedback
 */
export function showJustPlayedFeedback() {
    const btn = document.querySelector('.btn-just-played');
    if (!btn) return;

    const originalText = btn.textContent;
    btn.textContent = '✓ Daily Tasks Logged!';
    btn.style.background = 'var(--color-success)';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

/**
 * Record inspection checkbox
 * @param {string} type - Inspection type ('bridge', 'action', 'fret')
 * @param {string} frequency - Inspection frequency
 */
export function recordInspection(type, frequency) {
    const inspectionData = loadInspectionData();

    const checkboxIds = {
        bridge: ['bridgeCheck1', 'bridgeCheck2'],
        action: ['actionCheck1', 'actionCheck2', 'actionCheck3'],
        fret: ['fretCheck1', 'fretCheck2', 'fretCheck3']
    };

    const ids = checkboxIds[type] || [];
    const allChecked = ids.every(id => {
        const checkbox = document.getElementById(id);
        return checkbox && checkbox.checked;
    });

    ids.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            if (!inspectionData[id]) {
                inspectionData[id] = { completed: false, lastCompleted: null };
            }
            inspectionData[id].completed = checkbox.checked;
            if (checkbox.checked) {
                inspectionData[id].lastCompleted = new Date().toISOString();
            }
        }
    });

    saveInspectionData(inspectionData);

    // Update result display
    const resultId = type + 'CheckResult';
    const resultEl = document.getElementById(resultId);
    if (resultEl && allChecked) {
        const nextDue = calculateInspectionDueDate(frequency);
        resultEl.textContent = `✓ Completed: ${new Date().toLocaleDateString()} | Next Due: ${nextDue}`;
        resultEl.style.display = 'block';
        resultEl.style.color = 'var(--color-success)';
    }
}

/**
 * Set default date on date inputs
 */
export function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Export UI object for convenience
export const UI = {
    renderMaintenanceTasks,
    renderInventoryChecklist,
    renderHumidityTable,
    updateDashboard,
    renderCalendar,
    renderAlerts,
    switchTab,
    toggleTheme,
    applyTheme,
    toggleExpand,
    openModal,
    closeModal,
    showConfirmation,
    showJustPlayedFeedback,
    recordInspection,
    setDefaultDate
};
