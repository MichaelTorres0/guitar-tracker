/**
 * Guitar Tracker - Main Application
 * Entry point that initializes the app and wires up event handlers
 */

import { MAINTENANCE_TASKS } from './config.js';
import { loadMaintenanceData, loadHumidityReadings, loadInspectionData, clearAllData } from './storage.js';
import { toggleTask, completeAllDailyTasks, resetCategoryTasks, countOverdueTasks } from './tasks.js';
import { addHumidityReadingFromForm, deleteHumidityReading, checkHumidityAlerts, drawHumidityChart } from './humidity.js';
import { exportAsCSV, exportAsJSON } from './export.js';
import {
    renderMaintenanceTasks,
    renderInventoryChecklist,
    renderHumidityTable,
    updateDashboard,
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
} from './ui.js';

/**
 * Check for all alerts (humidity + overdue tasks)
 */
function checkForAlerts() {
    const alerts = [];

    // Humidity alerts
    const humidityAlerts = checkHumidityAlerts();
    alerts.push(...humidityAlerts);

    // Overdue task alerts
    const overdueCount = countOverdueTasks();
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

/**
 * Handle Just Played button click
 */
function handleJustPlayed() {
    completeAllDailyTasks();
    updateDashboard();
    renderMaintenanceTasks();
    checkForAlerts();
    showJustPlayedFeedback();
}

/**
 * Handle humidity form submission
 */
function handleHumiditySubmit() {
    const humidityInput = document.getElementById('humidityValue');
    const temperatureInput = document.getElementById('temperatureValue');
    const locationSelect = document.getElementById('guitarLocation');

    const result = addHumidityReadingFromForm({
        humidityInput,
        temperatureInput,
        locationSelect
    });

    if (result.success) {
        showConfirmation('logConfirmation');
        updateDashboard();
        renderHumidityTable();
        checkForAlerts();

        // Update chart
        const canvas = document.getElementById('humidityChart');
        const container = document.getElementById('humidityChartContainer');
        if (canvas && container) {
            drawHumidityChart(canvas, container);
        }
    }
}

/**
 * Handle task checkbox change
 * @param {string} taskId - The task ID
 */
function handleTaskToggle(taskId) {
    toggleTask(taskId);
    updateDashboard();
    renderMaintenanceTasks();
    checkForAlerts();
}

/**
 * Handle reset daily tasks
 */
function handleResetDaily() {
    if (confirm('Reset all daily tasks? This will uncheck them for today.')) {
        resetCategoryTasks('daily');
        updateDashboard();
        renderMaintenanceTasks();
    }
}

/**
 * Handle reset weekly tasks
 */
function handleResetWeekly() {
    if (confirm('Reset all weekly tasks? This will uncheck them for this week.')) {
        resetCategoryTasks('weekly');
        updateDashboard();
        renderMaintenanceTasks();
    }
}

/**
 * Handle full data reset
 */
function handleFullReset() {
    if (confirm('⚠️ This will DELETE ALL data including maintenance history and humidity logs. This cannot be undone. Are you sure?')) {
        if (confirm('Really delete everything? Last chance!')) {
            clearAllData();
            location.reload();
        }
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Just Played button
    const justPlayedBtn = document.querySelector('.btn-just-played');
    if (justPlayedBtn) {
        justPlayedBtn.addEventListener('click', handleJustPlayed);
    }

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.textContent.toLowerCase().includes('dashboard') ? 'dashboard' :
                btn.textContent.toLowerCase().includes('maintenance') ? 'maintenance' :
                    btn.textContent.toLowerCase().includes('humidity') ? 'humidity' :
                        btn.textContent.toLowerCase().includes('inspection') ? 'inspection' :
                            btn.textContent.toLowerCase().includes('equipment') ? 'inventory' :
                                btn.textContent.toLowerCase().includes('export') ? 'export' : 'dashboard';
            switchTab(tabName, btn);
        });
    });

    // Humidity form
    const humiditySubmitBtn = document.querySelector('#humidity .btn-primary');
    if (humiditySubmitBtn) {
        humiditySubmitBtn.addEventListener('click', handleHumiditySubmit);
    }

    // Task checkboxes (use event delegation)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskId = e.target.dataset.taskId;
            if (taskId) {
                handleTaskToggle(taskId);
            }
        }
    });

    // Expand buttons (use event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('expand-btn')) {
            toggleExpand(e.target);
        }
    });

    // Delete humidity reading (use event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-humidity-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (id) {
                deleteHumidityReading(id);
                updateDashboard();
                renderHumidityTable();

                const canvas = document.getElementById('humidityChart');
                const container = document.getElementById('humidityChartContainer');
                if (canvas && container) {
                    drawHumidityChart(canvas, container);
                }
            }
        }
    });

    // Export buttons
    const exportCSVBtn = document.querySelector('[onclick="exportAsCSV()"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CSV'));
    const exportJSONBtn = document.querySelector('[onclick="exportAsJSON()"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('JSON'));

    // Find export buttons by content
    document.querySelectorAll('#export button').forEach(btn => {
        if (btn.textContent.includes('CSV')) {
            btn.addEventListener('click', exportAsCSV);
        } else if (btn.textContent.includes('JSON') || btn.textContent.includes('Backup')) {
            btn.addEventListener('click', exportAsJSON);
        } else if (btn.textContent.includes('Reset Daily')) {
            btn.addEventListener('click', handleResetDaily);
        } else if (btn.textContent.includes('Reset Weekly')) {
            btn.addEventListener('click', handleResetWeekly);
        } else if (btn.textContent.includes('Clear All')) {
            btn.addEventListener('click', handleFullReset);
        }
    });

    // Modal buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Bridge') && btn.textContent.includes('Recommendations')) {
            btn.addEventListener('click', () => openModal('bridgeModal'));
        } else if (btn.textContent.includes('Action') && btn.textContent.includes('Recommendations')) {
            btn.addEventListener('click', () => openModal('actionModal'));
        } else if (btn.textContent.includes('Fret') && btn.textContent.includes('Recommendations')) {
            btn.addEventListener('click', () => openModal('fretModal'));
        }
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });

    // Modal confirm buttons
    document.querySelectorAll('.modal .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });

    // Inspection checkboxes
    document.querySelectorAll('#bridgeCheck1, #bridgeCheck2').forEach(cb => {
        cb.addEventListener('change', () => recordInspection('bridge', 'weekly'));
    });
    document.querySelectorAll('#actionCheck1, #actionCheck2, #actionCheck3').forEach(cb => {
        cb.addEventListener('change', () => recordInspection('action', 'quarterly'));
    });
    document.querySelectorAll('#fretCheck1, #fretCheck2, #fretCheck3').forEach(cb => {
        cb.addEventListener('change', () => recordInspection('fret', 'stringchange'));
    });
}

/**
 * Initialize the application
 */
function init() {
    // Load data from storage
    loadMaintenanceData();
    loadHumidityReadings();
    loadInspectionData();

    // Apply theme
    applyTheme();

    // Render UI
    renderMaintenanceTasks();
    renderInventoryChecklist();
    renderHumidityTable();
    updateDashboard();
    setDefaultDate();
    checkForAlerts();

    // Draw humidity chart
    const canvas = document.getElementById('humidityChart');
    const container = document.getElementById('humidityChartContainer');
    if (canvas && container) {
        drawHumidityChart(canvas, container);
    }

    // Set up event listeners
    setupEventListeners();

    console.log('Guitar Tracker initialized');
}

// Expose necessary functions to window for any remaining inline handlers
window.GuitarTracker = {
    toggleTask: handleTaskToggle,
    toggleTheme,
    switchTab,
    exportAsCSV,
    exportAsJSON,
    openModal,
    closeModal
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
