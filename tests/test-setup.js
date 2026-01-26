// Test setup - dynamically import modules after globals are set
// This function must be called AFTER global.window, global.localStorage, etc. are set

export async function setupWindow(win) {
    // Set up global references for modules that use global localStorage/document
    global.window = win;
    global.document = win.document;
    // Don't overwrite global.localStorage - keep using the mock set up by test.js
    // global.localStorage = win.localStorage;  // This was overwriting our mock with JSDOM's undefined localStorage
    global.alert = win.alert || (() => {});
    global.confirm = win.confirm || (() => true);

    const window = win;

    // Now dynamically import modules after globals are set
    const { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS, DATA_VERSION } = await import('../js/config.js');
    const { migrateData, loadData, saveData } = await import('../js/storage.js');
    const { toggleTask, quickActionJustPlayed, calculateNextDue, resetDailyTasks, resetWeeklyTasks, confirmReset, recordInspection, getAllNextDueDates, calculateSmartStringLife } = await import('../js/tasks.js');
    const { validateHumidity, validateTemperature } = await import('../js/validators.js');
    const { addHumidityReadingSimplified, deleteHumidityReading, checkForAlerts, drawHumidityChart } = await import('../js/humidity.js');
    const { renderCalendar, toggleTheme, updateDashboard, switchTab, openBridgeRecommendations, closeBridgeModal, openActionRecommendations, closeActionModal, openFretRecommendations, closeFretModal } = await import('../js/ui.js');
    const { exportAsCSV, exportAsJSON, downloadFile } = await import('../js/export.js');
    const { setupKeyboardShortcuts } = await import('../js/app.js');
    const { togglePracticeTimer } = await import('../js/sessions.js');

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
    window.setupKeyboardShortcuts = setupKeyboardShortcuts;
    window.togglePracticeTimer = togglePracticeTimer;
    window.calculateSmartStringLife = calculateSmartStringLife;

    // Set up keyboard shortcuts for testing
    setupKeyboardShortcuts();

    // Mock functions that aren't exposed
    window.saveInspectionData = () => {};
    window.loadInspectionData = () => ({});
    window.calculateInspectionDueDate = (freq) => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
}
