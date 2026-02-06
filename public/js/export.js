// Export and download functions
import { MAINTENANCE_TASKS, STORAGE_KEYS, DATA_VERSION } from './config.js';
import { getVersionedData, getHumidityReadings, saveVersionedData } from './storage.js';
import { ls } from './localStorage.js';

export function exportAsCSV(filteredReadings = null) {
    let csv = 'TAYLOR GS MINI MAINTENANCE TRACKER - CSV EXPORT\n\n';
    csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

    if (!filteredReadings) {
        csv += '=== MAINTENANCE TASKS ===\n';
        for (let category in MAINTENANCE_TASKS) {
            csv += `\n${category.toUpperCase()}\n`;
            MAINTENANCE_TASKS[category].forEach(task => {
                csv += `"${task.name}","${task.duration}","${task.completed ? 'Yes' : 'No'}","${task.lastCompleted || 'Never'}"\n`;
            });
        }
        csv += '\n\n';
    }

    csv += filteredReadings ? '=== FILTERED HUMIDITY LOG ===\n' : '=== HUMIDITY LOG ===\n';
    csv += 'Date,Time,RH %,Temp °F,Location,Status\n';
    // Use consolidated versioned storage
    const readings = filteredReadings || getHumidityReadings();
    readings.forEach(r => {
        const date = new Date(r.timestamp);
        csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${r.humidity}","${r.temp}","${r.location}"\n`;
    });

    const filename = filteredReadings ? 'guitar-humidity-filtered.csv' : 'guitar-maintenance.csv';
    downloadFile(csv, filename, 'text/csv');
}

export function exportAsJSON() {
    const data = {
        exportDate: new Date().toISOString(),
        tasks: MAINTENANCE_TASKS,
        // Use consolidated versioned storage
        humidity: getHumidityReadings()
    };

    downloadFile(JSON.stringify(data, null, 2), 'guitar-maintenance-backup.json', 'application/json');
}

export function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Get localStorage data size
export function getDataSize() {
    let totalSize = 0;
    // Get size of main data keys (primary is now versioned storage)
    const mainData = ls.getItem(STORAGE_KEYS.mainData) || '';
    const theme = ls.getItem('theme') || '';
    // Legacy keys may still exist during transition
    const legacyHumidityData = ls.getItem(STORAGE_KEYS.legacy.humidity) || '';
    const inspectionData = ls.getItem('inspectionData') || '';
    const lastBackup = ls.getItem('lastBackupDate') || '';

    totalSize = mainData.length + theme.length + legacyHumidityData.length +
                inspectionData.length + lastBackup.length;

    // Convert to KB
    const sizeKB = (totalSize / 1024).toFixed(2);
    return sizeKB + ' KB';
}

// Get last backup date
export function getLastBackupDate() {
    const lastBackup = ls.getItem('lastBackupDate');
    return lastBackup ? new Date(lastBackup).toLocaleString() : 'Never';
}

// Update backup status display
export function updateBackupStatus() {
    const dataSizeEl = document.getElementById('dataSize');
    const lastBackupEl = document.getElementById('lastBackupDate');

    if (dataSizeEl) dataSizeEl.textContent = getDataSize();
    if (lastBackupEl) lastBackupEl.textContent = getLastBackupDate();
}

// Create backup
export function createBackup() {
    // Get all versioned data (includes v2.0 features)
    const versionedData = getVersionedData();

    const data = {
        exportDate: new Date().toISOString(),
        version: DATA_VERSION,
        // Include current task states
        tasks: MAINTENANCE_TASKS,
        // Include all versioned data fields
        versionedData: versionedData,
        // Include theme preference (stored separately)
        theme: ls.getItem('theme') || 'light'
    };

    // Save backup timestamp
    ls.setItem('lastBackupDate', new Date().toISOString());

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadFile(JSON.stringify(data, null, 2), `guitar-backup-${timestamp}.json`, 'application/json');

    // Update status display
    updateBackupStatus();

    // Show confirmation
    const confirmation = document.getElementById('backupConfirmation');
    if (confirmation) {
        confirmation.style.display = 'block';
        setTimeout(() => {
            confirmation.style.display = 'none';
        }, 3000);
    }
}

