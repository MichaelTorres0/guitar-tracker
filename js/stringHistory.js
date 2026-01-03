// String change history tracking module
import { updateDashboard } from './ui.js';

// Show string brand prompt
export function showStringBrandPrompt() {
    const modal = document.getElementById('stringBrandModal');
    if (modal) modal.classList.add('show');
}

// Hide string brand prompt
export function hideStringBrandPrompt() {
    const modal = document.getElementById('stringBrandModal');
    if (modal) {
        modal.classList.remove('show');
        // Clear input
        const input = document.getElementById('stringBrandInput');
        if (input) input.value = '';
    }
}

// Save string change with brand
export function saveStringChangeBrand() {
    const input = document.getElementById('stringBrandInput');
    const brand = input ? input.value.trim() : null;
    saveStringChange(brand);
}

// Log a string change
export function saveStringChange(brand) {
    const history = JSON.parse(localStorage.getItem('stringChangeHistory') || '[]');
    const previousChange = history[history.length - 1];

    const record = {
        date: Date.now(),
        brand: brand || null,
        daysFromPrevious: previousChange
            ? Math.floor((Date.now() - previousChange.date) / (24 * 60 * 60 * 1000))
            : null
    };

    history.push(record);
    localStorage.setItem('stringChangeHistory', JSON.stringify(history));

    // Hide modal
    hideStringBrandPrompt();

    // Update display
    renderStringHistory();
    updateDashboard();
}

// Calculate average string life
export function getAverageStringLife() {
    const history = JSON.parse(localStorage.getItem('stringChangeHistory') || '[]');
    const withDays = history.filter(r => r.daysFromPrevious !== null);

    if (withDays.length < 2) return null;

    const totalDays = withDays.reduce((sum, r) => sum + r.daysFromPrevious, 0);
    return Math.round(totalDays / withDays.length);
}

// Render string history display
export function renderStringHistory() {
    const container = document.getElementById('stringHistoryDisplay');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('stringChangeHistory') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding: 20px; text-align: center;">No string changes logged yet</p>';
        return;
    }

    // Sort by date, most recent first
    const sorted = [...history].sort((a, b) => b.date - a.date);

    // Calculate average if we have enough data
    const avgLife = getAverageStringLife();
    let html = '';

    if (avgLife) {
        html += `<div style="background: var(--color-bg); padding: 12px; border-radius: 6px; margin-bottom: 16px; text-align: center;">
            <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 4px;">Average String Life</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--color-primary);">${avgLife} days</div>
        </div>`;
    }

    html += '<div style="max-height: 300px; overflow-y: auto;">';
    html += '<table style="width: 100%; font-size: 13px;">';
    html += '<thead><tr style="border-bottom: 2px solid var(--color-border);"><th style="text-align: left; padding: 8px;">Date</th><th style="text-align: left; padding: 8px;">Brand</th><th style="text-align: right; padding: 8px;">Days Used</th></tr></thead>';
    html += '<tbody>';

    sorted.forEach(record => {
        const date = new Date(record.date).toLocaleDateString();
        const brand = record.brand || '<span class="empty-state" style="font-style: italic;">Not recorded</span>';
        const days = record.daysFromPrevious !== null ? `${record.daysFromPrevious} days` : '—';

        html += `<tr style="border-bottom: 1px solid var(--color-border);">
            <td style="padding: 8px;">${date}</td>
            <td style="padding: 8px;">${brand}</td>
            <td style="padding: 8px; text-align: right; font-weight: 600;">${days}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';

    container.innerHTML = html;
}

// Initialize string history
export function initStringHistory() {
    // Wire up close button
    const closeBtn = document.getElementById('closeStringBrandModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => saveStringChange(null));
    }

    // Render on load
    renderStringHistory();
}

// Expose functions to window
window.saveStringChange = saveStringChange;
window.saveStringChangeBrand = saveStringChangeBrand;
window.showStringBrandPrompt = showStringBrandPrompt;
