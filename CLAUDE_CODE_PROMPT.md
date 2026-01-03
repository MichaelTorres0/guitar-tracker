# Claude Code Implementation Prompt

## Context Setup

Copy the SPECIFICATION.md file to your guitar-tracker repository root before starting.

---

## Phase 1 Prompt (Foundation)

```
I need you to enhance my Guitar Tracker PWA following TDD methodology. 
Read SPECIFICATION.md for full details.

## CRITICAL CONSTRAINTS
- Keep ALL code in single index.html file
- Maintain mobile-first design (test at 390px)
- No external dependencies except optional Chart.js
- Must work 100% offline after first load
- 44pt minimum touch targets

## PHASE 1 TASKS (in order)

### Task 1.1: Fix Inconsistencies
- Change all "6-week" / "sixweek" references to "8-week" / "eightweek"
- Update default string recommendation to EJ16 Light (.012-.053) with note that this reduces bridge stress on GS Mini
- Fix header subtitle to show "EJ16 Light (.012-.053)"
- Update MAINTENANCE_TASKS key from 'sixweek' to 'eightweek'
- Update all UI text, variable names, and calculations accordingly

### Task 1.2: Data Versioning
Add version-aware data structure:

```javascript
const DATA_VERSION = 2;

const DEFAULT_DATA = {
    version: DATA_VERSION,
    guitars: [{
        id: 'default',
        name: 'Taylor GS Mini Sapele',
        bodyType: 'solid-top',
        fretboardMaterial: 'ebony',
        settings: {
            targetHumidity: { min: 45, max: 50 },
            safeHumidity: { min: 40, max: 55 },
            stringChangeWeeks: 8,
            playingHoursPerWeek: 2.5
        }
    }],
    maintenanceData: {},
    humidityReadings: [],
    inspectionData: {}
};
```

Implement `migrateData()` function that:
- Detects old format (no version key)
- Converts to new format preserving all existing data
- Returns current format if already migrated

### Task 1.3: Module Pattern Refactor
Wrap all code in module pattern:

```javascript
const GuitarTracker = (function() {
    // Private state
    let state = { ...DEFAULT_DATA };
    
    // Validators module
    const Validators = {
        humidity: function(value) { /* ... */ },
        temperature: function(value) { /* ... */ }
    };
    
    // HumidityAnalyzer module  
    const HumidityAnalyzer = {
        getStatus: function(humidity) { /* ... */ },
        get24hChange: function(readings) { /* ... */ },
        hasRapidChange: function(readings) { /* ... */ }
    };
    
    // TaskManager module
    const TaskManager = {
        toggleTask: function(taskId) { /* ... */ },
        justPlayed: function() { /* ... */ },
        getNextDue: function(task, frequency) { /* ... */ }
    };
    
    // Continue for all modules...
    
    // Public API
    return {
        init: function() { /* ... */ },
        // Expose only what's needed for onclick handlers
    };
})();

// Initialize on load
GuitarTracker.init();
```

Update all inline onclick handlers to call GuitarTracker.methodName()

### Task 1.4: Input Validation
Implement Validators module:

```javascript
const Validators = {
    humidity: function(value) {
        const num = parseFloat(value);
        if (value === '' || value === null || value === undefined) {
            return { valid: false, error: 'Humidity is required' };
        }
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
    },
    
    temperature: function(value) {
        if (value === '' || value === null || value === undefined) {
            return { valid: true, value: null }; // Optional field
        }
        const num = parseFloat(value);
        if (isNaN(num)) {
            return { valid: false, error: 'Must be a number' };
        }
        if (num < 32 || num > 120) {
            return { valid: false, error: 'Temperature seems outside reasonable range (32-120°F)' };
        }
        return { valid: true, value: num };
    }
};
```

Add validation to addHumidityReadingSimplified():
- Validate before saving
- Show error message in UI (add error display element)
- Show warning if present but still allow save

### Task 1.5: Create Test Infrastructure
Create test.html file that:
- Loads index.html in iframe OR copies testable functions
- Implements simple test runner
- Runs all test cases from SPECIFICATION.md

Test file structure (can be separate files or combined):
```
tests/
├── test-runner.js
├── validators.test.js
├── humidity.test.js
├── tasks.test.js
├── string-life.test.js
├── completion.test.js
└── persistence.test.js
```

Implement at minimum these test categories:
1. Humidity Validation (8 tests)
2. Temperature Validation (4 tests)
3. Humidity Status Determination (6 tests)
4. Task Completion (3 tests)
5. Next Due Calculation (5 tests)
6. Period Completion (5 tests)

## VERIFICATION CHECKLIST
After completing Phase 1:
- [ ] All "6-week" references changed to "8-week"
- [ ] String gauge shows EJ16 Light (.012-.053)
- [ ] Data loads correctly after migration
- [ ] Old localStorage data still works (backward compatible)
- [ ] Validation prevents invalid humidity entries
- [ ] Validation shows warnings for unusual values
- [ ] All tests pass
- [ ] App works at 390px width
- [ ] Dark mode still works
- [ ] "Just Played" button still works
- [ ] Export functions still work
- [ ] No console errors

## OUTPUT
When complete, provide:
1. Updated index.html
2. test.html with all tests
3. Summary of changes made
```