// Merge backup data with current data (non-destructive)
export function mergeBackupData(currentData, backupData) {
    const merged = JSON.parse(JSON.stringify(currentData)); // Deep clone

    // Merge humidity readings by timestamp (avoid duplicates)
    if (backupData.humidityReadings && Array.isArray(backupData.humidityReadings)) {
        const existingTimestamps = new Set(
            (merged.humidityReadings || []).map(r => r.timestamp)
        );

        backupData.humidityReadings.forEach(reading => {
            if (!existingTimestamps.has(reading.timestamp)) {
                merged.humidityReadings = merged.humidityReadings || [];
                merged.humidityReadings.push(reading);
            }
        });

        // Sort by timestamp
        if (merged.humidityReadings) {
            merged.humidityReadings.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
        }
    }

    // Merge playing sessions by timestamp
    if (backupData.playingSessions && Array.isArray(backupData.playingSessions)) {
        const existingTimestamps = new Set(
            (merged.playingSessions || []).map(s => s.timestamp)
        );

        backupData.playingSessions.forEach(session => {
            if (!existingTimestamps.has(session.timestamp)) {
                merged.playingSessions = merged.playingSessions || [];
                merged.playingSessions.push(session);
            }
        });

        // Sort by timestamp
        if (merged.playingSessions) {
            merged.playingSessions.sort((a, b) => a.timestamp - b.timestamp);
        }
    }

    // Merge string change history by date
    if (backupData.stringChangeHistory && Array.isArray(backupData.stringChangeHistory)) {
        const existingDates = new Set(
            (merged.stringChangeHistory || []).map(s => s.date)
        );

        backupData.stringChangeHistory.forEach(change => {
            if (!existingDates.has(change.date)) {
                merged.stringChangeHistory = merged.stringChangeHistory || [];
                merged.stringChangeHistory.push(change);
            }
        });

        // Sort by date
        if (merged.stringChangeHistory) {
            merged.stringChangeHistory.sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
        }
    }

    // Merge task lastCompleted dates (keep the most recent)
    if (backupData.maintenanceStates) {
        merged.maintenanceStates = merged.maintenanceStates || {};

        for (const category in backupData.maintenanceStates) {
            if (!merged.maintenanceStates[category]) {
                merged.maintenanceStates[category] = backupData.maintenanceStates[category];
            } else {
                // For each task, keep the most recent lastCompleted
                backupData.maintenanceStates[category].forEach(backupTask => {
                    const existingTask = merged.maintenanceStates[category].find(t => t.id === backupTask.id);
                    if (existingTask) {
                        if (backupTask.lastCompleted && (!existingTask.lastCompleted ||
                            new Date(backupTask.lastCompleted) > new Date(existingTask.lastCompleted))) {
                            existingTask.lastCompleted = backupTask.lastCompleted;
                            existingTask.completed = backupTask.completed;
                        }
                    } else {
                        merged.maintenanceStates[category].push(backupTask);
                    }
                });
            }
        }
    }

    return merged;
}

// Merge from backup file (non-destructive)
export function mergeFromBackup(fileContent) {
    try {
        const backupData = JSON.parse(fileContent);

        // Validate backup structure
        if (!backupData.versionedData && !backupData.tasks) {
            throw new Error('Invalid backup file structure');
        }

        // Get current data
        const currentData = getVersionedData();
        const backupVersionedData = backupData.versionedData || {};

        // Preview what will be merged
        const currentHumidity = (currentData.humidityReadings || []).length;
        const backupHumidity = (backupVersionedData.humidityReadings || []).length;
        const currentSessions = (currentData.playingSessions || []).length;
        const backupSessions = (backupVersionedData.playingSessions || []).length;

        let previewMsg = 'Merge Preview:\n\n';
        previewMsg += `Current data: ${currentHumidity} humidity readings, ${currentSessions} sessions\n`;
        previewMsg += `Backup data: ${backupHumidity} humidity readings, ${backupSessions} sessions\n\n`;
        previewMsg += 'This will ADD missing historical data from the backup.\n';
        previewMsg += 'Existing data will NOT be overwritten.\n\n';
        previewMsg += 'Continue with merge?';

        if (!confirm(previewMsg)) {
            return { success: false, reason: 'cancelled' };
        }

        // Perform merge
        const mergedData = mergeBackupData(currentData, backupVersionedData);

        // Save merged data
        saveVersionedData(mergedData);

        // Calculate what was added
        const addedHumidity = (mergedData.humidityReadings || []).length - currentHumidity;
        const addedSessions = (mergedData.playingSessions || []).length - currentSessions;

        // Show success
        const confirmation = document.getElementById('mergeConfirmation');
        if (confirmation) {
            confirmation.className = 'form-feedback success';
            confirmation.textContent = `✅ Merged! Added ${addedHumidity} humidity readings, ${addedSessions} sessions. Reloading...`;
            confirmation.style.display = 'block';
        }

        setTimeout(() => {
            location.reload();
        }, 2000);

        return { success: true, addedHumidity, addedSessions };

    } catch (error) {
        const confirmation = document.getElementById('mergeConfirmation');
        if (confirmation) {
            confirmation.className = 'form-feedback error';
            confirmation.textContent = '❌ Error: ' + error.message;
            confirmation.style.display = 'block';
        }
        return { success: false, error: error.message };
    }
}

