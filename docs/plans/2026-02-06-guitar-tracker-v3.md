# Guitar Tracker v3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform a single-guitar localStorage PWA into a multi-guitar system with bidirectional Notion sync, deployed on Vercel at guitar.katieanneandmike.com.

**Architecture:** Vanilla JS PWA (public/) + Vercel serverless API routes (api/) that proxy to Notion. Single consolidated localStorage key (v6 schema) preserves offline-first safety. Song library cached separately (expendable). Sync queue in main key (never lose unsent data).

**Tech Stack:** Vanilla JS (ES modules), @notionhq/client SDK, Vercel serverless functions, localStorage, Service Worker for offline caching.

**Source of Truth:** `SPEC_V3_AMENDED.md` in project root. Read it before starting any task.

**Current State:**
- 14 JS modules (~4,700 LOC) in `js/`
- localStorage v5 consolidated schema
- Tests: `node tests/test.js` (94 tests, custom framework with assertEqual/assertTrue)
- Live at GitHub Pages (will move to Vercel)
- Known bug: `playingHours` reference error in init()

**Test Commands:**
- Frontend: `node tests/test.js`
- API (local): `npx vercel dev` then `curl http://localhost:3000/api/sync/status`

---

## Phase 1: Infrastructure & Bug Fix

### Task 1: Fix the playingHours Bug

**Files:**
- Modify: `js/ui.js` (the `updateDashboard()` function references `playingHours` which is undefined in scope)
- Modify: `js/app.js` (the init function wraps in try/catch but the error propagates)
- Test: `tests/test.js`

**Step 1: Locate the exact bug**

Search for `playingHours` across all JS files. The error in the iOS screenshots says `"Can't find variable: playingHours"` during `updateDashboard()` in `ui.js`. Read `ui.js` and find where `playingHours` is referenced without being defined. It's likely a variable that should be `playingHoursPerWeek` (from versioned data) or calculated from sessions.

**Step 2: Write a test that exercises the bug path**

In `tests/test.js`, add:
```javascript
runTest('updateDashboard does not throw with default data', () => {
    // Reset to clean state
    storage.clear();
    const data = createDefaultData();
    saveVersionedData(data);
    loadData();
    // This should not throw
    try {
        updateDashboard();
        assertTrue(true, 'updateDashboard completed without error');
    } catch (e) {
        assertTrue(false, `updateDashboard threw: ${e.message}`);
    }
});
```

**Step 3: Run test to verify it fails**

Run: `node tests/test.js`
Expected: FAIL with "playingHours is not defined" or similar

**Step 4: Fix the bug**

In `ui.js`, find the line referencing `playingHours` and replace with the correct variable. This is likely `getVersionedField('playingHoursPerWeek', 2.5)` or the result of `calculateAverageHoursPerWeek()` from sessions.js.

**Step 5: Run test to verify it passes**

Run: `node tests/test.js`
Expected: ALL PASS (including new test)

**Step 6: Commit**

```bash
git add js/ui.js tests/test.js
git commit -m "fix: resolve playingHours reference error in updateDashboard

The variable was referenced without being defined in scope.
Replaced with proper getVersionedField() call.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Restructure Repo for Vercel

**Files:**
- Create: `public/` directory
- Move: All static files into `public/`
- Create: `api/` directory structure
- Create: `api/_lib/notion.js`
- Create: `api/_lib/auth.js`
- Modify: `.gitignore`

**Step 1: Create directory structure**

```bash
mkdir -p public/css public/js public/icons
mkdir -p api/_lib api/notion api/sync
mkdir -p scripts
```

**Step 2: Move static files to public/**

```bash
# Move HTML
mv index.html public/
mv test.html public/

