/**
 * Guitar Tracker - Task Management
 * Handles task operations, calculations, and string life
 */

import { MAINTENANCE_TASKS, TASK_FREQUENCIES, STRING_LIFE } from './config.js';
import { saveMaintenanceData } from './storage.js';

/**
 * Toggle a task's completion status
 * @param {string} taskId - The task ID to toggle
 * @returns {Object|null} The toggled task or null if not found
 */
export function toggleTask(taskId) {
    for (let category in MAINTENANCE_TASKS) {
        const task = MAINTENANCE_TASKS[category].find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.lastCompleted = new Date().toISOString();
            }
            saveMaintenanceData();
            return task;
        }
    }
    return null;
}

/**
 * Complete all daily tasks (Just Played action)
 */
export function completeAllDailyTasks() {
    const now = new Date().toISOString();
    MAINTENANCE_TASKS.daily.forEach(task => {
        task.completed = true;
        task.lastCompleted = now;
    });
    saveMaintenanceData();
}

/**
 * Reset tasks for a specific category
 * @param {string} category - The category to reset ('daily', 'weekly', etc.)
 */
export function resetCategoryTasks(category) {
    if (MAINTENANCE_TASKS[category]) {
        MAINTENANCE_TASKS[category].forEach(task => {
            task.completed = false;
        });
        saveMaintenanceData();
    }
}

/**
 * Calculate next due date for a task
 * @param {Object} task - The task object
 * @param {string} category - The task category
 * @returns {string} Human-readable next due string
 */
export function calculateNextDue(task, category) {
    if (!task.lastCompleted) {
        return 'ASAP';
    }

    const lastDate = new Date(task.lastCompleted);
    const nextDate = new Date(lastDate);
    const daysToAdd = TASK_FREQUENCIES[category] || 7;

    if (category === 'annual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
        nextDate.setDate(nextDate.getDate() + daysToAdd);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate <= today) {
        return '⚠️ OVERDUE';
    }

    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil === 0) {
        return 'Today';
    } else if (daysUntil === 1) {
        return 'Tomorrow';
    }

    return `${daysUntil} days`;
}

/**
 * Get all next due dates for calendar display
 * @returns {Date[]} Array of dates with upcoming tasks
 */
export function getAllNextDueDates() {
    const dates = [];
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            if (!task.lastCompleted) {
                dates.push(new Date(today));
                return;
            }

            const lastDate = new Date(task.lastCompleted);
            const nextDate = new Date(lastDate);
            const daysToAdd = TASK_FREQUENCIES[category] || 7;

            if (category === 'annual') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
                nextDate.setDate(nextDate.getDate() + daysToAdd);
            }

            if (nextDate >= today && nextDate <= sevenDaysFromNow) {
                dates.push(nextDate);
            }
        });
    }

    return dates;
}

/**
 * Calculate string life percentage
 * @returns {{percent: number, status: string, daysRemaining: number, estimate: string}}
 */
export function calculateStringLife() {
    // Find the restring task
    const restringTask = MAINTENANCE_TASKS.eightweek?.find(t => t.id === '8w-8');

    if (!restringTask || !restringTask.lastCompleted) {
        return {
            percent: 0,
            status: 'unknown',
            daysRemaining: 0,
            estimate: 'No string change recorded'
        };
    }

    const lastChange = new Date(restringTask.lastCompleted);
    const today = new Date();
    const daysSinceChange = Math.floor((today - lastChange) / (1000 * 60 * 60 * 24));

    // Calculate effective lifespan based on cleaning habits
    let effectiveWeeks = STRING_LIFE.BASE_WEEKS;

    // Check daily cleaning compliance
    const dailyCleaningTask = MAINTENANCE_TASKS.daily?.find(t => t.id === 'daily-1');
    if (dailyCleaningTask) {
        // Simple heuristic: if cleaning is current, assume good compliance
        if (dailyCleaningTask.completed) {
            effectiveWeeks = STRING_LIFE.MAX_WEEKS;
        }
    }

    const totalDays = effectiveWeeks * 7;
    const daysRemaining = Math.max(0, totalDays - daysSinceChange);
    const percent = Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)));

    let status = 'safe';
    if (percent <= 0) {
        status = 'danger';
    } else if (percent <= 25) {
        status = 'warning';
    }

    let estimate;
    if (daysRemaining <= 0) {
        estimate = 'Strings are past due for replacement';
    } else if (daysRemaining === 1) {
        estimate = '1 day remaining';
    } else if (daysRemaining <= 7) {
        estimate = `${daysRemaining} days remaining - consider ordering strings`;
    } else {
        const weeksRemaining = Math.floor(daysRemaining / 7);
        estimate = `~${weeksRemaining} week${weeksRemaining > 1 ? 's' : ''} remaining`;
    }

    return {
        percent,
        status,
        daysRemaining,
        daysSinceChange,
        estimate
    };
}

/**
 * Get days since last string change
 * @returns {number|null} Days since change or null if never recorded
 */
export function getDaysSinceStringChange() {
    const restringTask = MAINTENANCE_TASKS.eightweek?.find(t => t.id === '8w-8');

    if (!restringTask || !restringTask.lastCompleted) {
        return null;
    }

    const lastChange = new Date(restringTask.lastCompleted);
    const today = new Date();
    return Math.floor((today - lastChange) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate completion percentage for a category
 * @param {string} category - The category name
 * @returns {number} Completion percentage (0-100)
 */
export function getCategoryCompletion(category) {
    const tasks = MAINTENANCE_TASKS[category];
    if (!tasks || tasks.length === 0) return 0;

    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
}

/**
 * Calculate overall completion percentage
 * @returns {number} Overall completion percentage (0-100)
 */
export function getOverallCompletion() {
    let total = 0;
    let completed = 0;

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            total++;
            if (task.completed) completed++;
        });
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Count overdue tasks
 * @returns {number} Number of overdue tasks
 */
export function countOverdueTasks() {
    let count = 0;

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            if (!task.completed && task.lastCompleted) {
                const nextDue = calculateNextDue(task, category);
                if (nextDue.includes('OVERDUE')) {
                    count++;
                }
            }
        });
    }

    return count;
}

/**
 * Calculate inspection due date
 * @param {string} frequency - The frequency type ('weekly', 'quarterly', 'stringchange')
 * @returns {string} Formatted due date
 */
export function calculateInspectionDueDate(frequency) {
    const now = new Date();
    const nextDate = new Date(now);

    switch (frequency) {
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

// Export Tasks object for convenience
export const Tasks = {
    toggleTask,
    completeAllDailyTasks,
    resetCategoryTasks,
    calculateNextDue,
    getAllNextDueDates,
    calculateStringLife,
    getDaysSinceStringChange,
    getCategoryCompletion,
    getOverallCompletion,
    countOverdueTasks,
    calculateInspectionDueDate
};
