# Guitar Tracker v3 — Amended Build Specification

**Created:** February 6, 2026
**Amended by:** Claude Code (Opus 4.6) after full review of original spec, codebase, Notion API, and Vercel platform
**Purpose:** This replaces the original spec as the single source of truth for building Guitar Tracker v3.

---

## What Changed From the Original Spec (and Why)

| # | Issue | Original | Amended | Why |
|---|-------|----------|---------|-----|
| 1 | localStorage schema | Split into many keys (`tasks:gs-mini`, etc.) | Single consolidated key, restructured for multi-guitar | v5 was created because browsers clear individual keys. Splitting them again is a regression. |
| 2 | Migration strategy | None (no v5→v6 path) | Full v5→v6 migration with task ID remapping | Existing data (humidity, sessions, task history) would be orphaned without this. |
| 3 | Notion relation format | Page URLs | Page IDs | The @notionhq/client SDK uses `{ relation: [{ id: "uuid" }] }`, not URLs. |
| 4 | API property format | MCP-style (`"date:Date:start"`) | SDK-style (`{ date: { start: "..." } }`) | API routes use @notionhq/client, not the MCP tool. Different interfaces. |
| 5 | `data_source_id` | Used in API routes | Changed to `database_id` | `data_source_id` is MCP terminology. The SDK uses `database_id`. |
| 6 | Module format | `require()`/`module.exports` | `import`/`export default` | package.json has `"type": "module"`. CommonJS would fail. |
| 7 | Service worker | "Update existing sw.js" | Create from scratch | sw.js doesn't exist in the current codebase. |
| 8 | File structure | Missing inventory.js, history.js, onboarding.js, export.js | All preserved | These are working modules with real functionality (1,100+ lines combined). |
| 9 | `vercel.json` rewrites | `"/api/:path*"` → `"/api/:path*"` | Removed | Redundant — Vercel auto-routes /api/ directory. |
| 10 | Practice session flow | 6 mandatory steps | Quick Save + Full Save options | 6 steps after a practice session is too much friction on iPhone. |
| 11 | Select option behavior | "Typos cause silent failures" | Auto-creates new options | Notion auto-creates select options if integration has write access. Risk is duplicate options, not failures. |
| 12 | Vercel database | Not considered | Evaluated and rejected | See Architecture Decision below. |
| 13 | GitHub Pages transition | Not addressed | Migration plan included | Current URL would keep serving stale code indefinitely. |
| 14 | Existing bug | Not mentioned | Fix in Phase 1 | `playingHours` reference error visible in iOS screenshots. |
| 15 | Custom domain | Generic instructions | Specific to katieanneandmike.com | Subdomain: guitar.katieanneandmike.com |

---

## Architecture Decision: Why Not Vercel Postgres

The original plan uses localStorage + Notion (via Vercel serverless functions). I evaluated whether Vercel Postgres or KV would simplify the system.

**Conclusion: No Vercel database needed.** Here's why:

| Factor | localStorage + Notion | Adding Vercel Postgres |
|--------|----------------------|----------------------|
| Data flow | App → Vercel API → Notion | App → Vercel API → Postgres → (cron) → Notion |
| Complexity | 2 hops | 3 hops + cron job |
| Offline support | localStorage handles it | Still need localStorage anyway |
| Rate limits | 3 req/sec (fine for ~30 calls/week) | No limit on Postgres, but still limited syncing to Notion |
| Cost | Free | Free tier sufficient, but adds ops burden |
| Source of truth | Notion (where Mike analyzes data) | Two sources of truth (Postgres + Notion) |

The usage pattern (~20-30 API calls per week) never approaches Notion's rate limit. Postgres would be an unnecessary middle layer. The batch sync endpoint handles the "coming back online with queued items" case adequately.

**Vercel KV** was also considered for song library caching. Rejected because offline-first still requires localStorage caching, so KV would be a redundant layer.

---

## Sections Unchanged From Original Spec

The following sections from the original spec are correct and should be used as-is:

- **Section 1: Project Overview** — Goals, principles, user profile
- **Section 7: Guitar Configuration** — All task definitions, inspections, humidity config (the TASKS, INSPECTIONS, and HUMIDITY objects are correct)
- **Section 8: Notion Database Schemas** — Column definitions are correct (but property FORMAT in API code is fixed below)
- **Section 12: Authentication** — APP_SECRET approach is fine for personal app
- **Section 13: Custom Domain** — Process is correct (specific domain details updated below)

---

## 3. System Architecture (Amended)

```
┌──────────────────────────────────────────────────────────────┐
│                    GUITAR TRACKER v3                          │
│              guitar.katieanneandmike.com                      │
│                   (Vercel Deployment)                         │
│                                                              │
│  ┌───────────────────────┐  ┌──────────────────────────────┐ │
│  │   Frontend (PWA)       │  │   API Routes (/api/*)        │ │
│  │                        │  │                              │ │
│  │  public/index.html     │  │  GET  /api/notion/songs      │ │
│  │  public/js/*.js        │  │  PATCH /api/notion/songs     │ │
│  │  public/css/styles.css │  │  POST /api/notion/sessions   │ │
│  │                        │  │  POST /api/notion/strings    │ │
│  │  [Single consolidated  │  │  POST /api/notion/humidity   │ │
│  │   localStorage key]    │  │  POST /api/notion/maintenance│ │
│  │  [Sync queue in same   │◄─►  POST /api/sync/batch       │ │
│  │   key — never lose]    │  │  GET  /api/sync/status       │ │
│  │  [Song cache separate  │  │                              │ │
│  │   — expendable]        │  │  Uses: @notionhq/client      │ │
│  │                        │  │  Auth: X-App-Secret header   │ │
│  └───────────────────────┘  └──────────────┬───────────────┘ │
│                                             │                 │
└─────────────────────────────────────────────┼─────────────────┘
                                              │
                                              ▼
                             ┌──────────────────────────────┐
                             │        NOTION API             │
                             │                               │
                             │  🎵 Song Library (READ+WRITE) │
                             │  🎸 Practice Journal (WRITE)  │
                             │  🎻 String Change Log (WRITE) │
                             │  📊 Humidity Log (WRITE) NEW  │
                             │  🔧 Maintenance Log (WRITE)NEW│
                             └──────────────────────────────┘
```