# Move JS modules
mv js/*.js public/js/

# Move CSS
mv css/styles.css public/css/

# Move icons
mv icon-192.png public/icons/
mv icon-512.png public/icons/

# Move manifest
mv manifest.json public/

# Move tests (keep at root for node access)
# tests/ stays at root
```

**Step 3: Update all import paths in public/js/app.js**

Since files moved from `js/` to `public/js/`, internal imports between modules stay the same (relative `./config.js` etc). But `index.html` script src changes from `js/app.js` to `js/app.js` (same relative path from its new location).

Verify: Open `public/index.html`, confirm `<script type="module" src="js/app.js">` path is correct relative to public/.

**Step 4: Update test paths**

Update `tests/test.js` imports to point to `../public/js/` instead of `../js/`:
```javascript
// Old: import { ... } from '../js/config.js';
// New: import { ... } from '../public/js/config.js';
```

Apply to ALL imports in `tests/test.js` and `tests/test-setup.js`.

**Step 5: Run tests to verify nothing broke**

Run: `node tests/test.js`
Expected: ALL 94 PASS

**Step 6: Create api/_lib/notion.js**

```javascript
import { Client } from '@notionhq/client';

export const notion = new Client({ auth: process.env.NOTION_API_KEY });
```

**Step 7: Create api/_lib/auth.js**

```javascript
export function auth(req, res) {
  if (req.headers['x-app-secret'] !== process.env.APP_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
```

**Step 8: Update .gitignore**

Add to `.gitignore`:
```
node_modules/
.env.local
.env*.local
.vercel/
```

**Step 9: Commit**

```bash
git add -A
git commit -m "refactor: restructure repo for Vercel deployment

Move static files to public/, create api/ directory for serverless
functions, update import paths in tests.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Vercel Config and Package Updates

**Files:**
- Create: `vercel.json`
- Modify: `package.json`
- Create: `.env.local.example`

**Step 1: Create vercel.json**

```json
{
  "outputDirectory": "public",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

**Step 2: Update package.json**

```json
{
  "name": "guitar-tracker",
  "version": "3.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node tests/test.js",
    "create-dbs": "node scripts/create-notion-dbs.js"
  },
  "dependencies": {
    "@notionhq/client": "^2.2.0"
  },
  "devDependencies": {
    "jsdom": "^24.1.3"
  }
}
```

**Step 3: Install dependencies**

Run: `npm install`
Expected: `@notionhq/client` installed, `node_modules/` updated

**Step 4: Create .env.local.example**

```
NOTION_API_KEY=ntn_your_key_here
NOTION_SONG_DB=4d5f9175-74fa-429e-aaf7-9ee54e35251a
NOTION_JOURNAL_DB=d92cecec-3b62-4e37-9796-ba8c8791b1f3
NOTION_STRINGS_DB=63310750-12c2-4117-a737-71aabba87c3f
NOTION_HUMIDITY_DB=your_id_here
NOTION_MAINTENANCE_DB=your_id_here
APP_SECRET=your_32_char_secret_here
```

**Step 5: Run tests**

Run: `node tests/test.js`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add vercel.json package.json package-lock.json .env.local.example .gitignore
git commit -m "chore: add Vercel config, update package.json for v3

Add vercel.json with security headers, update to ESM package with
@notionhq/client dependency.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Health Check API Route

**Files:**
- Create: `api/sync/status.js`

**Step 1: Implement the status endpoint**

Create `api/sync/status.js` with the full implementation from SPEC_V3_AMENDED.md Section 9 (GET /api/sync/status). This endpoint:
- Validates X-App-Secret header
- Attempts `notion.databases.retrieve()` for each of the 5 database env vars
- Returns JSON with `notionConnected`, `databases`, and `timestamp`

**Step 2: Verify locally (if vercel CLI available)**

Run: `npx vercel dev`
Then: `curl -H "X-App-Secret: test123" http://localhost:3000/api/sync/status`
Expected: JSON response (databases may show "Not configured" until env vars are set — that's OK)

**Step 3: Commit**

```bash
git add api/sync/status.js
git commit -m "feat: add /api/sync/status health check endpoint

Returns accessibility status for all 5 Notion databases.
First serverless function for the Vercel deployment.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Notion Database Creation Script

**Files:**
- Create: `scripts/create-notion-dbs.js`

**Step 1: Implement the script**

Create `scripts/create-notion-dbs.js` with the full implementation from SPEC_V3_AMENDED.md "Notion Database Creation Script" section. This script:
- Creates "Humidity Log" database under the Guitar Journey page
- Creates "Maintenance Log" database under the Guitar Journey page
- Prints the database IDs for Vercel env var configuration
- Uses `process.env.NOTION_API_KEY` (must be set before running)

**Step 2: Test the script**

Run: `NOTION_API_KEY=ntn_YOUR_TOKEN_HERE node scripts/create-notion-dbs.js`

Expected output:
```
Creating Notion databases...

Humidity Log created. Database ID: <uuid>
Maintenance Log created. Database ID: <uuid>

--- Add these to Vercel Environment Variables ---
NOTION_HUMIDITY_DB=<uuid>
NOTION_MAINTENANCE_DB=<uuid>
```

**Step 3: Record the database IDs**

Save the output IDs — Mike will need these for Vercel env vars. Update MEMORY.md with the actual IDs.

**Step 4: Commit**

```bash
git add scripts/create-notion-dbs.js
git commit -m "feat: add Notion database creation script

One-time script to create Humidity Log and Maintenance Log databases
under the Guitar Journey page in Notion.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Deploy to Vercel

**Files:** None (deployment step)

**Step 1: Connect GitHub repo to Vercel**

This is a manual step OR via CLI:
```bash
npx vercel link
npx vercel deploy
```

**Step 2: Mike adds environment variables in Vercel dashboard**

All 7 env vars from SPEC_V3_AMENDED.md Section 4, Step 2.

**Step 3: Verify deployment**

Visit the Vercel preview URL + `/api/sync/status` with the APP_SECRET header.
Expected: 5 databases showing `accessible: true`

**Step 4: Commit any deployment-related changes (if vercel link created .vercel/)**

```bash
# .vercel/ should already be gitignored
git status  # Should be clean
```

---

## Phase 2: Multi-Guitar Core

### Task 7: Rewrite config.js With Multi-Guitar Profiles

**Files:**
- Modify: `public/js/config.js`
- Test: `tests/test.js`

**Step 1: Write tests for new config structure**

Add to `tests/test.js`:
```javascript
// Guitar config tests
runTest('GUITARS has gs-mini and prs-ce24', () => {
    assertDefined(GUITARS['gs-mini'], 'GS Mini profile exists');
    assertDefined(GUITARS['prs-ce24'], 'CE24 profile exists');
});

runTest('GS Mini has 19 tasks total', () => {
    const gsMiniTasks = Object.keys(TASKS).filter(id => id.startsWith('gs-mini-'));
    assertEqual(gsMiniTasks.length, 19, 'GS Mini has 19 tasks');
});

runTest('CE24 has 24 tasks total', () => {
    const ce24Tasks = Object.keys(TASKS).filter(id => id.startsWith('prs-ce24-'));
    assertEqual(ce24Tasks.length, 24, 'CE24 has 24 tasks');
});

runTest('Each task has required fields', () => {
    for (const [id, task] of Object.entries(TASKS)) {
        assertDefined(task.id, `${id} has id`);
        assertDefined(task.guitar, `${id} has guitar`);
        assertDefined(task.period, `${id} has period`);
        assertDefined(task.name, `${id} has name`);
        assertEqual(task.id, id, `${id} id matches key`);
    }
});

runTest('INSPECTIONS has both guitars', () => {
    assertDefined(INSPECTIONS['gs-mini'], 'GS Mini inspections exist');
    assertDefined(INSPECTIONS['prs-ce24'], 'CE24 inspections exist');
});
```

**Step 2: Run tests — verify they fail**

Run: `node tests/test.js`
Expected: FAIL (GUITARS, TASKS, INSPECTIONS not defined)

**Step 3: Rewrite config.js**

Replace the entire `public/js/config.js` with the full GUITARS, TASKS, INSPECTIONS, and HUMIDITY objects from the original spec Section 7 (referenced in SPEC_V3_AMENDED.md). Keep DATA_VERSION at 5 for now (we'll bump to 6 in Task 8). Keep STORAGE_KEYS. Remove old MAINTENANCE_TASKS (replaced by TASKS).

Export: `DATA_VERSION`, `STORAGE_KEYS`, `GUITARS`, `TASKS`, `INSPECTIONS`, `HUMIDITY_CONFIG`, `EQUIPMENT_ITEMS`, `DEFAULT_GUITAR`

Also export a `TASK_ID_MAP` constant mapping old v5 IDs to new v6 IDs (from SPEC_V3_AMENDED.md migration section).

**Step 4: Update test imports**

Update `tests/test.js` imports to include the new exports:
```javascript
import { GUITARS, TASKS, INSPECTIONS, TASK_ID_MAP } from '../public/js/config.js';
```

**Step 5: Run tests — verify they pass**

Run: `node tests/test.js`
Expected: New tests PASS. Some old tests may fail if they import `MAINTENANCE_TASKS` — fix imports to use `TASKS` or add a backward-compatible re-export.

**Step 6: Commit**

```bash
git add public/js/config.js tests/test.js
git commit -m "feat: rewrite config.js with multi-guitar profiles

Add GUITARS (gs-mini, prs-ce24), TASKS (43 tasks with guitar-specific
IDs), INSPECTIONS (per-guitar checklists), and HUMIDITY_CONFIG.
Includes TASK_ID_MAP for v5→v6 migration.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: v6 localStorage Schema and Migration

**Files:**
- Modify: `public/js/config.js` (bump DATA_VERSION to 6)
- Modify: `public/js/storage.js` (add v6 schema, migrateV5ToV6)
- Test: `tests/test.js`

**Step 1: Write migration tests**

Add to `tests/test.js`:
```javascript
runTest('migrateV5ToV6 preserves humidity readings', () => {
    const v5 = createV5TestData();
    v5.humidityReadings = [
        { id: 'h1', humidity: 47, temp: 68, timestamp: '2026-01-15T10:00:00Z' }
    ];
    const v6 = migrateV5ToV6(v5);
    assertEqual(v6.version, 6, 'Version is 6');
    assertEqual(v6.guitars['gs-mini'].humidity.readings.length, 1, 'Humidity readings preserved');
    assertEqual(v6.guitars['gs-mini'].humidity.readings[0].humidity, 47, 'Reading value preserved');
});

runTest('migrateV5ToV6 remaps task IDs', () => {
    const v5 = createV5TestData();
    v5.maintenanceStates = {
        daily: [
            { id: 'daily-1', completed: true, lastCompleted: '2026-02-01T10:00:00Z' }
        ]
    };
    const v6 = migrateV5ToV6(v5);
    assertDefined(v6.guitars['gs-mini'].tasks['gs-mini-daily-1'], 'Task remapped');
    assertEqual(
        v6.guitars['gs-mini'].tasks['gs-mini-daily-1'].lastCompleted,
        '2026-02-01T10:00:00Z',
        'Completion date preserved'
    );
});

runTest('migrateV5ToV6 creates empty CE24', () => {
    const v5 = createV5TestData();
    const v6 = migrateV5ToV6(v5);
    assertDefined(v6.guitars['prs-ce24'], 'CE24 exists');
    assertEqual(Object.keys(v6.guitars['prs-ce24'].tasks).length, 0, 'CE24 tasks empty initially');
});

runTest('migrateV5ToV6 preserves sessions with guitarId', () => {
    const v5 = createV5TestData();
    v5.playingSessions = [{ timestamp: 1706000000000, duration: 30 }];
    const v6 = migrateV5ToV6(v5);
    assertEqual(v6.sessions[0].guitarId, 'gs-mini', 'Session assigned to GS Mini');
});

runTest('migrateV5ToV6 preserves inventory', () => {
    const v5 = createV5TestData();
    v5.inventory = { items: [{ id: 'i1', name: 'Strings', count: 3 }] };
    const v6 = migrateV5ToV6(v5);
    assertEqual(v6.inventory.items.length, 1, 'Inventory preserved');
});

runTest('migrateV5ToV6 initializes syncQueue', () => {
    const v5 = createV5TestData();
    const v6 = migrateV5ToV6(v5);
    assertArrayLength(v6.syncQueue, 0, 'Sync queue initialized empty');
});

runTest('createDefaultData returns v6 schema', () => {
    const data = createDefaultData();
    assertEqual(data.version, 6, 'Default data is v6');
    assertDefined(data.guitars['gs-mini'], 'GS Mini exists in default');
    assertDefined(data.guitars['prs-ce24'], 'CE24 exists in default');
    assertDefined(data.syncQueue, 'syncQueue exists');
});

// Helper to create v5 test data
function createV5TestData() {
    return {
        version: 5,
        guitars: [{ id: 'default', name: 'Taylor GS Mini Sapele' }],
        activeGuitarId: 'default',
        maintenanceStates: {},
        humidityReadings: [],
        inspectionData: {},
        onboardingComplete: true,
        playingFrequency: 'weekly',
        playingHoursPerWeek: 2.5,
        hasHygrometer: true,
        playingSessions: [],
        stringChangeHistory: [],
        equipmentList: [],
        currentStringType: "D'Addario EJ16",
        lastStringChangeDate: null,
        timerState: { running: false, startTimestamp: null },
        practiceHistory: [],
        inventory: { items: [] }
    };
}
```

**Step 2: Run tests — verify they fail**

Run: `node tests/test.js`
Expected: FAIL (migrateV5ToV6 not defined, createDefaultData returns v5)

**Step 3: Implement v6 schema in storage.js**

In `public/js/storage.js`:
1. Import `TASK_ID_MAP` from config.js
2. Add `migrateV5ToV6(v5Data)` function per SPEC_V3_AMENDED.md
3. Update `migrateData()` to handle `version === 5` → `migrateV5ToV6()`
4. Update `createDefaultData()` to return v6 schema with both guitars
5. Update `loadData()` to work with v6 per-guitar task structure
6. Update `saveData()` to save per-guitar tasks
7. Add helper functions:
   - `getActiveGuitar()` — returns current guitar ID
   - `setActiveGuitar(guitarId)` — set active guitar
   - `getGuitarData(guitarId)` — returns guitar's data subtree
   - `updateGuitarData(guitarId, field, value)` — update guitar-specific field
   - `getGuitarTasks(guitarId)` — returns task states for a guitar
   - `saveGuitarTask(guitarId, taskId, state)` — save a single task state
   - `getGuitarHumidity(guitarId)` — returns humidity readings for guitar
   - `saveGuitarHumidity(guitarId, readings)` — save humidity readings

**Step 4: Bump DATA_VERSION to 6 in config.js**

Change: `export const DATA_VERSION = 6;`

**Step 5: Run tests — verify they pass**

Run: `node tests/test.js`
Expected: ALL PASS (new migration tests + existing tests if they've been updated for new API)

Note: Some existing tests will break because they depend on v5 schema. Fix them to use v6 patterns. This may require updating test helper functions.

**Step 6: Commit**

```bash
git add public/js/config.js public/js/storage.js tests/test.js
git commit -m "feat: implement v6 localStorage schema with v5 migration

Add migrateV5ToV6() with task ID remapping, per-guitar data nesting,
sync queue initialization. All v5 data maps to GS Mini. CE24 starts
empty. Preserves: humidity, sessions, inventory, timer state.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Guitar Selector UI

**Files:**
- Modify: `public/index.html` (add guitar selector, restructure tabs)
- Modify: `public/js/app.js` (wire guitar selector, handle tab visibility)
- Modify: `public/css/styles.css` (guitar selector styling)
- Modify: `public/js/ui.js` (conditional tab rendering)

**Step 1: Add guitar selector HTML**

In `public/index.html`, add a guitar selector bar between the header and tab navigation:
```html
<div class="guitar-selector" id="guitarSelector">
    <button class="guitar-btn active" data-guitar="gs-mini">
        <span class="guitar-icon">&#127794;</span> GS Mini
    </button>
    <button class="guitar-btn" data-guitar="prs-ce24">
        <span class="guitar-icon">&#9889;</span> CE24
    </button>
</div>
```

**Step 2: Add a Songs tab to bottom navigation**

Add a 4th main tab. Restructure the tab bar to: Dashboard | Tasks | Songs | Humidity/Inspect

The 4th tab label changes based on selected guitar:
- GS Mini → "Humidity"
- CE24 → "Inspect"

**Step 3: Wire guitar selector in app.js**

Add event listeners for `.guitar-btn` buttons:
```javascript
document.querySelectorAll('.guitar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const guitarId = btn.dataset.guitar;
        setActiveGuitar(guitarId);
        updateGuitarSelectorUI(guitarId);
        renderForGuitar(guitarId);
    });
});
```

On init, read `getActiveGuitar()` from storage and set the correct button as active.

**Step 4: Add CSS for guitar selector**

Style the selector as a pill toggle bar. Active button gets accent color. Mobile-friendly touch targets (44px min height).

**Step 5: Test manually**

Open `public/index.html` in browser. Verify:
- Guitar selector shows two buttons
- Clicking toggles active state
- Selection persists after reload (stored in localStorage v6)

**Step 6: Commit**

```bash
git add public/index.html public/js/app.js public/css/styles.css public/js/ui.js
git commit -m "feat: add guitar selector UI with persistent toggle

Two-guitar selector at top of app. Selection stored in localStorage.
Tab visibility changes based on selected guitar (humidity for GS Mini,
inspect for CE24).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Per-Guitar Task Rendering

**Files:**
- Modify: `public/js/tasks.js` (work with new TASKS object, per-guitar filtering)
- Modify: `public/js/ui.js` (renderMaintenanceTasks uses active guitar)
- Test: `tests/test.js`

**Step 1: Write tests for per-guitar task filtering**

```javascript
runTest('getTasksForGuitar returns correct tasks', () => {
    const gsMini = getTasksForGuitar('gs-mini');
    const ce24 = getTasksForGuitar('prs-ce24');
    assertEqual(gsMini.length, 19, 'GS Mini has 19 tasks');
    assertEqual(ce24.length, 24, 'CE24 has 24 tasks');
});

runTest('getTasksByPeriod groups correctly for GS Mini', () => {
    const groups = getTasksByPeriod('gs-mini');
    assertEqual(groups.daily.length, 4, 'GS Mini: 4 daily');
    assertEqual(groups.weekly.length, 3, 'GS Mini: 3 weekly');
    assertEqual(groups['string-change'].length, 8, 'GS Mini: 8 string-change');
    assertEqual(groups.quarterly.length, 3, 'GS Mini: 3 quarterly');
    assertEqual(groups.annual.length, 1, 'GS Mini: 1 annual');
    assertTrue(!groups.monthly, 'GS Mini: no monthly');
    assertTrue(!groups['6-month'], 'GS Mini: no 6-month');
});

runTest('getTasksByPeriod groups correctly for CE24', () => {
    const groups = getTasksByPeriod('prs-ce24');
    assertEqual(groups.daily.length, 3, 'CE24: 3 daily');
    assertEqual(groups.weekly.length, 3, 'CE24: 3 weekly');
    assertEqual(groups.monthly.length, 3, 'CE24: 3 monthly');
    assertEqual(groups['string-change'].length, 10, 'CE24: 10 string-change');
    assertEqual(groups.quarterly.length, 2, 'CE24: 2 quarterly');
    assertEqual(groups['6-month'].length, 2, 'CE24: 2 6-month');
    assertEqual(groups.annual.length, 1, 'CE24: 1 annual');
});

runTest('toggleTask only affects selected guitar', () => {
    storage.clear();
    const data = createDefaultData();
    saveVersionedData(data);

    toggleTask('gs-mini-daily-1', 'gs-mini');

    const gsData = getGuitarTasks('gs-mini');
    const ceData = getGuitarTasks('prs-ce24');
    assertDefined(gsData['gs-mini-daily-1'].lastCompleted, 'GS Mini task completed');
    assertTrue(!ceData['prs-ce24-daily-1']?.lastCompleted, 'CE24 task unaffected');
});
```

**Step 2: Run tests — verify they fail**

Run: `node tests/test.js`
Expected: FAIL (getTasksForGuitar, getTasksByPeriod not defined)

**Step 3: Implement per-guitar task functions**

In `public/js/tasks.js`:
1. Import `TASKS` (not old `MAINTENANCE_TASKS`) from config.js
2. Add `getTasksForGuitar(guitarId)` — filters TASKS by guitar field
3. Add `getTasksByPeriod(guitarId)` — groups filtered tasks by period
4. Rewrite `toggleTask(taskId, guitarId)` — saves to per-guitar task state in v6 storage
5. Rewrite `isCompletedWithinPeriod(taskId, guitarId)` — reads from v6 per-guitar state
6. Rewrite `quickActionJustPlayed(guitarId)` — completes daily tasks for specified guitar
7. Update `calculateSmartStringLife(guitarId)` — uses guitar-specific string data

**Step 4: Update ui.js renderMaintenanceTasks()**

`renderMaintenanceTasks()` now takes a `guitarId` parameter (defaults to `getActiveGuitar()`). It calls `getTasksByPeriod(guitarId)` and renders the tasks. Period labels adapt: "String Change" instead of "8-Week". Monthly and 6-Month sections only render for CE24.

**Step 5: Run tests — verify they pass**

Run: `node tests/test.js`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add public/js/tasks.js public/js/ui.js tests/test.js
git commit -m "feat: per-guitar task rendering and completion

Tasks filtered by guitar ID. Completion states stored independently
per guitar. Period grouping adapts to guitar-specific periods
(monthly/6-month for CE24 only).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Per-Guitar Humidity and Sessions

**Files:**
- Modify: `public/js/humidity.js` (use guitar-specific storage, GS Mini only logic)
- Modify: `public/js/sessions.js` (add guitar selection to session flow)
- Modify: `public/js/stringHistory.js` → rename to `public/js/strings.js`
- Test: `tests/test.js`

**Step 1: Write tests**

```javascript
runTest('humidity readings scoped to guitar', () => {
    storage.clear();
    const data = createDefaultData();
    saveVersionedData(data);

    const reading = { id: 'r1', humidity: 47, timestamp: Date.now() };
    addGuitarHumidityReading('gs-mini', reading);

    const gsReadings = getGuitarHumidity('gs-mini');
    const ceReadings = getGuitarHumidity('prs-ce24');
    assertEqual(gsReadings.readings.length, 1, 'GS Mini has reading');
    assertEqual(ceReadings.readings.length, 0, 'CE24 has no readings');
});

runTest('sessions include guitarId', () => {
    storage.clear();
    const data = createDefaultData();
    saveVersionedData(data);

    logSession({ guitarId: 'prs-ce24', duration: 30, focus: ['Songs'] });

    const sessions = getSessions();
    assertEqual(sessions[0].guitarId, 'prs-ce24', 'Session has correct guitar');
});
```

**Step 2: Run tests — verify they fail**

**Step 3: Implement**

- **humidity.js**: Read/write from `guitars[guitarId].humidity.readings` instead of top-level `humidityReadings`. `addHumidityReadingSimplified()` auto-uses `'gs-mini'` since only GS Mini tracks humidity. Hide humidity tab entirely when CE24 is selected.

- **sessions.js**: Add `guitarId` field to session objects. On "Quick Save", record just guitar + duration. Update `logPlayingSession()` to accept `guitarId` parameter. Update rendering to show guitar icon next to each session.

- **strings.js** (renamed from stringHistory.js): Per-guitar string tracking. `saveStringChange(guitarId, brand, notes)` writes to `guitars[guitarId].strings`. Update imports in app.js.

**Step 4: Run tests — verify they pass**

**Step 5: Commit**

```bash
git add public/js/humidity.js public/js/sessions.js public/js/strings.js tests/test.js
git rm public/js/stringHistory.js  # if git tracks the rename
git commit -m "feat: per-guitar humidity, sessions, and string tracking

Humidity scoped to GS Mini only. Sessions include guitarId field.
String changes tracked per guitar. Renamed stringHistory.js → strings.js.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Preserve and Adapt Remaining Modules

**Files:**
- Modify: `public/js/onboarding.js` (adapt for multi-guitar)
- Verify: `public/js/inventory.js` (ensure v6 compatibility)
- Verify: `public/js/history.js` (ensure v6 compatibility)
- Verify: `public/js/export.js` (ensure v6 backup/restore works)
- Modify: `public/js/app.js` (update all imports for renamed/new modules)

**Step 1: Update app.js imports**

Fix all import paths:
```javascript
import { ... } from './strings.js';  // was stringHistory.js
```

Update `init()` to:
1. Call `migrateData()` (now handles v5→v6)
2. Load tasks for active guitar
3. Render for active guitar
4. Register guitar selector event handlers

Update `setupEventHandlers()` to pass `getActiveGuitar()` to functions that need it.

**Step 2: Adapt onboarding.js**

- Change welcome text to mention both guitars
- After onboarding, set default guitar to 'gs-mini'
- Update data references from v5 flat fields to v6 nested fields

**Step 3: Verify inventory.js**

Inventory is shared (not per-guitar) — it lives at `data.inventory` which is the same location in v6. Should work without changes. Run tests to verify.

**Step 4: Verify history.js**

History reads from task states and humidity. Update it to read from `getGuitarTasks(guitarId)` instead of flat `maintenanceStates`. May need to aggregate across both guitars for a combined timeline.

**Step 5: Verify export.js**

Backup/restore must handle v6 schema. `createBackup()` just serializes the entire guitarTrackerData — should work. `restoreFromBackup()` needs to handle both v5 and v6 backup files (delegate to migration chain if version < 6). `mergeBackupData()` needs updating for nested guitar structure.

**Step 6: Run full test suite**

Run: `node tests/test.js`
Expected: ALL PASS

**Step 7: Manual verification**

Open app in browser. Switch guitars. Complete tasks on each. Reload. Verify:
- Task states persist independently
- Dashboard shows correct metrics per guitar
- Humidity only shows for GS Mini

**Step 8: Commit**

```bash
git add public/js/app.js public/js/onboarding.js public/js/inventory.js public/js/history.js public/js/export.js tests/test.js
git commit -m "feat: adapt all modules for v6 multi-guitar schema

Update imports, onboarding flow, history timeline, and export/restore
for v6 per-guitar structure. Inventory preserved as shared resource.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 3: Song Library (Notion → App)

### Task 13: API Client and Song API Route

**Files:**
- Create: `public/js/api-client.js`
- Create: `api/notion/songs.js`

**Step 1: Create api-client.js**

```javascript
const APP_SECRET = 'GENERATED_32_CHAR_SECRET';  // Set during deployment

const BASE_URL = '';  // Same origin

export async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            'X-App-Secret': APP_SECRET,
        },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}

export async function apiPost(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-App-Secret': APP_SECRET,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}

export async function apiPatch(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-App-Secret': APP_SECRET,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}
```

**Step 2: Create api/notion/songs.js**

Full implementation from SPEC_V3_AMENDED.md Section 9. Handles both GET (fetch library) and PATCH (update status via query param `?id=`). Uses `notion.databases.query()` for GET and `notion.pages.update()` for PATCH. All properties mapped using SDK format.

**Step 3: Verify locally**

```bash
npx vercel dev
curl -H "X-App-Secret: YOUR_SECRET" http://localhost:3000/api/notion/songs
```
Expected: JSON with `songs` array containing all songs from Notion

**Step 4: Commit**

```bash
git add public/js/api-client.js api/notion/songs.js
git commit -m "feat: add Song Library API route and client

GET /api/notion/songs fetches all songs with page IDs for relations.
PATCH updates song status. api-client.js provides fetch wrapper with
auth headers.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Songs Module and Cache

**Files:**
- Create: `public/js/songs.js`

**Step 1: Implement songs.js**

This module manages the song library cache in the separate `songLibraryCache` localStorage key:

```javascript
import { apiGet, apiPatch } from './api-client.js';

const CACHE_KEY = 'songLibraryCache';
const TTL_MINUTES = 30;

export function getCachedSongs() { /* read from localStorage */ }
export function isCacheStale() { /* check TTL */ }
export async function fetchSongs() { /* call API, update cache */ }
export async function refreshSongsIfNeeded() { /* fetch if stale or missing */ }
export function filterSongsByGuitar(songs, guitarId) { /* Electric/Acoustic/Both filtering */ }
export function searchSongs(songs, query) { /* name + artist search */ }
export async function updateSongStatus(songId, newStatus) { /* PATCH + update local cache */ }
```

**Step 2: Write a test for cache logic**

```javascript
runTest('filterSongsByGuitar filters correctly', () => {
    const songs = [
        { name: 'Song A', guitar: 'Electric' },
        { name: 'Song B', guitar: 'Acoustic' },
        { name: 'Song C', guitar: 'Both' },
    ];
    const electric = filterSongsByGuitar(songs, 'prs-ce24');
    const acoustic = filterSongsByGuitar(songs, 'gs-mini');
    assertEqual(electric.length, 2, 'Electric shows Electric+Both');
    assertEqual(acoustic.length, 2, 'Acoustic shows Acoustic+Both');
});
```

**Step 3: Run tests — verify pass**

**Step 4: Commit**

```bash
git add public/js/songs.js tests/test.js
git commit -m "feat: add songs module with cache and filtering

