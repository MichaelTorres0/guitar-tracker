# Guitar Tracker - Development Guide

A Progressive Web App for tracking maintenance, humidity, and care for a Taylor GS Mini Sapele acoustic guitar.

## Purpose & Goals

**User Profile:** Hobbyist guitarist returning after years away, owns quality instrument, wants proper maintenance without being overwhelmed.

**Core Problems Solved:**
1. **Bridge lift prevention** - GS Mini solid spruce tops are vulnerable to humidity damage ($150-200 repair)
2. **Maintenance anxiety** - Users don't know WHEN or HOW to maintain their guitar
3. **String life optimization** - Calculate when strings actually need changing based on playing habits
4. **Humidity monitoring** - Track and alert on dangerous conditions before damage occurs

**Design Philosophy:**
- Mobile-first (target: iPhone in guitar case)
- Offline-capable (works in case, basement, studio)
- Zero configuration (works immediately)
- Never lose data (robust localStorage)

## Quick Reference

- **Live URL:** https://michaeltorres0.github.io/guitar-tracker/
- **Architecture:** ES modules with separate CSS
- **Data storage:** localStorage with versioned schema (DATA_VERSION = 3)
- **Target device:** iPhone Safari (iOS 16.4+)

## Architecture

### ES Modules Structure
```
guitar-tracker/
├── index.html           # HTML structure, loads app.js as module
├── css/
│   └── styles.css       # All styles (extracted from embedded)
├── js/
│   ├── app.js           # Entry point, event wiring, init()
│   ├── config.js        # MAINTENANCE_TASKS, EQUIPMENT_ITEMS, thresholds
│   ├── storage.js       # localStorage operations, migration
│   ├── localStorage.js  # Cross-platform localStorage helper (v2.1.2)
│   ├── validators.js    # Input validation (humidity, temperature)
│   ├── humidity.js      # Humidity logging, analysis, charts
│   ├── tasks.js         # Task toggle, calculations, string life
│   ├── ui.js            # DOM rendering, tabs, modals, themes
│   ├── export.js        # CSV/JSON export functions
│   ├── onboarding.js    # First-time user onboarding wizard (v2.0)
│   ├── sessions.js      # Playing session tracking & calculations (v2.0)
│   └── stringHistory.js # String change history & average life (v2.0)
├── tests/
│   ├── test-setup.js    # Test framework setup
│   └── test.js          # Test suite (63 tests)
├── test.html            # Test runner page
├── manifest.json        # PWA manifest
└── RELEASE_NOTES.md     # Version history and features (v2.0)
```

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| `config.js` | Data constants, task definitions, humidity thresholds |
| `storage.js` | Data persistence, v1→v2→v3→v4 migration, legacy compatibility, versioned data helpers |
| `localStorage.js` | **v2.1.2** Cross-platform localStorage helper for browser and Node.js test environments |
| `validators.js` | Input validation with error/warning feedback |
| `humidity.js` | Humidity logging, chart rendering, alerts |
| `tasks.js` | Task completion, string life calculator, string change hook |
| `ui.js` | DOM manipulation, tab switching, theme toggle, dashboard updates |
| `export.js` | CSV and JSON export generation |
| `onboarding.js` | **v2.0** First-time user wizard, data collection, setup flow |
| `sessions.js` | **v2.0** Playing session tracking, rolling averages, weekly hours |
| `stringHistory.js` | **v2.0** String change history, brand tracking, average life calc |
| `app.js` | Application init, event handler wiring, module initialization |

### localStorage Schema (v3 - Current)
```javascript
// Key: 'guitarTrackerData' - ALL data is now consolidated in this versioned structure
{
    version: 3,
    guitars: [{ id, name, settings: { targetHumidity, stringChangeWeeks, ... } }],
    activeGuitarId: 'default',
    maintenanceStates: { daily: [...], weekly: [...], eightweek: [...], ... },
    humidityReadings: [{ humidity, temp, timestamp, guitarId }],
    inspectionData: { ... },
    // v2.0 features - now consolidated into versioned structure (v3+)
    onboardingComplete: false,
    playingFrequency: 'weekly',
    playingHoursPerWeek: 2.5,
    hasHygrometer: null,
    playingSessions: [{ timestamp, duration }],
    stringChangeHistory: [{ date, brand, daysFromPrevious }]
}
```

### Migration History
- **v1 → v2**: Consolidated separate keys into `guitarTrackerData` with guitars array
- **v2 → v3**: Moved v2.0 session/string tracking from separate keys into versioned structure
- All migrations are automatic and backward-compatible

### Legacy Keys (for migration)
**v1 keys** (migrated to v2/v3):
- `guitarMaintenanceData` - Old maintenance task states
- `humidityReadings` - Old humidity log entries
- `inspectionData` - Old inspection checkbox states

**v2.0 separate keys** (migrated to v3):
- `onboardingComplete` - Now in versioned structure
- `playingFrequency` - Now in versioned structure
- `playingHoursPerWeek` - Now in versioned structure
- `hasHygrometer` - Now in versioned structure
- `playingSessions` - Now in versioned structure
- `stringChangeHistory` - Now in versioned structure

**Separate keys** (not versioned):
- `theme` - Light/dark mode preference (stored separately for quick access)

### Data Flow

**Typical user action flow:**
```
1. User clicks button in index.html (e.g., id="addHumiditySimplified")
2. app.js event listener triggers → calls humidity.js function
3. Function validates input (validators.js)
4. Function updates in-memory data structure
5. Function saves to localStorage (storage.js)
6. Function calls ui.js to re-render affected sections
7. UI updates immediately with new data
```

