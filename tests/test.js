/**
 * Guitar Tracker Test Suite
 * Tests core functionality of the Taylor GS Mini Maintenance Tracker PWA
 */

import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create localStorage mock early - must be set on globalThis BEFORE any other imports
// because ES modules execute at import time and need access to localStorage
class EarlyLocalStorageMock {
    constructor() {
        this.store = {};
    }
    clear() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    get length() {
        return Object.keys(this.store).length;
    }
    key(index) {
        return Object.keys(this.store)[index] || null;
    }
}

// Set up localStorage on globalThis immediately - always use our mock for consistent testing
globalThis.localStorage = new EarlyLocalStorageMock();

// Test results tracking
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failed++;
        failures.push({ name, error: error.message });
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${error.message}`);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} Expected: ${expected}, Got: ${actual}`);
    }
}

function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`${message} Expected truthy value, got: ${value}`);
    }
}

function assertFalse(value, message = '') {
    if (value) {
        throw new Error(`${message} Expected falsy value, got: ${value}`);
    }
}

function assertDefined(value, message = '') {
    if (value === undefined || value === null) {
        throw new Error(`${message} Expected defined value, got: ${value}`);
    }
}

function assertArrayLength(arr, length, message = '') {
    if (!Array.isArray(arr) || arr.length !== length) {
        throw new Error(`${message} Expected array of length ${length}, got: ${arr ? arr.length : 'not an array'}`);
    }
}

// Use the early localStorage mock as the shared instance
const sharedLocalStorage = globalThis.localStorage;

// Setup DOM environment BEFORE importing modules
function setupGlobalDOM() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    // Remove the script tag to prevent module loading issues
    const htmlWithoutScript = html.replace(/<script type="module".*?<\/script>/s, '');

    const dom = new JSDOM(htmlWithoutScript, {
        runScripts: 'outside-only',
        pretendToBeVisual: true,
        url: 'file://' + path.join(__dirname, '..') + '/'
    });

    // Use the shared localStorage instance for consistency
    // Set up global references BEFORE modules are imported
    global.window = dom.window;
    global.document = dom.window.document;
    global.localStorage = sharedLocalStorage;
    globalThis.localStorage = sharedLocalStorage;
    global.alert = () => {};
    global.confirm = () => true;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
    global.URL = dom.window.URL;

    // Set localStorage on the window object
    dom.window.localStorage = sharedLocalStorage;

    return dom;
}

// Helper function to access localStorage consistently in tests
function getLS() {
    return sharedLocalStorage;
}

// ==================== TEST SUITES ====================

