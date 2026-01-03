// Import modules directly and expose to window
import { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS, DATA_VERSION } from '../js/config.js';
import { migrateData, loadData, saveData } from '../js/storage.js';
import { toggleTask, quickActionJustPlayed, calculateNextDue, resetDailyTasks, resetWeeklyTasks, confirmReset, recordInspection, getAllNextDueDates } from '../js/tasks.js';
import { validateHumidity, validateTemperature } from '../js/validators.js';
import { addHumidityReadingSimplified, deleteHumidityReading, checkForAlerts, drawHumidityChart } from '../js/humidity.js';
import { renderCalendar, toggleTheme, updateDashboard, switchTab, openBridgeRecommendations, closeBridgeModal, openActionRecommendations, closeActionModal, openFretRecommendations, closeFretModal } from '../js/ui.js';
import { exportAsCSV, exportAsJSON, downloadFile } from '../js/export.js';

export function setupWindow(window) {
    window.MAINTENANCE_TASKS = MAINTENANCE_TASKS;
    window.EQUIPMENT_ITEMS = EQUIPMENT_ITEMS;
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.DATA_VERSION = DATA_VERSION;
    window.saveData = saveData;
    window.loadData = loadData;
    window.toggleTask = toggleTask;
    window.calculateNextDue = calculateNextDue;
    window.validateHumidity = validateHumidity;
    window.validateTemperature = validateTemperature;
    window.addHumidityReadingSimplified = addHumidityReadingSimplified;
    window.deleteHumidityReading = deleteHumidityReading;
    window.checkForAlerts = checkForAlerts;
    window.exportAsCSV = exportAsCSV;
    window.exportAsJSON = exportAsJSON;
    window.downloadFile = downloadFile;
    window.migrateData = migrateData;
    window.renderCalendar = renderCalendar;
    window.toggleTheme = toggleTheme;
    window.quickActionJustPlayed = quickActionJustPlayed;
    window.updateDashboard = updateDashboard;
    window.drawHumidityChart = drawHumidityChart;
    window.getAllNextDueDates = getAllNextDueDates;
    window.resetDailyTasks = resetDailyTasks;
    window.resetWeeklyTasks = resetWeeklyTasks;
    window.confirmReset = confirmReset;
    window.switchTab = switchTab;
    window.recordInspection = recordInspection;
    window.openBridgeRecommendations = openBridgeRecommendations;
    window.closeBridgeModal = closeBridgeModal;
    window.openActionRecommendations = openActionRecommendations;
    window.closeActionModal = closeActionModal;
    window.openFretRecommendations = openFretRecommendations;
    window.closeFretModal = closeFretModal;

    // Mock functions that aren't exposed
    window.saveInspectionData = () => {};
    window.loadInspectionData = () => ({});
    window.calculateInspectionDueDate = (freq) => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
}
