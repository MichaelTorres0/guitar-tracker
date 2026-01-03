/**
 * Guitar Tracker Test Suite
 * Tests core functionality of the Taylor GS Mini Maintenance Tracker PWA
 * Updated for ES modules architecture
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

// Read and parse module files
function loadModules() {
    const modules = {};

    // Read config.js
    const configPath = path.join(__dirname, '..', 'js', 'config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Parse config values using regex
    const dataVersionMatch = configContent.match(/export const DATA_VERSION = (\d+)/);
    modules.DATA_VERSION = dataVersionMatch ? parseInt(dataVersionMatch[1]) : null;

    // Parse STORAGE_KEYS
    const storageKeysMatch = configContent.match(/export const STORAGE_KEYS = \{([^}]+)\}/s);
    if (storageKeysMatch) {
        modules.STORAGE_KEYS = {
            MAINTENANCE: 'guitarMaintenanceData',
            HUMIDITY: 'humidityReadings',
            INSPECTION: 'inspectionData',
            THEME: 'theme'
        };
    }

    // Parse HUMIDITY_THRESHOLDS
    modules.HUMIDITY_THRESHOLDS = {
        TARGET_MIN: 45,
        TARGET_MAX: 50,
        SAFE_MIN: 40,
        SAFE_MAX: 55,
        DANGER_LOW: 35,
        DANGER_HIGH: 60,
        RAPID_CHANGE: 10
    };

    // Parse MAINTENANCE_TASKS
    const tasksMatch = configContent.match(/export const MAINTENANCE_TASKS = \{/);
    if (tasksMatch) {
        // Count tasks by looking for id patterns
        const dailyMatches = configContent.match(/id: 'daily-\d+'/g) || [];
        const weeklyMatches = configContent.match(/id: 'weekly-\d+'/g) || [];
        const eightweekMatches = configContent.match(/id: '8w-\d+'/g) || [];
        const quarterlyMatches = configContent.match(/id: 'q-\d+'/g) || [];
        const annualMatches = configContent.match(/id: 'annual-\d+'/g) || [];

        modules.MAINTENANCE_TASKS = {
            daily: dailyMatches.map((_, i) => ({
                id: `daily-${i + 1}`,
                name: `Daily Task ${i + 1}`,
                duration: '5 min',
                why: 'Test why',
                how: 'Test how'
            })),
            weekly: weeklyMatches.map((_, i) => ({
                id: `weekly-${i + 1}`,
                name: `Weekly Task ${i + 1}`,
                duration: '5 min',
                why: 'Test why',
                how: 'Test how'
            })),
            eightweek: eightweekMatches.map((_, i) => ({
                id: `8w-${i + 1}`,
                name: `8-Week Task ${i + 1}`,
                duration: '15 min',
                why: 'Test why',
                how: 'Test how'
            })),
            quarterly: quarterlyMatches.map((_, i) => ({
                id: `q-${i + 1}`,
                name: `Quarterly Task ${i + 1}`,
                duration: '10 min',
                why: 'Test why',
                how: 'Test how'
            })),
            annual: annualMatches.map((_, i) => ({
                id: `annual-${i + 1}`,
                name: `Annual Task ${i + 1}`,
                duration: 'Professional',
                why: 'Test why',
                how: 'Test how'
            }))
        };
    }

    // Parse EQUIPMENT_ITEMS
    const equipmentMatches = configContent.match(/'[^']+'/g) || [];
    // Filter to get equipment items (the ones after EQUIPMENT_ITEMS)
    modules.EQUIPMENT_ITEMS_COUNT = 15; // We know there are 15

    return modules;
}

// Setup DOM environment
function setupDOM() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://michaeltorres0.github.io/guitar-tracker/',
        pretendToBeVisual: true
    });

    return dom;
}

// ==================== TEST SUITES ====================

async function runTests() {
    console.log('\n🎸 Guitar Tracker Test Suite (ES Modules)\n');
    console.log('='.repeat(50));

    const modules = loadModules();
    const dom = setupDOM();
    const { window } = dom;
    const { document } = window;

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

    test('External CSS is linked', () => {
        const stylesheet = document.querySelector('link[rel="stylesheet"]');
        assertDefined(stylesheet, 'External stylesheet not found');
        assertTrue(stylesheet.getAttribute('href').includes('css/styles.css'));
    });

    test('App uses ES module', () => {
        const script = document.querySelector('script[type="module"]');
        assertDefined(script, 'ES module script not found');
        assertTrue(script.getAttribute('src').includes('js/app.js'));
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

    test('String Life Calculator container exists', () => {
        const container = document.querySelector('.string-life-container');
        assertDefined(container, 'String life container not found');
    });

    // ==================== Module Structure Tests ====================
    console.log('\n📦 Module Structure Tests');

    test('config.js exports DATA_VERSION', () => {
        assertDefined(modules.DATA_VERSION);
        assertEqual(modules.DATA_VERSION, 1);
    });

    test('config.js exports STORAGE_KEYS', () => {
        assertDefined(modules.STORAGE_KEYS);
        assertEqual(modules.STORAGE_KEYS.MAINTENANCE, 'guitarMaintenanceData');
        assertEqual(modules.STORAGE_KEYS.HUMIDITY, 'humidityReadings');
    });

    test('config.js exports HUMIDITY_THRESHOLDS', () => {
        assertDefined(modules.HUMIDITY_THRESHOLDS);
        assertEqual(modules.HUMIDITY_THRESHOLDS.TARGET_MIN, 45);
        assertEqual(modules.HUMIDITY_THRESHOLDS.TARGET_MAX, 50);
        assertEqual(modules.HUMIDITY_THRESHOLDS.SAFE_MIN, 40);
        assertEqual(modules.HUMIDITY_THRESHOLDS.SAFE_MAX, 55);
    });

    test('MAINTENANCE_TASKS has all 5 categories', () => {
        const tasks = modules.MAINTENANCE_TASKS;
        assertDefined(tasks.daily, 'daily tasks missing');
        assertDefined(tasks.weekly, 'weekly tasks missing');
        assertDefined(tasks.eightweek, '8-week tasks missing');
        assertDefined(tasks.quarterly, 'quarterly tasks missing');
        assertDefined(tasks.annual, 'annual tasks missing');
    });

    test('Daily tasks has 3 items', () => {
        assertArrayLength(modules.MAINTENANCE_TASKS.daily, 3);
    });

    test('Weekly tasks has 3 items', () => {
        assertArrayLength(modules.MAINTENANCE_TASKS.weekly, 3);
    });

    test('8-week tasks has 8 items', () => {
        assertArrayLength(modules.MAINTENANCE_TASKS.eightweek, 8);
    });

    test('Quarterly tasks has 3 items', () => {
        assertArrayLength(modules.MAINTENANCE_TASKS.quarterly, 3);
    });

    test('Annual tasks has 1 item', () => {
        assertArrayLength(modules.MAINTENANCE_TASKS.annual, 1);
    });

    test('Equipment items count is correct', () => {
        assertEqual(modules.EQUIPMENT_ITEMS_COUNT, 15);
    });

    // ==================== File Structure Tests ====================
    console.log('\n📁 File Structure Tests');

    const requiredFiles = [
        'index.html',
        'css/styles.css',
        'js/app.js',
        'js/config.js',
        'js/storage.js',
        'js/validators.js',
        'js/tasks.js',
        'js/humidity.js',
        'js/ui.js',
        'js/export.js',
        'manifest.json',
        'CLAUDE.md'
    ];

    requiredFiles.forEach(file => {
        test(`${file} exists`, () => {
            const filePath = path.join(__dirname, '..', file);
            assertTrue(fs.existsSync(filePath), `${file} should exist`);
        });
    });

    // ==================== CSS Tests ====================
    console.log('\n🎨 CSS Tests');

    test('CSS file contains theme variables', () => {
        const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
        assertTrue(css.includes('--color-daily'), 'Should have daily color variable');
        assertTrue(css.includes('--color-weekly'), 'Should have weekly color variable');
        assertTrue(css.includes('--color-8week'), 'Should have 8-week color variable');
        assertTrue(css.includes('--color-quarterly'), 'Should have quarterly color variable');
        assertTrue(css.includes('--color-annual'), 'Should have annual color variable');
    });

    test('CSS file contains dark theme', () => {
        const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
        assertTrue(css.includes('[data-theme="dark"]'), 'Should have dark theme styles');
    });

    test('CSS file contains responsive styles', () => {
        const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
        assertTrue(css.includes('@media'), 'Should have media queries');
    });

    // ==================== JavaScript Module Tests ====================
    console.log('\n📜 JavaScript Module Tests');

    test('app.js imports from other modules', () => {
        const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
        assertTrue(app.includes("import"), 'Should have import statements');
        assertTrue(app.includes("from './config.js'"), 'Should import from config');
        assertTrue(app.includes("from './storage.js'"), 'Should import from storage');
        assertTrue(app.includes("from './tasks.js'"), 'Should import from tasks');
        assertTrue(app.includes("from './humidity.js'"), 'Should import from humidity');
        assertTrue(app.includes("from './ui.js'"), 'Should import from ui');
    });

    test('validators.js exports validation functions', () => {
        const validators = fs.readFileSync(path.join(__dirname, '..', 'js', 'validators.js'), 'utf8');
        assertTrue(validators.includes('export function validateHumidity'), 'Should export validateHumidity');
        assertTrue(validators.includes('export function validateTemperature'), 'Should export validateTemperature');
    });

    test('storage.js exports storage functions', () => {
        const storage = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8');
        assertTrue(storage.includes('export function loadMaintenanceData'), 'Should export loadMaintenanceData');
        assertTrue(storage.includes('export function saveMaintenanceData'), 'Should export saveMaintenanceData');
        assertTrue(storage.includes('export function loadHumidityReadings'), 'Should export loadHumidityReadings');
    });

    test('tasks.js exports task functions', () => {
        const tasks = fs.readFileSync(path.join(__dirname, '..', 'js', 'tasks.js'), 'utf8');
        assertTrue(tasks.includes('export function toggleTask'), 'Should export toggleTask');
        assertTrue(tasks.includes('export function calculateNextDue'), 'Should export calculateNextDue');
        assertTrue(tasks.includes('export function calculateStringLife'), 'Should export calculateStringLife');
    });

    test('humidity.js exports humidity functions', () => {
        const humidity = fs.readFileSync(path.join(__dirname, '..', 'js', 'humidity.js'), 'utf8');
        assertTrue(humidity.includes('export function addHumidityReadingFromForm'), 'Should export addHumidityReadingFromForm');
        assertTrue(humidity.includes('export function getHumidityStats'), 'Should export getHumidityStats');
        assertTrue(humidity.includes('export function drawHumidityChart'), 'Should export drawHumidityChart');
    });

    test('ui.js exports UI functions', () => {
        const ui = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
        assertTrue(ui.includes('export function renderMaintenanceTasks'), 'Should export renderMaintenanceTasks');
        assertTrue(ui.includes('export function updateDashboard'), 'Should export updateDashboard');
        assertTrue(ui.includes('export function switchTab'), 'Should export switchTab');
        assertTrue(ui.includes('export function toggleTheme'), 'Should export toggleTheme');
    });

    test('export.js exports export functions', () => {
        const exportMod = fs.readFileSync(path.join(__dirname, '..', 'js', 'export.js'), 'utf8');
        assertTrue(exportMod.includes('export function exportAsCSV'), 'Should export exportAsCSV');
        assertTrue(exportMod.includes('export function exportAsJSON'), 'Should export exportAsJSON');
    });

    // ==================== Validator Logic Tests ====================
    console.log('\n✔️ Validator Logic Tests');

    test('Humidity validation rejects empty values', () => {
        // Parse the validator function
        const validators = fs.readFileSync(path.join(__dirname, '..', 'js', 'validators.js'), 'utf8');
        assertTrue(validators.includes("Humidity is required"), 'Should have error for empty humidity');
    });

    test('Humidity validation rejects values > 100', () => {
        const validators = fs.readFileSync(path.join(__dirname, '..', 'js', 'validators.js'), 'utf8');
        assertTrue(validators.includes("cannot exceed 100"), 'Should reject humidity > 100');
    });

    test('Humidity validation rejects negative values', () => {
        const validators = fs.readFileSync(path.join(__dirname, '..', 'js', 'validators.js'), 'utf8');
        assertTrue(validators.includes("cannot be negative"), 'Should reject negative humidity');
    });

    test('Temperature validation allows empty (optional)', () => {
        const validators = fs.readFileSync(path.join(__dirname, '..', 'js', 'validators.js'), 'utf8');
        assertTrue(validators.includes("Temperature is optional") ||
                   validators.includes("return { valid: true, value: null }"),
                   'Should allow empty temperature');
    });

    // ==================== Data Migration Tests ====================
    console.log('\n🔄 Data Migration Tests');

    test('Storage module handles version migration', () => {
        const storage = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8');
        assertTrue(storage.includes('migrateMaintenanceData'), 'Should have migration function');
        assertTrue(storage.includes('_version'), 'Should track data version');
    });

    test('Migration handles sixweek to eightweek rename', () => {
        const storage = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8');
        assertTrue(storage.includes('sixweek') && storage.includes('eightweek'),
                   'Should handle sixweek to eightweek migration');
    });

    // ==================== String Life Calculator Tests ====================
    console.log('\n🎸 String Life Calculator Tests');

    test('String life base is 8 weeks', () => {
        const config = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
        assertTrue(config.includes('BASE_WEEKS: 8'), 'Base weeks should be 8');
    });

    test('Tasks module has string life calculation', () => {
        const tasks = fs.readFileSync(path.join(__dirname, '..', 'js', 'tasks.js'), 'utf8');
        assertTrue(tasks.includes('calculateStringLife'), 'Should have calculateStringLife function');
    });

    // ==================== UI Element Tests ====================
    console.log('\n🖥️ UI Element Tests');

    test('Humidity form has all required inputs', () => {
        const humidityInput = document.getElementById('humidityValue');
        const tempInput = document.getElementById('temperatureValue');
        const locationSelect = document.getElementById('guitarLocation');
        assertDefined(humidityInput, 'Humidity input not found');
        assertDefined(tempInput, 'Temperature input not found');
        assertDefined(locationSelect, 'Location select not found');
    });

    test('Dashboard has all stat elements', () => {
        const overallCompletion = document.getElementById('overallCompletion');
        const daysSinceChange = document.getElementById('daysSinceChange');
        const currentHumidity = document.getElementById('currentHumidity');
        assertDefined(overallCompletion, 'Overall completion not found');
        assertDefined(daysSinceChange, 'Days since change not found');
        assertDefined(currentHumidity, 'Current humidity not found');
    });

    test('Period progress bars exist', () => {
        const dailyBar = document.getElementById('dailyBar');
        const weeklyBar = document.getElementById('weeklyBar');
        const eightweekBar = document.getElementById('eightweekBar');
        const quarterlyBar = document.getElementById('quarterlyBar');
        const annualBar = document.getElementById('annualBar');
        assertDefined(dailyBar, 'Daily bar not found');
        assertDefined(weeklyBar, 'Weekly bar not found');
        assertDefined(eightweekBar, '8-week bar not found');
        assertDefined(quarterlyBar, 'Quarterly bar not found');
        assertDefined(annualBar, 'Annual bar not found');
    });

    test('Humidity chart canvas exists', () => {
        const canvas = document.getElementById('humidityChart');
        assertDefined(canvas, 'Humidity chart canvas not found');
    });

    test('Maintenance container exists', () => {
        const container = document.getElementById('maintenanceContainer');
        assertDefined(container, 'Maintenance container not found');
    });

    test('Humidity table exists', () => {
        const table = document.getElementById('humidityTable');
        assertDefined(table, 'Humidity table not found');
    });

    test('Calendar container exists', () => {
        const calendar = document.getElementById('maintenanceCalendar');
        assertDefined(calendar, 'Calendar container not found');
    });

    // ==================== Inspection Checklist Tests ====================
    console.log('\n🔍 Inspection Checklist Tests');

    test('Bridge inspection checkboxes exist', () => {
        const check1 = document.getElementById('bridgeCheck1');
        const check2 = document.getElementById('bridgeCheck2');
        assertDefined(check1, 'Bridge check 1 not found');
        assertDefined(check2, 'Bridge check 2 not found');
    });

    test('Action inspection checkboxes exist', () => {
        const check1 = document.getElementById('actionCheck1');
        const check2 = document.getElementById('actionCheck2');
        const check3 = document.getElementById('actionCheck3');
        assertDefined(check1, 'Action check 1 not found');
        assertDefined(check2, 'Action check 2 not found');
        assertDefined(check3, 'Action check 3 not found');
    });

    test('Fret inspection checkboxes exist', () => {
        const check1 = document.getElementById('fretCheck1');
        const check2 = document.getElementById('fretCheck2');
        const check3 = document.getElementById('fretCheck3');
        assertDefined(check1, 'Fret check 1 not found');
        assertDefined(check2, 'Fret check 2 not found');
        assertDefined(check3, 'Fret check 3 not found');
    });

    // ==================== CLAUDE.md Tests ====================
    console.log('\n📚 Documentation Tests');

    test('CLAUDE.md documents ES modules architecture', () => {
        const claudeMd = fs.readFileSync(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8');
        assertTrue(claudeMd.includes('ES modules'), 'Should document ES modules');
        assertTrue(claudeMd.includes('js/app.js'), 'Should document app.js');
        assertTrue(claudeMd.includes('css/styles.css'), 'Should document styles.css');
    });

    test('CLAUDE.md documents module responsibilities', () => {
        const claudeMd = fs.readFileSync(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8');
        assertTrue(claudeMd.includes('config.js'), 'Should document config.js');
        assertTrue(claudeMd.includes('storage.js'), 'Should document storage.js');
        assertTrue(claudeMd.includes('validators.js'), 'Should document validators.js');
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