**Key patterns:**
- **Event delegation:** Task checkboxes use event delegation (one listener for all checkboxes)
- **Direct binding:** Buttons use direct getElementById + addEventListener
- **Inline handlers:** Inspection checkboxes use inline onchange for simplicity
- **Always re-render:** After data changes, always call relevant render functions

## Critical Constraints

1. **No external libraries** - Vanilla JS only (optional Chart.js for humidity)
2. **ES modules** - Use `import`/`export`, no build step required
3. **Mobile-first** - Test at 390px width (iPhone 14/15)
4. **44pt touch targets** - iOS Human Interface Guidelines
5. **Offline-first** - Must work 100% without network
6. **Never lose data** - Robust localStorage error handling with migration

## Code Style

### JavaScript
- ES modules with named exports
- Vanilla JavaScript only, no frameworks
- localStorage operations use try/catch
- Validation before data persistence

### CSS
- CSS custom properties for theming
- Mobile-first responsive design
- No horizontal scroll at 390px width
- All styles in `css/styles.css`

### HTML
- Semantic markup where possible
- Most event handlers wired in `app.js` via element IDs
- Exception: Inspection checkboxes use inline `onchange` for simplicity
- Button element IDs must match the event listener IDs in `app.js`

**Event Handler Pattern:**
```javascript
// HTML: <button id="exportCSV" class="btn-primary">Export</button>
// app.js setupEventHandlers():
const exportCsvBtn = document.getElementById('exportCSV');
if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportAsCSV);
```

**When adding new buttons:**
1. Add unique `id` attribute to HTML element
2. Add event listener in `app.js` setupEventHandlers()
3. Import and wire to appropriate function from module

## Key Functions (by module)

### app.js
| Function | Purpose |
|----------|---------|
| `init()` | Load data, render UI, check migration |

### tasks.js
| Function | Purpose |
|----------|---------|
| `toggleTask(taskId)` | Mark task complete/incomplete |
| `quickActionJustPlayed()` | Complete all daily tasks |

### humidity.js
| Function | Purpose |
|----------|---------|
| `addHumidityReadingSimplified()` | Log humidity with auto-timestamp |
| `drawHumidityChart()` | Render 7-day trend canvas |
| `checkForAlerts()` | Scan for critical conditions |

### ui.js
| Function | Purpose |
|----------|---------|
| `updateDashboard()` | Recalculate all metrics |
| `renderMaintenanceTasks()` | Render task lists |
| `switchTab()` | Handle tab navigation |

## Business Rules

### Humidity Thresholds
- **Target:** 45-50% RH
- **Safe:** 40-55% RH
- **Low Risk:** <40% (fret sprout)
- **High Risk:** >55% (bridge lifting - CRITICAL)

### Task Frequencies
- Daily: After each playing session
- Weekly: Every 7 days
- 8-Week: Every 56 days (string change)
- Quarterly: Every 84 days
- Annual: Every 365 days

### String Life Calculation
- Base lifespan: 8 weeks
- Reduces to 6 weeks if daily cleaning <60%
- Extends to 10 weeks if playing <2 hrs/week

## Making Changes

### Common Tasks

**Adding a new button:**
1. Add element with unique ID to `index.html`
   ```html
   <button id="myNewButton" class="btn-primary">Do Thing</button>
   ```
2. Add event listener in `app.js` setupEventHandlers()
   ```javascript
   const myBtn = document.getElementById('myNewButton');
   if (myBtn) myBtn.addEventListener('click', handleMyAction);
   ```
3. If function is in another module, import it at top of `app.js`

**Adding a new feature:**
1. Determine which module owns the functionality
2. Add function to appropriate module with named export
3. Update `app.js` to import and wire up if needed
4. Add UI elements to `index.html` if needed
5. Update render functions in `ui.js` if displaying data

**Modifying data structure:**
1. Update `createDefaultData()` in `storage.js` to include new fields
2. Increment DATA_VERSION in `config.js` if breaking change
3. Add migration logic to `storage.js` (e.g., `migrateV3ToV4()`)
4. Use helper functions to access versioned data:
   - `getVersionedData()` - Get entire data structure
   - `getVersionedField(field, default)` - Get specific field
   - `updateVersionedField(field, value)` - Update single field
   - `saveVersionedData(data)` - Save entire structure
5. Test with empty localStorage AND with existing data from all previous versions

### Testing Workflow
1. **During development:** Refresh browser, check console
2. **Before committing:** Run `npm test` - all 63 tests must pass
3. **Before deploying:** Test on actual iPhone Safari if possible

### Debugging Tips
- Check browser console for errors (F12)
- Verify element IDs match between HTML and JS
- Use `console.log()` liberally during development
- Test localStorage: Chrome DevTools → Application → Local Storage

## PWA Requirements

### Icon (icon.png)
- Size: 180x180px minimum
- Format: PNG
- Theme: Guitar-related, blue (#3b82f6) or green (#10b981)

### manifest.json
Already configured with:
- App name and description
- Standalone display mode
- Theme colors matching app

## Testing Checklist

- [ ] All task categories render
- [ ] Checkboxes persist across reload
- [ ] "Just Played" completes daily tasks
- [ ] Humidity form validates input
- [ ] Dashboard updates in real-time
- [ ] Theme toggle works
- [ ] Export generates valid files
- [ ] No horizontal scroll at 390px
- [ ] Works offline after first load

## Future Enhancements (v2.1+)

- Govee API integration for auto humidity logging
- Browser notifications (iOS 16.4+)
- iOS Shortcuts generator
- Time budgeting display
