/**
 * Guitar Tracker Test Suite
 * Tests core functionality of the Taylor GS Mini Maintenance Tracker PWA
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

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

// Load and setup the DOM environment
function setupDOM() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        url: 'https://michaeltorres0.github.io/guitar-tracker/'
    });

    // Wait for scripts to execute
    return new Promise((resolve) => {
        // Give the scripts time to run
        setTimeout(() => {
            resolve(dom);
        }, 500);
    });
}

// ==================== TEST SUITES ====================

async function runTests() {
    console.log('\n🎸 Guitar Tracker Test Suite\n');
    console.log('='.repeat(50));

    const dom = await setupDOM();
    const { window } = dom;
    const { document } = window;

    // Make functions available globally for testing
    const localStorage = window.localStorage;

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

    test('Just Played button exists', () => {
        const btn = document.querySelector('.btn-just-played');
        assertDefined(btn, 'Just Played button not found');
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
        assertDefined(tasks.sixweek, '6-week tasks missing');
        assertDefined(tasks.quarterly, 'quarterly tasks missing');
        assertDefined(tasks.annual, 'annual tasks missing');
    });

    test('Daily tasks has 3 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.daily, 3);
    });

    test('Weekly tasks has 3 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.weekly, 3);
    });

    test('6-week tasks has 8 items', () => {
        assertArrayLength(window.MAINTENANCE_TASKS.sixweek, 8);
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
        const originalAlert = window.alert;
        window.alert = () => { alertCalled = true; };

        window.addHumidityReadingSimplified();

        window.alert = originalAlert;

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
        window.MAINTENANCE_TASKS.sixweek.forEach(t => { t.completed = false; });
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
        // 3 daily (all complete) + 3 weekly + 8 sixweek + 3 quarterly + 1 annual = 18 total
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

    test('Never completed task shows ASAP', () => {
        const task = { id: 'test', lastCompleted: null };
        const result = window.calculateNextDue(task, 'daily');
        assertEqual(result, 'ASAP');
    });

    test('Overdue task shows OVERDUE', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

        const task = { id: 'test', lastCompleted: pastDate.toISOString() };
        const result = window.calculateNextDue(task, 'daily');
        assertTrue(result.includes('OVERDUE'), 'Should show OVERDUE');
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
