// Humidity logging, charting, and analysis functions
import { STORAGE_KEYS, MAINTENANCE_TASKS } from './config.js';
import { validateHumidity, validateTemperature, showFeedback, hideFeedback } from './validators.js';
import { calculateNextDue } from './tasks.js';
import { getHumidityReadings, saveHumidityReadings, addHumidityReading as addHumidityReadingToStorage, removeHumidityReading } from './storage.js';

export function addHumidityReading() {
    const date = document.getElementById('humidityDate').value;
    const time = document.getElementById('humidityTime').value;
    const humidityInput = document.getElementById('humidityValue').value;
    const tempInput = document.getElementById('temperatureValue').value;
    const location = document.getElementById('guitarLocation').value;

    // Validate humidity
    const humidityResult = validateHumidity(humidityInput);
    if (!humidityResult.valid) {
        showFeedback('humidityFeedback', humidityResult.error, 'error');
        return;
    }

    // Validate temperature
    const tempResult = validateTemperature(tempInput);
    if (!tempResult.valid) {
        showFeedback('humidityFeedback', tempResult.error, 'error');
        return;
    }

    // Show warning if present but continue
    if (humidityResult.warning) {
        showFeedback('humidityFeedback', humidityResult.warning, 'warning');
    } else {
        hideFeedback('humidityFeedback');
    }

    if (!date || !time) {
        showFeedback('humidityFeedback', 'Please enter date and time', 'error');
        return;
    }

    const humidity = humidityResult.value;
    const temp = tempResult.value;

    const reading = {
        id: Date.now(),
        date,
        time,
        humidity,
        temp,
        location,
        timestamp: new Date(`${date}T${time}`).toISOString()
    };

    // Use consolidated versioned storage
    addHumidityReadingToStorage(reading);

    document.getElementById('humidityValue').value = '';
    document.getElementById('temperatureValue').value = '';
    showFeedback('logConfirmation', '✅ Reading logged successfully', 'success');

    return reading;
}

export function addHumidityReadingSimplified() {
    const humidity = parseFloat(document.getElementById('humidityValue').value);
    const temp = parseFloat(document.getElementById('temperatureValue').value) || null;
    const location = document.getElementById('guitarLocation').value;

    // Get optional date/time (default to now)
    const dateInput = document.getElementById('humidityDateSimple');
    const timeInput = document.getElementById('humidityTimeSimple');

    let timestamp;
    if (dateInput && dateInput.value && timeInput && timeInput.value) {
        timestamp = new Date(`${dateInput.value}T${timeInput.value}`);
    } else if (dateInput && dateInput.value) {
        // Date only - use noon
        timestamp = new Date(`${dateInput.value}T12:00`);
    } else {
        timestamp = new Date();
    }

    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
        alert('Please enter a valid humidity percentage (0-100)');
        return;
    }

    // Validate date isn't in future
    if (timestamp > new Date()) {
        alert('Cannot log readings for future dates');
        return;
    }

    const reading = {
        id: Date.now(),
        date: timestamp.toISOString().split('T')[0],
        time: timestamp.toTimeString().slice(0, 5),
        humidity,
        temp,
        location,
        timestamp: timestamp.toISOString(),
        source: 'manual'
    };

    // Use consolidated versioned storage
    addHumidityReadingToStorage(reading);

    // Clear form
    document.getElementById('humidityValue').value = '';
    document.getElementById('temperatureValue').value = '';
    if (dateInput) dateInput.value = '';
    if (timeInput) timeInput.value = '';

    // Show confirmation with date info
    const isBackdated = reading.date !== new Date().toISOString().split('T')[0];
    const confirmEl = document.getElementById('logConfirmation');
    if (confirmEl) {
        confirmEl.textContent = isBackdated
            ? `✅ Reading logged for ${reading.date}`
            : '✅ Reading logged successfully';
        confirmEl.style.display = 'block';
        setTimeout(() => { confirmEl.style.display = 'none'; }, 3000);
    }

    return reading;
}

export function deleteHumidityReading(id) {
    // Use consolidated versioned storage
    removeHumidityReading(id);
}

