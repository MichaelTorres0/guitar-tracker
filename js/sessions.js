// Playing session tracking module
import { updateDashboard } from './ui.js';
import { quickActionJustPlayed } from './tasks.js';
import { renderMaintenanceTasks } from './ui.js';
import { checkForAlerts } from './humidity.js';

// Get start of current week (Sunday)
function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.getTime();
}

// Log a playing session
export function logPlayingSession(durationMinutes) {
    const sessions = JSON.parse(localStorage.getItem('playingSessions') || '[]');

    sessions.push({
        timestamp: Date.now(),
        duration: durationMinutes
    });

    localStorage.setItem('playingSessions', JSON.stringify(sessions));
    updateWeeklyHours();

    // Complete daily tasks
    quickActionJustPlayed();

    // Close modal
    hideSessionModal();

    // Update UI
    updateDashboard();
    renderMaintenanceTasks();
    checkForAlerts();

    // Show confirmation
    const btn = document.querySelector('.btn-just-played');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = `✓ ${durationMinutes} min session logged!`;
        btn.style.background = 'var(--color-success)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

// Calculate weekly average hours (last 2 weeks)
export function calculateAverageHoursPerWeek() {
    const sessions = JSON.parse(localStorage.getItem('playingSessions') || '[]');
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

    const recentSessions = sessions.filter(s => s.timestamp > twoWeeksAgo);

    if (recentSessions.length < 3) {
        // Not enough data, use default or onboarding value
        const defaultHours = localStorage.getItem('playingHoursPerWeek');
        return defaultHours ? parseFloat(defaultHours) : 2.5;
    }

    const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
    const weeks = 2;
    return (totalMinutes / 60) / weeks;
}

// Get this week's total hours
export function getThisWeekHours() {
    const sessions = JSON.parse(localStorage.getItem('playingSessions') || '[]');
    const startOfWeek = getStartOfWeek();

    const thisWeekSessions = sessions.filter(s => s.timestamp > startOfWeek);
    const totalMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);

    return (totalMinutes / 60).toFixed(1);
}

// Update weekly hours display
function updateWeeklyHours() {
    const hours = getThisWeekHours();
    const avgHours = calculateAverageHoursPerWeek();

    // Update header if it exists
    const headerSubtitle = document.querySelector('.header p:not(.model-badge)');
    if (headerSubtitle) {
        const stringGauge = 'String Gauge: EJ16 Light (.012-.053)';
        headerSubtitle.textContent = `Playing Schedule: ${avgHours.toFixed(1)} hrs/week | ${stringGauge}`;
    }

    // Store the updated average
    localStorage.setItem('playingHoursPerWeek', avgHours.toFixed(1));
}

// Show session duration modal
export function showSessionModal() {
    const modal = document.getElementById('sessionDurationModal');
    if (modal) modal.classList.add('show');
}

// Hide session duration modal
export function hideSessionModal() {
    const modal = document.getElementById('sessionDurationModal');
    if (modal) modal.classList.remove('show');
}

// Initialize session tracking
export function initSessions() {
    // Wire up close button
    const closeBtn = document.getElementById('closeSessionModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideSessionModal);
    }

    // Update display on load
    updateWeeklyHours();
}

// Expose functions to window
window.logSessionWithDuration = logPlayingSession;
window.showSessionModal = showSessionModal;
