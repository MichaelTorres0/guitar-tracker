// Task management functions
import { MAINTENANCE_TASKS } from './config.js';
import { saveData } from './storage.js';

export function toggleTask(taskId) {
    for (let category in MAINTENANCE_TASKS) {
        const task = MAINTENANCE_TASKS[category].find(t => t.id === taskId);
        if (task) {
            // Check if task was already completed within its period
            if (!task.completed && task.lastCompleted) {
                const wasCompletedThisPeriod = isCompletedWithinPeriod(task, category);
                if (wasCompletedThisPeriod) {
                    const confirmLog = confirm(
                        `This task was already completed ${getRelativeTimeAgo(task.lastCompleted)}. Log again?`
                    );
                    if (!confirmLog) {
                        return null;
                    }
                }
            }

            task.completed = !task.completed;
            if (task.completed) {
                task.lastCompleted = new Date().toISOString();
            }
            saveData();
            return task;
        }
    }
    return null;
}

// Helper function to check if task was completed within its period
export function isCompletedWithinPeriod(task, category) {
    if (!task.lastCompleted) return false;

    const lastDate = new Date(task.lastCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (category === 'daily') {
        // Check if completed today
        const completedDate = new Date(lastDate);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    } else if (category === 'weekly') {
        // Check if completed within last 7 days
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        return daysDiff < 7;
    } else if (category === 'eightweek') {
        // Check if completed within last 56 days
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        return daysDiff < 56;
    } else if (category === 'quarterly') {
        // Check if completed within last 84 days
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        return daysDiff < 84;
    } else if (category === 'annual') {
        // Check if completed within last 365 days
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        return daysDiff < 365;
    }
    return false;
}

// Helper function to get relative time ago
export function getRelativeTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

export function quickActionJustPlayed() {
    const now = new Date().toISOString();
    MAINTENANCE_TASKS.daily.forEach(task => {
        task.completed = true;
        task.lastCompleted = now;
    });
    saveData();

    // Show confirmation feedback
    const btn = document.querySelector('.btn-just-played');
    const originalText = btn.textContent;
    btn.textContent = '✓ Daily Tasks Logged!';
    btn.style.background = 'var(--color-success)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

export function calculateNextDue(task, category) {
    if (!task.lastCompleted) {
        return 'ASAP';
    }

    const lastDate = new Date(task.lastCompleted);
    let nextDate = new Date(lastDate);

    if (category === 'daily') {
        nextDate.setDate(nextDate.getDate() + 1);
    } else if (category === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (category === 'eightweek') {
        nextDate.setDate(nextDate.getDate() + 56);
    } else if (category === 'quarterly') {
        nextDate.setDate(nextDate.getDate() + 84);
    } else if (category === 'annual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const today = new Date();
    if (nextDate <= today) {
        return '⚠️ OVERDUE';
    }
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return `${daysUntil} days`;
}

export function getAllNextDueDates() {
    const dates = [];
    const today = new Date();

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            if (!task.lastCompleted) {
                dates.push(today);
                return;
            }

            const lastDate = new Date(task.lastCompleted);
            let nextDate = new Date(lastDate);

            if (category === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (category === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (category === 'eightweek') {
                nextDate.setDate(nextDate.getDate() + 56);
            } else if (category === 'quarterly') {
                nextDate.setDate(nextDate.getDate() + 84);
            } else if (category === 'annual') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            if (nextDate >= today && nextDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                dates.push(nextDate);
            }
        });
    }

    return dates;
}

export function resetDailyTasks() {
    if (confirm('Reset all daily tasks? This will uncheck them for today.')) {
        MAINTENANCE_TASKS.daily.forEach(task => {
            task.completed = false;
        });
        saveData();
        return true;
    }
    return false;
}

export function resetWeeklyTasks() {
    if (confirm('Reset all weekly tasks? This will uncheck them for this week.')) {
        MAINTENANCE_TASKS.weekly.forEach(task => {
            task.completed = false;
        });
        saveData();
        return true;
    }
    return false;
}

export function confirmReset() {
    if (confirm('⚠️ This will DELETE ALL data including maintenance history and humidity logs. This cannot be undone. Are you sure?')) {
        if (confirm('Really delete everything? Last chance!')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Inspection recording functions
let inspectionData = {};

export function recordInspection(type, frequency) {
    const saved = localStorage.getItem('inspectionData');
    if (saved) {
        inspectionData = JSON.parse(saved);
    }

    const checkboxIds = {
        bridge: ['bridgeCheck1', 'bridgeCheck2'],
        action: ['actionCheck1', 'actionCheck2', 'actionCheck3'],
        fret: ['fretCheck1', 'fretCheck2', 'fretCheck3']
    };

    const ids = checkboxIds[type] || [];
    const allChecked = ids.every(id => document.getElementById(id).checked);

    ids.forEach(id => {
        const checkbox = document.getElementById(id);
        if (!inspectionData[id]) {
            inspectionData[id] = { completed: false, lastCompleted: null };
        }
        inspectionData[id].completed = checkbox.checked;
        if (checkbox.checked) {
            inspectionData[id].lastCompleted = new Date().toISOString();
        }
    });

    localStorage.setItem('inspectionData', JSON.stringify(inspectionData));

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

function calculateInspectionDueDate(frequency) {
    const now = new Date();
    let nextDate = new Date(now);

    switch(frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'quarterly':
            nextDate.setDate(nextDate.getDate() + 84);
            break;
        case 'stringchange':
            nextDate.setDate(nextDate.getDate() + 56);
            break;
        default:
            nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate.toLocaleDateString();
}

export function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}