export function renderHumidityTable(filteredReadings = null) {
    // Use consolidated versioned storage
    const readings = filteredReadings || getHumidityReadings();
    const tbody = document.getElementById('humidityTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    const displayReadings = filteredReadings ? readings : readings.slice(0, 20);
    displayReadings.forEach(reading => {
        const date = new Date(reading.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let statusBadge = '<span class="badge badge-success">✓ Safe</span>';
        if (reading.humidity > 55) {
            statusBadge = '<span class="badge badge-danger">🔴 High Risk</span>';
        } else if (reading.humidity < 40) {
            statusBadge = '<span class="badge badge-warning">⚠️ Low</span>';
        }

        const row = `
            <tr>
                <td>${dateStr} ${timeStr}</td>
                <td><strong>${reading.humidity}%</strong></td>
                <td>${reading.temp != null ? reading.temp + '°F' : '—'}</td>
                <td>${reading.location === 'case' ? 'Case' : 'Out'}</td>
                <td>${statusBadge}</td>
                <td><button class="btn-secondary delete-humidity-btn" data-id="${reading.id}" style="padding: 4px 8px; font-size: 12px;">×</button></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

export function checkForAlerts() {
    const alerts = [];
    // Use consolidated versioned storage
    const readings = getHumidityReadings();

    if (readings.length > 0) {
        const latest = readings[0];
        if (latest.humidity > 55) {
            alerts.push({
                type: 'danger',
                icon: '🔴',
                title: 'CRITICAL: High Humidity Detected',
                message: `RH is ${latest.humidity}% (danger threshold >55%). Bridge lifting risk active. Replace Humidipak immediately.`
            });
        } else if (latest.humidity < 40) {
            alerts.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Low Humidity Warning',
                message: `RH is ${latest.humidity}% (below safe 40-55% range). Fret sprout risk. Increase humidity.`
            });
        }

        // 24h change check
        if (readings.length > 1) {
            const oneDayAgo = new Date(latest.timestamp);
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            const prevReading = readings.find(r => new Date(r.timestamp) <= oneDayAgo);
            if (prevReading) {
                const change = Math.abs(latest.humidity - prevReading.humidity);
                if (change > 10) {
                    alerts.push({
                        type: 'warning',
                        icon: '📊',
                        title: 'Rapid Humidity Change',
                        message: `RH changed ${change.toFixed(1)}% in 24h (alert threshold >10%). Monitor closely.`
                    });
                }
            }
        }
    }

    // Check overdue tasks
    let overdueCount = 0;
    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            if (!task.completed && task.lastCompleted) {
                const nextDue = calculateNextDue(task, category);
                if (nextDue.includes('OVERDUE')) {
                    overdueCount++;
                }
            }
        });
    }

    if (overdueCount > 0) {
        alerts.push({
            type: 'info',
            icon: '⏰',
            title: 'Maintenance Overdue',
            message: `${overdueCount} task(s) are overdue. Check Maintenance Tasks tab.`
        });
    }

    renderAlerts(alerts);
}

function renderAlerts(alerts) {
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

// Filter state
let activeFilters = null;

// Filter humidity readings
export function filterHumidityReadings(fromDate, toDate, location) {
    // Use consolidated versioned storage
    let readings = getHumidityReadings();

    if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        readings = readings.filter(r => new Date(r.timestamp) >= from);
    }

    if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        readings = readings.filter(r => new Date(r.timestamp) <= to);
    }

    if (location && location !== 'all') {
        readings = readings.filter(r => r.location === location);
    }

    return readings;
}

// Apply filters and render table
export function applyHumidityFilters() {
    const fromDate = document.getElementById('filterDateFrom').value;
    const toDate = document.getElementById('filterDateTo').value;
    const location = document.getElementById('filterLocation').value;

    activeFilters = { fromDate, toDate, location };
    const filtered = filterHumidityReadings(fromDate, toDate, location);
    renderHumidityTable(filtered);
}

// Clear filters
export function clearHumidityFilters() {
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterLocation').value = 'all';
    activeFilters = null;
    renderHumidityTable();
}

// Get filtered readings for export
export function getFilteredReadings() {
    if (!activeFilters) {
        // Use consolidated versioned storage
        return getHumidityReadings();
    }
    return filterHumidityReadings(activeFilters.fromDate, activeFilters.toDate, activeFilters.location);
}

export function drawHumidityChart() {
    // Use consolidated versioned storage
    const readings = getHumidityReadings();
    const chartContainer = document.getElementById('humidityChartContainer');
    const canvas = document.getElementById('humidityChart');

    if (!canvas || !chartContainer) return;

    if (readings.length < 2) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth - 40;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Get last 7 days of readings
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReadings = readings
        .filter(r => new Date(r.timestamp) >= sevenDaysAgo)
        .reverse();

    if (recentReadings.length < 2) {
        chartContainer.style.display = 'none';
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background zones
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Danger zone (55-65)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(padding, padding, chartWidth, chartHeight * 0.25);

    // Caution zone high (50-55)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.25, chartWidth, chartHeight * 0.125);

    // Safe zone (40-50)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.375, chartWidth, chartHeight * 0.25);

    // Caution zone low (30-40)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.625, chartWidth, chartHeight * 0.25);

    // Draw line chart
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const minHumidity = 30;
    const maxHumidity = 65;
    const range = maxHumidity - minHumidity;

    recentReadings.forEach((reading, i) => {
        const x = padding + (i / (recentReadings.length - 1)) * chartWidth;
        const y = padding + (1 - (reading.humidity - minHumidity) / range) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    recentReadings.forEach((reading, i) => {
        const x = padding + (i / (recentReadings.length - 1)) * chartWidth;
        const y = padding + (1 - (reading.humidity - minHumidity) / range) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = reading.humidity > 55 ? '#ef4444' :
                       reading.humidity < 40 ? '#f59e0b' : '#10b981';
        ctx.fill();
    });

    // Draw Y-axis labels
    ctx.fillStyle = 'var(--color-text-light)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('65%', padding - 5, padding + 10);
    ctx.fillText('55%', padding - 5, padding + chartHeight * 0.285 + 4);
    ctx.fillText('40%', padding - 5, padding + chartHeight * 0.715 + 4);
    ctx.fillText('30%', padding - 5, height - padding + 4);
}
