// Storage and data migration functions
import { DATA_VERSION, STORAGE_KEYS, DEFAULT_GUITAR, MAINTENANCE_TASKS } from './config.js';

// Helper to get localStorage - works in both browser and Node.js test environments
function getLocalStorage() {
    // Check globalThis first (works in both browser and Node.js)
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        return globalThis.localStorage;
    }
    // Then check window (browser fallback)
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    // Finally check bare localStorage (browser global)
    if (typeof localStorage !== 'undefined') {
        return localStorage;
    }
    return null;
}

// Wrapper for localStorage operations with fallback
const storage = {
    getItem(key) {
        const ls = getLocalStorage();
        return ls ? ls.getItem(key) : null;
    },
    setItem(key, value) {
        const ls = getLocalStorage();
        if (ls) ls.setItem(key, value);
    },
    removeItem(key) {
        const ls = getLocalStorage();
        if (ls) ls.removeItem(key);
    },
    clear() {
        const ls = getLocalStorage();
        if (ls) ls.clear();
    }
};

// MIGRATION FUNCTIONS
export function migrateData() {
    try {
        // Check for new format data first
        const newData = storage.getItem(STORAGE_KEYS.mainData);
        if (newData) {
            const parsed = JSON.parse(newData);

            // Check if already at current version
            if (parsed.version === DATA_VERSION) {
                return verifyDataIntegrity(parsed);
            }

            // Migrate from v5 to v6
            if (parsed.version === 5) {
                console.log('Migrating from v5 to v6 - multi-guitar nested structure');
                return migrateV5ToV6(parsed);
            }

            // Migrate from v4 to v6 (through v5 first)
            if (parsed.version === 4) {
                console.log('Migrating from v4 to v6 - consolidating all data');
                const v5Data = migrateV4ToV5(parsed);
                return migrateV5ToV6(v5Data);
            }

            // Migrate from v3 to v6 (through v4 and v5 first)
            if (parsed.version === 3) {
                console.log('Migrating from v3 to v6 - adding practice stopwatch, inventory, and consolidating');
                const v4Data = migrateV3ToV4(parsed);
                const v5Data = migrateV4ToV5(v4Data);
                return migrateV5ToV6(v5Data);
            }

            // Migrate from v2 to v6 (through v3, v4, and v5 first)
            if (parsed.version === 2) {
                console.log('Migrating from v2 to v6 - consolidating fragmented keys');
                const v3Data = migrateV2ToV3(parsed);
                const v4Data = migrateV3ToV4(v3Data);
                const v5Data = migrateV4ToV5(v4Data);
                return migrateV5ToV6(v5Data);
            }

            // Migrate from v1 to v6 (through v2, v3, v4, and v5 first)
            if (parsed.version === 1 || !parsed.version) {
                console.log('Migrating from v1 to v6');
                const v2Data = migrateV1ToV2(parsed);
                const v3Data = migrateV2ToV3(v2Data);
                const v4Data = migrateV3ToV4(v3Data);
                const v5Data = migrateV4ToV5(v4Data);
                return migrateV5ToV6(v5Data);
            }
        }

        // Check for legacy data (pre-versioning)
        const legacyMaintenance = storage.getItem(STORAGE_KEYS.legacy.maintenance);
        const legacyHumidity = storage.getItem(STORAGE_KEYS.legacy.humidity);
        const legacyInspection = storage.getItem(STORAGE_KEYS.legacy.inspection);

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

// Migrate from v4 to v5 - consolidate ALL data into versioned structure
// This fixes data persistence issues where legacy keys could be cleared independently
export function migrateV4ToV5(v4Data) {
    const data = {
        ...v4Data,
        version: 5
    };

    // Consolidate humidity readings from legacy key if not already in versioned structure
    if (!data.humidityReadings || data.humidityReadings.length === 0) {
        const legacyHumidity = storage.getItem(STORAGE_KEYS.legacy.humidity);
        if (legacyHumidity) {
            try {
                data.humidityReadings = JSON.parse(legacyHumidity);
                console.log(`  - Migrated ${data.humidityReadings.length} humidity readings from legacy key`);
            } catch (e) {
                console.error('Error parsing legacy humidity readings:', e);
                data.humidityReadings = [];
            }
        } else {
            data.humidityReadings = [];
        }
    }

    // Consolidate task states from legacy key if not already properly migrated
    const legacyMaintenance = storage.getItem(STORAGE_KEYS.legacy.maintenance);
    if (legacyMaintenance) {
        try {
            const legacyTasks = JSON.parse(legacyMaintenance);
            // Merge with existing maintenanceStates, preserving any newer data
            if (!data.maintenanceStates) {
                data.maintenanceStates = {};
            }
            for (const category in legacyTasks) {
                if (!data.maintenanceStates[category]) {
                    data.maintenanceStates[category] = legacyTasks[category];
                } else {
                    // Merge: use the one with more recent lastCompleted dates
                    legacyTasks[category].forEach(legacyTask => {
                        const existingTask = data.maintenanceStates[category].find(t => t.id === legacyTask.id);
                        if (!existingTask) {
                            data.maintenanceStates[category].push(legacyTask);
                        } else if (legacyTask.lastCompleted && (!existingTask.lastCompleted ||
                            new Date(legacyTask.lastCompleted) > new Date(existingTask.lastCompleted))) {
                            existingTask.completed = legacyTask.completed;
                            existingTask.lastCompleted = legacyTask.lastCompleted;
                        }
                    });
                }
            }
            console.log('  - Consolidated task states from legacy key');
        } catch (e) {
            console.error('Error parsing legacy maintenance data:', e);
        }
    }

    // Save the consolidated data
    saveVersionedData(data);

    console.log('✓ Migration to v5 complete - all data consolidated into single versioned structure');

    return data;
}

// Migrate from v5 to v6 - multi-guitar nested structure
export function migrateV5ToV6(v5Data) {
    console.log('Migrating v5 → v6: Multi-guitar nested structure');

    const TASK_ID_MAP = {
        'daily-1': 'gs-mini-daily-1',
        'daily-2': 'gs-mini-daily-2',
        'daily-3': 'gs-mini-daily-3',
        'weekly-1': 'gs-mini-weekly-1',
        'weekly-2': 'gs-mini-weekly-2',
        'weekly-3': 'gs-mini-weekly-3',
        '8w-1': 'gs-mini-string-1',
        '8w-2': 'gs-mini-string-2',
        '8w-3': 'gs-mini-string-3',
        '8w-4': 'gs-mini-string-4',
        '8w-5': 'gs-mini-string-5',
        '8w-6': 'gs-mini-string-6',
        '8w-7': 'gs-mini-string-7',
        '8w-8': 'gs-mini-string-8',
        'q-1': 'gs-mini-quarterly-1',
        'q-2': 'gs-mini-quarterly-2',
        'q-3': 'gs-mini-quarterly-3',
        'annual-1': 'gs-mini-annual-1'
    };

    const v6Data = createDefaultData();

    // Migrate GS Mini data (was the only guitar in v5)
    const gsMini = v6Data.guitars['gs-mini'];

    // Migrate settings from first guitar in v5 array
    if (v5Data.guitars && v5Data.guitars[0]) {
        const oldGuitar = v5Data.guitars[0];
        if (oldGuitar.settings) {
            gsMini.settings = { ...gsMini.settings, ...oldGuitar.settings };
        }
    }

    // Migrate maintenance states with ID remapping
    if (v5Data.maintenanceStates) {
        Object.keys(v5Data.maintenanceStates).forEach(category => {
            const oldStates = v5Data.maintenanceStates[category] || [];
            const newCategory = category === 'eightweek' ? 'eightweek' : category;

            gsMini.maintenanceStates[newCategory] = oldStates.map(state => ({
                ...state,
                id: TASK_ID_MAP[state.id] || state.id
            }));
        });
    }

    // Migrate other fields
    gsMini.humidityReadings = v5Data.humidityReadings || [];
    gsMini.playingSessions = v5Data.playingSessions || [];
    gsMini.stringChangeHistory = v5Data.stringChangeHistory || [];
    gsMini.lastStringChangeDate = v5Data.lastStringChangeDate || null;
    gsMini.currentStringType = v5Data.currentStringType || null;
    gsMini.onboardingComplete = v5Data.onboardingComplete || false;
    gsMini.playingFrequency = v5Data.playingFrequency || 'weekly';
    gsMini.playingHoursPerWeek = v5Data.playingHoursPerWeek || 2.5;
    gsMini.hasHygrometer = v5Data.hasHygrometer || null;
    gsMini.timerState = v5Data.timerState || { running: false, startTimestamp: null };
    gsMini.practiceHistory = v5Data.practiceHistory || [];
    gsMini.inventory = v5Data.inventory || { items: [] };

    v6Data.inspectionData = v5Data.inspectionData || {};
    v6Data.syncQueue = [];

    console.log('✓ Migration to v6 complete - multi-guitar structure created');

    return v6Data;
}

// Migrate from v2 to v3 - consolidate separate localStorage keys into versioned structure
export function migrateV2ToV3(v2Data) {
    const data = {
        ...v2Data,
        version: 3
    };

    // Consolidate v2.0 features from separate keys if not already in structure
    if (!data.onboardingComplete) {
        const onboardingComplete = storage.getItem(STORAGE_KEYS.legacy.onboardingComplete);
        data.onboardingComplete = onboardingComplete === 'true';
    }

    if (!data.playingFrequency) {
        const playingFrequency = storage.getItem(STORAGE_KEYS.legacy.playingFrequency);
        data.playingFrequency = playingFrequency || 'weekly';
    }

    if (!data.playingHoursPerWeek) {
        const playingHoursPerWeek = storage.getItem(STORAGE_KEYS.legacy.playingHoursPerWeek);
        data.playingHoursPerWeek = playingHoursPerWeek ? parseFloat(playingHoursPerWeek) : 2.5;
    }

    if (!data.hasHygrometer) {
        const hasHygrometer = storage.getItem(STORAGE_KEYS.legacy.hasHygrometer);
        data.hasHygrometer = hasHygrometer === 'true' ? true : (hasHygrometer === 'false' ? false : null);
    }

    if (!data.playingSessions) {
        try {
            const playingSessions = storage.getItem(STORAGE_KEYS.legacy.playingSessions);
            data.playingSessions = playingSessions ? JSON.parse(playingSessions) : [];
        } catch (e) {
            console.error('Error migrating playing sessions:', e);
            data.playingSessions = [];
        }
    }

    if (!data.stringChangeHistory) {
        try {
            const stringChangeHistory = storage.getItem(STORAGE_KEYS.legacy.stringChangeHistory);
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

    // Now migrate v2 → v3 → v4 → v5 → v6 to pick up any v2.0 separate keys and consolidate
    const v3Data = migrateV2ToV3(data);
    const v4Data = migrateV3ToV4(v3Data);
    const v5Data = migrateV4ToV5(v4Data);
    const v6Data = migrateV5ToV6(v5Data);

    // Clean up legacy keys (commented out for safety - can be enabled after verification)
    // storage.removeItem(STORAGE_KEYS.legacy.maintenance);
    // storage.removeItem(STORAGE_KEYS.legacy.humidity);
    // storage.removeItem(STORAGE_KEYS.legacy.inspection);

    return v6Data;
}

export function createDefaultData() {
    return {
        version: DATA_VERSION,
        activeGuitarId: 'gs-mini', // Default to acoustic
        guitars: {
            'gs-mini': {
                id: 'gs-mini',
                name: 'Taylor GS Mini Sapele',
                settings: {
                    targetHumidity: { min: 45, max: 50 },
                    safeHumidity: { min: 40, max: 55 },
                    dangerHumidity: { low: 35, high: 60 },
                    stringChangeWeeks: 8,
                    playingHoursPerWeek: 2.5
                },
                maintenanceStates: {
                    daily: [],
                    weekly: [],
                    eightweek: [],
                    quarterly: [],
                    annual: []
                },
                humidityReadings: [],
                playingSessions: [],
                stringChangeHistory: [],
                lastStringChangeDate: null,
                currentStringType: null,
                onboardingComplete: false,
                playingFrequency: 'weekly',
                hasHygrometer: null,
                timerState: { running: false, startTimestamp: null },
                practiceHistory: [],
                inventory: { items: [] }
            },
            'prs-ce24': {
                id: 'prs-ce24',
                name: 'PRS SE CE24',
                settings: {
                    targetHumidity: { min: 40, max: 60 },
                    safeHumidity: { min: 30, max: 70 },
                    dangerHumidity: { low: 20, high: 80 },
                    stringChangeWeeks: 12,
                    playingHoursPerWeek: 3.5
                },
                maintenanceStates: {
                    daily: [],
                    weekly: [],
                    monthly: [],
                    quarterly: [],
                    annual: []
                },
                humidityReadings: [],
                playingSessions: [],
                stringChangeHistory: [],
                lastStringChangeDate: null,
                currentStringType: null,
                onboardingComplete: false,
                playingFrequency: 'weekly',
                hasHygrometer: null,
                timerState: { running: false, startTimestamp: null },
                practiceHistory: [],
                inventory: { items: [] }
            }
        },
        syncQueue: [],
        inspectionData: {}
    };
}

export function saveVersionedData(data) {
    try {
        data.version = DATA_VERSION;
        storage.setItem(STORAGE_KEYS.mainData, JSON.stringify(data));
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
        const data = storage.getItem(STORAGE_KEYS.mainData);
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

// Legacy compatibility functions - now use versioned storage as primary source
export function loadData() {
    // First try to load from versioned storage (v5+)
    const versionedData = getVersionedData();
    if (versionedData.maintenanceStates && Object.keys(versionedData.maintenanceStates).length > 0) {
        for (let category in versionedData.maintenanceStates) {
            if (MAINTENANCE_TASKS[category]) {
                versionedData.maintenanceStates[category].forEach(task => {
                    const original = MAINTENANCE_TASKS[category].find(t => t.id === task.id);
                    if (original) {
                        original.completed = task.completed || false;
                        original.lastCompleted = task.lastCompleted || null;
                    }
                });
            }
        }
        return;
    }

    // Fallback to legacy key for backward compatibility
    const DATA_KEY = STORAGE_KEYS.legacy.maintenance;
    const saved = storage.getItem(DATA_KEY);
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
    // Save to versioned storage (primary)
    syncTasksToVersionedData();

    // Also save to legacy key for backward compatibility
    const DATA_KEY = STORAGE_KEYS.legacy.maintenance;
    const data = {};
    for (let category in MAINTENANCE_TASKS) {
        data[category] = MAINTENANCE_TASKS[category].map(task => ({
            id: task.id,
            completed: task.completed || false,
            lastCompleted: task.lastCompleted || null
        }));
    }
    storage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadInspectionData() {
    let inspectionData = {};
    const saved = storage.getItem('inspectionData');
    if (saved) {
        inspectionData = JSON.parse(saved);
    }
    return inspectionData;
}

// ============================================================
// V5 DATA INTEGRITY AND HELPER FUNCTIONS
// ============================================================

// Verify data integrity and fix any issues
export function verifyDataIntegrity(data) {
    let needsSave = false;
    const issues = [];

    // Ensure all required fields exist
    if (!data.humidityReadings) {
        data.humidityReadings = [];
        issues.push('humidityReadings was missing');
        needsSave = true;
    }

    if (!data.maintenanceStates) {
        data.maintenanceStates = {};
        issues.push('maintenanceStates was missing');
        needsSave = true;
    }

    if (!data.playingSessions) {
        data.playingSessions = [];
        issues.push('playingSessions was missing');
        needsSave = true;
    }

    if (!data.stringChangeHistory) {
        data.stringChangeHistory = [];
        issues.push('stringChangeHistory was missing');
        needsSave = true;
    }

    if (!data.inventory) {
        data.inventory = { items: [] };
        issues.push('inventory was missing');
        needsSave = true;
    }

    if (!data.timerState) {
        data.timerState = { running: false, startTimestamp: null };
        issues.push('timerState was missing');
        needsSave = true;
    }

    if (!data.practiceHistory) {
        data.practiceHistory = [];
        issues.push('practiceHistory was missing');
        needsSave = true;
    }

    // Check for legacy data that should be merged
    const legacyHumidity = storage.getItem(STORAGE_KEYS.legacy.humidity);
    if (legacyHumidity) {
        try {
            const legacyReadings = JSON.parse(legacyHumidity);
            if (legacyReadings.length > 0) {
                // Merge any readings not in versioned data (by ID)
                const existingIds = new Set(data.humidityReadings.map(r => r.id));
                const newReadings = legacyReadings.filter(r => !existingIds.has(r.id));
                if (newReadings.length > 0) {
                    data.humidityReadings = [...data.humidityReadings, ...newReadings];
                    data.humidityReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    issues.push(`Recovered ${newReadings.length} humidity readings from legacy storage`);
                    needsSave = true;
                }
            }
        } catch (e) {
            console.error('Error checking legacy humidity:', e);
        }
    }

    if (issues.length > 0) {
        console.log('Data integrity check found issues:', issues);
        if (needsSave) {
            saveVersionedData(data);
            console.log('Data integrity issues repaired and saved');
        }
    }

    return data;
}

// ============================================================
// HUMIDITY READINGS - Consolidated Storage Functions
// ============================================================

// Get humidity readings from versioned storage
export function getHumidityReadings() {
    const data = getVersionedData();
    return data.humidityReadings || [];
}

// Save humidity readings to versioned storage
export function saveHumidityReadings(readings) {
    const data = getVersionedData();
    data.humidityReadings = readings;
    saveVersionedData(data);

    // Also update legacy key for backward compatibility during transition
    // This can be removed in a future version once all users have migrated
    storage.setItem(STORAGE_KEYS.legacy.humidity, JSON.stringify(readings));
}

// Add a single humidity reading
export function addHumidityReading(reading) {
    const readings = getHumidityReadings();
    readings.unshift(reading);
    readings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    saveHumidityReadings(readings);
    return reading;
}

// Delete a humidity reading by ID
export function removeHumidityReading(id) {
    let readings = getHumidityReadings();
    readings = readings.filter(r => r.id !== id);
    saveHumidityReadings(readings);
}

// ============================================================
// TASK STATES - Consolidated Storage Functions
// ============================================================

// Sync in-memory MAINTENANCE_TASKS from versioned storage
export function syncTasksFromVersionedData() {
    const data = getVersionedData();
    if (data.maintenanceStates) {
        for (const category in data.maintenanceStates) {
            if (MAINTENANCE_TASKS[category]) {
                data.maintenanceStates[category].forEach(savedTask => {
                    const task = MAINTENANCE_TASKS[category].find(t => t.id === savedTask.id);
                    if (task) {
                        task.completed = savedTask.completed || false;
                        task.lastCompleted = savedTask.lastCompleted || null;
                    }
                });
            }
        }
    }
}

// Sync in-memory MAINTENANCE_TASKS to versioned storage
export function syncTasksToVersionedData() {
    const data = getVersionedData();
    data.maintenanceStates = {};

    for (const category in MAINTENANCE_TASKS) {
        data.maintenanceStates[category] = MAINTENANCE_TASKS[category].map(task => ({
            id: task.id,
            completed: task.completed || false,
            lastCompleted: task.lastCompleted || null
        }));
    }

    saveVersionedData(data);

    // Also update legacy key for backward compatibility during transition
    const legacyData = {};
    for (const category in MAINTENANCE_TASKS) {
        legacyData[category] = MAINTENANCE_TASKS[category].map(task => ({
            id: task.id,
            completed: task.completed || false,
            lastCompleted: task.lastCompleted || null
        }));
    }
    storage.setItem(STORAGE_KEYS.legacy.maintenance, JSON.stringify(legacyData));
}

// ============================================================
// MULTI-GUITAR DATA ACCESS - V6+ Helper Functions
// ============================================================

// Get current active guitar ID
export function getActiveGuitarId() {
    return getVersionedField('activeGuitarId', 'gs-mini');
}

// Set active guitar
export function setActiveGuitarId(guitarId) {
    updateVersionedField('activeGuitarId', guitarId);
}

// Get specific guitar's data
export function getGuitarData(guitarId) {
    const data = getVersionedData();
    return data.guitars?.[guitarId] || null;
}

// Update specific guitar's data
export function updateGuitarData(guitarId, updates) {
    const data = getVersionedData();
    if (data.guitars && data.guitars[guitarId]) {
        data.guitars[guitarId] = { ...data.guitars[guitarId], ...updates };
        saveVersionedData(data);
    }
}

// Get sync queue
export function getSyncQueue() {
    return getVersionedField('syncQueue', []);
}

// Add to sync queue
export function addToSyncQueue(item) {
    const queue = getSyncQueue();
    queue.push({ ...item, queuedAt: new Date().toISOString() });
    updateVersionedField('syncQueue', queue);
}

// Clear sync queue
export function clearSyncQueue() {
    updateVersionedField('syncQueue', []);
}

// ============================================================
// PLAYING SESSIONS - Consolidated Storage Functions
// ============================================================

// Get playing sessions from versioned storage
export function getPlayingSessions() {
    const data = getVersionedData();
    return data.playingSessions || [];
}

// Save playing sessions to versioned storage
export function savePlayingSessions(sessions) {
    const data = getVersionedData();
    data.playingSessions = sessions;
    saveVersionedData(data);

    // Also update legacy key for backward compatibility
    storage.setItem(STORAGE_KEYS.legacy.playingSessions, JSON.stringify(sessions));
}
