/**
 * Guitar Tracker - Input Validation
 * Validates user inputs with friendly error messages
 */

import { HUMIDITY_THRESHOLDS } from './config.js';

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the input is valid
 * @property {*} value - The parsed/cleaned value (if valid)
 * @property {string} [error] - Error message (if invalid)
 * @property {string} [warning] - Warning message (if valid but unusual)
 */

/**
 * Validate humidity reading
 * @param {string|number} value - The humidity value to validate
 * @returns {ValidationResult}
 */
export function validateHumidity(value) {
    // Handle empty input
    if (value === '' || value === null || value === undefined) {
        return { valid: false, error: 'Humidity is required' };
    }

    const num = parseFloat(value);

    // Check if it's a valid number
    if (isNaN(num)) {
        return { valid: false, error: 'Please enter a valid number' };
    }

    // Check range
    if (num < 0) {
        return { valid: false, error: 'Humidity cannot be negative' };
    }

    if (num > 100) {
        return { valid: false, error: 'Humidity cannot exceed 100%' };
    }

    // Valid but with warnings for unusual values
    if (num > 85) {
        return {
            valid: true,
            value: num,
            warning: 'This reading seems unusually high. Please verify your hygrometer.'
        };
    }

    if (num < 20) {
        return {
            valid: true,
            value: num,
            warning: 'This reading seems unusually low. Please verify your hygrometer.'
        };
    }

    return { valid: true, value: num };
}

/**
 * Validate temperature reading
 * @param {string|number} value - The temperature value to validate
 * @returns {ValidationResult}
 */
export function validateTemperature(value) {
    // Temperature is optional
    if (value === '' || value === null || value === undefined) {
        return { valid: true, value: null };
    }

    const num = parseFloat(value);

    // Check if it's a valid number
    if (isNaN(num)) {
        return { valid: false, error: 'Please enter a valid number' };
    }

    // Reasonable indoor temperature range (Fahrenheit)
    if (num < 32) {
        return { valid: false, error: 'Temperature seems too low for indoor storage' };
    }

    if (num > 120) {
        return { valid: false, error: 'Temperature seems too high for indoor storage' };
    }

    // Warnings for concerning temperatures
    if (num < 50) {
        return {
            valid: true,
            value: num,
            warning: 'Cold temperatures can affect guitar wood and finish'
        };
    }

    if (num > 90) {
        return {
            valid: true,
            value: num,
            warning: 'High temperatures can damage guitar finish and glue joints'
        };
    }

    return { valid: true, value: num };
}

/**
 * Get humidity status based on reading
 * @param {number} humidity - The humidity percentage
 * @returns {{level: string, message: string, class: string}}
 */
export function getHumidityStatus(humidity) {
    if (humidity >= HUMIDITY_THRESHOLDS.TARGET_MIN && humidity <= HUMIDITY_THRESHOLDS.TARGET_MAX) {
        return {
            level: 'optimal',
            message: 'Optimal (45-50%)',
            class: 'safe'
        };
    }

    if (humidity >= HUMIDITY_THRESHOLDS.SAFE_MIN && humidity < HUMIDITY_THRESHOLDS.TARGET_MIN) {
        return {
            level: 'safe-low',
            message: 'Safe Low (40-45%)',
            class: 'safe'
        };
    }

    if (humidity > HUMIDITY_THRESHOLDS.TARGET_MAX && humidity <= HUMIDITY_THRESHOLDS.SAFE_MAX) {
        return {
            level: 'safe-high',
            message: 'Safe High (50-55%)',
            class: 'warning'
        };
    }

    if (humidity < HUMIDITY_THRESHOLDS.SAFE_MIN && humidity >= HUMIDITY_THRESHOLDS.DANGER_LOW) {
        return {
            level: 'warning-low',
            message: 'Low Risk (<40%)',
            class: 'warning'
        };
    }

    if (humidity > HUMIDITY_THRESHOLDS.SAFE_MAX && humidity <= HUMIDITY_THRESHOLDS.DANGER_HIGH) {
        return {
            level: 'warning-high',
            message: 'High Risk (>55%)',
            class: 'danger'
        };
    }

    if (humidity < HUMIDITY_THRESHOLDS.DANGER_LOW) {
        return {
            level: 'danger-low',
            message: 'CRITICAL LOW (<35%)',
            class: 'danger'
        };
    }

    // humidity > DANGER_HIGH
    return {
        level: 'danger-high',
        message: 'CRITICAL HIGH (>60%)',
        class: 'danger'
    };
}

/**
 * Show validation feedback on an input element
 * @param {HTMLInputElement} input - The input element
 * @param {ValidationResult} result - The validation result
 */
export function showValidationFeedback(input, result) {
    // Find or create message element
    let messageEl = input.parentElement.querySelector('.validation-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'validation-message';
        input.parentElement.appendChild(messageEl);
    }

    // Clear previous state
    input.classList.remove('input-error');
    messageEl.classList.remove('error', 'warning');
    messageEl.textContent = '';

    if (!result.valid) {
        input.classList.add('input-error');
        messageEl.classList.add('error');
        messageEl.textContent = result.error;
    } else if (result.warning) {
        messageEl.classList.add('warning');
        messageEl.textContent = result.warning;
    }
}

/**
 * Clear validation feedback from an input element
 * @param {HTMLInputElement} input - The input element
 */
export function clearValidationFeedback(input) {
    input.classList.remove('input-error');
    const messageEl = input.parentElement.querySelector('.validation-message');
    if (messageEl) {
        messageEl.classList.remove('error', 'warning');
        messageEl.textContent = '';
    }
}

// Export validators object for convenience
export const Validators = {
    humidity: validateHumidity,
    temperature: validateTemperature,
    getHumidityStatus,
    showValidationFeedback,
    clearValidationFeedback
};
