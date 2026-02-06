// Main application entry point
import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS, DATA_VERSION } from './config.js';
import { migrateData, loadData, saveData, getActiveGuitarId, setActiveGuitarId } from './storage.js';
import { toggleTask, quickActionJustPlayed, resetDailyTasks, resetWeeklyTasks, confirmReset, recordInspection, setDefaultDate, calculateNextDue, setCustomCompletionDate, calculateSmartStringLife, getDetailedDueDates } from './tasks.js';
import { addHumidityReading, addHumidityReadingSimplified, deleteHumidityReading, renderHumidityTable, checkForAlerts, drawHumidityChart, applyHumidityFilters, clearHumidityFilters, getFilteredReadings } from './humidity.js';
import { renderMaintenanceTasks, renderInventoryChecklist, updateDashboard, switchTab, toggleTheme, toggleExpand, openBridgeRecommendations, closeBridgeModal, openActionRecommendations, closeActionModal, openFretRecommendations, closeFretModal, renderSongs } from './ui.js';
import { exportAsCSV, exportAsJSON, createBackup, initBackupRestore } from './export.js';
import { validateHumidity, validateTemperature } from './validators.js';
import { initOnboarding } from './onboarding.js';
import { initSessions, showSessionModal } from './sessions.js';
import { initStringHistory } from './stringHistory.js';
import { renderInventory, updateRestockAlerts } from './inventory.js';
import { initHistory, renderHistoryTimeline } from './history.js';
import { getSongs, searchSongs, filterByDifficulty, filterByTuning } from './songs.js';
import { ls } from './localStorage.js';

// Guitar settings functions
function loadGuitarSettings() {
    import('./storage.js').then(({ getVersionedField, MAINTENANCE_TASKS }) => {
        const stringTypeInput = document.getElementById('currentStringType');
        const stringDateInput = document.getElementById('lastStringChangeDate');

        if (stringTypeInput) {
            const currentStringType = getVersionedField('currentStringType', 'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)');
            stringTypeInput.value = currentStringType;
        }

        if (stringDateInput) {
            // Try to get from versioned data first
            let lastChangeDate = getVersionedField('lastStringChangeDate', null);

            // If not found, check the 8-week string change task
            if (!lastChangeDate) {
                const stringChangeTask = MAINTENANCE_TASKS.eightweek.find(t => t.id === '8w-8');
                if (stringChangeTask && stringChangeTask.lastCompleted) {
                    lastChangeDate = new Date(stringChangeTask.lastCompleted).toISOString().split('T')[0];
                }
            }

            if (lastChangeDate) {
                // Convert to YYYY-MM-DD format if needed
                const date = new Date(lastChangeDate);
                stringDateInput.value = date.toISOString().split('T')[0];
            }
        }
    });
}

function saveGuitarSettings() {
    import('./storage.js').then(({ getVersionedData, saveVersionedData }) => {
        const stringTypeInput = document.getElementById('currentStringType');
        const stringDateInput = document.getElementById('lastStringChangeDate');

        const data = getVersionedData();

        if (stringTypeInput) {
            data.currentStringType = stringTypeInput.value.trim() || 'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)';
        }

        if (stringDateInput && stringDateInput.value) {
            data.lastStringChangeDate = stringDateInput.value;

            // Also update the 8-week string change task
            const stringChangeTask = MAINTENANCE_TASKS.eightweek.find(t => t.id === '8w-8');
            if (stringChangeTask) {
                stringChangeTask.completed = true;
                stringChangeTask.lastCompleted = new Date(stringDateInput.value).toISOString();
            }
        }

        saveVersionedData(data);
        saveData(); // Save task states

        // Show confirmation
        const confirmation = document.getElementById('settingsSavedConfirmation');
        if (confirmation) {
            confirmation.style.display = 'block';
            setTimeout(() => {
                confirmation.style.display = 'none';
            }, 3000);
        }

        // Update dashboard
        updateDashboard();
    });
}

