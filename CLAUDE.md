# Guitar Tracker - Development Guide

A Progressive Web App for tracking maintenance, humidity, and care for a Taylor GS Mini Sapele acoustic guitar.

## Quick Reference

- **Live URL:** https://michaeltorres0.github.io/guitar-tracker/
- **Single file app:** All code is in `index.html`
- **Data storage:** localStorage only (offline-capable)
- **Target device:** iPhone Safari (iOS 16.4+)

## Architecture

### Single HTML File Structure
```
index.html
├── <head>
│   ├── PWA meta tags
│   └── Embedded CSS (700+ lines)
├── <body>
│   ├── Header with theme toggle
│   ├── Alert container
│   ├── Tab navigation (6 tabs)
│   ├── Tab content sections
│   └── Modals (3 emergency action modals)
└── <script>
    ├── Data structures (MAINTENANCE_TASKS, EQUIPMENT_ITEMS)
    ├── localStorage functions
    ├── Task rendering and toggle
    ├── Humidity logging and charting
    ├── Dashboard calculations
    └── Export/reset functions
```

### localStorage Keys
- `guitarMaintenanceData` - Maintenance task states
- `humidityReadings` - Humidity log entries
- `inspectionData` - Inspection checkbox states
- `theme` - Light/dark mode preference

## Critical Constraints

1. **No external libraries** - Vanilla JS only (optional Chart.js for humidity)
2. **Single HTML file** - Keep all CSS/JS embedded
3. **Mobile-first** - Test at 390px width (iPhone 14/15)
4. **44pt touch targets** - iOS Human Interface Guidelines
5. **Offline-first** - Must work 100% without network
6. **Never lose data** - Robust localStorage error handling

## Code Style

### JavaScript
- Vanilla JavaScript only, no frameworks
- All functions are global (not modules)
- localStorage operations use try/catch where needed

### CSS
- CSS custom properties for theming
- Mobile-first responsive design
- No horizontal scroll at 390px width

### HTML
- Semantic markup where possible
- Inline onclick handlers (single-file constraint)

## Key Functions

| Function | Purpose |
|----------|---------|
| `init()` | Load data, render UI, check migration |
| `toggleTask(taskId)` | Mark task complete/incomplete |
| `quickActionJustPlayed()` | Complete all daily tasks |
| `addHumidityReadingSimplified()` | Log humidity with auto-timestamp |
| `updateDashboard()` | Recalculate all metrics |
| `checkForAlerts()` | Scan for critical conditions |
| `drawHumidityChart()` | Render 7-day trend canvas |

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

### While Editing
- Keep all code in index.html
- Test mobile viewport (390px)
- Test both light and dark themes
- Verify localStorage read/write

### After Editing
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