Song library cached in separate localStorage key (expendable).
30-minute TTL with stale cache shown when offline. Guitar-type
filtering maps GS Mini→Acoustic, CE24→Electric.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 15: Songs Tab UI

**Files:**
- Modify: `public/index.html` (add Songs tab content)
- Modify: `public/js/ui.js` (render song list, detail sheet)
- Modify: `public/css/styles.css` (song list, detail sheet styles)
- Modify: `public/js/app.js` (wire Songs tab, song events)

**Step 1: Add Songs tab HTML structure**

In `public/index.html`, add a tab content section:
```html
<div id="songs" class="tab-content" style="display: none;">
    <div class="song-controls">
        <input type="search" id="songSearch" placeholder="Search songs..." class="input-field">
        <div class="song-filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="learning">Learning</button>
            <button class="filter-btn" data-filter="can-play">Can Play</button>
        </div>
    </div>
    <div id="songList" class="song-list">
        <!-- Rendered by JS -->
    </div>
    <button id="refreshSongs" class="btn-secondary">Refresh Songs</button>

    <!-- Song Detail Sheet (slide-up modal) -->
    <div id="songDetail" class="song-detail-sheet" style="display: none;">
        <!-- Rendered dynamically -->
    </div>
</div>
```

**Step 2: Implement renderSongList() in ui.js**