**Key difference from original:** One consolidated localStorage key (not many), plus one expendable cache key.

---

## 4. Manual Setup Steps (Amended)

### Already Done
- Notion integration created: "Guitar Tracker"
- Notion secret: `REDACTED_NOTION_KEY`
  - **WARNING:** This key must ONLY go into Vercel environment variables. Never commit to code. Consider rotating after setup if concerned about exposure.
- Vercel account created

### Step 1: Share Databases with Integration (~2 min)
1. Open "Guitar Journey & Gear Wiki" page in Notion
2. Click "..." menu → "Connections" → Search for "Guitar Tracker"
3. Click to add the integration
4. This grants access to ALL child databases

### Step 2: Add Environment Variables in Vercel (~3 min)
In Vercel dashboard → Project Settings → Environment Variables:

| Variable | Value | When to Add |
|----------|-------|-------------|
| `NOTION_API_KEY` | `REDACTED_NOTION_KEY` | Before first deploy |
| `NOTION_SONG_DB` | `4d5f9175-74fa-429e-aaf7-9ee54e35251a` | Before first deploy |
| `NOTION_JOURNAL_DB` | `d92cecec-3b62-4e37-9796-ba8c8791b1f3` | Before first deploy |
| `NOTION_STRINGS_DB` | `63310750-12c2-4117-a737-71aabba87c3f` | Before first deploy |
| `NOTION_HUMIDITY_DB` | *(from create script output)* | After Phase 1 DB creation |
| `NOTION_MAINTENANCE_DB` | *(from create script output)* | After Phase 1 DB creation |
| `APP_SECRET` | *(Claude Code will generate)* | Before first deploy |

### Step 3: Custom Domain — guitar.katieanneandmike.com (~10 min)
1. In Vercel: Project → Settings → Domains → Add `guitar.katieanneandmike.com`
2. In Squarespace: Domains → katieanneandmike.com → DNS Settings → Add CNAME record:
   - **Host:** `guitar`
   - **Type:** CNAME
   - **Value:** `cname.vercel-dns.com`
3. Wait for DNS propagation (can take up to 24-48 hours, usually faster)
4. Vercel auto-provisions SSL certificate

### Step 4: Deprecate GitHub Pages
After Vercel is live and verified:
1. In GitHub repo → Settings → Pages → set source to "None"
2. Or: add a redirect `index.html` that points to `guitar.katieanneandmike.com`

---

## 5. Repo Structure (Amended)

```
guitar-tracker/
├── public/                        # Static PWA files (served at root by Vercel)
│   ├── index.html                 # Main app shell (restructured for multi-guitar)
│   ├── css/
│   │   └── styles.css             # All styles (extended for new UI)
│   ├── js/
│   │   ├── app.js                 # Entry point, init, event wiring, guitar selector
│   │   ├── config.js              # Guitar profiles, ALL task/inspection/humidity config
│   │   ├── storage.js             # localStorage: v6 schema, v1-v6 migration chain
│   │   ├── validators.js          # Input validation (preserved)
│   │   ├── tasks.js               # Per-guitar task logic, period management
│   │   ├── humidity.js            # Humidity logging, charts, alerts (GS Mini only)
│   │   ├── sessions.js            # Practice session logging, timer (enhanced)
│   │   ├── songs.js               # NEW: Song library cache, search, filtering
│   │   ├── strings.js             # RENAMED from stringHistory.js, enhanced
│   │   ├── sync.js                # NEW: Sync queue manager
│   │   ├── api-client.js          # NEW: Fetch wrapper for /api/* routes
│   │   ├── ui.js                  # DOM rendering, tabs, modals, themes
│   │   ├── export.js              # CSV/JSON export, backup/restore (preserved)
│   │   ├── inventory.js           # Consumables tracking (preserved)
│   │   ├── history.js             # Maintenance timeline (preserved)
│   │   └── onboarding.js          # First-time wizard (adapted for multi-guitar)
│   ├── sw.js                      # NEW: Service worker (offline caching)
│   ├── manifest.json              # Updated for new domain + scope
│   └── icons/                     # PWA icons (moved from root)
│       ├── icon-192.png
│       └── icon-512.png
│
├── api/                           # Vercel serverless functions (ESM)
│   ├── _lib/
│   │   ├── notion.js              # Shared Notion client
│   │   └── auth.js                # Auth middleware
│   ├── notion/
│   │   ├── songs.js               # GET: fetch song library, PATCH: update status
│   │   ├── sessions.js            # POST: create practice journal entry
│   │   ├── strings.js             # POST: log string change
│   │   ├── humidity.js            # POST: log humidity reading
│   │   └── maintenance.js         # POST: log maintenance event
│   └── sync/
│       ├── status.js              # GET: health check
│       └── batch.js               # POST: process queued sync items
│
├── scripts/
│   └── create-notion-dbs.js       # One-time: create Humidity Log + Maintenance Log
│
├── tests/
│   ├── test-setup.js              # Test framework setup (preserved)
│   └── test.js                    # Test suite (updated for v6 schema)
├── test.html                      # Test runner (preserved)
│
├── vercel.json                    # Vercel config
├── package.json                   # Dependencies
├── .env.local.example             # Template for local dev (gitignored values)
├── .gitignore                     # Updated for .env.local, node_modules
├── CLAUDE.md                      # Updated project docs
├── SPEC_V3_AMENDED.md             # This file
└── README.md
```

### vercel.json (Amended — no unnecessary rewrites)
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

### package.json (Amended — ESM compatible)
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

Note: `sharp` dev dependency removed (not used by tests). `@notionhq/client` added as a production dependency.

---

## 6. Environment Variables (Amended)

### Frontend: NO secrets embedded in client code

The original plan embeds `APP_SECRET` directly in `api-client.js`. This is fine for security (personal app), but creates a deployment hassle — every time the secret changes, the client code must be redeployed.

**Better approach:** Use a simple cookie/header set during the first visit, or simply embed it as a constant that Vercel's build step can't tree-shake anyway. Since this is a personal app, embedding in client JS is acceptable.