// Initialize the application
export function init() {
    // Migrate data if needed
    const migratedData = migrateData();

    // Load migrated data into tasks
    loadData();

    // Set guitar selector to active guitar
    const activeId = getActiveGuitarId();
    const selector = document.getElementById('activeGuitar');
    if (selector) selector.value = activeId;

    renderMaintenanceTasks();
    renderInventoryChecklist();
    renderInventory();
    updateDashboard();
    setDefaultDate();
    initBackupRestore();

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// Set up event handlers
function setupEventHandlers() {
    // Timer button - handled dynamically by updateTimerDisplay()
    // (no setup needed here)

    // Quick Complete Daily Tasks button
    const quickCompleteDailyBtn = document.getElementById('quickCompleteDaily');
    if (quickCompleteDailyBtn) {
        quickCompleteDailyBtn.addEventListener('click', () => {
            quickActionJustPlayed();
            updateDashboard();
            renderMaintenanceTasks();
            checkForAlerts();

            // Show confirmation
            const originalText = quickCompleteDailyBtn.textContent;
            quickCompleteDailyBtn.textContent = '✓ Daily Tasks Completed!';
            quickCompleteDailyBtn.style.opacity = '0.8';
            setTimeout(() => {
                quickCompleteDailyBtn.textContent = originalText;
                quickCompleteDailyBtn.style.opacity = '1';
            }, 2000);
        });
    }

    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Guitar selector
    const guitarSelector = document.getElementById('activeGuitar');
    if (guitarSelector) {
        guitarSelector.addEventListener('change', (e) => {
            setActiveGuitarId(e.target.value);
            // Re-render everything
            updateDashboard();
            renderMaintenanceTasks();
            drawHumidityChart();
        });
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        const tabs = ['dashboard', 'maintenance', 'humidity', 'inspection', 'inventory', 'songs', 'export'];
        btn.addEventListener('click', () => {
            switchTab(tabs[index]);

            // Load songs when Songs tab is opened
            if (tabs[index] === 'songs') {
                getSongs().then(songs => {
                    renderSongs(songs);
                }).catch(error => {
                    console.error('Error loading songs:', error);
                    const songList = document.getElementById('songList');
                    if (songList) {
                        songList.innerHTML = '<p style="text-align: center; color: var(--color-error);">Error loading songs. Check console for details.</p>';
                    }
                });
            }
        });
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

    // Real-time humidity input feedback
    const humidityInput = document.getElementById('humidityValue');
    if (humidityInput) {
        humidityInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            humidityInput.classList.remove('input-safe', 'input-warning', 'input-danger');

            if (isNaN(value)) return;

            if (value < 40) {
                humidityInput.classList.add('input-warning');
            } else if (value > 55) {
                humidityInput.classList.add('input-danger');
            } else {
                humidityInput.classList.add('input-safe');
            }
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

    // Modal X close buttons
    const closeBridgeX = document.getElementById('closeBridgeModalX');
    if (closeBridgeX) closeBridgeX.addEventListener('click', closeBridgeModal);

    const closeActionX = document.getElementById('closeActionModalX');
    if (closeActionX) closeActionX.addEventListener('click', closeActionModal);

    const closeFretX = document.getElementById('closeFretModalX');
    if (closeFretX) closeFretX.addEventListener('click', closeFretModal);

    // Export buttons
    const exportCsvBtn = document.getElementById('exportCSV');
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportAsCSV);

    const exportJsonBtn = document.getElementById('exportJSON');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportAsJSON);

    // Backup button
    const createBackupBtn = document.getElementById('createBackup');
    if (createBackupBtn) createBackupBtn.addEventListener('click', createBackup);

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

    // Guitar settings
    const saveGuitarSettingsBtn = document.getElementById('saveGuitarSettings');
    if (saveGuitarSettingsBtn) {
        saveGuitarSettingsBtn.addEventListener('click', saveGuitarSettings);
    }

    // Load guitar settings on tab switch to export
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        const tabs = ['dashboard', 'maintenance', 'humidity', 'inspection', 'inventory', 'songs', 'export'];
        btn.addEventListener('click', () => {
            if (tabs[index] === 'export') {
                loadGuitarSettings();
            }
        });
    });

    // Humidity filter buttons
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyHumidityFilters);
    }

    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearHumidityFilters);
    }

    const exportFilteredBtn = document.getElementById('exportFiltered');
    if (exportFilteredBtn) {
        exportFilteredBtn.addEventListener('click', () => {
            const filtered = getFilteredReadings();
            if (filtered.length === 0) {
                alert('No humidity readings match the current filters.');
                return;
            }
            exportAsCSV(filtered);
        });
    }

    // Song search and filters
    const songSearch = document.getElementById('songSearch');
    if (songSearch) {
        songSearch.addEventListener('input', async (e) => {
            const allSongs = await getSongs();
            let filtered = searchSongs(allSongs, e.target.value);

            const diffFilter = document.getElementById('difficultyFilter').value;
            const tuningFilter = document.getElementById('tuningFilter').value;

            filtered = filterByDifficulty(filtered, diffFilter);
            filtered = filterByTuning(filtered, tuningFilter);

            renderSongs(filtered);
        });
    }

    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', async () => {
            const allSongs = await getSongs();
            const searchQuery = document.getElementById('songSearch').value;

            let filtered = searchSongs(allSongs, searchQuery);
            filtered = filterByDifficulty(filtered, difficultyFilter.value);
            filtered = filterByTuning(filtered, document.getElementById('tuningFilter').value);

            renderSongs(filtered);
        });
    }

    const tuningFilter = document.getElementById('tuningFilter');
    if (tuningFilter) {
        tuningFilter.addEventListener('change', async () => {
            const allSongs = await getSongs();
            const searchQuery = document.getElementById('songSearch').value;

            let filtered = searchSongs(allSongs, searchQuery);
            filtered = filterByDifficulty(filtered, document.getElementById('difficultyFilter').value);
            filtered = filterByTuning(filtered, tuningFilter.value);

            renderSongs(filtered);
        });
    }

    const refreshSongs = document.getElementById('refreshSongs');
    if (refreshSongs) {
        refreshSongs.addEventListener('click', async () => {
            refreshSongs.textContent = '⏳ Loading...';
            refreshSongs.disabled = true;

            try {
                const songs = await getSongs(true); // Force refresh
                renderSongs(songs);
            } catch (error) {
                alert('Failed to fetch songs: ' + error.message);
            } finally {
                refreshSongs.textContent = '🔄 Refresh from Notion';
                refreshSongs.disabled = false;
            }
        });
    }

    // Quick Capture Mode - Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Quick Capture Mode - Keyboard shortcuts (exported for testing)
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        // H key - focus humidity input
        if (e.key === 'h' || e.key === 'H') {
            const humidityInput = document.getElementById('humidityValue');
            if (humidityInput) {
                // Switch to humidity tab first if not already there
                switchTab('humidity');
                humidityInput.focus();
                e.preventDefault();
            }
        }

        // S key - toggle practice timer
        if (e.key === 's' || e.key === 'S') {
            if (window.togglePracticeTimer) {
                // Switch to dashboard tab if not already there
                switchTab('dashboard');
                window.togglePracticeTimer();
                e.preventDefault();
            }
        }
    });
}

