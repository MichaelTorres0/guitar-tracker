# Taylor GS Mini Maintenance Tracker

A Progressive Web App (PWA) for tracking maintenance, humidity, and care tasks for a Taylor GS Mini Sapele acoustic guitar.

**Live App:** https://michaeltorres0.github.io/guitar-tracker/

## Features

### Dashboard
- One-tap "Just Played" button to log all daily tasks
- Real-time humidity status with color-coded alerts
- String life calculator based on playing time and cleaning habits
- Period completion progress bars (Daily, Weekly, 8-Week, Quarterly, Annual)
- Upcoming maintenance calendar

### Maintenance Tasks
- **Daily (3 tasks):** String cleaning, body wipedown, humidity check
- **Weekly (3 tasks):** Hardware check, bridge monitoring, Humidipak inspection
- **8-Week (8 tasks):** String change cycle with deep cleaning
- **Quarterly (3 tasks):** Humidipak replacement, truss rod observation, structural inspection
- **Annual (1 task):** Taylor Refresh professional service

Each task includes expandable "Why" and "How" explanations.

**NEW:** Enhanced task completion UX with:
- Visual completion badges ("✓ Completed Today", "✓ Completed This Week")
- Relative time display (e.g., "3 days ago")
- Duplicate logging prevention with confirmation dialogs
- Color-coded status indicators for tasks completed within their period

### Humidity Tracking
- Simple logging form with auto-captured timestamps
- 7-day trend chart with color-coded safety zones
- 24-hour change tracking
- Historical log with status badges

**NEW:** Advanced filtering and export:
- Filter by date range (from/to dates)
- Filter by location (In Case / Out of Case)
- Export filtered results to CSV
- Clear filters with one click

### Inspections
- **Weekly:** Bridge wing lift check (2 items)
- **Quarterly:** Action & buzzing check (3 items)
- **Every String Change:** Fret feel check (3 items)
- Emergency action modals with step-by-step guidance

### Equipment Inventory
- MusicNomad MN290 Work Station checklist (15 items)
- Priority items to add with urgency levels

### Export & Settings
- CSV export for spreadsheet analysis
- JSON backup for data restoration
- Task reset functions
- Manual reminder setup guides

**NEW:** Enhanced backup & restore:
- Visual backup status (last backup date, data size)
- One-click timestamped backup creation
- File-based restore with validation
- Preview backup contents before restoring
- Automatic data safety checks

## Technical Details

- **ES modules architecture** with separate CSS and JS files
- **localStorage** for offline-capable data persistence (versioned schema v3)
- **No external dependencies** (vanilla JavaScript)
- **Mobile-first design** optimized for iPhone Safari
- **62 tests** for validation and business logic
- **Node.js compatible** - Window assignments wrapped for test environment support

**NEW in v2.1:**
- **Fully responsive** with breakpoints for 480px, 375px (iPhone SE)
- **iOS HIG compliant** - all touch targets meet 44px minimum
- **Horizontal scrollable tabs** with snap scrolling on mobile
- **16px input font size** to prevent iOS auto-zoom
- **Print-friendly CSS** for maintenance schedules
- **Offline mode indicator** with pulsing green dot

## Installation (Add to Home Screen)

1. Open https://michaeltorres0.github.io/guitar-tracker/ in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will appear with a custom icon

## Humidity Thresholds

| Range | Status | Risk |
|-------|--------|------|
| 45-50% | Target | Optimal |
| 40-55% | Safe | Normal |
| <40% | Low | Fret sprout risk |
| >55% | High | Bridge lifting risk |

**Critical Warning:** GS Mini bridge lifting occurs at RH >55-60%. Repair cost: $150-200.

## Development

See [CLAUDE.md](CLAUDE.md) for development guidelines.

### Quick Start
1. Clone the repository
2. Open `index.html` in a browser
3. All functionality works offline

### File Structure
```
guitar-tracker/
├── index.html           # HTML structure
├── css/
│   └── styles.css       # All styles
├── js/
│   ├── app.js           # Entry point, init
│   ├── config.js        # Task definitions, thresholds
│   ├── storage.js       # Data persistence, migration (v3)
│   ├── validators.js    # Input validation
│   ├── humidity.js      # Humidity features
│   ├── tasks.js         # Task management
│   ├── ui.js            # DOM rendering
│   ├── export.js        # Export functions
│   ├── onboarding.js    # First-time user wizard (v2.0)
│   ├── sessions.js      # Playing session tracking (v2.0)
│   └── stringHistory.js # String change history (v2.0)
├── tests/
│   ├── test.js          # Test suite (62 tests)
│   └── test-setup.js    # Test environment setup
├── test.html            # Browser test runner
├── manifest.json        # PWA manifest
├── CLAUDE.md            # Development guidelines
├── SPECIFICATION.md     # Full feature specification
├── RELEASE_NOTES.md     # Version history
└── README.md            # This file
```

## License

This project is for personal use.

## Version

v2.1.1 - January 2026 (Test Infrastructure Fixes)

### Recent Changes (v2.1.1)
- Fixed Node.js compatibility for test environment
- Window assignments now wrapped with `typeof window !== 'undefined'` checks
- Fixed null temperature display in humidity log table
- Improved test setup with dynamic module loading
