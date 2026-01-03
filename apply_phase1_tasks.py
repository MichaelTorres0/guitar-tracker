#!/usr/bin/env python3
"""
Apply Phase 1 Tasks 1.2 and 1.4 to the guitar tracker
Task 1.1 is already applied in index_temp.html
"""
import re

def apply_task_1_2_and_1_4(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # ============================================
    # TASK 1.4: Add validation CSS (if not present)
    # ============================================

    validation_css = """
        .form-feedback {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .form-feedback.error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--color-error);
            border-left: 3px solid var(--color-error);
        }

        .form-feedback.warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--color-warning);
            border-left: 3px solid var(--color-warning);
        }

        .form-feedback.success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--color-success);
            border-left: 3px solid var(--color-success);
        }
"""

    # Add validation CSS before button-group if not present
    if '.form-feedback' not in content:
        content = content.replace(
            '        .button-group {',
            validation_css + '\n        .button-group {'
        )

    # ============================================
    # TASK 1.4: Add validation feedback element to HTML
    # ============================================

    # Find the humidity form section and add feedback element after the button
    humidity_form_pattern = r'(<button class="btn-primary" onclick="addHumidityReading\(\)" style="width: 100%;">Log Reading</button>)'
    humidity_form_replacement = r'\1\n                    <div id="humidityFeedback" class="form-feedback" style="display: none;"></div>\n                    <div id="logConfirmation" class="form-feedback success" style="display: none;"></div>'

    if 'id="humidityFeedback"' not in content:
        content = re.sub(humidity_form_pattern, humidity_form_replacement, content)

    # ============================================
    # TASK 1.2: Add data versioning system
    # ============================================

    # Add DATA_VERSION constant and update storage keys
    data_version_code = """        // DATA VERSIONING & STORAGE
        const DATA_VERSION = 2;
        const STORAGE_KEYS = {
            mainData: 'guitarTrackerData',
            legacy: {
                maintenance: 'guitarMaintenanceData',
                humidity: 'humidityReadings',
                inspection: 'inspectionData'
            }
        };
        const DATA_KEY = STORAGE_KEYS.legacy.maintenance; // Keep for compatibility
        const HUMIDITY_KEY = STORAGE_KEYS.legacy.humidity; // Keep for compatibility
"""

    # Replace existing DATA_KEY and HUMIDITY_KEY declarations
    content = re.sub(
        r'        const DATA_KEY = .*?\n        const HUMIDITY_KEY = .*?\n',
        data_version_code + '\n',
        content
    )

    # ============================================
    # Add migration functions before MAINTENANCE_TASKS
    # ============================================

    migration_functions = """
        // DEFAULT DATA STRUCTURE
        const DEFAULT_GUITAR = {
            id: 'default',
            name: 'Taylor GS Mini Sapele',
            make: 'Taylor',
            model: 'GS Mini',
            variant: 'Sapele',
            settings: {
                targetHumidity: { min: 45, max: 50 },
                safeHumidity: { min: 40, max: 55 },
                dangerHumidity: { low: 35, high: 60 },
                stringChangeWeeks: 8,
                playingHoursPerWeek: 2.5
            }
        };

        // MIGRATION FUNCTIONS
        function migrateData() {
            try {
                // Check for new format data first
                const newData = localStorage.getItem(STORAGE_KEYS.mainData);
                if (newData) {
                    const parsed = JSON.parse(newData);
                    if (parsed.version === DATA_VERSION) {
                        return parsed; // Already migrated
                    }
                }

                // Check for legacy data
                const legacyMaintenance = localStorage.getItem(STORAGE_KEYS.legacy.maintenance);
                const legacyHumidity = localStorage.getItem(STORAGE_KEYS.legacy.humidity);
                const legacyInspection = localStorage.getItem(STORAGE_KEYS.legacy.inspection);

                if (legacyMaintenance || legacyHumidity || legacyInspection) {
                    console.log('Migrating legacy data to version', DATA_VERSION);
                    return migrateLegacyData(legacyMaintenance, legacyHumidity, legacyInspection);
                }

                // No data exists, return default
                return createDefaultData();
            } catch (e) {
                console.error('Migration error:', e);
                return createDefaultData();
            }
        }

        function migrateLegacyData(maintenanceJson, humidityJson, inspectionJson) {
            const data = createDefaultData();

            // Migrate maintenance task states
            if (maintenanceJson) {
                try {
                    const legacy = JSON.parse(maintenanceJson);
                    data.maintenanceStates = {};

                    for (let category in legacy) {
                        // Map old 'sixweek' to new 'eightweek'
                        const newCategory = category === 'sixweek' ? 'eightweek' : category;
                        data.maintenanceStates[newCategory] = legacy[category].map(task => ({
                            id: task.id.replace('6w-', '8w-'), // Update task IDs
                            completed: task.completed || false,
                            lastCompleted: task.lastCompleted || null
                        }));
                    }
                } catch (e) {
                    console.error('Error migrating maintenance data:', e);
                }
            }

            // Migrate humidity readings
            if (humidityJson) {
                try {
                    const legacy = JSON.parse(humidityJson);
                    data.humidityReadings = legacy.map(r => ({
                        ...r,
                        guitarId: 'default'
                    }));
                } catch (e) {
                    console.error('Error migrating humidity data:', e);
                }
            }

            // Migrate inspection data
            if (inspectionJson) {
                try {
                    data.inspectionData = JSON.parse(inspectionJson);
                } catch (e) {
                    console.error('Error migrating inspection data:', e);
                }
            }

            // Save migrated data
            saveVersionedData(data);

            // Clean up legacy keys (commented out for safety - can be enabled after verification)
            // localStorage.removeItem(STORAGE_KEYS.legacy.maintenance);
            // localStorage.removeItem(STORAGE_KEYS.legacy.humidity);
            // localStorage.removeItem(STORAGE_KEYS.legacy.inspection);

            return data;
        }

        function createDefaultData() {
            return {
                version: DATA_VERSION,
                guitars: [DEFAULT_GUITAR],
                activeGuitarId: 'default',
                maintenanceStates: {},
                humidityReadings: [],
                inspectionData: {}
            };
        }

        function saveVersionedData(data) {
            try {
                data.version = DATA_VERSION;
                localStorage.setItem(STORAGE_KEYS.mainData, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Error saving versioned data:', e);
                alert('Warning: Unable to save data. Storage may be full.');
                return false;
            }
        }

"""

    # Insert migration functions before MAINTENANCE_TASKS
    content = content.replace(
        '        const MAINTENANCE_TASKS = {',
        migration_functions + '        const MAINTENANCE_TASKS = {'
    )

    # ============================================
    # Update init() to call migration
    # ============================================

    # Find and update the init function
    old_init = """        function init() {
            loadData();
            renderMaintenanceTasks();
            renderInventoryChecklist();
            updateDashboard();
            setDefaultDate();
        }"""

    new_init = """        function init() {
            // Migrate data if needed
            const migratedData = migrateData();

            // Load migrated data into tasks
            loadData();

            renderMaintenanceTasks();
            renderInventoryChecklist();
            updateDashboard();
            setDefaultDate();
        }"""

    content = content.replace(old_init, new_init)

    # ============================================
    # TASK 1.4: Add validation functions
    # ============================================

    validation_functions = """
        // VALIDATION FUNCTIONS
        function validateHumidity(value) {
            if (value === '' || value === null || value === undefined) {
                return { valid: false, error: 'Humidity is required' };
            }
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, error: 'Must be a number' };
            }
            if (num < 0 || num > 100) {
                return { valid: false, error: 'Must be between 0-100%' };
            }
            if (num > 85) {
                return { valid: true, value: num, warning: 'Unusually high reading - please verify' };
            }
            if (num < 20) {
                return { valid: true, value: num, warning: 'Unusually low reading - please verify' };
            }
            return { valid: true, value: num };
        }

        function validateTemperature(value) {
            if (value === '' || value === null || value === undefined) {
                return { valid: true, value: null }; // Optional field
            }
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, error: 'Must be a number' };
            }
            if (num < 32 || num > 120) {
                return { valid: false, error: 'Temperature outside reasonable range (32-120°F)' };
            }
            return { valid: true, value: num };
        }

        function showFeedback(elementId, message, type) {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = message;
                el.className = 'form-feedback ' + type;
                el.style.display = 'block';
                if (type === 'success') {
                    setTimeout(() => { el.style.display = 'none'; }, 3000);
                }
            }
        }

        function hideFeedback(elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.style.display = 'none';
            }
        }

"""

    # Insert validation functions before renderMaintenanceTasks
    content = content.replace(
        '        function renderMaintenanceTasks() {',
        validation_functions + '        function renderMaintenanceTasks() {'
    )

    # ============================================
    # Update addHumidityReading to use validation
    # ============================================

    old_add_humidity = """        function addHumidityReading() {
            const date = document.getElementById('humidityDate').value;
            const time = document.getElementById('humidityTime').value;
            const humidity = parseFloat(document.getElementById('humidityValue').value);
            const temp = parseFloat(document.getElementById('temperatureValue').value);
            const location = document.getElementById('guitarLocation').value;

            if (!date || !time || isNaN(humidity) || isNaN(temp)) {
                alert('Please fill in all fields');
                return;
            }"""

    new_add_humidity = """        function addHumidityReading() {
            const date = document.getElementById('humidityDate').value;
            const time = document.getElementById('humidityTime').value;
            const humidityInput = document.getElementById('humidityValue').value;
            const tempInput = document.getElementById('temperatureValue').value;
            const location = document.getElementById('guitarLocation').value;

            // Validate humidity
            const humidityResult = validateHumidity(humidityInput);
            if (!humidityResult.valid) {
                showFeedback('humidityFeedback', humidityResult.error, 'error');
                return;
            }

            // Validate temperature
            const tempResult = validateTemperature(tempInput);
            if (!tempResult.valid) {
                showFeedback('humidityFeedback', tempResult.error, 'error');
                return;
            }

            // Show warning if present but continue
            if (humidityResult.warning) {
                showFeedback('humidityFeedback', humidityResult.warning, 'warning');
            } else {
                hideFeedback('humidityFeedback');
            }

            if (!date || !time) {
                showFeedback('humidityFeedback', 'Please enter date and time', 'error');
                return;
            }

            const humidity = humidityResult.value;
            const temp = tempResult.value;"""

    content = content.replace(old_add_humidity, new_add_humidity)

    # Update the success message in addHumidityReading
    content = content.replace(
        "            document.getElementById('humidityValue').value = '';\n            document.getElementById('temperatureValue').value = '';\n            updateDashboard();",
        "            document.getElementById('humidityValue').value = '';\n            document.getElementById('temperatureValue').value = '';\n            showFeedback('logConfirmation', '✅ Reading logged successfully', 'success');\n            updateDashboard();"
    )

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Task 1.2: Data versioning system added")
    print(f"✅ Task 1.4: Input validation UI completed")
    print(f"✅ Output written to {output_path}")

if __name__ == '__main__':
    apply_task_1_2_and_1_4('/home/user/guitar-tracker/index_temp.html', '/home/user/guitar-tracker/index.html')