// Load theme
const savedTheme = ls.getItem('theme') || 'light';
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
window.switchTab = switchTab;
window.setCustomCompletionDate = setCustomCompletionDate;
window.renderMaintenanceTasks = renderMaintenanceTasks;
window.updateDashboard = updateDashboard;
window.calculateSmartStringLife = calculateSmartStringLife;
window.getDetailedDueDates = getDetailedDueDates;

// Humidity trend info modal functions
window.showHumidityTrendInfo = function() {
    const modal = document.getElementById('humidityTrendModal');
    if (modal) modal.classList.add('show');
};

window.hideHumidityTrendInfo = function() {
    const modal = document.getElementById('humidityTrendModal');
    if (modal) modal.classList.remove('show');
};

// Wire up humidity trend modal close buttons
const closeHumidityTrendX = document.getElementById('closeHumidityTrendModal');
if (closeHumidityTrendX) closeHumidityTrendX.addEventListener('click', window.hideHumidityTrendInfo);

const closeHumidityTrendBtn = document.getElementById('closeHumidityTrendBtn');
if (closeHumidityTrendBtn) closeHumidityTrendBtn.addEventListener('click', window.hideHumidityTrendInfo);

// Initialize app
init();
setupEventHandlers();
checkForAlerts();
renderHumidityTable();
drawHumidityChart();
initSessions();
initStringHistory();
initHistory();
initOnboarding();
