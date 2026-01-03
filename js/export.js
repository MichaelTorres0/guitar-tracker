/**
 * Guitar Tracker - Export Module
 * Handles CSV and JSON export functionality
 */

import { MAINTENANCE_TASKS } from './config.js';
import { loadHumidityReadings } from './storage.js';

/**
 * Download a file to the user's device
 * @param {string} content - The file content
 * @param {string} filename - The filename
 * @param {string} type - The MIME type
 */
function downloadFile(content, filename, type) {
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

/**
 * Escape a value for CSV (handle commas and quotes)
 * @param {*} value - The value to escape
 * @returns {string} Escaped value
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Export data as CSV
 */
export function exportAsCSV() {
    const lines = [];

    lines.push('TAYLOR GS MINI MAINTENANCE TRACKER - CSV EXPORT');
    lines.push('');
    lines.push(`Export Date,${new Date().toLocaleDateString()}`);
    lines.push('');

    // Maintenance tasks section
    lines.push('=== MAINTENANCE TASKS ===');
    lines.push('Category,Task Name,Duration,Completed,Last Completed');

    for (let category in MAINTENANCE_TASKS) {
        MAINTENANCE_TASKS[category].forEach(task => {
            const lastCompleted = task.lastCompleted
                ? new Date(task.lastCompleted).toLocaleDateString()
                : 'Never';
            lines.push([
                escapeCSV(category.toUpperCase()),
                escapeCSV(task.name),
                escapeCSV(task.duration),
                task.completed ? 'Yes' : 'No',
                lastCompleted
            ].join(','));
        });
    }

    lines.push('');

    // Humidity log section
    lines.push('=== HUMIDITY LOG ===');
    lines.push('Date,Time,RH %,Temp °F,Location');

    const readings = loadHumidityReadings();
    readings.forEach(r => {
        const date = new Date(r.timestamp);
        lines.push([
            escapeCSV(date.toLocaleDateString()),
            escapeCSV(date.toLocaleTimeString()),
            r.humidity,
            r.temp || '',
            r.location
        ].join(','));
    });

    const csv = lines.join('\n');
    downloadFile(csv, 'guitar-maintenance.csv', 'text/csv');
}

/**
 * Export data as JSON
 */
export function exportAsJSON() {
    const data = {
        exportDate: new Date().toISOString(),
        version: 1,
        tasks: {},
        humidity: loadHumidityReadings()
    };

    // Include task data with completion status
    for (let category in MAINTENANCE_TASKS) {
        data.tasks[category] = MAINTENANCE_TASKS[category].map(task => ({
            id: task.id,
            name: task.name,
            duration: task.duration,
            completed: task.completed || false,
            lastCompleted: task.lastCompleted || null
        }));
    }

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'guitar-maintenance-backup.json', 'application/json');
}

// Export object for convenience
export const Export = {
    exportAsCSV,
    exportAsJSON
};
