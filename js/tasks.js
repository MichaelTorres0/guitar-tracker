// Task management functions
import { MAINTENANCE_TASKS } from './config.js';
import { saveData } from './storage.js';

export function toggleTask(taskId) {
    for (let category in MAINTENANCE_TASKS) {
        const task = MAINTENANCE_TASKS[category].find(t => t.id === taskId);
        if (task) {
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