Renders a card for each song showing: name, artist, status badge, difficulty, guitar type icon. Tapping a card opens the detail sheet.

**Step 3: Implement song detail sheet**

Slide-up modal showing all song fields. Status is a row of tappable chips. "Open in UG" button opens the tab link. "Close" button slides it down.

**Step 4: Wire events in app.js**

- Song search input → debounced `searchSongs()` + re-render
- Filter buttons → toggle active + re-render
- Song card tap → open detail sheet
- Status chip tap → `updateSongStatus()` + re-render
- Refresh button → `fetchSongs()` + re-render
- Tab switch to Songs → `refreshSongsIfNeeded()` on first visit

**Step 5: Style for mobile**

- Song cards: full width, 44px+ tap targets
- Detail sheet: slides up from bottom, 80% viewport height
- Search input: sticky at top
- Filter chips: horizontal scroll

**Step 6: Manual test**

Deploy to Vercel (or test with vercel dev). Open Songs tab. Verify songs load from Notion. Search works. Filter works. Detail sheet opens. Status update works.

**Step 7: Commit**

```bash
git add public/index.html public/js/ui.js public/js/app.js public/css/styles.css
git commit -m "feat: add Songs tab with search, filter, and detail sheet

Song library displayed as card list. Search by name/artist. Filter by
status. Slide-up detail sheet with status update and UG link.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 4: Notion Writes + Sync

### Task 16: Remaining API Routes

**Files:**
- Create: `api/notion/sessions.js`
- Create: `api/notion/strings.js`
- Create: `api/notion/humidity.js`
- Create: `api/notion/maintenance.js`
- Create: `api/sync/batch.js`

**Step 1: Create all 4 POST routes**

Implement each exactly as specified in SPEC_V3_AMENDED.md Section 9. Key points:
- ALL use ESM (`import`/`export default`)
- ALL use SDK property format (`{ select: { name: "..." } }`)
- Relations use page IDs (`{ relation: [{ id }] }`)
- Rating converted from number to star string before sending

**Step 2: Create batch sync route**

`api/sync/batch.js` processes items sequentially with 350ms delay between Notion API calls. Uses dynamic imports to reuse existing route handlers.

**Step 3: Test each route**

```bash
npx vercel dev

