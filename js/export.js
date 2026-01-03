// Export and download functions
import { MAINTENANCE_TASKS, STORAGE_KEYS } from './config.js';

const HUMIDITY_KEY = STORAGE_KEYS.legacy.humidity;

export function exportAsCSV() {
    let csv = 'TAYLOR GS MINI MAINTENANCE TRACKER - CSV EXPORT\n\n';
    csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

    csv += '=== MAINTENANCE TASKS ===\n';
    for (let category in MAINTENANCE_TASKS) {
        csv += `\n${category.toUpperCase()}\n`;
        MAINTENANCE_TASKS[category].forEach(task => {
            csv += `"${task.name}","${task.duration}","${task.completed ? 'Yes' : 'No'}","${task.lastCompleted || 'Never'}"\n`;
        });
    }

    csv += '\n\n=== HUMIDITY LOG ===\n';
    csv += 'Date,Time,RH %,Temp °F,Location,Status\n';
    const readings = JSON.parse(localStorage.getItem(HUMIDITY_KEY) || '[]');
    readings.forEach(r => {
        const date = new Date(r.timestamp);
        csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${r.humidity}","${r.temp}","${r.location}"\n`;
    });

    downloadFile(csv, 'guitar-maintenance.csv', 'text/csv');
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
