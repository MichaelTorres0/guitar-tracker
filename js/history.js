// Maintenance History Timeline Module
import { getVersionedData, getHumidityReadings } from './storage.js';
import { MAINTENANCE_TASKS } from './config.js';

// Event types for the timeline
const EVENT_TYPES = {
    STRING_CHANGE: { icon: '🎸', label: 'String Change', color: '--color-8week' },
    HUMIDITY_HIGH: { icon: '💧', label: 'High Humidity', color: '--color-error' },
    HUMIDITY_LOW: { icon: '⚠️', label: 'Low Humidity', color: '--color-warning' },
    QUARTERLY_SERVICE: { icon: '🔧', label: 'Quarterly Service', color: '--color-quarterly' },
    ANNUAL_SERVICE: { icon: '⭐', label: 'Annual Service', color: '--color-annual' },
    PRACTICE_SESSION: { icon: '🎵', label: 'Practice Session', color: '--color-daily' }
};

// Get all historical events for timeline
export function getHistoryEvents(limitMonths = 6) {
    const events = [];
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - limitMonths);

    const data = getVersionedData();

    // 1. String changes from stringChangeHistory
    if (data.stringChangeHistory && Array.isArray(data.stringChangeHistory)) {
        data.stringChangeHistory.forEach(entry => {
            const date = new Date(entry.date);
            if (date >= cutoffDate) {
                events.push({
                    type: 'STRING_CHANGE',
                    date,
                    title: 'String Change',
                    details: entry.brand || 'Strings replaced',
                    notes: entry.notes || '',
                    ...EVENT_TYPES.STRING_CHANGE
                });
            }
        });
    }

    // 2. Humidity alerts (readings > 55% or < 40%)
    const readings = getHumidityReadings();
    const seenHumidityDates = new Set();

    readings.forEach(reading => {
        const date = new Date(reading.timestamp);
        if (date >= cutoffDate) {
            const dateKey = date.toDateString();

            if (reading.humidity > 55 && !seenHumidityDates.has(`high-${dateKey}`)) {
                seenHumidityDates.add(`high-${dateKey}`);
                events.push({
                    type: 'HUMIDITY_HIGH',
                    date,
                    title: 'High Humidity Alert',
                    details: `${reading.humidity}% RH - Risk of bridge lift`,
                    ...EVENT_TYPES.HUMIDITY_HIGH
                });
            } else if (reading.humidity < 40 && !seenHumidityDates.has(`low-${dateKey}`)) {
                seenHumidityDates.add(`low-${dateKey}`);
                events.push({
                    type: 'HUMIDITY_LOW',
                    date,
                    title: 'Low Humidity Warning',
                    details: `${reading.humidity}% RH - Risk of fret sprout`,
                    ...EVENT_TYPES.HUMIDITY_LOW
                });
            }
        }
    });

    // 3. Completed quarterly tasks
    MAINTENANCE_TASKS.quarterly.forEach(task => {
        if (task.lastCompleted) {
            const date = new Date(task.lastCompleted);
            if (date >= cutoffDate) {
                events.push({
                    type: 'QUARTERLY_SERVICE',
                    date,
                    title: task.name,
                    details: 'Completed',
                    ...EVENT_TYPES.QUARTERLY_SERVICE
                });
            }
        }
    });

    // 4. Completed annual tasks
    MAINTENANCE_TASKS.annual.forEach(task => {
        if (task.lastCompleted) {
            const date = new Date(task.lastCompleted);
            if (date >= cutoffDate) {
                events.push({
                    type: 'ANNUAL_SERVICE',
                    date,
                    title: task.name,
                    details: 'Completed',
                    ...EVENT_TYPES.ANNUAL_SERVICE
                });
            }
        }
    });

    // Sort by date descending (most recent first)
    events.sort((a, b) => b.date - a.date);

    return events;
}

// Render timeline HTML
export function renderHistoryTimeline() {
    const container = document.getElementById('historyTimeline');
    if (!container) return;

    const events = getHistoryEvents();

    if (events.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <p style="text-align: center; color: var(--color-text-light);">No maintenance history yet.</p>
                <p style="font-size: 12px; color: var(--color-text-light); text-align: center;">Events will appear here as you complete tasks and log readings.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="timeline">';
    let currentMonth = null;

    events.forEach(event => {
        const eventMonth = event.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        // Add month header if changed
        if (eventMonth !== currentMonth) {
            currentMonth = eventMonth;
            html += `<div class="timeline-month-header">${eventMonth}</div>`;
        }

        const dateStr = event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        html += `
            <div class="timeline-event">
                <div class="timeline-event-icon" style="background: var(${event.color})">${event.icon}</div>
                <div class="timeline-event-content">
                    <div class="timeline-event-date">${dateStr}</div>
                    <div class="timeline-event-title">${event.title}</div>
                    <div class="timeline-event-details">${event.details}</div>
                    ${event.notes ? `<div class="timeline-event-notes">${event.notes}</div>` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Initialize history module
export function initHistory() {
    renderHistoryTimeline();
}

// Expose to window for testing
if (typeof window !== 'undefined') {
    window.getHistoryEvents = getHistoryEvents;
    window.renderHistoryTimeline = renderHistoryTimeline;
}
