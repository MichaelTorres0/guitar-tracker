# Task 1.3: ES Modules Refactoring

## Overview
Refactor the embedded single-file architecture to ES modules for better maintainability and testability.

## Current State
- All code is embedded in `index.html` (~2500 lines)
- Phase 1 enhancements completed (Tasks 1.1, 1.2, 1.4, 1.5)
- 62 tests passing
- DATA_VERSION = 2

## Target Architecture

```
guitar-tracker/
├── index.html              # HTML structure only, loads app.js
├── css/
│   └── styles.css          # All styles extracted from index.html
├── js/
│   ├── app.js              # Entry point, wires up event handlers
│   ├── config.js           # MAINTENANCE_TASKS, EQUIPMENT_ITEMS, thresholds
│   ├── storage.js          # localStorage operations, migration
│   ├── validators.js       # Input validation (humidity, temperature)
│   ├── humidity.js         # Humidity logging, analysis, charts
│   ├── tasks.js            # Task toggle, calculations, string life
│   ├── ui.js               # DOM rendering, tabs, modals, themes
│   └── export.js           # CSV/JSON export functions
├── tests/
│   └── test.js             # Update to work with modules
└── ...
```

## Module Responsibilities

| Module | Extract From | Key Functions |
|--------|--------------|---------------|
| `config.js` | Lines 1302-1450 | MAINTENANCE_TASKS, EQUIPMENT_ITEMS, DATA_VERSION, STORAGE_KEYS, thresholds |
| `storage.js` | Lines 1335-1420 | saveData, loadData, migrateData, migrateLegacyData |
| `validators.js` | Lines 1420-1500 | validateHumidity, validateTemperature, showFeedback, hideFeedback |
| `humidity.js` | Lines 1750-1900 | addHumidityReadingSimplified, deleteHumidityReading, drawHumidityChart, checkForAlerts |
| `tasks.js` | Lines 1500-1650 | toggleTask, quickActionJustPlayed, calculateNextDue, resetDailyTasks, resetWeeklyTasks |
| `ui.js` | Lines 1650-1800, 1900-2100 | renderMaintenanceTasks, renderInventoryChecklist, updateDashboard, switchTab, toggleTheme, modal functions |
| `export.js` | Lines 2100-2200 | exportAsCSV, exportAsJSON, downloadFile |
| `app.js` | Lines 1300, 2470-2480 | init, event handler wiring, checkForAlerts call |

## Implementation Steps

### 1. Extract CSS (~700 lines)
- Copy all styles from `<style>` tag to `css/styles.css`
- Replace `<style>` block with `<link rel="stylesheet" href="css/styles.css">`

### 2. Create config.js
```javascript
// js/config.js
export const DATA_VERSION = 2;

export const STORAGE_KEYS = {
    mainData: 'guitarTrackerData',
    legacy: {
        maintenance: 'guitarMaintenanceData',
        humidity: 'humidityReadings',
        inspection: 'inspectionData'
    }
};

export const HUMIDITY_THRESHOLDS = {
    TARGET_MIN: 45,
    TARGET_MAX: 50,
    // ... etc
};

export const MAINTENANCE_TASKS = {
    daily: [...],
    weekly: [...],
    eightweek: [...],  // NOTE: was 'sixweek' in old code
    quarterly: [...],
    annual: [...]
};

export const EQUIPMENT_ITEMS = [...];
```

### 3. Create remaining modules
- Each module imports what it needs from other modules
- Use named exports (not default exports)
- Avoid circular dependencies

### 4. Update index.html
Replace the `<script>` block with:
```html
<script type="module" src="js/app.js"></script>
```

Remove inline `onclick` handlers, wire them up in `app.js`:
```javascript
// js/app.js
document.querySelector('.btn-just-played').addEventListener('click', quickActionJustPlayed);
```

### 5. Update tests
- Modify `tests/test.js` to load modules or parse them
- Alternative: Create a test build that bundles modules

## Critical Notes

1. **Preserve DATA_VERSION = 2** - Migration logic must remain intact
2. **Use `eightweek` not `sixweek`** - Phase 1 renamed 6-week to 8-week
3. **Keep validation functions** - Phase 1.4 added input validation
4. **No build step required** - ES modules work natively in browsers
5. **Test on GitHub Pages** - Ensure modules load correctly via HTTPS

## Validation Checklist

- [ ] All 62 existing tests pass (may need test refactoring)
- [ ] Data migration from v1 to v2 works
- [ ] Humidity validation shows feedback
- [ ] 8-week tasks display correctly (not 6-week)
- [ ] Works offline after initial load
- [ ] No console errors
- [ ] Works on GitHub Pages

## Reference

The previous ES modules attempt is available in the git history:
```bash
git show origin/claude/update-string-specs-gLY4N:js/app.js
git show origin/claude/update-string-specs-gLY4N:js/config.js
# etc.
```

Note: That version was at DATA_VERSION = 1 and missing Phase 1 enhancements. Use it as a structural reference only.
