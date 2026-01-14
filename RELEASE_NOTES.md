# Guitar Tracker - Release Notes

---

# v2.1.1 - Test Infrastructure Fixes

**Release Date:** January 2026

## Summary

This patch release fixes critical issues with the test infrastructure that prevented tests from running in Node.js environments. The core application functionality is unchanged.

## Bug Fixes

### Test Environment Compatibility
- **Fixed:** Module-level `window` assignments causing `ReferenceError: window is not defined` in Node.js
- **Affected files:** `ui.js`, `sessions.js`, `onboarding.js`, `stringHistory.js`
- **Solution:** Wrapped all window assignments with `if (typeof window !== 'undefined')` checks

### Humidity Display Fix
- **Fixed:** Null temperature values displaying as `null°F` in humidity log table
- **Solution:** Added null check with fallback to em-dash (`—`) for missing temperature values

### Test Setup Improvements
- **Fixed:** Test modules loading before global DOM environment was configured
- **Solution:** Converted `test-setup.js` to use dynamic imports, ensuring globals are set first
- **Added:** LocalStorage mock for reliable test execution

## Technical Details

| Metric | Value |
|--------|-------|
| Files Modified | 6 |
| Tests Passing | 48/62 |
| Breaking Changes | None |

## Files Changed

1. `js/ui.js:169-179` - Window assignment wrapped
2. `js/sessions.js:125-129` - Window assignment wrapped
3. `js/onboarding.js:212-220` - Window assignment wrapped
4. `js/stringHistory.js:126-131` - Window assignment wrapped
5. `js/humidity.js:138` - Null temperature handling
6. `tests/test-setup.js` - Dynamic imports
7. `tests/test.js` - LocalStorage mock, async setup

---

# v2.0 - Major Feature Release

## Overview

Major update implementing 7 enhancements across 3 development sprints. This release transforms the first-time user experience, adds comprehensive data tracking, and provides intelligent insights for guitar maintenance.

**Release Date:** January 2026
**Version:** 2.0.0
**Total Enhancements:** 7
**New Modules:** 3 (onboarding.js, sessions.js, stringHistory.js)
**Lines Added:** ~1,147

---

## 🎯 Sprint 1: Polish & UX Improvements

### 1.1 Empty State Improvements ✨

**Problem:** Dashboard showed "—" symbols making the app look broken for new users.

**Solution:**
- Replaced all em dashes with helpful, contextual messages
- Added call-to-action links that navigate to relevant tabs
- Consistent `.empty-state` styling across all components

**Examples:**
- Current Humidity: "No readings yet" → "Log first reading →"
- Days Since String Change: "—" → "Log your first string change" + "Go to 8-Week Tasks →"
- String Life Calculator: "0% life" → "Complete setup to start tracking"
- 24h Change: "—" → "Need 24h of data"

**Impact:** New users immediately understand what actions to take.

---

### 1.2 Guitar Model Identification 🎸

**Problem:** Users didn't know the app was Taylor GS Mini-specific.

**Solution:**
- Added "Configured for Taylor GS Mini Sapele" badge in header
- Model-specific measurements labeled with "GS Mini" indicators
- Action specs (High E: 1.5-2mm, Low E: 2-2.5mm) clearly marked
- 23.5" scale length references labeled throughout

**Impact:** Clear communication that specs are model-specific.

---

### 1.3 Contextual Humidity Reference 💧

**Problem:** Humidity thresholds only visible on Dashboard tab.

**Solution:**
- Visual threshold legend on Humidity Log tab:
  - 45-50% Target (green)
  - 40-55% Safe (blue)
  - <40% Low (yellow)
  - \>55% High (red)
- Real-time input validation with color-coded borders
- Visual feedback doesn't block form submission

**Impact:** Users always know if their readings are concerning.

---

## 🚀 Sprint 2: First-Time User Onboarding

### 2.1 Onboarding Wizard 🪄

**Problem:** New users saw empty dashboard with no way to seed initial data.

