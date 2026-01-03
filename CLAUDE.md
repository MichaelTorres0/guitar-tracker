# Guitar Tracker - Development Guide

A Progressive Web App for tracking maintenance, humidity, and care for a Taylor GS Mini Sapele acoustic guitar.

## Quick Reference

- **Live URL:** https://michaeltorres0.github.io/guitar-tracker/
- **Architecture:** ES modules with separate CSS
- **Data storage:** localStorage with versioned schema (DATA_VERSION = 2)
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
│   ├── validators.js    # Input validation (humidity, temperature)
│   ├── humidity.js      # Humidity logging, analysis, charts
│   ├── tasks.js         # Task toggle, calculations, string life
│   ├── ui.js            # DOM rendering, tabs, modals, themes
│   └── export.js        # CSV/JSON export functions
├── tests/
│   ├── test-setup.js    # Test framework setup
│   └── test.js          # Test suite (62 tests)
├── test.html            # Test runner page
└── manifest.json        # PWA manifest
```

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| `config.js` | Data constants, task definitions, humidity thresholds |
| `storage.js` | Data persistence, v1→v2 migration, legacy compatibility |
| `validators.js` | Input validation with error/warning feedback |
| `humidity.js` | Humidity logging, chart rendering, alerts |
| `tasks.js` | Task completion, string life calculator |
| `ui.js` | DOM manipulation, tab switching, theme toggle |
| `export.js` | CSV and JSON export generation |
| `app.js` | Application init, event handler wiring |

### localStorage Schema (v2)
```javascript
// Key: 'guitarTrackerData'
{
    version: 2,
    guitars: [{ id, name, settings: { targetHumidity, stringChangeWeeks, ... } }],
    activeGuitarId: 'default',
    maintenanceStates: { daily: [...], weekly: [...], eightweek: [...], ... },
    humidityReadings: [{ humidity, temp, timestamp, guitarId }],
    inspectionData: { ... }
}
```

### Legacy Keys (for migration)
- `guitarMaintenanceData` - Old maintenance task states
- `humidityReadings` - Old humidity log entries
- `inspectionData` - Old inspection checkbox states
- `theme` - Light/dark mode preference

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
- Event handlers wired in `app.js` (not inline onclick)

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

### Before Editing
1. Read this file and understand constraints
2. Test current functionality in Safari
3. Run tests: open `test.html` in browser

### While Editing
- Modify appropriate module in `js/` directory
- Maintain ES module import/export patterns
- Test mobile viewport (390px)
- Test both light and dark themes
- Verify localStorage read/write

### After Editing
- Run all 62 tests (test.html)
- Test offline functionality
- Verify no console errors
- Check touch target sizes (44pt min)
- Test on actual iPhone if possible

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
