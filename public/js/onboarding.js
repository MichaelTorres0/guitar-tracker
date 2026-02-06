// Onboarding module for first-time user setup
import { MAINTENANCE_TASKS } from './config.js';
import { saveData, getVersionedData, saveVersionedData, getVersionedField } from './storage.js';
import { updateDashboard } from './ui.js';

let currentStep = 0;
let onboardingData = {
    lastStringChange: null,
    playingFrequency: 'weekly',
    hasHygrometer: null
};

// Frequency to hours/week mapping
const frequencyToHours = {
    daily: 7,
    fewTimesWeek: 4,
    weekly: 2.5,
    occasionally: 1
};

// Check if onboarding should be shown
export function shouldShowOnboarding() {
    return !getVersionedField('onboardingComplete', false);
}

// Show onboarding modal
export function showOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.classList.add('show');
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('onboardingStringDate');
        if (dateInput) dateInput.value = today;
    }
}

// Hide onboarding modal
export function hideOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.remove('show');
}

// Navigate to next step
export function nextOnboardingStep() {
    if (currentStep < 3) {
        // Deactivate current step
        const currentStepEl = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
        const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

        if (currentStepEl) currentStepEl.classList.remove('active');
        if (currentDot) {
            currentDot.classList.remove('active');
            currentDot.classList.add('completed');
        }

        // Activate next step
        currentStep++;
        const nextStepEl = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
        const nextDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

        if (nextStepEl) nextStepEl.classList.add('active');
        if (nextDot) nextDot.classList.add('active');
    }
}

// Navigate to previous step
export function previousOnboardingStep() {
    if (currentStep > 0) {
        // Deactivate current step
        const currentStepEl = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
        const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

        if (currentStepEl) currentStepEl.classList.remove('active');
        if (currentDot) currentDot.classList.remove('active');

        // Activate previous step
        currentStep--;
        const prevStepEl = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
        const prevDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

        if (prevStepEl) prevStepEl.classList.add('active');
        if (prevDot) {
            prevDot.classList.add('active');
            prevDot.classList.remove('completed');
        }
    }
}

// Skip string date (use today as default)
export function skipStringDate() {
    const dateInput = document.getElementById('onboardingStringDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    nextOnboardingStep();
}

// Set hygrometer answer
export function setHasHygrometer(hasIt) {
    onboardingData.hasHygrometer = hasIt;

    // Update button states
    const buttons = document.querySelectorAll('.btn-yn');
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Highlight selected button
    const selectedBtn = Array.from(buttons).find(btn =>
        btn.textContent.includes(hasIt ? 'Yes' : 'No')
    );
    if (selectedBtn) selectedBtn.classList.add('selected');

    // Show recommendation if no hygrometer
    const recommendation = document.getElementById('hygrometerRecommendation');
    if (recommendation) {
        recommendation.style.display = hasIt ? 'none' : 'block';
    }

    // Enable finish button
    const finishBtn = document.getElementById('finishOnboarding');
    if (finishBtn) finishBtn.disabled = false;
}

// Skip onboarding
export function skipOnboarding() {
    if (confirm('Skip setup? You can always enter this information later in the app.')) {
        const data = getVersionedData();
        data.onboardingComplete = true;
        saveVersionedData(data);
        hideOnboarding();
    }
}

// Complete onboarding
export function completeOnboarding() {
    // Collect data
    const dateInput = document.getElementById('onboardingStringDate');
    const frequencyInput = document.getElementById('onboardingPlayingFrequency');

    if (dateInput && dateInput.value) {
        onboardingData.lastStringChange = dateInput.value;
    }

    if (frequencyInput) {
        onboardingData.playingFrequency = frequencyInput.value;
    }

    // Get current versioned data
    const data = getVersionedData();

    // Save to versioned data structure
    if (onboardingData.lastStringChange) {
        // Find and update the string change task
        const stringChangeTask = MAINTENANCE_TASKS.eightweek.find(t => t.id === '8w-8');
        if (stringChangeTask) {
            stringChangeTask.completed = true;
            stringChangeTask.lastCompleted = new Date(onboardingData.lastStringChange).toISOString();
        }
    }

    data.playingFrequency = onboardingData.playingFrequency;
    data.playingHoursPerWeek = frequencyToHours[onboardingData.playingFrequency];

    if (onboardingData.hasHygrometer !== null) {
        data.hasHygrometer = onboardingData.hasHygrometer;
    }

    data.onboardingComplete = true;

    // Save versioned data
    saveVersionedData(data);

    // Save task data
    saveData();

    // Update dashboard with new data
    updateDashboard();

    // Hide modal
    hideOnboarding();

    // Show success message
    const btn = document.querySelector('.btn-just-played');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ Setup Complete! Welcome!';
        btn.style.background = 'var(--color-success)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 3000);
    }
}

// Initialize onboarding
export function initOnboarding() {
    // Wire up close button
    const closeBtn = document.getElementById('closeOnboarding');
    if (closeBtn) {
        closeBtn.addEventListener('click', skipOnboarding);
    }

    // Check if should show onboarding
    if (shouldShowOnboarding()) {
        // Show after a brief delay to let the page load
        setTimeout(() => {
            showOnboarding();
        }, 500);
    }
}

// Expose functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.nextOnboardingStep = nextOnboardingStep;
    window.previousOnboardingStep = previousOnboardingStep;
    window.skipStringDate = skipStringDate;
    window.setHasHygrometer = setHasHygrometer;
    window.skipOnboarding = skipOnboarding;
    window.completeOnboarding = completeOnboarding;
}