```javascript
// public/js/api-client.js
const APP_SECRET = 'PLACEHOLDER_SET_DURING_BUILD';
// Claude Code will generate and embed this during Phase 1
```

### .env.local.example (for local development)
```
NOTION_API_KEY=ntn_your_key_here
NOTION_SONG_DB=4d5f9175-74fa-429e-aaf7-9ee54e35251a
NOTION_JOURNAL_DB=d92cecec-3b62-4e37-9796-ba8c8791b1f3
NOTION_STRINGS_DB=63310750-12c2-4117-a737-71aabba87c3f
NOTION_HUMIDITY_DB=your_id_here
NOTION_MAINTENANCE_DB=your_id_here
APP_SECRET=your_32_char_secret_here
```

For local development, use `vercel dev` which auto-pulls Development env vars from Vercel cloud. Alternatively, run `vercel env pull .env.local` to get a local copy.

---

## 10. localStorage Schema v6 (Amended — Critical Section)

### Design Principle

**Single consolidated key.** Version 5 was specifically created because browsers (especially iOS Safari) clear individual localStorage keys unpredictably. The original v3 plan proposed splitting back into many keys — this is a regression. Instead, we restructure the internals of the single key for multi-guitar support.

**One expendable key.** The Song Library cache is stored separately because:
- It can always be re-fetched from Notion
- It could be large (48+ songs with full metadata)
- Losing it just triggers a re-fetch, not data loss

### Schema

```javascript
// PRIMARY KEY: 'guitarTrackerData' — ALL important data lives here
{
  version: 6,
  activeGuitarId: 'gs-mini',  // 'gs-mini' or 'prs-ce24'

  // ─── Per-Guitar Data ───────────────────────────────────
  guitars: {
    'gs-mini': {
      tasks: {
        // Key = task ID from config, Value = completion state
        'gs-mini-daily-1': { lastCompleted: '2026-02-06T19:00:00Z' },
        'gs-mini-daily-2': { lastCompleted: '2026-02-06T19:00:00Z' },
        'gs-mini-daily-3': { lastCompleted: null },
        'gs-mini-daily-4': { lastCompleted: null },
        'gs-mini-weekly-1': { lastCompleted: null },
        // ... all 19 GS Mini tasks
      },
      strings: {
        lastChanged: '2026-01-15T00:00:00Z',
        brand: "D'Addario EJ16 (.012-.053)",
        estimatedHoursPlayed: 28,
      },
      humidity: {
        readings: [
          {
            id: 'uuid',
            timestamp: '2026-02-06T19:00:00Z',
            humidity: 47,
            temp: 68,
            location: 'In Case',
            status: 'Target',
            source: 'manual'
          }
        ],
      },
      inspections: {
        weekly: {
          lastCompleted: '2026-02-04T00:00:00Z',
          results: { 'gsm-bw-1': 'pass', 'gsm-bw-2': 'pass' }
        },
        quarterly: { lastCompleted: null, results: {} },
        stringChange: { lastCompleted: null, results: {} },
      },
    },
    'prs-ce24': {
      tasks: {
        'prs-ce24-daily-1': { lastCompleted: null },
        // ... all 24 CE24 tasks
      },
      strings: {
        lastChanged: null,
        brand: "D'Addario XL (.010-.046)",
        estimatedHoursPlayed: 0,
      },
      humidity: { readings: [] },  // Empty — CE24 doesn't track humidity
      inspections: {
        weekly: { lastCompleted: null, results: {} },
        quarterly: { lastCompleted: null, results: {} },
        stringChange: { lastCompleted: null, results: {} },
      },
    }
  },

  // ─── Shared Data (not per-guitar) ──────────────────────
  sessions: [
    {
      id: 'uuid',
      timestamp: '2026-02-06T19:30:00Z',
      guitarId: 'prs-ce24',       // Which guitar was used
      duration: 45,                // Minutes
      focus: ['Songs', 'Technique'],
      songIds: ['notion-page-id-1', 'notion-page-id-2'],  // Page IDs
      rating: 4,                   // 1-5 (stored as number, rendered as stars)
      notes: 'Worked on alternate picking',
      notionSynced: false,         // Has this been synced to Notion?
    }
  ],

  stringChangeHistory: [
    {
      date: '2026-01-15',
      guitarId: 'gs-mini',
      brand: "D'Addario EJ16 (.012-.053)",
      notes: 'Old strings sounded dull',
      daysFromPrevious: 56,
      notionSynced: false,
    }
  ],

  // ─── Sync Queue ────────────────────────────────────────
  syncQueue: [
    {
      id: 'uuid',
      endpoint: '/api/notion/sessions',
      method: 'POST',
      payload: { /* request body */ },
      createdAt: '2026-02-06T19:30:00Z',
      retries: 0,
      maxRetries: 5,
      status: 'pending',  // pending | syncing | failed | failed_permanent
    }
  ],
  lastSyncTime: null,

  // ─── Preserved From v5 ────────────────────────────────
  onboardingComplete: true,
  playingFrequency: 'weekly',
  playingHoursPerWeek: 2.5,
  hasHygrometer: true,
  equipmentList: [ /* preserved array */ ],
  inventory: { items: [ /* preserved array */ ] },
  timerState: { running: false, startTimestamp: null },
  practiceHistory: [ /* preserved array */ ],
}

// EXPENDABLE KEY: 'songLibraryCache' — can be re-fetched anytime
{
  fetchedAt: '2026-02-06T15:00:00Z',
  ttlMinutes: 30,
  songs: [
    {
      id: '2f851ee9-25cd-8165-9090-c57bad182f0b',  // Notion PAGE ID
      name: 'Boulevard of Broken Dreams',
      artist: 'Green Day',
      status: 'Learning',
      genre: ['Rock', 'Pop-Punk'],
      guitar: 'Both',
      difficulty: 'Intermediate',
      chords: 'Em, G, D, A, C',
      preset: 'Pop-Punk',
      funFactor: 4,               // Stored as number 1-5
      tabLink: 'https://tabs.ultimate-guitar.com/...',
      tabType: 'Guitar Pro',
    }
  ]
}

// PRESERVED SEPARATE KEY: 'theme' — quick-access for flash prevention
'dark'  // or 'light'
```