---

## Phase 2 Prompt (Smart Features)

```
Continue enhancing Guitar Tracker. Phase 1 is complete.
Read SPECIFICATION.md sections 1.4 (Smart Recommendations) and 2.3.2.

## PHASE 2 TASKS

### Task 2.1: Recommendations Engine
Add RecommendationEngine module:

```javascript
const RecommendationEngine = {
    analyze: function(guitarId) {
        const recommendations = [];
        recommendations.push(...this.analyzeHumidity(guitarId));
        recommendations.push(...this.analyzeMaintenanceCompliance(guitarId));
        recommendations.push(...this.getSeasonalTips());
        return recommendations.sort((a, b) => b.priority - a.priority);
    },
    
    analyzeHumidity: function(guitarId) {
        // Get last 72 hours of readings
        // Implement logic from SPECIFICATION.md 1.4 table
    },
    
    getSeasonalTips: function() {
        const month = new Date().getMonth();
        // Winter: Nov-Feb (months 10,11,0,1)
        // Summer: Jun-Aug (months 5,6,7)
        // Transition: other months
    },
    
    analyzeMaintenanceCompliance: function(guitarId) {
        // Check cleaning compliance
        // Check overdue tasks
        // Check string age
    }
};
```

### Task 2.2: Recommendations Dashboard Widget
Add recommendations section to dashboard:
- Shows top 3 recommendations
- Color-coded by priority (red=high, yellow=medium, blue=info)
- Expandable for full list
- Updates when humidity logged or tasks completed

### Task 2.3: Action Measurement Tracking
Add to Inspections tab:
- Action measurement form (high E at 12th, low E at 12th)
- Neck relief measurement
- Historical log with change indicators
- Alert if significant change detected (>0.5mm)

### Task 2.4: Temperature Utilization
- Display temperature alongside humidity in dashboard
- Include in humidity chart (dual axis)
- Factor into recommendations (high temp + high humidity = higher risk)

### Task 2.5: Additional Maintenance Items
Add to MAINTENANCE_TASKS:

Monthly:
- Strap button tightness check

Quarterly:
- Case interior inspection
- Action measurement

Annual:
- Tuning machine lubrication

## TESTS FOR PHASE 2
Implement all tests from SPECIFICATION.md Category 8 (Recommendations Engine)
```

---

## Phase 3 Prompt (Multi-Guitar)

```
Continue enhancing Guitar Tracker. Phases 1-2 complete.
Read SPECIFICATION.md sections 1.5 and 2.3.1.

## PHASE 3 TASKS

### Task 3.1: Guitar Profile Schema
Update data structure for multiple guitars:
- guitars array with full profile for each
- guitarId on all maintenance records, humidity readings, inspections
- activeGuitarId for current selection

### Task 3.2: Guitar Selector UI
- Add dropdown in header next to theme toggle
- "Add Guitar" option in dropdown
- Current guitar name displayed

### Task 3.3: Guitar Management Screen
New tab or modal:
- List of guitars
- Edit guitar details
- Delete guitar (with confirmation)
- Set as active

### Task 3.4: Per-Guitar Data Filtering
All views filter by activeGuitarId:
- Dashboard shows active guitar stats
- Maintenance tasks track per guitar
- Humidity log per guitar
- Inspections per guitar

### Task 3.5: Data Migration
- Existing data assigned to "default" guitar
- New guitars get fresh data slate
- Export includes all guitars

## TESTS FOR PHASE 3
Implement all tests from SPECIFICATION.md Category 9 (Multi-Guitar)
```

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| index.html | Main application (all code embedded) |
| manifest.json | PWA manifest |
| sw.js | Service worker (create in Phase 2) |
| icon.png | App icon (needs creation) |
| test.html | Test runner |
| tests/*.js | Test files |
| SPECIFICATION.md | Full spec document |
| CLAUDE.md | Dev guidelines (update after changes) |