// Restore from backup
export function restoreFromBackup(fileContent) {
    try {
        const data = JSON.parse(fileContent);

        // Validate backup structure (support both old and new format)
        if (!data.tasks && !data.versionedData) {
            throw new Error('Invalid backup file structure');
        }

        // Build preview message
        let confirmMsg = 'This backup contains:\n';

        if (data.versionedData) {
            // New format backup
            const taskCount = Object.values(data.tasks || {}).flat().length;
            const humidityCount = (data.versionedData.humidityReadings || []).length;
            const sessionCount = (data.versionedData.playingSessions || []).length;
            const stringChangeCount = (data.versionedData.stringChangeHistory || []).length;

            confirmMsg += `- ${taskCount} maintenance tasks\n`;
            confirmMsg += `- ${humidityCount} humidity readings\n`;
            if (sessionCount > 0) confirmMsg += `- ${sessionCount} playing sessions\n`;
            if (stringChangeCount > 0) confirmMsg += `- ${stringChangeCount} string changes\n`;
        } else {
            // Old format backup
            const taskCount = Object.values(data.tasks).flat().length;
            const humidityCount = (data.humidity || []).length;
            confirmMsg += `- ${taskCount} maintenance tasks\n`;
            confirmMsg += `- ${humidityCount} humidity readings\n`;
        }

        confirmMsg += '\nThis will REPLACE all current data. Continue?';

        if (!confirm(confirmMsg)) {
            return;
        }

        // Restore versioned data structure
        if (data.versionedData) {
            ls.setItem(STORAGE_KEYS.mainData, JSON.stringify(data.versionedData));
        } else {
            // Old format - restore to legacy keys and let migration handle it
            if (data.tasks) {
                ls.setItem('guitarMaintenanceData', JSON.stringify(data.tasks));
            }
            if (data.humidity) {
                ls.setItem(STORAGE_KEYS.legacy.humidity, JSON.stringify(data.humidity));
            }
            if (data.inspections) {
                ls.setItem('inspectionData', JSON.stringify(data.inspections));
            }
        }

        // Restore task states to in-memory MAINTENANCE_TASKS
        if (data.tasks) {
            for (let category in data.tasks) {
                if (MAINTENANCE_TASKS[category]) {
                    data.tasks[category].forEach((task, index) => {
                        if (MAINTENANCE_TASKS[category][index]) {
                            MAINTENANCE_TASKS[category][index].completed = task.completed || false;
                            MAINTENANCE_TASKS[category][index].lastCompleted = task.lastCompleted || null;
                        }
                    });
                }
            }
        }

        // Restore theme
        if (data.theme) {
            ls.setItem('theme', data.theme);
        }

        // Show success and reload
        const confirmation = document.getElementById('restoreConfirmation');
        if (confirmation) {
            confirmation.className = 'form-feedback success';
            confirmation.textContent = '✅ Backup restored successfully! Reloading...';
            confirmation.style.display = 'block';
        }

        setTimeout(() => {
            location.reload();
        }, 1500);

    } catch (error) {
        const confirmation = document.getElementById('restoreConfirmation');
        if (confirmation) {
            confirmation.className = 'form-feedback error';
            confirmation.textContent = '❌ Error: ' + error.message;
            confirmation.style.display = 'block';
        }
    }
}

// Initialize backup file input handler
export function initBackupRestore() {
    const restoreBtn = document.getElementById('restoreBackup');
    const restoreFile = document.getElementById('restoreFile');
    const mergeBtn = document.getElementById('mergeBackup');
    const mergeFile = document.getElementById('mergeFile');

    if (restoreBtn && restoreFile) {
        restoreBtn.addEventListener('click', () => {
            restoreFile.click();
        });

        restoreFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    restoreFromBackup(event.target.result);
                };
                reader.readAsText(file);
            }
        });
    }

    if (mergeBtn && mergeFile) {
        mergeBtn.addEventListener('click', () => {
            mergeFile.click();
        });

        mergeFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    mergeFromBackup(event.target.result);
                };
                reader.readAsText(file);
            }
        });
    }

    // Update status on load
    updateBackupStatus();
}