### Key Design Decisions

1. **Song IDs are Notion page IDs** (UUIDs), not URLs. These are used directly in relation properties when creating Practice Journal entries.

2. **Ratings stored as numbers** (1-5), rendered as stars in UI. Converted to emoji strings (`"⭐⭐⭐⭐"`) only when writing to Notion.

3. **`notionSynced` flag** on sessions and string changes enables quick identification of unsynced items without scanning the sync queue.

4. **Sync queue is IN the main key** because losing it means losing unsent data. The song cache is separate because it's expendable.

5. **`inspectionData` from v5** is restructured into per-guitar `inspections` objects with the new guitar-specific inspection IDs.

---

## v5 → v6 Migration Strategy (New Section)

This is the most critical piece of the implementation. All existing data is GS Mini data (it's the only guitar in v2).

### Task ID Remapping

```javascript
const TASK_ID_MAP = {
  // v5 ID → v6 ID (GS Mini)
  // Daily
  'daily-1': 'gs-mini-daily-1',  // String Cleaning → Wipe strings
  'daily-2': 'gs-mini-daily-2',  // Body Wipedown → Wipe body
  'daily-3': 'gs-mini-daily-3',  // Humidity Check → Check humidity
  // Note: gs-mini-daily-4 (Return to case) is NEW — no v5 equivalent

  // Weekly
  'weekly-1': 'gs-mini-weekly-1', // Hardware Oxidation → Hardware oxidation check
  'weekly-2': 'gs-mini-weekly-2', // Bridge Wing Monitoring → Bridge wing monitoring
  'weekly-3': 'gs-mini-weekly-3', // Humidipak Check → Humidipak packet check

  // Eight-week → String Change
  '8w-1': 'gs-mini-string-1',    // String Removal & Fret Inspection → Remove old strings
  '8w-2': 'gs-mini-string-3',    // Fret Polishing (FRINE) → Polish frets
  '8w-3': 'gs-mini-string-2',    // Fretboard Conditioning → Clean fretboard
  '8w-4': 'gs-mini-string-5',    // Nut & Saddle Lubrication → Lubricate nut & saddle
  '8w-5': 'gs-mini-string-6',    // Bridge Pin Cleaning → Clean bridge pins
  '8w-6': 'gs-mini-string-8',    // Full Body Detailing → Full body detail
  '8w-7': null,                   // Hardware Polish → DROPPED (not in v3 tasks)
  '8w-8': 'gs-mini-string-7',    // Restring → Install new strings

  // Quarterly
  'q-1': 'gs-mini-quarterly-1',  // Humidipak Replacement → Replace Humidipak
  'q-2': 'gs-mini-quarterly-2',  // Truss Rod Observation → Truss rod observation
  'q-3': 'gs-mini-quarterly-3',  // Structural Inspection → Structural inspection

  // Annual
  'annual-1': 'gs-mini-annual-1', // Taylor Refresh → Taylor Refresh service
};
```

### Migration Function

```javascript
export function migrateV5ToV6(v5Data) {
  const v6 = {
    version: 6,
    activeGuitarId: 'gs-mini',

    guitars: {
      'gs-mini': {
        tasks: {},
        strings: {
          lastChanged: v5Data.lastStringChangeDate || null,
          brand: v5Data.currentStringType || "D'Addario EJ16 (.012-.053)",
          estimatedHoursPlayed: 0,  // Can't calculate from v5 data
        },
        humidity: {
          readings: (v5Data.humidityReadings || []).map(r => ({
            ...r,
            source: r.source || 'manual',
          })),
        },
        inspections: {
          weekly: { lastCompleted: null, results: {} },
          quarterly: { lastCompleted: null, results: {} },
          stringChange: { lastCompleted: null, results: {} },
        },
      },
      'prs-ce24': {
        tasks: {},
        strings: {
          lastChanged: null,
          brand: "D'Addario XL (.010-.046)",
          estimatedHoursPlayed: 0,
        },
        humidity: { readings: [] },
        inspections: {
          weekly: { lastCompleted: null, results: {} },
          quarterly: { lastCompleted: null, results: {} },
          stringChange: { lastCompleted: null, results: {} },
        },
      },
    },

    // Shared data — migrate from v5
    sessions: (v5Data.playingSessions || []).map(s => ({
      id: s.id || crypto.randomUUID(),
      timestamp: s.timestamp,
      guitarId: 'gs-mini',  // All v5 sessions were GS Mini
      duration: s.duration,
      focus: [],
      songIds: [],
      rating: null,
      notes: '',
      notionSynced: false,  // Will sync on next online
    })),

    stringChangeHistory: (v5Data.stringChangeHistory || []).map(s => ({
      ...s,
      guitarId: 'gs-mini',  // All v5 changes were GS Mini
      notionSynced: false,
    })),

    syncQueue: [],
    lastSyncTime: null,

    // Preserved fields
    onboardingComplete: v5Data.onboardingComplete || false,
    playingFrequency: v5Data.playingFrequency || 'weekly',
    playingHoursPerWeek: v5Data.playingHoursPerWeek || 2.5,
    hasHygrometer: v5Data.hasHygrometer,
    equipmentList: v5Data.equipmentList || [],
    inventory: v5Data.inventory || { items: [] },
    timerState: v5Data.timerState || { running: false, startTimestamp: null },
    practiceHistory: v5Data.practiceHistory || [],
  };

  // Remap task completion states
  if (v5Data.maintenanceStates) {
    for (const [period, tasks] of Object.entries(v5Data.maintenanceStates)) {
      for (const task of tasks) {
        const newId = TASK_ID_MAP[task.id];
        if (newId) {
          v6.guitars['gs-mini'].tasks[newId] = {
            lastCompleted: task.lastCompleted || null,
          };
        }
      }
    }
  }

  // Migrate inspection data if present
  if (v5Data.inspectionData) {
    // Map old inspection keys to new structure
    // The exact mapping depends on how inspectionData was structured in v5
    // Preserve lastCompleted dates where possible
  }

  saveVersionedData(v6);
  console.log('Migration to v6 complete - multi-guitar support enabled');
  return v6;
}
```

### Migration Chain Update

```javascript
// In migrateData():
if (parsed.version === 5) {
  console.log('Migrating from v5 to v6 - adding multi-guitar support');
  return migrateV5ToV6(parsed);
}
// Earlier versions chain through: v1→v2→v3→v4→v5→v6
```

---

## 9. API Route Specifications (Amended)

All routes use **ESM syntax** and **@notionhq/client SDK property format**.

### Shared: Notion Client (`api/_lib/notion.js`)

```javascript
import { Client } from '@notionhq/client';

export const notion = new Client({ auth: process.env.NOTION_API_KEY });
```

### Shared: Auth Middleware (`api/_lib/auth.js`)

```javascript
export function auth(req, res) {
  if (req.headers['x-app-secret'] !== process.env.APP_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
```

### GET /api/notion/songs

Fetches Song Library. Returns page IDs (not URLs) for use in relations.

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_SONG_DB,
      page_size: 100,
      sorts: [{ property: 'Name', direction: 'ascending' }],
    });

    const songs = response.results.map(page => ({
      id: page.id,                                              // PAGE ID for relations
      name: page.properties.Name?.title?.[0]?.plain_text || '',
      artist: page.properties.Artist?.rich_text?.[0]?.plain_text || '',
      status: page.properties.Status?.select?.name || '',
      genre: (page.properties.Genre?.multi_select || []).map(g => g.name),
      guitar: page.properties.Guitar?.select?.name || '',
      difficulty: page.properties.Difficulty?.select?.name || '',
      chords: page.properties.Chords?.rich_text?.[0]?.plain_text || '',
      preset: page.properties.Preset?.select?.name || '',
      funFactor: (page.properties['Fun Factor']?.select?.name || '').length, // Count stars
      tabLink: page.properties['UG Tab Link']?.url || '',
      tabType: page.properties['Tab Type']?.select?.name || '',
    }));

    res.status(200).json({
      songs,
      fetchedAt: new Date().toISOString(),
      hasMore: response.has_more,
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### PATCH /api/notion/songs (song status update)

Uses query parameter for song ID: `PATCH /api/notion/songs?id=<page-id>`

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { id } = req.query;
  const { status } = req.body;

  const validStatuses = ['Want to Learn', 'Learning', 'On Hold', 'Can Play', 'Mastered', 'Archived'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        'Status': { select: { name: status } },
      },
    });

    res.status(200).json({ success: true, songId: id, newStatus: status });
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### POST /api/notion/sessions

