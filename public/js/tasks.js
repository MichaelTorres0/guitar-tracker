// Task management functions
import { MAINTENANCE_TASKS } from './config.js';
import { saveData } from './storage.js';
import { getVersionedField, getPlayingSessions } from './storage.js';
import { ls } from './localStorage.js';

// Constants for string life calculation
const BASE_STRING_LIFE_DAYS = 56; // 8 weeks
const DEFAULT_HOURS_PER_WEEK = 2.5;
const MIN_STRING_LIFE_DAYS = 28; // 4 weeks minimum
const MAX_STRING_LIFE_DAYS = 112; // 16 weeks maximum

/**
 * Calculate smart string life based on actual playing sessions
 * @returns {Object} { targetDays, actualHoursPerWeek, cleaningRate, factors }
 */
export function calculateSmartStringLife() {
    const sessions = getPlayingSessions();
    const now = Date.now();
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    // Calculate actual hours per week from recent sessions
    const recentSessions = sessions.filter(s => s.timestamp > twoWeeksAgo);
    let actualHoursPerWeek = DEFAULT_HOURS_PER_WEEK;

    if (recentSessions.length >= 2) {
        const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        actualHoursPerWeek = (totalMinutes / 60) / 2; // Average over 2 weeks
    }

    // Calculate daily cleaning compliance rate
    const dailyCleaningTask = MAINTENANCE_TASKS.daily.find(t => t.id === 'daily-1');
    let cleaningRate = 0.6; // Default to 60%
    if (dailyCleaningTask && dailyCleaningTask.lastCompleted) {
        // Check how often cleaning has been done in last 2 weeks
        // For now, use a simple heuristic: if completed recently, assume good compliance
        const daysSinceLastCleaning = Math.floor((now - new Date(dailyCleaningTask.lastCompleted).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastCleaning <= 1) {
            cleaningRate = 0.9;
        } else if (daysSinceLastCleaning <= 3) {
            cleaningRate = 0.7;
        } else if (daysSinceLastCleaning <= 7) {
            cleaningRate = 0.5;
        } else {
            cleaningRate = 0.3;
        }
    }

    // Calculate target days based on playtime ratio
    // Formula: baseDays * (defaultHours / actualHours) * cleaningMultiplier
    const playtimeRatio = DEFAULT_HOURS_PER_WEEK / Math.max(actualHoursPerWeek, 0.5);
    const cleaningMultiplier = cleaningRate >= 0.6 ? 1.0 : 0.75;

    let targetDays = Math.round(BASE_STRING_LIFE_DAYS * playtimeRatio * cleaningMultiplier);

    // Clamp to reasonable range
    targetDays = Math.max(MIN_STRING_LIFE_DAYS, Math.min(MAX_STRING_LIFE_DAYS, targetDays));

    return {
        targetDays,
        actualHoursPerWeek: parseFloat(actualHoursPerWeek.toFixed(1)),
        cleaningRate: parseFloat(cleaningRate.toFixed(2)),
        factors: {
            playtimeRatio: parseFloat(playtimeRatio.toFixed(2)),
            cleaningMultiplier,
            sessionCount: recentSessions.length
        }
    };
}

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

                // Check for linked inventory items and prompt to decrement
                checkAndPromptInventoryDecrement(taskId);

                // If this is the string change task, show brand prompt
                if (taskId === '8w-8' && window.showStringBrandPrompt) {
                    window.showStringBrandPrompt();
                }
            }
            saveData();
            return task;
        }
    }
    return null;
}

// Check for linked inventory and prompt to decrement
function checkAndPromptInventoryDecrement(taskId) {
    // Dynamically import inventory module to avoid circular dependency
    import('./inventory.js').then(({ getItemByTask, decrementInventory, renderInventory, updateRestockAlerts }) => {
        const linkedItem = getItemByTask(taskId);

        if (linkedItem) {
            if (linkedItem.count > 0) {
                const shouldDecrement = confirm(
                    `Deduct 1 ${linkedItem.name} from inventory?\n\nCurrent count: ${linkedItem.count}`
                );

                if (shouldDecrement) {
                    decrementInventory(linkedItem.id);
                    renderInventory();
                    updateRestockAlerts();

                    // Show success message
                    setTimeout(() => {
                        alert(`✓ ${linkedItem.name} count updated: ${linkedItem.count} → ${linkedItem.count - 1}`);
                    }, 100);
                }
            } else {
                // Warn about out of stock
                const shouldAddToList = confirm(
                    `You're out of ${linkedItem.name}!\n\nWould you like to be reminded to restock?`
                );

                if (shouldAddToList) {
                    // The item is already at 0, so restock alert will show automatically
                    updateRestockAlerts();
                }
            }
        }
    });
}

// Set custom completion date for backdating
export function setCustomCompletionDate(taskId, category) {
    const task = MAINTENANCE_TASKS[category].find(t => t.id === taskId);
    if (!task) return false;

    const dateInput = document.getElementById(`customDate-${taskId}`);
    if (!dateInput || !dateInput.value) {
        alert('Please select a date');
        return false;
    }

    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
        alert('Cannot set a completion date in the future');
        return false;
    }

    task.completed = true;
    task.lastCompleted = selectedDate.toISOString();
    saveData();

    alert(`✓ Completion date updated to ${selectedDate.toLocaleDateString()}`);

    // Trigger UI update
    if (window.updateDashboard) window.updateDashboard();
    if (window.renderMaintenanceTasks) {
        import('./ui.js').then(({ renderMaintenanceTasks }) => {
            renderMaintenanceTasks();
        });
    }

    return true;
}