# Test sessions
curl -X POST -H "X-App-Secret: SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Test Session","date":"2026-02-06T20:00:00Z","durationMinutes":30,"focus":["Songs"],"guitarUsed":"Taylor GS Mini","songIds":[],"notes":"test"}' \
  http://localhost:3000/api/notion/sessions

# Test strings
curl -X POST -H "X-App-Secret: SECRET" -H "Content-Type: application/json" \
  -d '{"guitar":"Taylor GS Mini","stringBrand":"D'\''Addario EJ16 (.012-.053)","hoursPlayed":40,"toneNotes":"test"}' \
  http://localhost:3000/api/notion/strings

# Test humidity
curl -X POST -H "X-App-Secret: SECRET" -H "Content-Type: application/json" \
  -d '{"humidity":47,"temperature":68,"location":"In Case","status":"Target"}' \
  http://localhost:3000/api/notion/humidity

# Test maintenance
curl -X POST -H "X-App-Secret: SECRET" -H "Content-Type: application/json" \
  -d '{"guitar":"Taylor GS Mini","period":"Weekly","category":"Inspection","task":"Bridge wing monitoring","notes":"All clear","issueDetected":false}' \
  http://localhost:3000/api/notion/maintenance
```

Expected: Each returns `{ success: true, notionPageId: "..." }`. Verify entries appear in Notion.

**Step 4: Commit**

```bash
git add api/notion/sessions.js api/notion/strings.js api/notion/humidity.js api/notion/maintenance.js api/sync/batch.js
git commit -m "feat: add all Notion write API routes + batch sync

