# Guitar Tracker - User Review Guide

**Live Site:** https://michaeltorres0.github.io/guitar-tracker/

Thanks for reviewing Guitar Tracker! This guide walks you through testing the app. Please note any bugs, confusing UI, or suggestions as you go.

---

## What This App Does

Guitar Tracker helps acoustic guitar owners (specifically Taylor GS Mini) maintain their instrument by:
- Tracking maintenance tasks (daily cleaning, string changes, etc.)
- Monitoring humidity levels (critical for preventing wood damage)
- Providing inspection checklists with professional recommendations
- Alerting when conditions become dangerous

**Target User:** Hobbyist guitarist who wants to keep their guitar in good shape without being overwhelmed.

---

## Quick Start (2 minutes)

1. Open the site on your phone (works best on mobile)
2. You'll land on the **Dashboard** tab
3. Notice the offline indicator in the header - this works without internet!
4. Try the **Dark Mode** toggle in the header

---

## Testing Walkthrough

### Test 1: Dashboard Overview

**What you're seeing:**
- **Overall Completion %** - How many tasks are done across all time periods
- **Days Since String Change** - Countdown (green = good, yellow = soon, red = overdue)
- **Current Humidity** - Latest reading with Safe/Warning/Danger badge
- **String Life Calculator** - Visual bar showing estimated string life remaining
- **Maintenance Calendar** - Month view with highlighted due dates

**Try this:**
- [ ] Does the dashboard load correctly?
- [ ] Is the layout readable on mobile?
- [ ] Can you understand what each metric means at a glance?

---

### Test 2: Maintenance Tasks

Tap the **Maintenance Tasks** tab (wrench icon).

**What you're seeing:**
5 task categories organized by frequency:
- **Daily** (3 tasks) - After each playing session
- **Weekly** (3 tasks) - Every 7 days
- **8-Week** (8 tasks) - String change & deep clean
- **Quarterly** (3 tasks) - Every 12 weeks
- **Annual** (1 task) - Professional service

**Try this:**
- [ ] Check off a few tasks - do they save?
- [ ] Expand "+ Why & How" on any task - is the info helpful?
- [ ] Refresh the page - do your checkmarks persist?
- [ ] Uncheck a task you just checked - does it ask for confirmation?

**Quick Action Test:**
- [ ] Find the "Just Played" button (should be near daily tasks)
- [ ] Tap it - does it complete all daily tasks at once?
- [ ] Does the button show feedback ("Daily Tasks Logged!")?

---

### Test 3: Humidity Logging

Tap the **Humidity Log** tab (water drop icon).

**What you're seeing:**
- Quick form to log humidity readings
- Statistics panel (latest reading, 24h change, 7-day range)
- 7-day trend chart (appears after 2+ readings)
- History table with all readings

**Try this:**
- [ ] Enter a humidity reading (try 47%) and tap "Log Reading Now"
- [ ] Does it show a success message?
- [ ] Add another reading (try 58% to trigger an alert)
- [ ] Go back to Dashboard - do you see a red "Critical High Humidity" alert?
- [ ] Add a few more readings and check if the chart appears
- [ ] Try deleting a reading using the X button in the table
- [ ] Test the filters (date range, location) - do they work?
- [ ] Export filtered data - does the CSV download?

**Validation Test:**
- [ ] Try entering humidity over 100 - does it reject it?
- [ ] Try leaving humidity blank - does it show an error?

---

### Test 4: Inspections

Tap the **Inspections** tab (magnifying glass icon).

**What you're seeing:**
3 inspection checklists:
- **Bridge Wing Lift Check** (Weekly) - 2 items
- **Action & Buzzing Check** (Quarterly) - 3 items
- **Fret Feel Check** (Every string change) - 3 items

Plus safety alerts about what products to use/avoid.

**Try this:**
- [ ] Complete all items in one inspection section
- [ ] Does it show "Completed" with the date and next due date?
- [ ] Tap "If Detected → Recommended Actions" button
- [ ] Does the modal open with helpful troubleshooting info?
- [ ] Can you close the modal (X button or bottom button)?
- [ ] Is the Safety Alerts section clear about do's and don'ts?

---

### Test 5: Equipment

Tap the **Equipment** tab (box icon).

**What you're seeing:**
- Checklist of 15 recommended equipment items
- Priority items section for things to buy

**Try this:**
- [ ] Check off some equipment items
- [ ] Refresh - do selections persist?
- [ ] Is the priority section helpful for knowing what to buy first?

---

### Test 6: Export & Settings

Tap the **Export & Settings** tab (download icon).

**What you're seeing:**
- Backup & Restore section
- Export buttons (CSV and JSON)
- Reset buttons for tasks
- Quick reference calendar

**Try this:**
- [ ] Tap "Create Backup" - does a JSON file download?
- [ ] Tap "Export as CSV" - does a CSV file download?
- [ ] Open the downloaded files - do they contain your data?
- [ ] Read the "Quick Reference" calendar - is it clear?

**Dangerous Tests (optional):**
- [ ] "Reset Daily Tasks" - does it ask for confirmation?
- [ ] "Clear All Data" - does it ask TWICE for confirmation?
- [ ] If you cleared data, try restoring from your backup file

---

### Test 7: Alerts System

Go back to **Dashboard**.

**Alert Types to Trigger:**
1. **Critical High Humidity** (red) - Log a reading >55%
2. **Low Humidity Warning** (yellow) - Log a reading <40%
3. **Maintenance Overdue** (blue) - Should appear if tasks are past due

**Try this:**
- [ ] Do alerts appear at the top of the page?
- [ ] Are they noticeable but not overwhelming?
- [ ] Is the messaging clear about what action to take?

---

### Test 8: Offline Mode

**Try this:**
- [ ] Turn off WiFi/airplane mode on your phone
- [ ] Refresh the page
- [ ] Does the app still work?
- [ ] Can you log humidity readings offline?
- [ ] Do tasks still save offline?

---

### Test 9: Mobile Experience

**Check these on your phone:**
- [ ] Can you tap all buttons easily? (no tiny targets)
- [ ] Is there any horizontal scrolling? (there shouldn't be)
- [ ] Is text readable without zooming?
- [ ] Do forms work well with the phone keyboard?
- [ ] Does the tab bar scroll if needed?

---

## Feedback Questions

After testing, please answer:

1. **First Impression:** What did you think when you first opened the app?

2. **Clarity:** Was anything confusing or unclear?

3. **Usefulness:** Would this actually help you maintain a guitar?

4. **Missing Features:** What would you add?

5. **Annoyances:** What frustrated you or felt clunky?

6. **Design:** How does it look? Any visual improvements?

7. **Bugs:** Did anything break or behave unexpectedly?

8. **Mobile:** How was the phone experience specifically?

---

## Known Limitations

- This is for Taylor GS Mini specifically (some specs are guitar-specific)
- No cloud sync - data lives only in your browser
- No push notifications yet (planned for future)
- Chart requires 2+ humidity readings to appear

---

## How to Report Issues

Please note:
- What you were trying to do
- What happened instead
- What device/browser you used
- Screenshot if possible

Thanks for your help!
