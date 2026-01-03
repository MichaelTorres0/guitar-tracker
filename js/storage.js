// Storage and data migration functions
import { DATA_VERSION, STORAGE_KEYS, DEFAULT_GUITAR, MAINTENANCE_TASKS } from './config.js';

// MIGRATION FUNCTIONS
export function migrateData() {
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

export function migrateLegacyData(maintenanceJson, humidityJson, inspectionJson) {
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

export function createDefaultData() {
    return {
        version: DATA_VERSION,
        guitars: [DEFAULT_GUITAR],
        activeGuitarId: 'default',
        maintenanceStates: {},
        humidityReadings: [],
        inspectionData: {}
    };
}

export function saveVersionedData(data) {
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

// Legacy compatibility functions
export function loadData() {
    const DATA_KEY = STORAGE_KEYS.legacy.maintenance;
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        for (let category in data) {
            if (MAINTENANCE_TASKS[category]) {
                data[category].forEach(task => {
                    const original = MAINTENANCE_TASKS[category].find(t => t.id === task.id);
                    if (original) {
                        original.completed = task.completed || false;
                        original.lastCompleted = task.lastCompleted || null;
                    }
                });
            }
        }
    }
}

export function saveData() {
    const DATA_KEY = STORAGE_KEYS.legacy.maintenance;
    const data = {};
    for (let category in MAINTENANCE_TASKS) {
        data[category] = MAINTENANCE_TASKS[category].map(task => ({
            id: task.id,
            completed: task.completed || false,
            lastCompleted: task.lastCompleted || null
        }));
    }
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadInspectionData() {
    let inspectionData = {};
    const saved = localStorage.getItem('inspectionData');
    if (saved) {
        inspectionData = JSON.parse(saved);
    }
    return inspectionData;
}
