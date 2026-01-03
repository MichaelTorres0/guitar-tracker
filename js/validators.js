// Input validation functions

export function validateHumidity(value) {
    if (value === '' || value === null || value === undefined) {
        return { valid: false, error: 'Humidity is required' };
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        return { valid: false, error: 'Must be a number' };
    }
    if (num < 0 || num > 100) {
        return { valid: false, error: 'Must be between 0-100%' };
    }
    if (num > 85) {
        return { valid: true, value: num, warning: 'Unusually high reading - please verify' };
    }
    if (num < 20) {
        return { valid: true, value: num, warning: 'Unusually low reading - please verify' };
    }
    return { valid: true, value: num };
}

export function validateTemperature(value) {
    if (value === '' || value === null || value === undefined) {
        return { valid: true, value: null }; // Optional field
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        return { valid: false, error: 'Must be a number' };
    }
    if (num < 32 || num > 120) {
        return { valid: false, error: 'Temperature outside reasonable range (32-120°F)' };
    }
    return { valid: true, value: num };
}

export function showFeedback(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.className = 'form-feedback ' + type;
        el.style.display = 'block';
        if (type === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 3000);
        }
    }
}

export function hideFeedback(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.display = 'none';
    }
}
