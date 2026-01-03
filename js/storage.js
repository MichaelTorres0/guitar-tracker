/**
 * Guitar Tracker - Storage Module
 * Handles localStorage operations with error handling and data migration
 */

import { STORAGE_KEYS, DATA_VERSION, MAINTENANCE_TASKS } from './config.js';

// In-memory state
let maintenanceState = {};
let humidityReadings = [];
let inspectionData = {};

/**
 * Load maintenance data from localStorage
 * @returns {Object} The loaded maintenance data
 */
export function loadMaintenanceData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
        if (saved) {
            const data = JSON.parse(saved);

            // Check for version and migrate if needed
            const version = data._version || 0;
            if (version < DATA_VERSION) {
                return migrateMaintenanceData(data, version);
            }

            // Apply saved state to MAINTENANCE_TASKS
            for (let category in data) {
                if (category === '_version') continue;
                if (MAINTENANCE_TASKS[category]) {
                    data[category].forEach(savedTask => {
                        const task = MAINTENANCE_TASKS[category].find(t => t.id === savedTask.id);
                        if (task) {
                            task.completed = savedTask.completed || false;
                            task.lastCompleted = savedTask.lastCompleted || null;
                        }
                    });
                }
            }

            maintenanceState = data;
        }
    } catch (error) {
        console.error('Error loading maintenance data:', error);
    }

    return maintenanceState;
}

/**
 * Save maintenance data to localStorage
 */
export function saveMaintenanceData() {
    try {
        const data = { _version: DATA_VERSION };

        for (let category in MAINTENANCE_TASKS) {
            data[category] = MAINTENANCE_TASKS[category].map(task => ({
                id: task.id,
                completed: task.completed || false,
                lastCompleted: task.lastCompleted || null
            }));
        }

        localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(data));
        maintenanceState = data;
    } catch (error) {
        console.error('Error saving maintenance data:', error);
    }
}

/**
 * Migrate maintenance data from older versions
 * @param {Object} data - The old data
 * @param {number} fromVersion - The version to migrate from
 * @returns {Object} The migrated data
 */
function migrateMaintenanceData(data, fromVersion) {
    console.log(`Migrating maintenance data from version ${fromVersion} to ${DATA_VERSION}`);

    // Version 0 -> 1: Rename 'sixweek' to 'eightweek'
    if (fromVersion < 1 && data.sixweek) {
        data.eightweek = data.sixweek.map(task => {
            // Update task IDs from 6w-* to 8w-*
            const newTask = { ...task };
            if (newTask.id && newTask.id.startsWith('6w-')) {
                newTask.id = newTask.id.replace('6w-', '8w-');
            }
            return newTask;
        });
        delete data.sixweek;
    }

    data._version = DATA_VERSION;

    // Save migrated data
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(data));

    return data;
}

/**
 * Load humidity readings from localStorage
 * @returns {Array} The humidity readings
 */
export function loadHumidityReadings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.HUMIDITY);
        if (saved) {
            humidityReadings = JSON.parse(saved);
            // Sort by timestamp descending
            humidityReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    } catch (error) {
        console.error('Error loading humidity readings:', error);
        humidityReadings = [];
    }

    return humidityReadings;
}

/**
 * Save humidity readings to localStorage
 * @param {Array} readings - The readings to save
 */
export function saveHumidityReadings(readings) {
    try {
        // Sort by timestamp descending
        readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        localStorage.setItem(STORAGE_KEYS.HUMIDITY, JSON.stringify(readings));
        humidityReadings = readings;
    } catch (error) {
        console.error('Error saving humidity readings:', error);
    }
}

/**
 * Add a humidity reading
 * @param {Object} reading - The reading to add
 */
export function addHumidityReading(reading) {
    const readings = loadHumidityReadings();
    readings.unshift(reading);
    saveHumidityReadings(readings);
    return readings;
}

/**
 * Delete a humidity reading by ID
 * @param {number} id - The reading ID to delete
 */
export function deleteHumidityReading(id) {
    let readings = loadHumidityReadings();
    readings = readings.filter(r => r.id !== id);
    saveHumidityReadings(readings);
    return readings;
}

/**
 * Load inspection data from localStorage
 * @returns {Object} The inspection data
 */
export function loadInspectionData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.INSPECTION);
        if (saved) {
            inspectionData = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading inspection data:', error);
        inspectionData = {};
    }

    return inspectionData;
}

/**
 * Save inspection data to localStorage
 * @param {Object} data - The inspection data to save
 */
export function saveInspectionData(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.INSPECTION, JSON.stringify(data));
        inspectionData = data;
    } catch (error) {
        console.error('Error saving inspection data:', error);
    }
}

/**
 * Get the saved theme preference
 * @returns {string} The theme ('light' or 'dark')
 */
export function getTheme() {
    try {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    } catch (error) {
        return 'light';
    }
}

/**
 * Save theme preference
 * @param {string} theme - The theme to save ('light' or 'dark')
 */
export function saveTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
        console.error('Error saving theme:', error);
    }
}

/**
 * Clear all data (with confirmation already handled by caller)
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
        localStorage.removeItem(STORAGE_KEYS.HUMIDITY);
        localStorage.removeItem(STORAGE_KEYS.INSPECTION);
        maintenanceState = {};
        humidityReadings = [];
        inspectionData = {};
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

/**
 * Export all data as JSON
 * @returns {Object} All stored data
 */
export function exportAllData() {
    return {
        exportDate: new Date().toISOString(),
        version: DATA_VERSION,
        maintenance: maintenanceState,
        humidity: humidityReadings,
        inspections: inspectionData
    };
}

// Export Storage object for convenience
export const Storage = {
    loadMaintenanceData,
    saveMaintenanceData,
    loadHumidityReadings,
    saveHumidityReadings,
    addHumidityReading,
    deleteHumidityReading,
    loadInspectionData,
    saveInspectionData,
    getTheme,
    saveTheme,
    clearAllData,
    exportAllData
};