Creates Practice Journal entry. **Relations use page IDs, not URLs.**

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { name, date, durationMinutes, focus, guitarUsed, songIds, rating, notes } = req.body;

  const properties = {
    'Name': { title: [{ text: { content: name } }] },
    'Date': { date: { start: date } },
    'Duration (min)': { number: durationMinutes },
    'Guitar Used': { select: { name: guitarUsed } },
  };

  // Optional fields
  if (focus && focus.length > 0) {
    properties['Focus'] = { multi_select: focus.map(f => ({ name: f })) };
  }
  if (songIds && songIds.length > 0) {
    // Relations use PAGE IDs (UUIDs), not URLs
    properties['Songs Worked On'] = { relation: songIds.map(id => ({ id })) };
  }
  if (rating) {
    // Convert number to star string: 4 → "⭐⭐⭐⭐"
    const starString = '⭐'.repeat(rating);
    properties['Rating'] = { select: { name: starString } };
  }
  if (notes) {
    properties['Notes'] = { rich_text: [{ text: { content: notes } }] };
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_JOURNAL_DB },
      properties,
    });

    res.status(200).json({
      success: true,
      notionPageId: response.id,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### POST /api/notion/strings

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { guitar, stringBrand, hoursPlayed, toneNotes } = req.body;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const properties = {
    'Name': { title: [{ text: { content: `${guitar} String Change - ${dateStr}` } }] },
    'Date Changed': { date: { start: new Date().toISOString().split('T')[0] } },
    'Guitar': { select: { name: guitar } },
    'String Brand': { select: { name: stringBrand } },
    'Replace Soon?': { checkbox: false },
  };

  if (hoursPlayed != null) properties['Hours Played (est)'] = { number: hoursPlayed };
  if (toneNotes) properties['Tone Notes'] = { rich_text: [{ text: { content: toneNotes } }] };

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_STRINGS_DB },
      properties,
    });
    res.status(200).json({ success: true, notionPageId: response.id });
  } catch (error) {
    console.error('Error logging string change:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### POST /api/notion/humidity

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { humidity, temperature, location, status, notes, timestamp } = req.body;
  const dateStr = new Date(timestamp || Date.now()).toLocaleString();

  const properties = {
    'Name': { title: [{ text: { content: `Reading - ${dateStr}` } }] },
    'Date': { date: { start: timestamp || new Date().toISOString() } },
    'Humidity (%)': { number: humidity },
    'Location': { select: { name: location } },
    'Status': { select: { name: status } },
    'Guitar': { select: { name: 'Taylor GS Mini' } },
  };

  if (temperature != null) properties['Temperature (F)'] = { number: temperature };
  if (notes) properties['Notes'] = { rich_text: [{ text: { content: notes } }] };

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_HUMIDITY_DB },
      properties,
    });
    res.status(200).json({ success: true, notionPageId: response.id });
  } catch (error) {
    console.error('Error logging humidity:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### POST /api/notion/maintenance

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { guitar, period, category, task, notes, issueDetected } = req.body;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const properties = {
    'Name': { title: [{ text: { content: `${task} - ${dateStr}` } }] },
    'Date': { date: { start: new Date().toISOString().split('T')[0] } },
    'Guitar': { select: { name: guitar } },
    'Period': { select: { name: period } },
    'Category': { select: { name: category } },
    'Task': { rich_text: [{ text: { content: task } }] },
    'Issue Detected': { checkbox: issueDetected || false },
  };

  if (notes) properties['Notes'] = { rich_text: [{ text: { content: notes } }] };

  try {
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_MAINTENANCE_DB },
      properties,
    });
    res.status(200).json({ success: true, notionPageId: response.id });
  } catch (error) {
    console.error('Error logging maintenance:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### POST /api/sync/batch

Processes multiple queued items with 350ms delay between Notion calls (stays under 3/sec limit).

```javascript
import { auth } from '../_lib/auth.js';

const DELAY_MS = 350;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Dynamic import to reuse existing route handlers
async function processItem(item) {
  // Re-use the logic from individual routes by calling them internally
  const routeMap = {
    '/api/notion/sessions': () => import('../notion/sessions.js'),
    '/api/notion/strings': () => import('../notion/strings.js'),
    '/api/notion/humidity': () => import('../notion/humidity.js'),
    '/api/notion/maintenance': () => import('../notion/maintenance.js'),
  };

  const getRoute = routeMap[item.endpoint];
  if (!getRoute) return { success: false, error: `Unknown endpoint: ${item.endpoint}` };

  // Create mock req/res to reuse handler logic
  const route = await getRoute();
  return new Promise((resolve) => {
    const mockReq = {
      method: item.method || 'POST',
      headers: { 'x-app-secret': process.env.APP_SECRET },
      body: item.payload,
      query: {},
    };
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        resolve({ success: this.statusCode < 400, ...data });
      },
    };
    route.default(mockReq, mockRes);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

  const results = [];
  for (let i = 0; i < items.length; i++) {
    try {
      const result = await processItem(items[i]);
      results.push({ index: i, ...result });
    } catch (error) {
      results.push({
        index: i,
        success: false,
        error: error.message,
        retryable: error.status === 429,
      });
    }
    // Throttle between requests
    if (i < items.length - 1) await sleep(DELAY_MS);
  }

  res.status(200).json({ results });
}
```

### GET /api/sync/status

```javascript
import { notion } from '../_lib/notion.js';
import { auth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req, res)) return;

  const databases = {};
  const dbMap = {
    songs: process.env.NOTION_SONG_DB,
    journal: process.env.NOTION_JOURNAL_DB,
    strings: process.env.NOTION_STRINGS_DB,
    humidity: process.env.NOTION_HUMIDITY_DB,
    maintenance: process.env.NOTION_MAINTENANCE_DB,
  };

  for (const [name, id] of Object.entries(dbMap)) {
    if (!id) {
      databases[name] = { accessible: false, error: 'Not configured' };
      continue;
    }
    try {
      await notion.databases.retrieve({ database_id: id });
      databases[name] = { accessible: true };
    } catch (error) {
      databases[name] = { accessible: false, error: error.message };
    }
  }

  res.status(200).json({
    notionConnected: Object.values(databases).some(d => d.accessible),
    databases,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 10b. Frontend: Simplified Practice Session Flow (New)

The original plan has 6 mandatory steps after stopping the timer. On iPhone, after you just finished playing, that's too much friction.

### Two Save Options

**Quick Save (1 tap after stopping timer):**
```
Timer stops → "Which guitar?" → [GS Mini] [CE24] → SAVED
```
Creates a minimal session: guitar + duration. No songs, no focus, no rating. Can be enriched later from session history.

**Full Save (for when user wants to log details):**
```
Timer stops → "Which guitar?" → [GS Mini] [CE24] [Both]
           → "What'd you work on?" → [Song picker + focus tags]  (skippable)
           → "How was it?" → [Rating + notes]  (skippable)
           → SAVED
           → "Update any song statuses?" (only if songs selected)
```

### Implementation

```
┌─────────────────────────────────┐
│  ⏱ 45:12                       │
│  [Stop Practice]                │
├─────────────────────────────────┤
│  Which guitar?                  │
│  [🌲 GS Mini] [⚡ CE24] [Both] │
│                                 │
│  ┌─────────────┐ ┌────────────┐│
│  │ Quick Save   │ │ Add Details││
│  │ (just log    │ │ (songs,    ││
│  │  the time)   │ │  rating)   ││
│  └─────────────┘ └────────────┘│
└─────────────────────────────────┘
```

Quick Save is the left (primary) action — the most common case. Add Details expands the full flow.

---

## Service Worker Strategy (New Section)

### Create `public/sw.js`

Since no service worker exists, we create one from scratch.

**Cache Strategy:**
- **Static assets (HTML, CSS, JS):** Cache-first with network fallback. Updated on new service worker activation.
- **API reads (GET /api/notion/songs):** Network-first with cache fallback. Ensures fresh data when online, cached data when offline.
- **API writes (POST /api/*):** Never cached. Handled by sync queue in localStorage.
- **External resources (Chart.js CDN, if used):** Cache-first.

**Cache Versioning:**
```javascript
const CACHE_NAME = 'guitar-tracker-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/config.js',
  '/js/storage.js',
  // ... all JS modules
  '/manifest.json',
];
```

**Lifecycle:**
1. On `install`: Pre-cache all static assets
2. On `activate`: Delete old caches
3. On `fetch`: Cache-first for static, network-first for API reads, passthrough for API writes

**No Background Sync API** — iOS Safari support is limited. Instead, the app's SyncManager (in `sync.js`) handles retries via `visibilitychange` and `online` events.

---

## Notion Database Creation Script (Amended)

### `scripts/create-notion-dbs.js`

Uses ESM and @notionhq/client to create the two new databases.

```javascript
import { Client } from '@notionhq/client';

// Load from environment or command line
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = '2f851ee9-25cd-8173-9533-f269472ba8d4'; // Guitar Journey page

const notion = new Client({ auth: NOTION_API_KEY });

async function createHumidityLog() {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Humidity Log' } }],
    icon: { type: 'emoji', emoji: '📊' },
    properties: {
      'Name': { title: {} },
      'Date': { date: {} },
      'Humidity (%)': { number: { format: 'number' } },
      'Temperature (F)': { number: { format: 'number' } },
      'Location': {
        select: {
          options: [
            { name: 'In Case', color: 'blue' },
            { name: 'Room', color: 'green' },
          ],
        },
      },
      'Status': {
        select: {
          options: [
            { name: 'Critical Low', color: 'red' },
            { name: 'Low', color: 'orange' },
            { name: 'Safe', color: 'yellow' },
            { name: 'Target', color: 'green' },
            { name: 'High', color: 'orange' },
            { name: 'Critical High', color: 'red' },
          ],
        },
      },
      'Guitar': {
        select: {
          options: [{ name: 'Taylor GS Mini', color: 'brown' }],
        },
      },
      'Notes': { rich_text: {} },
    },
  });
  console.log(`Humidity Log created. Database ID: ${db.id}`);
  return db.id;
}