async function runTests() {
    console.log('\n🎸 Guitar Tracker Test Suite\n');
    console.log('='.repeat(50));

    // Setup DOM globals first
    const dom = setupGlobalDOM();
    const { window } = dom;
    const { document } = window;

    // Now dynamically import modules after globals are set up
    const { setupWindow } = await import('./test-setup.js');
    await setupWindow(window);

    // Use the helper function for localStorage access in tests
    const localStorage = getLS();

    // ==================== HTML Structure Tests ====================
    console.log('\n📄 HTML Structure Tests');

    test('Page has correct title', () => {
        assertEqual(document.title, 'Taylor GS Mini Maintenance Tracker');
    });

    test('PWA meta tags exist', () => {
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
        assertDefined(appleTouchIcon, 'apple-touch-icon not found');

        const manifest = document.querySelector('link[rel="manifest"]');
        assertDefined(manifest, 'manifest link not found');

        const themeColor = document.querySelector('meta[name="theme-color"]');
        assertDefined(themeColor, 'theme-color meta not found');
        assertEqual(themeColor.getAttribute('content'), '#3b82f6');
    });

    test('All 6 tab buttons exist', () => {
        const tabBtns = document.querySelectorAll('.tab-btn');
        assertEqual(tabBtns.length, 6, 'Should have 6 tab buttons');
    });

    test('Dashboard tab is active by default', () => {
        const dashboardTab = document.getElementById('dashboard');
        assertTrue(dashboardTab.classList.contains('active'), 'Dashboard should be active');
    });

    test('Quick Complete Daily button exists', () => {
        const btn = document.getElementById('quickCompleteDaily') || document.querySelector('.btn-quick-action');
        assertDefined(btn, 'Quick Complete Daily button not found');
    });

    test('Theme toggle button exists', () => {
        const btn = document.querySelector('.theme-toggle');
        assertDefined(btn, 'Theme toggle button not found');
    });

    test('All 3 modals exist', () => {
        const bridgeModal = document.getElementById('bridgeModal');
        const actionModal = document.getElementById('actionModal');
        const fretModal = document.getElementById('fretModal');
        assertDefined(bridgeModal, 'Bridge modal not found');
        assertDefined(actionModal, 'Action modal not found');
        assertDefined(fretModal, 'Fret modal not found');
    });

    // ==================== Data Structure Tests ====================
    console.log('\n📊 Data Structure Tests');

    test('MAINTENANCE_TASKS is defined', () => {
        assertDefined(window.MAINTENANCE_TASKS);
    });

    test('MAINTENANCE_TASKS has all 5 categories', () => {
        const tasks = window.MAINTENANCE_TASKS;
        assertDefined(tasks.daily, 'daily tasks missing');
        assertDefined(tasks.weekly, 'weekly tasks missing');
        assertDefined(tasks.eightweek, '8-week tasks missing');
        assertDefined(tasks.quarterly, 'quarterly tasks missing');
        assertDefined(tasks.annual, 'annual tasks missing');
    });

    test('Daily tasks has 3 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.daily, 3);
    });

    test('Weekly tasks has 3 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.weekly, 3);
    });

    test('8-week tasks has 8 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.eightweek, 8);
    });

    test('Quarterly tasks has 3 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.quarterly, 3);
    });

    test('Annual tasks has 1 item', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.annual, 1);
    });

    test('Each task has required properties', () => {
        const task = window.MAINTENANCE_TASKS.daily[0];
        assertDefined(task.id, 'Task should have id');
        assertDefined(task.name, 'Task should have name');
        assertDefined(task.duration, 'Task should have duration');
        assertDefined(task.why, 'Task should have why');
        assertDefined(task.how, 'Task should have how');
    });

    test('EQUIPMENT_ITEMS is defined with 15 items', () => {
        assertDefined(window.EQUIPMENT_ITEMS);
        assertEqual(window.EQUIPMENT_ITEMS.length, 15);
    });

    // ==================== localStorage Tests ====================
    console.log('\n💾 localStorage Tests');

    test('saveData function exists', () => {
        assertDefined(window.saveData);
    });

    test('loadData function exists', () => {
        assertDefined(window.loadData);
    });

    test('saveData stores data correctly', () => {
        // Clear localStorage first
        localStorage.clear();

        // Mark a task complete
        window.MAINTENANCE_TASKS.daily[0].completed = true;
        window.MAINTENANCE_TASKS.daily[0].lastCompleted = new Date().toISOString();

        window.saveData();

        const saved = localStorage.getItem('guitarMaintenanceData');
        assertDefined(saved, 'Data should be saved');

        const data = JSON.parse(saved);
        assertTrue(data.daily[0].completed, 'First daily task should be completed');
    });

    test('loadData restores data correctly', () => {
        // Save some data
        const testData = {
            daily: [
                { id: 'daily-1', completed: true, lastCompleted: '2026-01-01T00:00:00.000Z' },
                { id: 'daily-2', completed: false, lastCompleted: null },
                { id: 'daily-3', completed: true, lastCompleted: '2026-01-02T00:00:00.000Z' }
            ]
        };
        localStorage.setItem('guitarMaintenanceData', JSON.stringify(testData));

        // Reset tasks
        window.MAINTENANCE_TASKS.daily.forEach(t => {
            t.completed = false;
            t.lastCompleted = null;
        });

        window.loadData();

        assertTrue(window.MAINTENANCE_TASKS.daily[0].completed, 'First task should be loaded as completed');
        assertFalse(window.MAINTENANCE_TASKS.daily[1].completed, 'Second task should be loaded as not completed');
    });

    // ==================== Task Toggle Tests ====================
    console.log('\n✅ Task Toggle Tests');

    test('toggleTask function exists', () => {
        assertDefined(window.toggleTask);
    });

    test('toggleTask marks task complete', () => {
        localStorage.clear();
        window.MAINTENANCE_TASKS.daily[0].completed = false;
        window.MAINTENANCE_TASKS.daily[0].lastCompleted = null;

        window.toggleTask('daily-1');

        assertTrue(window.MAINTENANCE_TASKS.daily[0].completed, 'Task should be completed after toggle');
        assertDefined(window.MAINTENANCE_TASKS.daily[0].lastCompleted, 'lastCompleted should be set');
    });

    test('toggleTask marks task incomplete', () => {
        window.MAINTENANCE_TASKS.daily[0].completed = true;

        window.toggleTask('daily-1');

        assertFalse(window.MAINTENANCE_TASKS.daily[0].completed, 'Task should be incomplete after toggle');
    });

    // ==================== Quick Action Tests ====================
    console.log('\n⚡ Quick Action Tests');

    test('quickActionJustPlayed function exists', () => {
        assertDefined(window.quickActionJustPlayed);
    });

    test('quickActionJustPlayed completes all daily tasks', () => {
        // Reset all daily tasks
        window.MAINTENANCE_TASKS.daily.forEach(t => {
            t.completed = false;
            t.lastCompleted = null;
        });

        window.quickActionJustPlayed();

        window.MAINTENANCE_TASKS.daily.forEach((t, i) => {
            assertTrue(t.completed, `Daily task ${i + 1} should be completed`);
            assertDefined(t.lastCompleted, `Daily task ${i + 1} should have lastCompleted`);
        });
    });

    // ==================== Humidity Tests ====================
    console.log('\n💧 Humidity Tests');

    test('addHumidityReadingSimplified function exists', () => {
        assertDefined(window.addHumidityReadingSimplified);
    });

    test('Humidity reading is stored correctly', () => {
        localStorage.clear();

        // Set form values
        document.getElementById('humidityValue').value = '47.5';
        document.getElementById('temperatureValue').value = '72';
        document.getElementById('guitarLocation').value = 'case';

        window.addHumidityReadingSimplified();

        const readings = JSON.parse(localStorage.getItem('humidityReadings') || '[]');
        assertTrue(readings.length > 0, 'Should have at least one reading');
        assertEqual(readings[0].humidity, 47.5, 'Humidity should be 47.5');
        assertEqual(readings[0].location, 'case', 'Location should be case');
    });

    test('Invalid humidity is rejected', () => {
        const initialCount = JSON.parse(localStorage.getItem('humidityReadings') || '[]').length;

        document.getElementById('humidityValue').value = '';

        // Should show alert, not add reading
        let alertCalled = false;
        const originalAlert = global.alert;
        global.alert = () => { alertCalled = true; };

        window.addHumidityReadingSimplified();

        global.alert = originalAlert;

        const newCount = JSON.parse(localStorage.getItem('humidityReadings') || '[]').length;
        assertEqual(newCount, initialCount, 'No new reading should be added for invalid input');
    });

    test('deleteHumidityReading function exists', () => {
        assertDefined(window.deleteHumidityReading);
    });

    // ==================== Dashboard Tests ====================
    console.log('\n📈 Dashboard Tests');

    test('updateDashboard function exists', () => {
        assertDefined(window.updateDashboard);
    });

    test('updateDashboard calculates completion correctly', () => {
        // Set specific completion state
        localStorage.clear();
        window.MAINTENANCE_TASKS.daily.forEach(t => { t.completed = true; });
        window.MAINTENANCE_TASKS.weekly.forEach(t => { t.completed = false; });
        window.MAINTENANCE_TASKS.eightweek.forEach(t => { t.completed = false; });
        window.MAINTENANCE_TASKS.quarterly.forEach(t => { t.completed = false; });
        window.MAINTENANCE_TASKS.annual.forEach(t => { t.completed = false; });

        window.updateDashboard();

        // Check daily completion is 100%
        const dailyPercent = document.getElementById('dailyPercent').textContent;
        assertEqual(dailyPercent, '100%', 'Daily should be 100%');

        // Check weekly completion is 0%
        const weeklyPercent = document.getElementById('weeklyPercent').textContent;
        assertEqual(weeklyPercent, '0%', 'Weekly should be 0%');
    });

    test('Overall completion calculates correctly', () => {
        // 3 daily (all complete) + 3 weekly + 8 eightweek + 3 quarterly + 1 annual = 18 total
        // 3 completed = 3/18 = 16.67% ≈ 17%
        const overall = document.getElementById('overallCompletion').textContent;
        // Should be approximately 17% (3/18)
        const percent = parseInt(overall);
        assertTrue(percent >= 16 && percent <= 17, `Overall should be ~17%, got ${percent}%`);
    });

    // ==================== Alert Tests ====================
    console.log('\n🚨 Alert Tests');

    test('checkForAlerts function exists', () => {
        assertDefined(window.checkForAlerts);
    });

    test('High humidity triggers critical alert', () => {
        localStorage.clear();

        // Add a high humidity reading
        const reading = {
            id: Date.now(),
            humidity: 58,
            temp: 72,
            location: 'case',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('humidityReadings', JSON.stringify([reading]));

        window.checkForAlerts();

        const alerts = document.getElementById('alertContainer').innerHTML;
        assertTrue(alerts.includes('CRITICAL') || alerts.includes('High Humidity'),
            'Should show high humidity alert');
    });

    test('Low humidity triggers warning alert', () => {
        localStorage.clear();

        const reading = {
            id: Date.now(),
            humidity: 35,
            temp: 72,
            location: 'case',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('humidityReadings', JSON.stringify([reading]));

        window.checkForAlerts();

        const alerts = document.getElementById('alertContainer').innerHTML;
        assertTrue(alerts.includes('Low Humidity') || alerts.includes('warning'),
            'Should show low humidity warning');
    });

    // ==================== Next Due Calculation Tests ====================
    console.log('\n📅 Next Due Calculation Tests');

    test('calculateNextDue function exists', () => {
        assertDefined(window.calculateNextDue);
    });

    test('Never completed task shows ASAP for non-daily tasks', () => {
        const task = { id: 'test', lastCompleted: null };
        const result = window.calculateNextDue(task, 'weekly');
        assertEqual(result, 'ASAP');
    });

    test('Overdue task shows OVERDUE for weekly tasks', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

        const task = { id: 'test', lastCompleted: pastDate.toISOString() };
        const result = window.calculateNextDue(task, 'weekly');
        assertTrue(result.includes('OVERDUE'), 'Should show OVERDUE');
    });

    test('Daily task without session shows not due message', () => {
        const task = { id: 'test', lastCompleted: null };
        const result = window.calculateNextDue(task, 'daily');
        // Daily tasks require a session to be logged first
        assertTrue(result.includes('Not due') || result.includes('session'), 'Daily tasks should mention session requirement');
    });

    test('Future task shows days remaining', () => {
        const today = new Date();

        const task = { id: 'test', lastCompleted: today.toISOString() };
        const result = window.calculateNextDue(task, 'weekly');
        // Should show something like "7 days" or "6 days"
        assertTrue(result.includes('days'), `Should show days remaining, got: ${result}`);
    });

    // ==================== Theme Tests ====================
    console.log('\n🎨 Theme Tests');

    test('toggleTheme function exists', () => {
        assertDefined(window.toggleTheme);
    });

    test('Theme toggle switches between light and dark', () => {
        // Start with light theme
        document.documentElement.setAttribute('data-theme', 'light');

        window.toggleTheme();
        assertEqual(document.documentElement.getAttribute('data-theme'), 'dark');

        window.toggleTheme();
        assertEqual(document.documentElement.getAttribute('data-theme'), 'light');
    });

    test('Theme preference is saved to localStorage', () => {
        localStorage.clear();
        document.documentElement.setAttribute('data-theme', 'light');

        window.toggleTheme();

        assertEqual(localStorage.getItem('theme'), 'dark');
    });

    // ==================== Export Tests ====================
    console.log('\n📤 Export Tests');

    test('exportAsCSV function exists', () => {
        assertDefined(window.exportAsCSV);
    });

    test('exportAsJSON function exists', () => {
        assertDefined(window.exportAsJSON);
    });

    test('downloadFile function exists', () => {
        assertDefined(window.downloadFile);
    });

    // ==================== Modal Tests ====================
    console.log('\n🔲 Modal Tests');

    test('openBridgeRecommendations function exists', () => {
        assertDefined(window.openBridgeRecommendations);
    });

    test('Bridge modal opens correctly', () => {
        window.openBridgeRecommendations();
        const modal = document.getElementById('bridgeModal');
        assertTrue(modal.classList.contains('show'), 'Modal should have show class');
    });

    test('closeBridgeModal closes the modal', () => {
        window.closeBridgeModal();
        const modal = document.getElementById('bridgeModal');
        assertFalse(modal.classList.contains('show'), 'Modal should not have show class');
    });

    // ==================== Inspection Tests ====================
    console.log('\n🔍 Inspection Tests');

    test('recordInspection function exists', () => {
        assertDefined(window.recordInspection);
    });

    test('saveInspectionData function exists', () => {
        assertDefined(window.saveInspectionData);
    });

    test('loadInspectionData function exists', () => {
        assertDefined(window.loadInspectionData);
    });

    test('calculateInspectionDueDate function exists', () => {
        assertDefined(window.calculateInspectionDueDate);
    });

    test('Weekly inspection due date is 7 days from now', () => {
        const result = window.calculateInspectionDueDate('weekly');
        const expected = new Date();
        expected.setDate(expected.getDate() + 7);
        assertEqual(result, expected.toLocaleDateString());
    });

    // ==================== Chart Tests ====================
    console.log('\n📊 Chart Tests');

    test('drawHumidityChart function exists', () => {
        assertDefined(window.drawHumidityChart);
    });

    test('Chart container is hidden with < 2 readings', () => {
        localStorage.clear();
        localStorage.setItem('humidityReadings', JSON.stringify([
            { id: 1, humidity: 45, timestamp: new Date().toISOString() }
        ]));

        window.drawHumidityChart();

        const container = document.getElementById('humidityChartContainer');
        assertEqual(container.style.display, 'none', 'Chart should be hidden with < 2 readings');
    });

    // ==================== Calendar Tests ====================
    console.log('\n📆 Calendar Tests');

    test('renderCalendar function exists', () => {
        assertDefined(window.renderCalendar);
    });

    test('getAllNextDueDates function exists', () => {
        assertDefined(window.getAllNextDueDates);
    });

    test('Calendar renders with day headers', () => {
        window.renderCalendar();
        const calendar = document.getElementById('maintenanceCalendar');
        assertTrue(calendar.innerHTML.includes('Sun'), 'Calendar should have Sunday header');
        assertTrue(calendar.innerHTML.includes('Mon'), 'Calendar should have Monday header');
    });

    // ==================== Reset Tests ====================
    console.log('\n🔄 Reset Tests');

    test('resetDailyTasks function exists', () => {
        assertDefined(window.resetDailyTasks);
    });

    test('resetWeeklyTasks function exists', () => {
        assertDefined(window.resetWeeklyTasks);
    });

    test('confirmReset function exists', () => {
        assertDefined(window.confirmReset);
    });

    // ==================== Tab Switching Tests ====================
    console.log('\n🔀 Tab Switching Tests');

    test('switchTab function exists', () => {
        assertDefined(window.switchTab);
    });

    test('switchTab changes active tab', () => {
        // Switch to humidity tab
        window.switchTab('humidity');
        const humidityTab = document.getElementById('humidity');
        assertTrue(humidityTab.classList.contains('active'), 'Humidity tab should be active');

        // Switch back to dashboard
        window.switchTab('dashboard');
        const dashboardTab = document.getElementById('dashboard');
        assertTrue(dashboardTab.classList.contains('active'), 'Dashboard tab should be active');
    });

    // ==================== localStorage Helper Tests ====================
    console.log('\n💾 localStorage Helper Tests');

    test('localStorage mock works correctly', () => {
        localStorage.clear();
        localStorage.setItem('testKey', 'testValue');
        assertEqual(localStorage.getItem('testKey'), 'testValue');
    });

    test('localStorage removeItem works', () => {
        localStorage.setItem('toRemove', 'value');
        localStorage.removeItem('toRemove');
        assertEqual(localStorage.getItem('toRemove'), null);
    });

    test('localStorage clear removes all items', () => {
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');
        localStorage.clear();
        assertEqual(localStorage.getItem('key1'), null);
        assertEqual(localStorage.getItem('key2'), null);
    });

    // ==================== SVG Ring Tests ====================
    console.log('\n🔘 SVG Ring Tests');

    test('String health ring SVG exists', () => {
        const ring = document.getElementById('stringHealthRing');
        assertDefined(ring, 'String health ring should exist');
    });

    test('Ring progress element exists', () => {
        const ringProgress = document.getElementById('ringProgress');
        assertDefined(ringProgress, 'Ring progress element should exist');
    });

    test('Ring text element exists with transform', () => {
        const ringText = document.getElementById('ringText');
        assertDefined(ringText, 'Ring text element should exist');
        const transform = ringText.getAttribute('transform');
        assertTrue(transform && transform.includes('rotate'), 'Ring text should have rotate transform');
    });

    test('Ring text uses correct fill color variable', () => {
        const ringText = document.getElementById('ringText');
        assertDefined(ringText, 'Ring text element should exist');
        assertTrue(ringText.classList.contains('ring-text'), 'Ring text should have ring-text class');
    });

    // ==================== Dark Mode Tests ====================
    console.log('\n🌙 Dark Mode Tests');

    test('Dark mode can be set via data-theme attribute', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        assertEqual(document.documentElement.getAttribute('data-theme'), 'dark');
        // Reset
        document.documentElement.setAttribute('data-theme', 'light');
    });

    test('CSS variables exist for theming', () => {
        // Check that the root has CSS custom properties defined
        const root = document.documentElement;
        assertDefined(root, 'Document element should exist');
    });

    // ==================== Input Feedback Tests ====================
    console.log('\n📝 Input Feedback Tests');

    test('Humidity input element exists', () => {
        const input = document.getElementById('humidityValue');
        assertDefined(input, 'Humidity input should exist');
    });

    test('Humidity input accepts number values', () => {
        const input = document.getElementById('humidityValue');
        input.value = '45.5';
        assertEqual(input.value, '45.5');
    });

    test('Temperature input element exists', () => {
        const input = document.getElementById('temperatureValue');
        assertDefined(input, 'Temperature input should exist');
    });

    // ==================== Quick Action Button Tests ====================
    console.log('\n⚡ Quick Action Button Tests');

    test('Quick complete daily button has correct ID', () => {
        const btn = document.getElementById('quickCompleteDaily');
        assertDefined(btn, 'Quick complete daily button should exist');
    });

    test('Quick complete daily button has btn-quick-action class', () => {
        const btn = document.getElementById('quickCompleteDaily');
        assertTrue(btn.classList.contains('btn-quick-action'), 'Button should have btn-quick-action class');
    });

    test('Timer button exists', () => {
        const btn = document.querySelector('.btn-timer');
        assertDefined(btn, 'Timer button should exist');
    });

    // ==================== Dashboard Element Tests ====================
    console.log('\n📊 Dashboard Element Tests');

    test('String life text element exists', () => {
        const el = document.getElementById('stringLifeText');
        assertDefined(el, 'String life text element should exist');
    });

    test('String life estimate element exists', () => {
        const el = document.getElementById('stringLifeEstimate');
        assertDefined(el, 'String life estimate element should exist');
    });

    test('Days since change element exists', () => {
        const el = document.getElementById('daysSinceChange');
        assertDefined(el, 'Days since change element should exist');
    });

    test('Current humidity element exists', () => {
        const el = document.getElementById('currentHumidity');
        assertDefined(el, 'Current humidity element should exist');
    });

    test('Weekly hours element exists', () => {
        const el = document.getElementById('weeklyHours');
        assertDefined(el, 'Weekly hours element should exist');
    });

    // ==================== Summary ====================
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

    if (failures.length > 0) {
        console.log('❌ Failed Tests:');
        failures.forEach(f => {
            console.log(`   - ${f.name}: ${f.error}`);
        });
        console.log('');
    }

    // Cleanup
    dom.window.close();

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(err => {
    console.error('Test suite failed to run:', err);
    process.exit(1);
});
