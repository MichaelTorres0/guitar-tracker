// UI rendering and interaction functions
import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS } from './config.js';
import { calculateNextDue, getAllNextDueDates, isCompletedWithinPeriod, getRelativeTimeAgo, calculateSmartStringLife } from './tasks.js';
import { getVersionedData, saveVersionedData, getVersionedField, getHumidityReadings, getPlayingSessions } from './storage.js';
import { calculatePracticeStreak, getStreakEmoji, getThisWeekHours } from './sessions.js';
import { updateRestockAlerts } from './inventory.js';
import { ls } from './localStorage.js';

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

            // Determine task status classes
            const isWithinPeriod = task.lastCompleted && isCompletedWithinPeriod(task, category.key);
            let taskClasses = 'task-item';
            if (task.completed) taskClasses += ' completed';
            if (isWithinPeriod) {
                if (category.key === 'daily') taskClasses += ' completed-today';
                else taskClasses += ' completed-this-period';
            }
            taskEl.className = taskClasses;

            const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted).toLocaleDateString() : 'Never';
            const relativeTime = task.lastCompleted ? getRelativeTimeAgo(task.lastCompleted) : null;
            const nextDue = calculateNextDue(task, category.key);

            // Generate completion badge
            let completionBadge = '';
            if (isWithinPeriod) {
                if (category.key === 'daily') {
                    completionBadge = '<div class="completion-badge today">✓ Completed Today</div>';
                } else if (category.key === 'weekly') {
                    completionBadge = '<div class="completion-badge this-week">✓ Completed This Week</div>';
                } else {
                    completionBadge = '<div class="completion-badge this-period">✓ Completed This Period</div>';
                }
            }

            taskEl.innerHTML = `
                <div class="task-header">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                    <div class="task-info">
                        <div class="task-name">${task.name}</div>
                        <div class="task-duration">⏱️ ${task.duration}</div>
                        ${completionBadge}
                        ${relativeTime ? `<div class="last-completed-badge">Last completed: <span class="relative-time">${relativeTime}</span></div>` : ''}
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
                    <div class="expand-section" style="border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: 12px;">
                        <div class="expand-label">SET COMPLETION DATE</div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
                            <input type="date" id="customDate-${task.id}" class="custom-date-input" style="flex: 1;" value="${task.lastCompleted ? new Date(task.lastCompleted).toISOString().split('T')[0] : ''}">
                            <button class="btn-secondary" onclick="window.setCustomCompletionDate('${task.id}', '${category.key}')" style="font-size: 11px; padding: 6px 12px; white-space: nowrap;">Update</button>
                        </div>
                        <div style="font-size: 11px; color: var(--color-text-light); margin-top: 6px;">Use this to backdate or correct completion dates</div>
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

    const equipmentList = getVersionedField('equipmentList', []);

    let html = '<div class="equipment-list">';

    equipmentList.forEach((item, index) => {
        html += `
            <div class="equipment-item">
                <span class="equipment-name">${item}</span>
                <button class="btn-icon-delete" onclick="window.deleteEquipment(${index})" title="Delete item">×</button>
            </div>
        `;
    });

    html += '</div>';

    html += `
        <div class="equipment-add" style="margin-top: 16px;">
            <input type="text" id="newEquipmentItem" placeholder="Add new equipment item..." style="margin-bottom: 8px;">
            <button id="addEquipmentBtn" class="btn-secondary" style="width: 100%;">+ Add Equipment</button>
        </div>
    `;

    container.innerHTML = html;

    // Wire up add button
    const addBtn = document.getElementById('addEquipmentBtn');
    const input = document.getElementById('newEquipmentItem');

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            const item = input.value.trim();
            if (item) {
                const data = getVersionedData();
                if (!data.equipmentList) data.equipmentList = [];
                data.equipmentList.push(item);
                saveVersionedData(data);
                input.value = '';
                renderInventoryChecklist();
            }
        });

        // Allow Enter key to add
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
    }
}

// Delete equipment item (exposed to window)
if (typeof window !== 'undefined') {
    window.deleteEquipment = function(index) {
        if (confirm('Delete this equipment item?')) {
            const data = getVersionedData();
            data.equipmentList.splice(index, 1);
            saveVersionedData(data);
            renderInventoryChecklist();
        }
    };
}

export function updateDashboard() {
    // Update playing schedule in header if set
    const playingHours = ls.getItem('playingHoursPerWeek');
    if (playingHours) {
        const headerSubtitle = document.querySelector('.header p:not(.model-badge)');
        if (headerSubtitle) {
            const stringGauge = getVersionedField("currentStringType", "D'Addario EJ16 Phosphor Bronze Light (.012-.053)");
            headerSubtitle.textContent = `Playing Schedule: ${playingHours} hrs/week | ${stringGauge}`;
        }
    }

    // Update weekly hours display - use consolidated versioned storage
    const sessions = getPlayingSessions();
    const weeklyHoursEl = document.getElementById('weeklyHours');
    const calculatorBasisEl = document.getElementById('calculatorBasis');

    if (sessions.length > 0) {
        // Calculate this week's hours
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekSessions = sessions.filter(s => s.timestamp > startOfWeek.getTime());
        const totalMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);
        const hours = (totalMinutes / 60).toFixed(1);

        if (weeklyHoursEl) {
            weeklyHoursEl.textContent = `This week: ${hours} hrs`;
            weeklyHoursEl.style.color = 'var(--color-success)';
        }

        // Check if we have enough data for average
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentSessions = sessions.filter(s => s.timestamp > twoWeeksAgo);

        if (calculatorBasisEl && recentSessions.length >= 3) {
            const avgHours = playingHours || '2.5';
            calculatorBasisEl.textContent = `Based on ${avgHours} hrs/week (your average) + daily cleaning`;
        } else if (calculatorBasisEl) {
            const avgHours = playingHours || '2.5';
            calculatorBasisEl.textContent = `Based on ${avgHours} hrs/week + daily cleaning`;
        }
    } else if (weeklyHoursEl) {
        weeklyHoursEl.textContent = 'This week: 0 hrs';
    }

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

    // Humidity stats - use consolidated versioned storage
    const readings = getHumidityReadings();
    if (readings.length > 0) {
        const latest = readings[0];
        const humidity = latest.humidity;

        const currentHumidityEl = document.getElementById('currentHumidity');
        const latestHumidityEl = document.getElementById('latestHumidity');
        const latestTimeEl = document.getElementById('latestTime');

        if (currentHumidityEl) {
            currentHumidityEl.textContent = humidity + '%';
            currentHumidityEl.classList.remove('empty-state');
        }
        if (latestHumidityEl) {
            latestHumidityEl.textContent = humidity + '%';
            latestHumidityEl.classList.remove('empty-state');
        }

        const date = new Date(latest.timestamp);
        if (latestTimeEl) {
            latestTimeEl.textContent = date.toLocaleString();
            latestTimeEl.classList.remove('empty-state');
        }

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

        // 24h change with color coding and arrows
        const oneDayAgo = new Date(date.getTime() - 24 * 60 * 60 * 1000);
        const prevReading = readings.find(r => new Date(r.timestamp) <= oneDayAgo);
        const humidity24hChangeEl = document.getElementById('humidity24hChange');
        if (prevReading && humidity24hChangeEl) {
            const change = humidity - prevReading.humidity;
            const absChange = Math.abs(change);
            const arrow = change > 0 ? '↑' : '↓';
            const sign = change > 0 ? '+' : '';

            // Determine severity and color
            let colorClass = 'humidity-change-normal';
            if (absChange >= 10) {
                colorClass = 'humidity-change-danger';
            } else if (absChange >= 5) {
                colorClass = 'humidity-change-caution';
            }

            humidity24hChangeEl.innerHTML = `<span class="${colorClass}">${arrow} ${sign}${change.toFixed(1)}%</span>`;
            humidity24hChangeEl.classList.remove('empty-state');
        } else if (humidity24hChangeEl) {
            humidity24hChangeEl.innerHTML = '<span class="empty-state">Need 24h of data</span>';
            humidity24hChangeEl.style.fontSize = '13px';
        }

        // 7-day range
        const sevenDaysAgo = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentReadings = readings.filter(r => new Date(r.timestamp) >= sevenDaysAgo).map(r => r.humidity);
        if (recentReadings.length > 0) {
            const high = Math.max(...recentReadings);
            const low = Math.min(...recentReadings);
            const humidity7dHighEl = document.getElementById('humidity7dHigh');
            const humidity7dLowEl = document.getElementById('humidity7dLow');
            if (humidity7dHighEl) {
                humidity7dHighEl.textContent = high.toFixed(1) + '%';
                humidity7dHighEl.classList.remove('empty-state');
            }
            if (humidity7dLowEl) {
                humidity7dLowEl.textContent = low.toFixed(1) + '%';
                humidity7dLowEl.classList.remove('empty-state');
            }
        }
    } else {
        // Empty states for humidity
        const currentHumidityEl = document.getElementById('currentHumidity');
        if (currentHumidityEl) {
            currentHumidityEl.innerHTML = '<div class="empty-state">No readings yet<br><span class="empty-state-cta" onclick="switchTab(\'humidity\')">Log first reading →</span></div>';
            currentHumidityEl.className = 'humidity-display';
            currentHumidityEl.style.fontSize = '16px';
        }

        const latestHumidityEl = document.getElementById('latestHumidity');
        if (latestHumidityEl) {
            latestHumidityEl.innerHTML = '<span class="empty-state">No readings yet</span>';
            latestHumidityEl.classList.add('empty-state');
            latestHumidityEl.style.fontSize = '14px';
        }

        const latestTimeEl = document.getElementById('latestTime');
        if (latestTimeEl) {
            latestTimeEl.innerHTML = '<span class="empty-state-cta" onclick="switchTab(\'humidity\')">Log your first reading →</span>';
        }

        const humidityStatusEl = document.getElementById('humidityStatus');
        if (humidityStatusEl) humidityStatusEl.textContent = '';

        const humidity24hChangeEl = document.getElementById('humidity24hChange');
        if (humidity24hChangeEl) {
            humidity24hChangeEl.innerHTML = '<span class="empty-state">Need 24h of data</span>';
            humidity24hChangeEl.style.fontSize = '13px';
        }

        const humidity7dHighEl = document.getElementById('humidity7dHigh');
        const humidity7dLowEl = document.getElementById('humidity7dLow');
        if (humidity7dHighEl) humidity7dHighEl.innerHTML = '<span class="empty-state">—</span>';
        if (humidity7dLowEl) humidity7dLowEl.innerHTML = '<span class="empty-state">—</span>';
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
        daysSinceChangeEl.classList.remove('empty-state');
        daysSinceChangeEl.style.fontSize = '';

        if (daysSince > 56) {
            daysSinceChangeEl.style.color = 'var(--color-error)';
        } else if (daysSince > 49) {
            daysSinceChangeEl.style.color = 'var(--color-warning)';
        } else {
            daysSinceChangeEl.style.color = 'var(--color-success)';
        }
    } else if (daysSinceChangeEl) {
        // Empty state for string change
        daysSinceChangeEl.innerHTML = '<div class="empty-state">Log your first string change<br><span class="empty-state-cta" onclick="switchTab(\'maintenance\')">Go to 8-Week Tasks →</span></div>';
        daysSinceChangeEl.style.color = '';
        daysSinceChangeEl.style.fontSize = '14px';
    }

    // String Life Calculator with Health Ring (using smart calculation)
    const stringLifeTextEl = document.getElementById('stringLifeText');
    const ringProgressEl = document.getElementById('ringProgress');
    const ringTextEl = document.getElementById('ringText');
    const stringLifeEstimateEl = document.getElementById('stringLifeEstimate');
    const factorsEl = document.getElementById('stringLifeFactors');

    if (stringChangeDate) {
        const today = new Date();
        const daysSince = Math.floor((today - stringChangeDate) / (1000 * 60 * 60 * 24));

        // Use smart string life calculation
        const smartLife = calculateSmartStringLife();
        const targetDays = smartLife.targetDays;
        const percentage = Math.min(Math.round((daysSince / targetDays) * 100), 100);

        // Update ring
        if (ringProgressEl && ringTextEl) {
            ringProgressEl.setAttribute('stroke-dasharray', `${percentage}, 100`);
            ringTextEl.textContent = `${percentage}%`;

            // Set ring color based on percentage
            let ringColor = '#22c55e'; // green
            if (percentage >= 100) {
                ringColor = '#ef4444'; // red
            } else if (percentage >= 75) {
                ringColor = '#f59e0b'; // yellow/orange
            }
            ringProgressEl.setAttribute('stroke', ringColor);
        }

        if (stringLifeTextEl) stringLifeTextEl.textContent = `Strings at ${percentage}% life`;

        const daysRemaining = Math.max(targetDays - daysSince, 0);
        const weeksRemaining = Math.round(daysRemaining / 7);

        if (stringLifeEstimateEl) {
            if (daysRemaining > 14) {
                stringLifeEstimateEl.innerHTML = `~${weeksRemaining} weeks remaining<br><span style="font-size: 11px;">Based on ${smartLife.actualHoursPerWeek} hrs/week</span>`;
            } else if (daysRemaining > 1) {
                stringLifeEstimateEl.innerHTML = `~${daysRemaining} days remaining<br><span style="font-size: 11px;">Based on ${smartLife.actualHoursPerWeek} hrs/week</span>`;
            } else {
                stringLifeEstimateEl.innerHTML = '<strong style="color: var(--color-error);">Change strings soon!</strong>';
            }
            stringLifeEstimateEl.classList.remove('empty-state');
        }

        // Update calculator basis text
        if (calculatorBasisEl) {
            const cleaningStatus = smartLife.cleaningRate >= 0.6 ? 'good' : 'low';
            calculatorBasisEl.textContent = `Based on ${smartLife.actualHoursPerWeek} hrs/week playing + ${cleaningStatus} cleaning (${Math.round(targetDays / 7)} week target)`;
        }

        // Update factors breakdown display
        if (factorsEl) {
            factorsEl.style.display = 'block';
            const factorPlayingEl = document.getElementById('factorPlaying');
            const factorCleaningEl = document.getElementById('factorCleaning');
            const factorTargetEl = document.getElementById('factorTarget');

            if (factorPlayingEl) factorPlayingEl.textContent = `${smartLife.actualHoursPerWeek} hrs/week`;
            if (factorCleaningEl) factorCleaningEl.textContent = smartLife.cleaningRate >= 0.6 ? 'Good' : 'Low';
            if (factorTargetEl) factorTargetEl.textContent = `${Math.round(targetDays / 7)} weeks`;
        }
    } else {
        // Empty state for string life
        if (stringLifeTextEl) stringLifeTextEl.innerHTML = '<span class="empty-state">Complete setup to start tracking</span>';
        if (ringProgressEl) {
            ringProgressEl.setAttribute('stroke-dasharray', '0, 100');
            ringProgressEl.setAttribute('stroke', '#22c55e');
        }
        if (ringTextEl) {
            ringTextEl.textContent = '0%';
        }
        if (stringLifeEstimateEl) {
            stringLifeEstimateEl.innerHTML = '<span class="empty-state">Log a string change to activate calculator</span>';
        }
        if (factorsEl) {
            factorsEl.style.display = 'none';
        }
    }

    // Calendar
    renderCalendar();

    // Practice Streak
    updatePracticeStreak();

    // Restock Alerts
    updateRestockAlerts();
}

// Update practice streak display
function updatePracticeStreak() {
    const streakEl = document.getElementById('practiceStreak');
    if (!streakEl) return;

    const streak = calculatePracticeStreak();
    const weeklyHours = getThisWeekHours();
    const emoji = getStreakEmoji(streak);

    if (streak === 0) {
        streakEl.innerHTML = 'No streak yet — play today! • This week: ' + weeklyHours + ' hrs';
        streakEl.style.color = 'var(--color-text-light)';
    } else {
        streakEl.innerHTML = emoji + ' ' + streak + ' day streak • This week: ' + weeklyHours + ' hrs';
        streakEl.style.color = 'var(--color-success)';
    }
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
    ls.setItem('theme', newTheme);
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
