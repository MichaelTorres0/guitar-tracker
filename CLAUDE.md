# Guitar Tracker - Development Guide

A Progressive Web App for tracking maintenance, humidity, and care for a Taylor GS Mini Sapele acoustic guitar.

## Quick Reference

- **Live URL:** https://michaeltorres0.github.io/guitar-tracker/
- **Architecture:** Modular ES modules (separate files)
- **Data storage:** localStorage only (offline-capable)
- **Target device:** iPhone Safari (iOS 16.4+)

## Architecture

### File Structure
```
guitar-tracker/
├── index.html              # HTML structure and entry point
├── css/
│   └── styles.css          # All application styles
├── js/
│   ├── app.js              # Main application entry point
│   ├── config.js           # Constants, thresholds, task definitions
│   ├── storage.js          # localStorage operations
│   ├── validators.js       # Input validation
│   ├── humidity.js         # Humidity analysis and logging
│   ├── tasks.js            # Task management and calculations
│   ├── ui.js               # UI rendering and DOM manipulation
│   └── export.js           # CSV/JSON export functions
├── tests/
│   └── test.js             # Test suite
├── manifest.json           # PWA manifest
├── icon.png                # App icon (180x180)
├── CLAUDE.md               # This file
├── README.md               # User documentation
└── SPECIFICATION.md        # Detailed specs and roadmap
```

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| `config.js` | MAINTENANCE_TASKS, EQUIPMENT_ITEMS, thresholds, DATA_VERSION |
| `storage.js` | load/save data, migration, error handling |
| `validators.js` | Validate humidity, temperature, form inputs |
| `humidity.js` | Add readings, analyze trends, chart data |
| `tasks.js` | Toggle tasks, calculate next due, string life |
| `ui.js` | Render components, handle tabs, modals, themes |
| `export.js` | Generate CSV/JSON exports, download handling |
| `app.js` | Initialize app, wire up event handlers |

### localStorage Keys
- `guitarMaintenanceData` - Maintenance task states (versioned)
- `humidityReadings` - Humidity log entries
- `inspectionData` - Inspection checkbox states
- `theme` - Light/dark mode preference

## Critical Constraints

1. **No build step required** - ES modules work natively in browser
2. **No external frameworks** - Vanilla JS only (optional Chart.js for humidity)
3. **Mobile-first** - Test at 390px width (iPhone 14/15)
4. **44pt touch targets** - iOS Human Interface Guidelines
5. **Offline-first** - Must work 100% without network (after initial load)
6. **Never lose data** - Robust localStorage error handling with try/catch

## Code Style

### JavaScript (ES Modules)
```javascript
// Each module exports its public API
export const ModuleName = {
    publicFunction() { /* ... */ },
    anotherFunction() { /* ... */ }
};

// Or export individual functions
export function doSomething() { /* ... */ }

// Import in other modules
import { ModuleName } from './modulename.js';
import { doSomething } from './other.js';
```

### Module Guidelines
- Each file is a self-contained ES module
- Use named exports (not default exports) for clarity
- Keep modules focused on single responsibility
- Import only what you need
- Avoid circular dependencies

### CSS
- CSS custom properties for theming (--color-*)
- Mobile-first responsive design
- No horizontal scroll at 390px width
- BEM-like naming for complex components

### HTML
- Semantic markup where possible
- Event handlers attached via JavaScript (not inline)
- `<script type="module">` for ES module support

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
2. Run existing tests: `npm test`
3. Test current functionality in Safari

### While Editing
- Keep related code in appropriate module
- Add validation for any user inputs
- Test mobile viewport (390px)
- Test both light and dark themes
- Verify localStorage read/write

### After Editing
- Run tests: `npm test`
- Test offline functionality
- Verify no console errors
- Check touch target sizes (44pt min)
- Test on actual iPhone if possible

### Adding New Features
1. Determine which module(s) need changes
2. Write tests first (TDD)
3. Implement in appropriate module
4. Export new functions if needed by other modules
5. Update app.js if new initialization needed

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

### Offline Support
For true offline support, add a service worker (sw.js) that caches:
- index.html
- css/styles.css
- All js/*.js modules
- manifest.json
- icon.png

## Testing

### Running Tests
```bash
npm test
```

### Test Structure
Tests use JSDOM to simulate browser environment. Each module has corresponding test coverage.

### Testing Checklist
- [ ] All task categories render
- [ ] Checkboxes persist across reload
- [ ] "Just Played" completes daily tasks
- [ ] Humidity form validates input (rejects invalid values)
- [ ] Dashboard updates in real-time
- [ ] Theme toggle works
- [ ] Export generates valid files
- [ ] No horizontal scroll at 390px
- [ ] Works offline after first load
- [ ] Data migration works for version changes

## Future Enhancements (v2.1+)

- Service worker for true offline caching
- Govee API integration for auto humidity logging
- Browser notifications (iOS 16.4+)
- iOS Shortcuts generator
- Multi-guitar support
- Smart recommendations engine