POST routes for sessions, strings, humidity, and maintenance.
Batch endpoint processes multiple items with 350ms throttle.
All use SDK format with correct relation/date/select properties.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 17: Sync Manager

**Files:**
- Create: `public/js/sync.js`

**Step 1: Implement SyncManager class**

Per SPEC_V3_AMENDED.md Section 11. Key methods:
- `enqueue(endpoint, method, payload)` — add item to syncQueue in localStorage
- `processQueue()` — process pending items sequentially with throttle
- `getStatus()` — returns { state, count } for UI indicator
- `onStatusChange(callback)` — register listener for UI updates

Sync triggers:
- On enqueue (try immediately)
- On `visibilitychange` (when user returns to app)
- On `online` event (when network restores)

Queue is stored IN the main `guitarTrackerData` key under `syncQueue`.

**Step 2: Write test for queue logic**

```javascript
runTest('SyncManager enqueue adds to queue', () => {
    storage.clear();
    const data = createDefaultData();
    saveVersionedData(data);

    const syncManager = new SyncManager();
    syncManager.enqueue('/api/notion/sessions', 'POST', { test: true });

    const stored = getVersionedData();
    assertEqual(stored.syncQueue.length, 1, 'Queue has 1 item');
    assertEqual(stored.syncQueue[0].endpoint, '/api/notion/sessions', 'Correct endpoint');
    assertEqual(stored.syncQueue[0].status, 'pending', 'Status is pending');
});
```

