/**
 * Guitar Tracker - Humidity Module
 * Handles humidity analysis, statistics, and chart rendering
 */

import { HUMIDITY_THRESHOLDS } from './config.js';
import { loadHumidityReadings, addHumidityReading as storeReading, deleteHumidityReading as removeReading } from './storage.js';
import { validateHumidity, validateTemperature, getHumidityStatus, showValidationFeedback } from './validators.js';

/**
 * Add a new humidity reading with validation
 * @param {Object} params - Reading parameters
 * @param {HTMLInputElement} params.humidityInput - Humidity input element
 * @param {HTMLInputElement} params.temperatureInput - Temperature input element
 * @param {HTMLSelectElement} params.locationSelect - Location select element
 * @returns {{success: boolean, error?: string, reading?: Object}}
 */
export function addHumidityReadingFromForm({ humidityInput, temperatureInput, locationSelect }) {
    // Validate humidity
    const humidityResult = validateHumidity(humidityInput.value);
    showValidationFeedback(humidityInput, humidityResult);

    if (!humidityResult.valid) {
        return { success: false, error: humidityResult.error };
    }

    // Validate temperature
    const tempResult = validateTemperature(temperatureInput.value);
    showValidationFeedback(temperatureInput, tempResult);

    if (!tempResult.valid) {
        return { success: false, error: tempResult.error };
    }

    const now = new Date();
    const reading = {
        id: Date.now(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        humidity: humidityResult.value,
        temp: tempResult.value,
        location: locationSelect.value,
        timestamp: now.toISOString(),
        source: 'manual'
    };

    storeReading(reading);

    // Clear inputs
    humidityInput.value = '';
    temperatureInput.value = '';

    return { success: true, reading };
}

/**
 * Delete a humidity reading
 * @param {number} id - The reading ID to delete
 */
export function deleteHumidityReading(id) {
    return removeReading(id);
}

/**
 * Get humidity statistics
 * @returns {Object} Humidity statistics
 */
export function getHumidityStats() {
    const readings = loadHumidityReadings();

    if (readings.length === 0) {
        return {
            hasData: false,
            latest: null,
            status: null,
            change24h: null,
            range7d: null
        };
    }

    const latest = readings[0];
    const status = getHumidityStatus(latest.humidity);

    // Calculate 24h change
    let change24h = null;
    const latestTime = new Date(latest.timestamp);
    const oneDayAgo = new Date(latestTime.getTime() - 24 * 60 * 60 * 1000);
    const prevReading = readings.find(r => new Date(r.timestamp) <= oneDayAgo);

    if (prevReading) {
        change24h = latest.humidity - prevReading.humidity;
    }

    // Calculate 7-day range
    let range7d = null;
    const sevenDaysAgo = new Date(latestTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentReadings = readings
        .filter(r => new Date(r.timestamp) >= sevenDaysAgo)
        .map(r => r.humidity);

    if (recentReadings.length > 0) {
        range7d = {
            high: Math.max(...recentReadings),
            low: Math.min(...recentReadings)
        };
    }

    return {
        hasData: true,
        latest,
        status,
        change24h,
        range7d
    };
}

/**
 * Check for humidity-related alerts
 * @returns {Object[]} Array of alert objects
 */
export function checkHumidityAlerts() {
    const alerts = [];
    const readings = loadHumidityReadings();

    if (readings.length === 0) {
        return alerts;
    }

    const latest = readings[0];

    // Check for danger thresholds
    if (latest.humidity > HUMIDITY_THRESHOLDS.SAFE_MAX) {
        alerts.push({
            type: 'danger',
            icon: '',
            title: 'CRITICAL: High Humidity Detected',
            message: `RH is ${latest.humidity}% (danger threshold >${HUMIDITY_THRESHOLDS.SAFE_MAX}%). Bridge lifting risk active. Replace Humidipak immediately.`
        });
    } else if (latest.humidity < HUMIDITY_THRESHOLDS.SAFE_MIN) {
        alerts.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Low Humidity Warning',
            message: `RH is ${latest.humidity}% (below safe ${HUMIDITY_THRESHOLDS.SAFE_MIN}-${HUMIDITY_THRESHOLDS.SAFE_MAX}% range). Fret sprout risk. Increase humidity.`
        });
    }

    // Check for rapid change
    if (readings.length > 1) {
        const latestTime = new Date(latest.timestamp);
        const oneDayAgo = new Date(latestTime.getTime() - 24 * 60 * 60 * 1000);
        const prevReading = readings.find(r => new Date(r.timestamp) <= oneDayAgo);

        if (prevReading) {
            const change = Math.abs(latest.humidity - prevReading.humidity);
            if (change > HUMIDITY_THRESHOLDS.RAPID_CHANGE) {
                alerts.push({
                    type: 'warning',
                    icon: '',
                    title: 'Rapid Humidity Change',
                    message: `RH changed ${change.toFixed(1)}% in 24h (alert threshold >${HUMIDITY_THRESHOLDS.RAPID_CHANGE}%). Monitor closely.`
                });
            }
        }
    }

    return alerts;
}

/**
 * Draw the humidity chart on a canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {HTMLElement} container - The chart container element
 */
export function drawHumidityChart(canvas, container) {
    const readings = loadHumidityReadings();

    if (readings.length < 2) {
        container.style.display = 'none';
        return;
    }

    // Get last 7 days of readings
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReadings = readings
        .filter(r => new Date(r.timestamp) >= sevenDaysAgo)
        .reverse();

    if (recentReadings.length < 2) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth - 40;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw background zones
    // Danger zone (55-65)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(padding, padding, chartWidth, chartHeight * 0.25);

    // Caution zone high (50-55)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.25, chartWidth, chartHeight * 0.125);

    // Safe zone (40-50)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.375, chartWidth, chartHeight * 0.25);

    // Caution zone low (30-40)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(padding, padding + chartHeight * 0.625, chartWidth, chartHeight * 0.25);

    // Draw line chart
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const minHumidity = 30;
    const maxHumidity = 65;
    const range = maxHumidity - minHumidity;

    recentReadings.forEach((reading, i) => {
        const x = padding + (i / (recentReadings.length - 1)) * chartWidth;
        const y = padding + (1 - (reading.humidity - minHumidity) / range) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    recentReadings.forEach((reading, i) => {
        const x = padding + (i / (recentReadings.length - 1)) * chartWidth;
        const y = padding + (1 - (reading.humidity - minHumidity) / range) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = reading.humidity > 55 ? '#ef4444' :
            reading.humidity < 40 ? '#f59e0b' : '#10b981';
        ctx.fill();
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('65%', padding - 5, padding + 10);
    ctx.fillText('55%', padding - 5, padding + chartHeight * 0.285 + 4);
    ctx.fillText('40%', padding - 5, padding + chartHeight * 0.715 + 4);
    ctx.fillText('30%', padding - 5, height - padding + 4);
}

// Export Humidity object for convenience
export const Humidity = {
    addHumidityReadingFromForm,
    deleteHumidityReading,
    getHumidityStats,
    checkHumidityAlerts,
    drawHumidityChart
};