// Helper function to check if task was completed within its period
export function isCompletedWithinPeriod(task, category) {
    if (!task.lastCompleted) return false;

    const lastDate = new Date(task.lastCompleted);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (category === 'daily') {
        // For daily tasks, check if completed after the most recent session
        const mostRecentSession = getMostRecentSession();

        // If no session logged, consider it complete if done today
        if (!mostRecentSession) {
            const completedDate = new Date(lastDate);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === today.getTime();
        }

        // Check if completed after the most recent session
        const sessionDate = new Date(mostRecentSession.timestamp);
        return lastDate >= sessionDate;
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

// Helper function to check if there's been a playing session since a given date
function hasSessionSince(sinceDate) {
    const sessions = getVersionedField('playingSessions', []);
    if (sessions.length === 0) return null;

    const sinceTimestamp = sinceDate ? new Date(sinceDate).getTime() : 0;
    const sessionsSince = sessions.filter(s => s.timestamp > sinceTimestamp);

    if (sessionsSince.length === 0) return null;

    // Return the most recent session
    return sessionsSince[sessionsSince.length - 1];
}

// Helper function to get the most recent playing session
function getMostRecentSession() {
    const sessions = getVersionedField('playingSessions', []);
    if (sessions.length === 0) return null;

    // Sort by timestamp descending and return the first (most recent)
    const sorted = [...sessions].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
}

export function quickActionJustPlayed() {
    const now = new Date().toISOString();
    MAINTENANCE_TASKS.daily.forEach(task => {
        task.completed = true;
        task.lastCompleted = now;
    });
    saveData();

    // Show confirmation feedback - look for button by ID or class
    const btn = document.getElementById('quickCompleteDaily') || document.querySelector('.btn-quick-action');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Daily Tasks Logged!';
        btn.style.background = 'var(--color-success)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

export function calculateNextDue(task, category) {
    // Special logic for daily tasks - they should only be due after a playing session
    if (category === 'daily') {
        const mostRecentSession = getMostRecentSession();

        // If no sessions have ever been logged, daily tasks are not due
        if (!mostRecentSession) {
            return 'Not due (log a session first)';
        }

        const sessionDate = new Date(mostRecentSession.timestamp);
        const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted) : null;

        // If task has never been completed, check if session was logged
        if (!lastCompleted) {
            // Check if session is older than 1 day
            const now = new Date();
            const hoursSinceSession = (now - sessionDate) / (1000 * 60 * 60);

            if (hoursSinceSession > 24) {
                return '⚠️ OVERDUE';
            } else {
                return 'Due after this session';
            }
        }

        // If task was completed after the most recent session, it's not due yet
        if (lastCompleted >= sessionDate) {
            return 'Complete for this session';
        }

        // Task was completed before the most recent session
        // Check if it's been more than 24 hours since the session
        const now = new Date();
        const hoursSinceSession = (now - sessionDate) / (1000 * 60 * 60);

        if (hoursSinceSession > 24) {
            return '⚠️ OVERDUE';
        } else {
            return 'Due after last session';
        }
    }

    // For non-daily tasks, use the original time-based logic
    if (!task.lastCompleted) {
        return 'ASAP';
    }

    const lastDate = new Date(task.lastCompleted);
    let nextDate = new Date(lastDate);

    if (category === 'weekly') {
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

// Get detailed due dates with task info for calendar agenda view
export function getDetailedDueDates(daysAhead = 14) {
    const dueDates = new Map(); // Map<dateString, {date, tasks[]}>
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const categoryColors = {
        daily: 'daily',
        weekly: 'weekly',
        eightweek: '8week',
        quarterly: 'quarterly',
        annual: 'annual'
    };

    const categoryLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        eightweek: '8-Week',
        quarterly: 'Quarterly',
        annual: 'Annual'
    };

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            let nextDate;

            if (!task.lastCompleted) {
                // Never completed = due today
                nextDate = new Date(today);
            } else {
                const lastDate = new Date(task.lastCompleted);
                nextDate = new Date(lastDate);

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
            }

            // Check if within range
            nextDate.setHours(0, 0, 0, 0);
            if (nextDate >= today && nextDate <= endDate) {
                const dateKey = nextDate.toISOString().split('T')[0];

                if (!dueDates.has(dateKey)) {
                    dueDates.set(dateKey, {
                        date: new Date(nextDate),
                        tasks: []
                    });
                }

                dueDates.get(dateKey).tasks.push({
                    id: task.id,
                    name: task.name,
                    category: category,
                    color: categoryColors[category],
                    label: categoryLabels[category],
                    isOverdue: nextDate < today
                });
            }
        });
    }

    // Convert to sorted array
    return Array.from(dueDates.values()).sort((a, b) => a.date - b.date);
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
            ls.clear();
            location.reload();
        }
    }
}

// Inspection recording functions
let inspectionData = {};

export function recordInspection(type, frequency) {
    const saved = ls.getItem('inspectionData');
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

    ls.setItem('inspectionData', JSON.stringify(inspectionData));

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
