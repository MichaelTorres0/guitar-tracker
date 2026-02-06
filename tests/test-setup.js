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
    const { MAINTENANCE_TASKS, EQUIPMENT_ITEMS, STORAGE_KEYS, DATA_VERSION, GUITARS, PRS_MAINTENANCE_TASKS, ALL_GUITAR_TASKS } = await import('../public/js/config.js');
    const { migrateData, loadData, saveData, migrateV5ToV6 } = await import('../public/js/storage.js');
    const { toggleTask, quickActionJustPlayed, calculateNextDue, resetDailyTasks, resetWeeklyTasks, confirmReset, recordInspection, getAllNextDueDates, calculateSmartStringLife, getDetailedDueDates } = await import('../public/js/tasks.js');
    const { validateHumidity, validateTemperature } = await import('../public/js/validators.js');
    const { addHumidityReadingSimplified, deleteHumidityReading, checkForAlerts, drawHumidityChart } = await import('../public/js/humidity.js');
    const { renderCalendar, toggleTheme, updateDashboard, switchTab, openBridgeRecommendations, closeBridgeModal, openActionRecommendations, closeActionModal, openFretRecommendations, closeFretModal } = await import('../public/js/ui.js');
    const { exportAsCSV, exportAsJSON, downloadFile, mergeBackupData, mergeFromBackup } = await import('../public/js/export.js');
    const { setupKeyboardShortcuts } = await import('../public/js/app.js');
    const { togglePracticeTimer } = await import('../public/js/sessions.js');
    const { getHistoryEvents, renderHistoryTimeline } = await import('../public/js/history.js');

    window.MAINTENANCE_TASKS = MAINTENANCE_TASKS;
    window.EQUIPMENT_ITEMS = EQUIPMENT_ITEMS;
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.DATA_VERSION = DATA_VERSION;
    window.GUITARS = GUITARS;
    window.PRS_MAINTENANCE_TASKS = PRS_MAINTENANCE_TASKS;
    window.ALL_GUITAR_TASKS = ALL_GUITAR_TASKS;
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
    window.mergeBackupData = mergeBackupData;
    window.mergeFromBackup = mergeFromBackup;
    window.migrateData = migrateData;
    window.migrateV5ToV6 = migrateV5ToV6;
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
    window.getDetailedDueDates = getDetailedDueDates;
    window.getHistoryEvents = getHistoryEvents;
    window.renderHistoryTimeline = renderHistoryTimeline;

    // Set up keyboard shortcuts for testing
    setupKeyboardShortcuts();

    // Mock functions that aren't exposed
    window.saveInspectionData = () => {};
    window.loadInspectionData = () => ({});
    window.calculateInspectionDueDate = (freq) => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
}
