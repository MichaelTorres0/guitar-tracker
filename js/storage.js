// Storage and data migration functions
import { DATA_VERSION, STORAGE_KEYS, DEFAULT_GUITAR, MAINTENANCE_TASKS } from './config.js';

// MIGRATION FUNCTIONS
export function migrateData() {
    try {
        // Check for new format data first
        const newData = localStorage.getItem(STORAGE_KEYS.mainData);
        if (newData) {
            const parsed = JSON.parse(newData);

            // Check if already at current version
            if (parsed.version === DATA_VERSION) {
                return parsed;
            }

            // Migrate from v3 to v4
            if (parsed.version === 3) {
                console.log('Migrating from v3 to v4 - adding practice stopwatch and inventory');
                return migrateV3ToV4(parsed);
            }

            // Migrate from v2 to v4 (through v3 first)
            if (parsed.version === 2) {
                console.log('Migrating from v2 to v4 - consolidating fragmented keys');
                const v3Data = migrateV2ToV3(parsed);
                return migrateV3ToV4(v3Data);
            }

            // Migrate from v1 to v4 (through v2 and v3 first)
            if (parsed.version === 1 || !parsed.version) {
                console.log('Migrating from v1 to v4');
                const v2Data = migrateV1ToV2(parsed);
                const v3Data = migrateV2ToV3(v2Data);
                return migrateV3ToV4(v3Data);
            }
        }

        // Check for legacy data (pre-versioning)
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

// Migrate from v3 to v4 - add new features
export function migrateV3ToV4(v3Data) {
    const data = {
        ...v3Data,
        version: 4
    };

    // Add v4 features if missing
    if (!data.timerState) {
        data.timerState = {
            running: false,
            startTimestamp: null
        };
    }

    if (!data.practiceHistory) {
        data.practiceHistory = [];
    }

    if (!data.inventory) {
        data.inventory = {
            items: []
        };
    }

    // Add notes field to existing string change history entries if missing
    if (data.stringChangeHistory && Array.isArray(data.stringChangeHistory)) {
        data.stringChangeHistory = data.stringChangeHistory.map(entry => ({
            ...entry,
            notes: entry.notes || ''
        }));
    }

    // Save migrated data
    saveVersionedData(data);

    console.log('✓ Migration to v4 complete - practice tracking and inventory added');

    return data;
}

// Migrate from v2 to v3 - consolidate separate localStorage keys into versioned structure
export function migrateV2ToV3(v2Data) {
    const data = {
        ...v2Data,
        version: 3
    };

    // Consolidate v2.0 features from separate keys if not already in structure
    if (!data.onboardingComplete) {
        const onboardingComplete = localStorage.getItem(STORAGE_KEYS.legacy.onboardingComplete);
        data.onboardingComplete = onboardingComplete === 'true';
    }

    if (!data.playingFrequency) {
        const playingFrequency = localStorage.getItem(STORAGE_KEYS.legacy.playingFrequency);
        data.playingFrequency = playingFrequency || 'weekly';
    }

    if (!data.playingHoursPerWeek) {
        const playingHoursPerWeek = localStorage.getItem(STORAGE_KEYS.legacy.playingHoursPerWeek);
        data.playingHoursPerWeek = playingHoursPerWeek ? parseFloat(playingHoursPerWeek) : 2.5;
    }

    if (!data.hasHygrometer) {
        const hasHygrometer = localStorage.getItem(STORAGE_KEYS.legacy.hasHygrometer);
        data.hasHygrometer = hasHygrometer === 'true' ? true : (hasHygrometer === 'false' ? false : null);
    }

    if (!data.playingSessions) {
        try {
            const playingSessions = localStorage.getItem(STORAGE_KEYS.legacy.playingSessions);
            data.playingSessions = playingSessions ? JSON.parse(playingSessions) : [];
        } catch (e) {
            console.error('Error migrating playing sessions:', e);
            data.playingSessions = [];
        }
    }

    if (!data.stringChangeHistory) {
        try {
            const stringChangeHistory = localStorage.getItem(STORAGE_KEYS.legacy.stringChangeHistory);
            data.stringChangeHistory = stringChangeHistory ? JSON.parse(stringChangeHistory) : [];
        } catch (e) {
            console.error('Error migrating string change history:', e);
            data.stringChangeHistory = [];
        }
    }

    // Add v3.1+ fields if missing (equipment list, string data)
    if (!data.equipmentList) {
        const defaultData = createDefaultData();
        data.equipmentList = defaultData.equipmentList;
    }
    if (!data.currentStringType) {
        data.currentStringType = 'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)';
    }
    if (!data.lastStringChangeDate) {
        data.lastStringChangeDate = null;
    }

    // Save migrated data
    saveVersionedData(data);

    console.log('✓ Migration to v3 complete - all data consolidated');

    return data;
}

// Migrate from v1 to v2 (for compatibility)
export function migrateV1ToV2(v1Data) {
    return {
        ...v1Data,
        version: 2
    };
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

    // Save as v2 first
    data.version = 2;
    saveVersionedData(data);

    // Now migrate v2 → v3 → v4 to pick up any v2.0 separate keys and add v4 features
    const v3Data = migrateV2ToV3(data);
    const v4Data = migrateV3ToV4(v3Data);

    // Clean up legacy keys (commented out for safety - can be enabled after verification)
    // localStorage.removeItem(STORAGE_KEYS.legacy.maintenance);
    // localStorage.removeItem(STORAGE_KEYS.legacy.humidity);
    // localStorage.removeItem(STORAGE_KEYS.legacy.inspection);

    return v4Data;
}

export function createDefaultData() {
    return {
        version: DATA_VERSION,
        guitars: [DEFAULT_GUITAR],
        activeGuitarId: 'default',
        maintenanceStates: {},
        humidityReadings: [],
        inspectionData: {},
        // v2.0+ features - now in versioned structure
        onboardingComplete: false,
        playingFrequency: 'weekly',
        playingHoursPerWeek: 2.5,
        hasHygrometer: null,
        playingSessions: [],
        stringChangeHistory: [],
        // v3.1+ features - equipment list (now editable)
        equipmentList: [
            'MusicNomad MN290 Ultimate Work Station (36" x 17" mat with gel cradle)',
            'Guitar ONE Polish & Cleaner',
            'F-ONE Fretboard Oil & Cleaner',
            'String Fuel string cleaner',
            'FRINE Fret Polishing Kit (5-piece micro-fine kit)',
            'Tune-It nut/saddle lubricant',
            'GRIP String Winder, Cutter, and Puller',
            '26-piece guitar tech screwdriver/wrench set',
            'Premium microfiber cloths',
            'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)',
            'Kyser Quick-Change Capo (KG6BA)',
            'Levy\'s MSSC8 Cotton Strap + D\'Addario Flex Lock Blocks',
            'Gator GC-GSMINI Molded Case',
            'D\'Addario Humidipak Restore Kit',
            'Inkbird ITH-10 Hygrometer'
        ],
        // String type and last change date
        currentStringType: 'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)',
        lastStringChangeDate: null,
        // v4+ features - practice stopwatch and inventory
        timerState: {
            running: false,
            startTimestamp: null
        },
        practiceHistory: [],
        inventory: {
            items: []
        }
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

// Get current versioned data (loads and migrates if needed)
export function getVersionedData() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.mainData);
        if (data) {
            const parsed = JSON.parse(data);
            // Ensure it's at the current version
            if (parsed.version !== DATA_VERSION) {
                return migrateData();
            }
            return parsed;
        }
        return migrateData();
    } catch (e) {
        console.error('Error loading versioned data:', e);
        return createDefaultData();
    }
}

// Update a specific field in versioned data
export function updateVersionedField(field, value) {
    const data = getVersionedData();
    data[field] = value;
    return saveVersionedData(data);
}

// Get a specific field from versioned data
export function getVersionedField(field, defaultValue = null) {
    const data = getVersionedData();
    return data[field] !== undefined ? data[field] : defaultValue;
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