async function createMaintenanceLog() {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Maintenance Log' } }],
    icon: { type: 'emoji', emoji: '🔧' },
    properties: {
      'Name': { title: {} },
      'Date': { date: {} },
      'Guitar': {
        select: {
          options: [
            { name: 'Taylor GS Mini', color: 'brown' },
            { name: 'PRS SE CE24', color: 'purple' },
          ],
        },
      },
      'Period': {
        select: {
          options: [
            { name: 'Daily' }, { name: 'Weekly' }, { name: 'Monthly' },
            { name: 'String Change' }, { name: 'Quarterly' },
            { name: '6-Month' }, { name: 'Annual' },
          ],
        },
      },
      'Category': {
        select: {
          options: [
            { name: 'Cleaning' }, { name: 'Hardware' }, { name: 'Electronics' },
            { name: 'Strings' }, { name: 'Fretboard' }, { name: 'Humidity' },
            { name: 'Inspection' }, { name: 'Professional Service' },
          ],
        },
      },
      'Task': { rich_text: {} },
      'Notes': { rich_text: {} },
      'Issue Detected': { checkbox: {} },
    },
  });
  console.log(`Maintenance Log created. Database ID: ${db.id}`);
  return db.id;
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error('Set NOTION_API_KEY environment variable first.');
    process.exit(1);
  }

  console.log('Creating Notion databases...\n');
  const humidityDbId = await createHumidityLog();
  const maintenanceDbId = await createMaintenanceLog();

  console.log('\n--- Add these to Vercel Environment Variables ---');
  console.log(`NOTION_HUMIDITY_DB=${humidityDbId}`);
  console.log(`NOTION_MAINTENANCE_DB=${maintenanceDbId}`);
}