**Step 3: Run test — verify pass**

**Step 4: Commit**

```bash
git add public/js/sync.js tests/test.js
git commit -m "feat: add SyncManager for offline-first Notion sync

Queue stored in consolidated localStorage key (never lose unsynced
data). Processes on enqueue, app focus, and network restore.
Exponential backoff on rate limits.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 18: Sync Indicator UI

**Files:**
- Modify: `public/index.html` (add sync indicator to header)
- Modify: `public/js/app.js` (wire SyncManager to UI)
- Modify: `public/css/styles.css` (sync indicator styles)

**Step 1: Add sync indicator HTML**

```html
<div class="sync-indicator" id="syncIndicator">
    <span class="sync-dot synced"></span>
    <span class="sync-text">Synced</span>
</div>
```

**Step 2: Style the indicator**

- `.sync-dot` — 8px circle
- `.synced` — green (#10b981)
- `.pending` — yellow (#f59e0b) with pulse animation
- `.offline` — red (#ef4444)
- Positioned top-right of header

**Step 3: Wire SyncManager status updates**

In app.js, after init:
```javascript
const syncManager = new SyncManager();
syncManager.onStatusChange(({ state, count }) => {
    const dot = document.querySelector('.sync-dot');
    const text = document.querySelector('.sync-text');
    dot.className = `sync-dot ${state}`;
    text.textContent = state === 'pending' ? `Pending (${count})` : state === 'offline' ? 'Offline' : 'Synced';
});
```

**Step 4: Manual test**

Toggle airplane mode. Make changes. See indicator go red. Toggle back. See it go yellow then green.

**Step 5: Commit**

```bash
git add public/index.html public/js/app.js public/css/styles.css
git commit -m "feat: add sync status indicator in header

Colored dot shows sync state: green=synced, yellow=pending, red=offline.
Updates in real-time as sync queue processes.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 19: Enhanced Practice Session Flow

**Files:**
- Modify: `public/js/sessions.js` (Quick Save + Full Save + song picker)
- Modify: `public/index.html` (updated session modal)
- Modify: `public/js/app.js` (wire new session flow)

**Step 1: Update session modal HTML**

Replace current simple session modal with the two-path flow:

After timer stops:
1. Guitar selector (3 buttons: GS Mini, CE24, Both)
2. Two action buttons: "Quick Save" and "Add Details"
3. If "Add Details": song picker, focus tags, rating, notes
4. After save: optional song status update screen

**Step 2: Implement Quick Save**

Quick Save creates a minimal session:
```javascript
{
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    guitarId: selectedGuitar,
    duration: timerMinutes,
    focus: [],
    songIds: [],
    rating: null,
    notes: '',
    notionSynced: false,
}
```

Saves to localStorage immediately. Enqueues to sync queue.

**Step 3: Implement Full Save with song picker**

Song picker component: search bar + list of songs filtered by selected guitar type. Each song is tappable (toggle selection). Multi-select supported. List sourced from `getCachedSongs()`.

Focus area selector: row of tappable chips (Songs, Technique, Scales, Chords, Jamming, Theory, Ear Training). Multi-select.

Rating: 5 tappable stars.

**Step 4: Wire sync for sessions**

After saving session, call:
```javascript
syncManager.enqueue('/api/notion/sessions', 'POST', {
    name: `Practice - ${dateStr}`,
    date: session.timestamp,
    durationMinutes: session.duration,
    focus: session.focus,
    guitarUsed: GUITARS[session.guitarId].notionLabel,
    songIds: session.songIds,
    rating: session.rating,
    notes: session.notes,
});
```

**Step 5: Wire song status updates after session**

If songs were selected, show a follow-up screen listing each song with its current status. Tapping a status cycles it. Changes enqueue PATCH requests.

**Step 6: Manual test**

Start timer → stop → Quick Save (2 taps). Start again → stop → Add Details → pick songs → save → update statuses.

**Step 7: Commit**

```bash
git add public/js/sessions.js public/index.html public/js/app.js
git commit -m "feat: enhanced practice session flow with Quick Save

Quick Save: guitar + duration (2 taps). Full Save: songs, focus,
rating, notes with optional song status updates. Sessions enqueue
to Notion sync.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 20: Wire Remaining Sync Points

**Files:**
- Modify: `public/js/tasks.js` (sync significant tasks to Notion)
- Modify: `public/js/humidity.js` (sync readings to Notion)
- Modify: `public/js/strings.js` (sync string changes to Notion)
- Modify: `public/js/app.js` (initialize sync manager globally)

**Step 1: Wire task completion sync**

In `tasks.js`, when a task with `syncToNotion: true` is completed:
```javascript
if (taskConfig.syncToNotion) {
    syncManager.enqueue('/api/notion/maintenance', 'POST', {
        guitar: GUITARS[guitarId].notionLabel,
        period: capitalizeFirst(taskConfig.period),
        category: inferCategory(taskConfig),
        task: taskConfig.name,
        notes: '',
        issueDetected: false,
    });
}
```

**Step 2: Wire humidity sync**

When a humidity reading is logged in humidity.js:
```javascript
syncManager.enqueue('/api/notion/humidity', 'POST', {
    humidity: reading.humidity,
    temperature: reading.temp,
    location: reading.location,
    status: reading.status,
    notes: '',
    timestamp: reading.timestamp,
});
```

**Step 3: Wire string change sync**

When "Install new strings" is completed, after the string brand modal:
```javascript
syncManager.enqueue('/api/notion/strings', 'POST', {
    guitar: GUITARS[guitarId].notionLabel,
    stringBrand: GUITARS[guitarId].strings.notionLabel,
    hoursPlayed: estimatedHours,
    toneNotes: notes,
});
```

**Step 4: Test sync end-to-end**

Deploy to Vercel. Complete a task flagged `syncToNotion: true`. Log a humidity reading. Change strings on GS Mini. Verify each creates entries in the corresponding Notion database.

**Step 5: Commit**

```bash
git add public/js/tasks.js public/js/humidity.js public/js/strings.js public/js/app.js
git commit -m "feat: wire all Notion sync points

