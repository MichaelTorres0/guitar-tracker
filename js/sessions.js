// Playing session tracking module
import { updateDashboard } from './ui.js';
import { quickActionJustPlayed } from './tasks.js';
import { renderMaintenanceTasks } from './ui.js';
import { checkForAlerts } from './humidity.js';
import { getVersionedData, saveVersionedData, getVersionedField } from './storage.js';

// Timer state
let timerInterval = null;

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
    const data = getVersionedData();

    data.playingSessions.push({
        timestamp: Date.now(),
        duration: durationMinutes
    });

    saveVersionedData(data);
    updateWeeklyHours();

    // Close modal
    hideSessionModal();

    // Update UI
    updateDashboard();
    renderMaintenanceTasks();
    checkForAlerts();

    // Show confirmation briefly
    setTimeout(() => {
        alert(`✓ ${durationMinutes} min practice session logged!`);
    }, 100);
}

// Calculate weekly average hours (last 2 weeks)
export function calculateAverageHoursPerWeek() {
    const sessions = getVersionedField('playingSessions', []);
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

    const recentSessions = sessions.filter(s => s.timestamp > twoWeeksAgo);

    if (recentSessions.length < 3) {
        // Not enough data, use default or onboarding value
        const defaultHours = getVersionedField('playingHoursPerWeek', 2.5);
        return defaultHours;
    }

    const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
    const weeks = 2;
    return (totalMinutes / 60) / weeks;
}

// Get this week's total hours
export function getThisWeekHours() {
    const sessions = getVersionedField('playingSessions', []);
    const startOfWeek = getStartOfWeek();

    const thisWeekSessions = sessions.filter(s => s.timestamp > startOfWeek);
    const totalMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);

    return (totalMinutes / 60).toFixed(1);
}

// Calculate practice streak
export function calculatePracticeStreak() {
    const sessions = getVersionedField('playingSessions', []);
    const practiceHistory = getVersionedField('practiceHistory', []);

    // Combine sessions and practice history to get all practice days
    const allPracticeDates = new Set();

    // Add from practice history
    practiceHistory.forEach(entry => {
        const date = new Date(entry.date).toDateString();
        allPracticeDates.add(date);
    });

    // Add from sessions
    sessions.forEach(session => {
        const date = new Date(session.timestamp).toDateString();
        allPracticeDates.add(date);
    });

    // Convert to sorted array of dates
    const sortedDates = Array.from(allPracticeDates)
        .map(d => new Date(d))
        .sort((a, b) => b - a);

    if (sortedDates.length === 0) {
        return 0;
    }

    // Get today and yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if most recent practice was today or yesterday
    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
        return 0; // Streak is broken
    }

    // Count consecutive days
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        currentDate.setHours(0, 0, 0, 0);

        const prevDate = new Date(sortedDates[i - 1]);
        prevDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Get streak emoji
export function getStreakEmoji(streak) {
    if (streak >= 3) {
        return '🔥';
    } else if (streak >= 1) {
        return '🎸';
    } else {
        return '';
    }
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

    // Store the updated average in versioned data
    const data = getVersionedData();
    data.playingHoursPerWeek = parseFloat(avgHours.toFixed(1));
    saveVersionedData(data);
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

// Start practice timer
export function startPracticeTimer() {
    const data = getVersionedData();

    data.timerState = {
        running: true,
        startTimestamp: Date.now()
    };

    saveVersionedData(data);
    updateTimerDisplay();

    // Start display update interval
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

// Stop practice timer and log session
export function stopPracticeTimer() {
    const data = getVersionedData();

    if (!data.timerState || !data.timerState.running) {
        return;
    }

    const elapsed = Date.now() - data.timerState.startTimestamp;
    const minutes = Math.round(elapsed / 1000 / 60);

    // Clear timer state
    data.timerState = {
        running: false,
        startTimestamp: null
    };

    saveVersionedData(data);

    // Stop display update
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Show session modal with duration pre-filled
    showSessionModal();

    // Update button display
    updateTimerDisplay();
}

// Discard running timer
export function discardTimer() {
    const data = getVersionedData();

    data.timerState = {
        running: false,
        startTimestamp: null
    };

    saveVersionedData(data);

    // Stop display update
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Update button display
    updateTimerDisplay();
}

// Update timer button display
export function updateTimerDisplay() {
    const btn = document.querySelector('.btn-timer');
    if (!btn) return;

    const data = getVersionedData();

    if (data.timerState && data.timerState.running) {
        // Calculate elapsed time
        const elapsed = Date.now() - data.timerState.startTimestamp;
        const totalSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let timeDisplay;
        if (hours > 0) {
            timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }

        btn.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
            <span>⏹️ Stop ${timeDisplay}</span>
            <button onclick="event.stopPropagation(); discardTimer();" style="background: rgba(239,68,68,0.2); color: var(--color-error); border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">✕ Discard</button>
        </span>`;
        btn.onclick = stopPracticeTimer;
    } else {
        btn.textContent = '▶️ Start Practice';
        btn.onclick = startPracticeTimer;
    }
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

    // Check if timer was running and resume
    const data = getVersionedData();
    if (data.timerState && data.timerState.running) {
        // Resume timer display
        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 1000);
    } else {
        // Show start button
        updateTimerDisplay();
    }
}

// Toggle practice timer (start if stopped, stop if running)
export function togglePracticeTimer() {
    const data = getVersionedData();
    if (data.timerState && data.timerState.running) {
        stopPracticeTimer();
    } else {
        startPracticeTimer();
    }
}

// Expose functions to window
if (typeof window !== 'undefined') {
    window.logSessionWithDuration = logPlayingSession;
    window.showSessionModal = showSessionModal;
    window.startPracticeTimer = startPracticeTimer;
    window.stopPracticeTimer = stopPracticeTimer;
    window.discardTimer = discardTimer;
    window.togglePracticeTimer = togglePracticeTimer;
}