main().catch(console.error);
```

### Also: Add EJ16 Option to String Change Log

The Notion API auto-creates select options when you write a new value. So on the first string change log entry for the GS Mini, the "D'Addario EJ16 (.012-.053)" option will be auto-created. No separate schema update script needed.

---

## Implementation Phases (Amended)

### Phase 1: Infrastructure & Bug Fix (~Day 1)

**Goal:** Vercel deployment working, Notion databases created, existing bug fixed.

1. Fix the `playingHours` reference error (visible in iOS screenshots)
2. Restructure repo: move files to `/public/`, create `/api/` directory
3. Create `vercel.json` and update `package.json`
4. Add `.gitignore` entries for `.env.local`, `node_modules/`
5. Create `/api/_lib/notion.js` and `/api/_lib/auth.js`
6. Create `/api/sync/status.js` as health check endpoint
7. Install `@notionhq/client` dependency
8. Run `scripts/create-notion-dbs.js` to create Humidity Log and Maintenance Log
9. Generate APP_SECRET and embed in `api-client.js`
10. Deploy to Vercel (connect GitHub repo)
11. **Mike:** Add all env vars to Vercel dashboard (including new DB IDs)
12. Verify: `GET /api/sync/status` returns all databases accessible

**Verification:** Visit `guitar.katieanneandmike.com/api/sync/status` (or Vercel preview URL) and confirm 5 databases show `accessible: true`.

### Phase 2: Multi-Guitar Core (~Days 2-3)

**Goal:** Two-guitar system with independent task tracking, all existing data preserved.

1. Rewrite `config.js` with full GUITARS, TASKS, INSPECTIONS, HUMIDITY objects from original spec Section 7
2. Implement v6 localStorage schema in `storage.js` with v5→v6 migration
3. Add guitar selector UI (persistent toggle at top of app)
4. Refactor `tasks.js` for per-guitar task rendering and completion
5. Add conditional periods (monthly, 6-month only for CE24)
6. Update `humidity.js` to only show for GS Mini
7. Update `ui.js` for per-guitar dashboard views
8. Update `sessions.js` to include guitar selection
9. Rename `stringHistory.js` → `strings.js`, add per-guitar tracking
10. Adapt `onboarding.js` for multi-guitar welcome
11. Preserve `inventory.js`, `history.js`, `export.js` functionality
12. Update tests for v6 schema

**Verification:**
- Switch between guitars — each shows correct task counts (19 GS Mini, 24 CE24)
- Complete a task on GS Mini — CE24 tasks unaffected
- Humidity tab shows for GS Mini, not CE24
- Existing data (humidity readings, sessions) is preserved after migration

### Phase 3: Song Library (Notion → App) (~Day 4)

**Goal:** Song library fetched from Notion, displayed in app, filterable.

1. Create `/api/notion/songs.js` GET route
2. Create `public/js/songs.js` — cache management, search, filtering
3. Create `public/js/api-client.js` — fetch wrapper with APP_SECRET header
4. Add Songs tab to bottom navigation
5. Build song list UI with search and guitar-type filter
6. Build song detail sheet (slide-up modal with status, chords, UG link)
7. Build song picker component (for practice session flow)
8. Handle offline: show stale cache with "May be outdated" warning

**Verification:**
- Open Songs tab — see songs from Notion
- Filter by "Electric" — shows only Electric/Both songs
- Tap song — see details, tap "Open in UG" — opens link
- Turn off network — Songs tab still shows cached list

### Phase 4: Notion Writes + Sync (~Days 5-6)

**Goal:** All data flows to Notion. Offline queue works.

1. Create remaining API routes: sessions, strings, humidity, maintenance
2. Create `public/js/sync.js` — SyncManager class
3. Build sync indicator in header (colored dot, not emoji)
4. Wire practice session flow (Quick Save + Full Save)
5. Wire song status updates (PATCH from song detail sheet)
6. Wire string change logging (triggered by "Install new strings" task)
7. Wire humidity reading sync (tasks flagged `syncToNotion: true`)
8. Wire maintenance event sync (significant tasks)
9. Create `/api/sync/batch.js` for bulk sync
10. Add sync triggers: `online` event, `visibilitychange`, manual refresh

**Verification:**
- Complete practice session → appears in Notion Practice Journal
- Change song status → updates in Notion Song Library
- Log humidity → appears in Notion Humidity Log
- Do it all offline → items queue → go online → sync completes
- Check sync indicator transitions: synced → pending → syncing → synced

### Phase 5: Service Worker + Polish (~Day 7)

**Goal:** True offline capability, domain setup, GitHub Pages deprecation.

1. Create `public/sw.js` with cache-first static + network-first API reads
2. Register service worker in `app.js`
3. Add Refresh button on Songs tab (not pull-to-refresh — simpler, more reliable)
4. Update `manifest.json` for new domain and scope
5. **Mike:** Set up DNS for guitar.katieanneandmike.com
6. **Mike:** Disable GitHub Pages or add redirect
7. Test full offline flow on iPhone
8. Test all inspection checklists with emergency modals
9. Final end-to-end pass on all flows

**Verification:** Full testing checklist from original spec Section 16, plus:
- [ ] App installs as PWA on iPhone
- [ ] Works completely offline after first load
- [ ] Sync queue processes reliably when coming back online
- [ ] guitar.katieanneandmike.com loads the app
- [ ] Old GitHub Pages URL no longer serves stale content

---

## Edge Cases & Gotchas (Amended)

### Corrected From Original

| Issue | Original Claim | Corrected |
|-------|---------------|-----------|
| Relation format | "Array of page URLs" | Array of page ID objects: `[{ id: "uuid" }]` |
| Select typos | "Silent failures" | Auto-creates new option (risk: duplicate options) |
| Service worker | "Update sw.js" | Create from scratch (doesn't exist) |
| DNS propagation | "5-30 minutes" | Up to 24-48 hours |

### Additional Edge Cases

1. **v5→v6 migration with empty data:** If user has a fresh install (no existing data), `migrateV5ToV6` should handle gracefully — just create the v6 default structure.

2. **Timer across migration:** If the user has an active timer (`timerState.running === true`) when the v6 migration runs, preserve it. The timer should still show correct elapsed time.

3. **Song Library exceeding 100 items:** The Notion API returns max 100 per query. Currently 48 songs. When it exceeds 100, add pagination with `has_more` and `next_cursor`. The API route should handle this transparently.

4. **Sync queue size:** If the user is offline for weeks and logs many sessions, the sync queue could grow large. The batch endpoint handles this, but add a UI indicator showing queue depth. Max queue size: 100 items (drop oldest if exceeded, with warning).

5. **Guitar.katieanneandmike.com PWA scope:** When installing as PWA from the new domain, the `manifest.json` scope must be `/` (not `/guitar-tracker/` as it is now).

6. **iOS Safari localStorage limits:** ~5MB per origin. With two guitars, full task history, humidity readings, and session history, estimate ~500KB-1MB max usage. Well within limits.

7. **Notion property name sensitivity:** Property names in API calls must EXACTLY match the database schema including capitalization and spaces. Example: `"Duration (min)"` not `"Duration"` or `"duration (min)"`.

---

## Testing Checklist (Amended)

### Infrastructure
- [ ] Vercel deployment serves static files at root
- [ ] API routes accessible at `/api/*`
- [ ] `/api/sync/status` returns all 5 databases accessible
- [ ] Humidity Log database exists with correct schema
- [ ] Maintenance Log database exists with correct schema
- [ ] `playingHours` bug is fixed (no console errors on load)

### Data Migration
- [ ] Fresh install creates v6 schema correctly
- [ ] v5 data migrates to v6 preserving all humidity readings
- [ ] v5 task completion dates map to correct v6 GS Mini task IDs
- [ ] v5 practice sessions preserved with `guitarId: 'gs-mini'`
- [ ] v5 string change history preserved
- [ ] v5 inventory data preserved
- [ ] v5 timer state preserved
- [ ] Earlier versions (v1-v4) still chain-migrate through to v6

### Multi-Guitar
- [ ] Guitar selector visible and functional
- [ ] Selection persists after reload
- [ ] GS Mini: 4 daily, 3 weekly, 0 monthly, 8 string-change, 3 quarterly, 0 6-month, 1 annual = 19 total
- [ ] CE24: 3 daily, 3 weekly, 3 monthly, 10 string-change, 2 quarterly, 2 6-month, 1 annual = 24 total
- [ ] Tasks are independent per guitar
- [ ] Humidity tab for GS Mini, not for CE24
- [ ] Correct inspections per guitar (bridge wings vs output jack)

### Song Library
- [ ] Songs load from Notion
- [ ] Cached with 30-min TTL
- [ ] Stale cache shown offline with warning
- [ ] Search by name and artist
- [ ] Filter by guitar type
- [ ] Song detail shows all fields
- [ ] "Open in UG" works

### Practice Sessions
- [ ] Quick Save: guitar + duration only (2 taps)
- [ ] Full Save: all fields work
- [ ] Timer survives phone lock (uses timestamp, not interval)
- [ ] Session creates Notion Practice Journal entry
- [ ] Song relations use page IDs correctly
- [ ] Song status updates work

### Sync
- [ ] Sync indicator shows correct state
- [ ] Items queue when offline
- [ ] Items sync when online
- [ ] Rate limiting (429) triggers retry, not data loss
- [ ] Batch sync respects 350ms throttle
- [ ] Failed items visible in sync status

### Offline
- [ ] App loads offline after first visit (service worker)
- [ ] All tasks completeable offline
- [ ] Sessions saveable offline
- [ ] Songs tab shows cached data
- [ ] Sync processes on reconnect
- [ ] No data lost during offline period

### Domain & PWA
- [ ] guitar.katieanneandmike.com loads the app
- [ ] SSL certificate valid
- [ ] PWA installable on iPhone
- [ ] Manifest scope is `/`
- [ ] GitHub Pages no longer serves old version

---

*End of amended specification. This document is the source of truth for implementation. The original spec's Section 7 (Guitar Configuration with all task definitions, inspections, and humidity config) remains authoritative for content — this document amends only the technical implementation.*
