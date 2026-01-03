// Export and download functions
import { MAINTENANCE_TASKS, STORAGE_KEYS } from './config.js';

const HUMIDITY_KEY = STORAGE_KEYS.legacy.humidity;

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
    const readings = filteredReadings || JSON.parse(localStorage.getItem(HUMIDITY_KEY) || '[]');
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
        humidity: JSON.parse(localStorage.getItem(HUMIDITY_KEY) || '[]')
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
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    // Convert to KB
    const sizeKB = (totalSize / 1024).toFixed(2);
    return sizeKB + ' KB';
}

// Get last backup date
export function getLastBackupDate() {
    const lastBackup = localStorage.getItem('lastBackupDate');
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
    const data = {
        exportDate: new Date().toISOString(),
        version: 2,
        tasks: MAINTENANCE_TASKS,
        humidity: JSON.parse(localStorage.getItem(HUMIDITY_KEY) || '[]'),
        inspections: JSON.parse(localStorage.getItem('inspectionData') || '{}'),
        theme: localStorage.getItem('theme') || 'light'
    };

    // Save backup timestamp
    localStorage.setItem('lastBackupDate', new Date().toISOString());

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

// Restore from backup
export function restoreFromBackup(fileContent) {
    try {
        const data = JSON.parse(fileContent);

        // Validate backup structure
        if (!data.tasks || !data.humidity) {
            throw new Error('Invalid backup file structure');
        }

        // Show preview and confirm
        const taskCount = Object.values(data.tasks).flat().length;
        const humidityCount = data.humidity.length;
        const confirmMsg = `This backup contains:\n- ${taskCount} maintenance tasks\n- ${humidityCount} humidity readings\n\nThis will REPLACE all current data. Continue?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        // Restore data
        if (data.tasks) {
            // Update MAINTENANCE_TASKS with restored data
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
            localStorage.setItem('guitarMaintenanceData', JSON.stringify(data.tasks));
        }

        if (data.humidity) {
            localStorage.setItem(HUMIDITY_KEY, JSON.stringify(data.humidity));
        }

        if (data.inspections) {
            localStorage.setItem('inspectionData', JSON.stringify(data.inspections));
        }

        if (data.theme) {
            localStorage.setItem('theme', data.theme);
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
    const fileInput = document.getElementById('restoreFile');

    if (restoreBtn && fileInput) {
        restoreBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
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

    // Update status on load
    updateBackupStatus();
}
