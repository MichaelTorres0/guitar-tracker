// Main application entry point
import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS, DATA_VERSION } from './config.js';
import { migrateData, loadData, saveData } from './storage.js';
import { toggleTask, quickActionJustPlayed, resetDailyTasks, resetWeeklyTasks, confirmReset, recordInspection, setDefaultDate, calculateNextDue } from './tasks.js';
import { addHumidityReading, addHumidityReadingSimplified, deleteHumidityReading, renderHumidityTable, checkForAlerts, drawHumidityChart } from './humidity.js';
import { renderMaintenanceTasks, renderInventoryChecklist, updateDashboard, switchTab, toggleTheme, toggleExpand, openBridgeRecommendations, closeBridgeModal, openActionRecommendations, closeActionModal, openFretRecommendations, closeFretModal } from './ui.js';
import { exportAsCSV, exportAsJSON } from './export.js';
import { validateHumidity, validateTemperature } from './validators.js';

// Initialize the application
export function init() {
    // Migrate data if needed
    const migratedData = migrateData();

    // Load migrated data into tasks
    loadData();

    renderMaintenanceTasks();
    renderInventoryChecklist();
    updateDashboard();
    setDefaultDate();
}

// Set up event handlers
function setupEventHandlers() {
    // Just Played button
    const justPlayedBtn = document.querySelector('.btn-just-played');
    if (justPlayedBtn) {
        justPlayedBtn.addEventListener('click', () => {
            quickActionJustPlayed();
            updateDashboard();
            renderMaintenanceTasks();
            checkForAlerts();
        });
    }

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        const tabs = ['dashboard', 'maintenance', 'humidity', 'inspection', 'inventory', 'export'];
        btn.addEventListener('click', () => switchTab(tabs[index]));
    });

    // Task checkboxes - use event delegation
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskId = e.target.getAttribute('data-task-id');
            toggleTask(taskId);
            updateDashboard();
            renderMaintenanceTasks();
            checkForAlerts();
        }
    });

    // Expand buttons - use event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('expand-btn')) {
            toggleExpand(e.target);
        }
    });

    // Humidity form - simplified
    const addSimplifiedBtn = document.getElementById('addHumiditySimplified');
    if (addSimplifiedBtn) {
        addSimplifiedBtn.addEventListener('click', () => {
            addHumidityReadingSimplified();
            updateDashboard();
            renderHumidityTable();
            drawHumidityChart();
            checkForAlerts();
        });
    }

    // Humidity form - full
    const addHumidityBtn = document.getElementById('addHumidity');
    if (addHumidityBtn) {
        addHumidityBtn.addEventListener('click', () => {
            addHumidityReading();
            updateDashboard();
            renderHumidityTable();
            drawHumidityChart();
            checkForAlerts();
        });
    }

    // Delete humidity readings - use event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-humidity-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteHumidityReading(id);
            updateDashboard();
            renderHumidityTable();
            drawHumidityChart();
            checkForAlerts();
        }
    });

    // Inspection buttons
    const bridgeBtn = document.getElementById('recordBridge');
    if (bridgeBtn) {
        bridgeBtn.addEventListener('click', () => recordInspection('bridge', 'weekly'));
    }

    const actionBtn = document.getElementById('recordAction');
    if (actionBtn) {
        actionBtn.addEventListener('click', () => recordInspection('action', 'stringchange'));
    }

    const fretBtn = document.getElementById('recordFret');
    if (fretBtn) {
        fretBtn.addEventListener('click', () => recordInspection('fret', 'quarterly'));
    }

    // Modal buttons
    const openBridgeBtn = document.getElementById('openBridgeModal');
    if (openBridgeBtn) openBridgeBtn.addEventListener('click', openBridgeRecommendations);

    const closeBridgeBtn = document.getElementById('closeBridgeModal');
    if (closeBridgeBtn) closeBridgeBtn.addEventListener('click', closeBridgeModal);

    const openActionBtn = document.getElementById('openActionModal');
    if (openActionBtn) openActionBtn.addEventListener('click', openActionRecommendations);

    const closeActionBtn = document.getElementById('closeActionModal');
    if (closeActionBtn) closeActionBtn.addEventListener('click', closeActionModal);

    const openFretBtn = document.getElementById('openFretModal');
    if (openFretBtn) openFretBtn.addEventListener('click', openFretRecommendations);

    const closeFretBtn = document.getElementById('closeFretModal');
    if (closeFretBtn) closeFretBtn.addEventListener('click', closeFretModal);

    // Export buttons
    const exportCsvBtn = document.getElementById('exportCSV');
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportAsCSV);

    const exportJsonBtn = document.getElementById('exportJSON');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportAsJSON);

    // Reset buttons
    const resetDailyBtn = document.getElementById('resetDaily');
    if (resetDailyBtn) {
        resetDailyBtn.addEventListener('click', () => {
            if (resetDailyTasks()) {
                updateDashboard();
                renderMaintenanceTasks();
            }
        });
    }

    const resetWeeklyBtn = document.getElementById('resetWeekly');
    if (resetWeeklyBtn) {
        resetWeeklyBtn.addEventListener('click', () => {
            if (resetWeeklyTasks()) {
                updateDashboard();
                renderMaintenanceTasks();
            }
        });
    }

    const resetAllBtn = document.getElementById('resetAll');
    if (resetAllBtn) resetAllBtn.addEventListener('click', confirmReset);
}

// Load theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
const themeToggleText = document.querySelector('.theme-toggle');
if (themeToggleText) {
    themeToggleText.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Expose key objects and functions to window for testing and debugging
window.MAINTENANCE_TASKS = MAINTENANCE_TASKS;
window.EQUIPMENT_ITEMS = EQUIPMENT_ITEMS;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DATA_VERSION = DATA_VERSION;

// Expose functions for testing
window.saveData = saveData;
window.loadData = loadData;
window.toggleTask = toggleTask;
window.calculateNextDue = calculateNextDue;
window.validateHumidity = validateHumidity;
window.validateTemperature = validateTemperature;
window.addHumidityReadingSimplified = addHumidityReadingSimplified;
window.checkForAlerts = checkForAlerts;
window.exportAsCSV = exportAsCSV;
window.exportAsJSON = exportAsJSON;
window.migrateData = migrateData;

// Initialize app
init();
setupEventHandlers();
checkForAlerts();
renderHumidityTable();
drawHumidityChart();