Significant tasks, humidity readings, and string changes auto-enqueue
to sync. Uses task config syncToNotion flag to determine which tasks
sync to Maintenance Log.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 5: Service Worker + Polish

### Task 21: Service Worker

**Files:**
- Create: `public/sw.js`
- Modify: `public/js/app.js` (register service worker)

**Step 1: Create service worker**

```javascript
const CACHE_NAME = 'guitar-tracker-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/config.js',
    '/js/storage.js',
    '/js/tasks.js',
    '/js/humidity.js',
    '/js/sessions.js',
    '/js/songs.js',
    '/js/strings.js',
    '/js/sync.js',
    '/js/api-client.js',
    '/js/ui.js',
    '/js/export.js',
    '/js/inventory.js',
    '/js/history.js',
    '/js/onboarding.js',
    '/js/validators.js',
    '/manifest.json',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // API writes: never cache, let sync queue handle offline
    if (url.pathname.startsWith('/api/') && request.method !== 'GET') {
        return;
    }

    // API reads: network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets: cache-first with network fallback
    event.respondWith(
        caches.match(request)
            .then(cached => cached || fetch(request))
    );
});
```

**Step 2: Register in app.js**

At the end of app.js:
```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.error('SW registration failed:', err));
}
```

**Step 3: Test offline**

Deploy to Vercel. Visit app. Open DevTools → Application → Service Workers. Verify SW is active. Toggle offline in DevTools. Reload page. App should load from cache.

**Step 4: Commit**

```bash
git add public/sw.js public/js/app.js
git commit -m "feat: add service worker for offline support

Cache-first for static assets, network-first for API reads.
API writes passthrough to sync queue. Pre-caches all JS modules
on install.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 22: Manifest and PWA Updates

**Files:**
- Modify: `public/manifest.json`

**Step 1: Update manifest**

```json
{
    "name": "Guitar Tracker",
    "short_name": "GuitarTracker",
    "description": "Multi-guitar maintenance, practice, and care tracker",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "theme_color": "#1a1a2e",
    "background_color": "#1a1a2e",
    "categories": ["utilities", "lifestyle"],
    "icons": [
        {
            "src": "/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ]
}
```

Key changes: `start_url` and `scope` changed from `/guitar-tracker/` to `/`. Theme color updated. Name simplified.

**Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "chore: update PWA manifest for Vercel deployment

Changed start_url and scope from /guitar-tracker/ to /.
Updated name and theme color for v3.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 23: Final Integration Testing

**Files:** None (testing task)

**Step 1: Run automated tests**

Run: `node tests/test.js`
Expected: ALL PASS

**Step 2: Deploy to Vercel**

```bash
git push  # Triggers Vercel auto-deploy
```

**Step 3: Manual testing on iPhone**

Go through the full testing checklist from SPEC_V3_AMENDED.md:

- [ ] Guitar selector works, persists
- [ ] GS Mini: 19 tasks in correct periods
- [ ] CE24: 24 tasks in correct periods
- [ ] Independent task completion per guitar
- [ ] Humidity tab for GS Mini only
- [ ] Songs tab loads from Notion
- [ ] Song search and filter
- [ ] Quick Save practice (2 taps)
- [ ] Full Save practice with songs
- [ ] Sync indicator works
- [ ] Offline mode: tasks, sessions saveable
- [ ] Online: sync completes
- [ ] PWA installable

**Step 4: Mike sets up custom domain**

Follow SPEC_V3_AMENDED.md Section 4, Step 3:
1. Add `guitar.katieanneandmike.com` in Vercel
2. Add CNAME `guitar` → `cname.vercel-dns.com` in Squarespace

**Step 5: Verify custom domain**

Visit `guitar.katieanneandmike.com`. Verify SSL, PWA install, all features work.

**Step 6: Deprecate GitHub Pages**

Disable GitHub Pages in repo settings or add a redirect page.

**Step 7: Final commit**

```bash
git add -A
git commit -m "chore: v3.0.0 release - multi-guitar Notion-connected PWA

Guitar Tracker v3 with: two-guitar support (GS Mini + PRS CE24),
bidirectional Notion sync, offline-first architecture, song library,
enhanced practice sessions, and service worker caching.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Quick Reference: Task Dependencies

```
Phase 1 (Infrastructure):
  Task 1 (bug fix) → no deps
  Task 2 (repo restructure) → depends on Task 1
  Task 3 (vercel config) → depends on Task 2
  Task 4 (status route) → depends on Task 3
  Task 5 (create DBs) → depends on Task 3, needs NOTION_API_KEY
  Task 6 (deploy) → depends on Tasks 4+5, needs Mike's env vars

Phase 2 (Multi-Guitar):
  Task 7 (config rewrite) → depends on Task 2
  Task 8 (v6 schema) → depends on Task 7
  Task 9 (guitar selector UI) → depends on Task 8
  Task 10 (per-guitar tasks) → depends on Tasks 8+9
  Task 11 (humidity+sessions) → depends on Task 10
  Task 12 (remaining modules) → depends on Tasks 10+11

Phase 3 (Song Library):
  Task 13 (API client+route) → depends on Task 3
  Task 14 (songs module) → depends on Task 13
  Task 15 (songs UI) → depends on Tasks 9+14

Phase 4 (Sync):
  Task 16 (API routes) → depends on Task 4
  Task 17 (sync manager) → depends on Task 8
  Task 18 (sync indicator) → depends on Task 17
  Task 19 (session flow) → depends on Tasks 11+14+17
  Task 20 (wire sync) → depends on Tasks 16+17

Phase 5 (Polish):
  Task 21 (service worker) → depends on Task 2
  Task 22 (manifest) → depends on Task 2
  Task 23 (final testing) → depends on ALL
```

## Parallelizable Tasks

These task groups can run in parallel if using subagent-driven development:

**Group A (Backend):** Tasks 4, 5, 13, 16
**Group B (Frontend Core):** Tasks 7, 8, 9, 10, 11, 12
**Group C (Frontend Features):** Tasks 14, 15, 17, 18, 19, 20

---

*End of implementation plan. Read SPEC_V3_AMENDED.md for complete schema definitions, API property mappings, and edge case details.*