**Solution:**
- 4-step wizard appears automatically on first visit
- Never repeats after completion or skip
- Mobile-responsive with smooth animations

**Steps:**
1. **Welcome** - Value proposition and setup preview
2. **String Change Date** - Date picker with "I Don't Remember" option
3. **Playing Frequency** - 4 options mapped to hours/week:
   - Daily: 7 hrs/week
   - Few times/week: 4 hrs/week
   - Weekly: 2.5 hrs/week (default)
   - Occasionally: 1 hr/week
4. **Hygrometer Check** - Yes/No with equipment recommendation

**Data Collection:**
- Seeds string change task (8w-8) with lastCompleted date
- Stores playingFrequency and playingHoursPerWeek
- Stores hasHygrometer flag
- Sets onboardingComplete to prevent repeat

**Impact:**
- Dashboard immediately shows relevant data
- String Life Calculator activated with user's actual data
- Empty states disappear, replaced with meaningful information
- Header updates with user's playing schedule

**UI/UX:**
- Step indicator dots (active/completed states)
- Skip option on every step
- Back/Next navigation
- Success message: "Setup Complete! Welcome!"

---

## 📊 Sprint 3: Data Tracking Enhancements

### 3.1 Playing Session Logging ⏱️

**Problem:** String Life Calculator used hardcoded 2.5 hrs/week assumption.

**Solution:**
- "Just Played" button now shows duration picker
- 4 quick options: 15min, 30min, 1hr, 2hr+
- Sessions stored with timestamp and duration
- Rolling 2-week average (requires 3+ sessions)
- Dashboard displays "This week: X hrs"

**Calculations:**
- Average calculated from last 14 days of sessions
- Fallback to onboarding/default for <3 sessions
- Header subtitle updates with calculated average

**Impact:**
- String Life Calculator uses actual playing habits
- Users see "Based on X hrs/week (your average)"
- Accurate maintenance schedule recommendations

**localStorage:**
- `playingSessions`: Array of {timestamp, duration}
- `playingHoursPerWeek`: Updated dynamically

---

### 3.2 String Change History 📜

**Problem:** Only tracked current counter, no historical record.

**Solution:**
- Brand prompt modal after completing string change task
- Optional brand input (e.g., "D'Addario EJ16", "Elixir Nanoweb")
- History table in Export & Settings
- Calculate average string life from 2+ changes

**History Display:**
- Average string life badge (e.g., "52 days")
- Sortable table: Date | Brand | Days Used
- Days automatically calculated between consecutive changes
- Empty state for new users

**Example:**
```
Average String Life: 52 days

Jan 3, 2026   | D'Addario EJ16  | 45 days
Nov 19, 2025  | D'Addario EJ16  | 58 days
Sep 22, 2025  | Elixir Nanoweb  | —
```

**Impact:**
- Track string brand preferences
- Optimize string change timing based on actual usage
- Identify which brands last longer

**localStorage:**
- `stringChangeHistory`: Array of {date, brand, daysFromPrevious}

---

### 3.3 Humidity Trend Context 📈

**Problem:** 24h Change didn't indicate if rate was concerning.

**Solution:**
- Color-coded severity indicators:
  - **Green** (<5%): Normal variation (safe)
  - **Yellow** (5-10%): Moderate stress (caution)
  - **Red** (>10%): High stress (danger)
- Direction arrows: ↑ rising, ↓ falling
- Info icon (ⓘ) opens educational modal

**Educational Modal Content:**
- Severity scale explanation
- Potential damage from rapid changes:
  - Finish cracking
  - Glue joint stress
  - Bridge movement/lifting
  - Fret sprout
- Prevention tips (keep in case with Humidipak)

**Example Display:**
- Safe: `↑ +2.3%` (green)
- Caution: `↓ -7.5%` (yellow)
- Danger: `↑ +12.1%` (red, bold) + alert

**Impact:**
- Users immediately know if they need to take action
- Educational content explains why rapid changes matter
- Proactive prevention of expensive repairs

---

## 🔧 Technical Improvements

### New Modules

1. **onboarding.js** (210 lines)
   - Multi-step wizard logic
   - Data collection and validation
   - Integration with tasks and storage

2. **sessions.js** (114 lines)
   - Playing session tracking
   - Rolling average calculations
   - Weekly hours display

3. **stringHistory.js** (123 lines)
   - String change history management
   - Average string life calculator
   - History table renderer

### Enhanced Modules

- **ui.js**: Empty states, dashboard updates, weekly hours display
- **tasks.js**: Integration with session logging and string history
- **app.js**: Module initialization and event handlers
- **css/styles.css**: New components, modals, color classes

### localStorage Schema

**New Keys:**
- `onboardingComplete` (boolean)
- `playingFrequency` (enum)
- `playingHoursPerWeek` (number, dynamic)
- `hasHygrometer` (boolean)
- `playingSessions` (array)
- `stringChangeHistory` (array)

**Total Storage:** ~6 new keys, all optional and non-breaking

---

## 📱 Mobile Responsive

All new features fully responsive:
- Onboarding: Full-screen on mobile, stacked buttons
- Session duration: 2-column grid → 1-column on mobile
- String history: Horizontal scroll table
- Humidity trend modal: Full-height on small screens

**Tested:** iPhone SE (375px), iPhone 14/15 (390px), iPad (768px)

---

## 🎓 User Experience Flow

### First-Time User Journey

1. **Load App** → Onboarding modal appears after 500ms
2. **Complete Setup** → Enter string change date, playing frequency, hygrometer status
3. **See Dashboard** → All metrics populated with real data
4. **Log Session** → Click "Just Played" → Select duration → Tasks completed
5. **Track Progress** → Watch weekly hours accumulate
6. **Change Strings** → Complete task → Enter brand → View history
7. **Monitor Humidity** → See color-coded changes → Learn from info modal

### Returning User Journey

1. **Load App** → No onboarding (completed once)
2. **Dashboard** → See this week's hours, string life %, humidity trends
3. **Quick Actions** → Log sessions, complete tasks, check thresholds
4. **Review History** → View string changes, average life, session totals

---

## 🐛 Bug Fixes

- Fixed String Life Calculator showing "0% life" on empty state
- Fixed header subtitle not updating with onboarding data
- Fixed 24h change showing "—" instead of helpful message
- Fixed modal z-index conflicts (onboarding now 2000)

---

## ⚠️ Breaking Changes

**None.** All changes are additive and backwards-compatible.

**Migration:** Existing users will not see onboarding (flag checks for data). All new localStorage keys are optional.

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Commits | 3 |
| Files Modified | 11 |
| Files Added | 3 |
| Lines Added | 1,147 |
| New Features | 7 |
| New Modals | 5 |
| New localStorage Keys | 6 |
| Test Cases Added | 21 |

---

## 🚀 Future Enhancements (Roadmap)

### Considered for v3.0:
- Govee API integration for automatic humidity logging
- Browser notifications (iOS 16.4+)
- iOS Shortcuts integration
- Time budgeting display (time since last session)
- Equipment maintenance tracking
- Photo attachments for inspection logs
- Multi-guitar support
- Data sync across devices

---

## 🙏 Acknowledgments

Designed and developed with focus on:
- **User-first approach**: Every feature solves a real problem
- **Mobile optimization**: PWA-first design for iPhone Safari
- **Data integrity**: Robust localStorage with error handling
- **Educational content**: Teach users why maintenance matters
- **Accessibility**: 44pt touch targets, semantic HTML, ARIA labels

---

## 📞 Support

For issues, feature requests, or feedback:
- **GitHub Issues:** https://github.com/michaeltorres0/guitar-tracker/issues
- **Live Demo:** https://michaeltorres0.github.io/guitar-tracker/

---

## 📝 Version History

- **v2.0.0** (January 2026) - Sprint 1-3 implementation
- **v1.0.0** (Previous) - Initial release with basic tracking

---

**Happy maintaining! 🎸✨**
