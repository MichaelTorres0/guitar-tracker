# Guitar Tracker → Notion Sync Integration

**Date:** 2026-01-30
**Status:** Ready for Implementation

## Overview

Real-time sync from the Guitar Tracker PWA to Notion databases, enabling practice sessions, humidity readings, maintenance completions, and string changes to appear in the Guitar Wiki automatically.

## Architecture

```
┌─────────────────┐      HTTPS POST       ┌──────────────────┐      API       ┌─────────────┐
│  Guitar Tracker │  ─────────────────▶   │ Cloudflare Worker│  ──────────▶   │   Notion    │
│      PWA        │                       │    (proxy)       │                │  Databases  │
└─────────────────┘                       └──────────────────┘                └─────────────┘
        │                                          │
        │ localStorage                             │ Holds Notion token
        │ (always saves first)                     │ Validates origin
        ▼                                          │ Transforms data
   Local data                                      ▼
   (offline-safe)                           Notion pages created
```

### Key Principles

1. **Local-first**: App saves to localStorage immediately, then syncs. Never blocks on network.
2. **Fire-and-forget**: Sync happens in background. User doesn't wait.
3. **Graceful degradation**: Offline? Data queues. Syncs when back online.
4. **Single responsibility**: Worker only proxies to Notion. All logic stays in PWA.

## Data Flow

| App Action | Notion Destination |
|------------|-------------------|
| Log practice session | Practice Journal database (existing) |
| Log humidity reading | Humidity Log database (new) |
| Complete maintenance task | Maintenance Log database (new) |
| Change strings | String Change Log database (existing) |

## Cloudflare Worker

### Endpoint

```
POST https://guitar-sync.<subdomain>.workers.dev/sync
```

### Request Format

```json
{
  "type": "practice_session" | "humidity" | "maintenance" | "string_change",
  "data": { ... },
  "timestamp": "2026-01-30T19:00:00Z"
}
```

### Security Layers

| Layer | Implementation |
|-------|----------------|
| Origin check | Only accepts requests from `michaeltorres0.github.io` |
| Shared secret | Header `X-Sync-Key: [32-char random string]` |
| HTTPS | Automatic with Cloudflare |
| Token scope | Notion integration limited to 4 databases only |

### Worker Structure

```javascript
// Database mapping (easy to extend)
const DATABASES = {
  practice_session: "693d5c44-cd99-4300-b704-fde3f8944f71",
  humidity: "<humidity-log-id>",
  maintenance: "<maintenance-log-id>",
  string_change: "67e42824-93ea-4645-8b14-6cde41ca6bfb",
  // Future databases: just add lines here
};

// Secrets (encrypted in Cloudflare dashboard)
// - NOTION_TOKEN
// - SYNC_KEY
```

### Worker Logic (~50 lines)

1. Validate origin header
2. Validate sync key header
3. Parse request body
4. Map `type` → correct Notion database ID
5. Transform `data` → Notion page properties
6. POST to Notion API
7. Return success/error status

## Notion Setup

### Integration

| Setting | Value |
|---------|-------|
| Name | Guitar Tracker Sync |
| Capabilities | Insert content, Read content |
| User info | Not needed |

### Databases

| Database | Status | ID |
|----------|--------|-----|
| Practice Journal | Existing | `693d5c44-cd99-4300-b704-fde3f8944f71` |
| String Change Log | Existing | `67e42824-93ea-4645-8b14-6cde41ca6bfb` |
| Humidity Log | **Create** | TBD |
| Maintenance Log | **Create** | TBD |

### New Database Schemas

**Humidity Log:**

| Property | Type | Description |
|----------|------|-------------|
| Date | date | When reading was taken |
| Humidity % | number | Percentage (0-100) |
| Temperature °F | number | Temperature reading |
| Location | select | "In Case", "Room", "Other" |

**Maintenance Log:**

| Property | Type | Description |
|----------|------|-------------|
| Date | date | When task completed |
| Task | title | Task name |
| Category | select | "Daily", "Weekly", "8-Week", "Quarterly", "Annual" |

## PWA Changes

### New Module: `js/sync.js`

```
js/
├── sync.js          ← NEW: Notion sync logic (~80 lines)
├── storage.js       ← Minor: calls sync after saves
├── humidity.js      ← Minor: calls sync after adding reading
├── tasks.js         ← Minor: calls sync after completing task
├── sessions.js      ← Minor: calls sync after logging session
└── stringHistory.js ← Minor: calls sync after string change
```

### sync.js Functions

| Function | Purpose |
|----------|---------|
| `syncToNotion(type, data)` | Main entry point, called by other modules |
| `queueSync(type, data)` | Adds to offline queue if no network |
| `flushQueue()` | Retries queued items when back online |
| `handleSyncError(error)` | Shows toast on failure |

### Integration Points

```javascript
// In humidity.js after saving reading:
syncToNotion('humidity', reading);

// In tasks.js after completing task:
syncToNotion('maintenance', { taskId, taskName, category });

// In sessions.js after logging session:
syncToNotion('practice_session', session);

// In stringHistory.js after string change:
syncToNotion('string_change', { date, brand, notes });
```

## Data Mapping

### Practice Session

| App Field | Notion Property | Type |
|-----------|-----------------|------|
| `timestamp` | Date | date |
| `duration` | Duration (min) | number |
| `focus` | Focus | multi_select |
| `notes` | Notes | rich_text |
| `guitarUsed` | Guitar Used | select |

### Humidity Reading

| App Field | Notion Property | Type |
|-----------|-----------------|------|
| `timestamp` | Date | date |
| `humidity` | Humidity % | number |
| `temp` | Temperature °F | number |
| `location` | Location | select |

### Maintenance Completion

| App Field | Notion Property | Type |
|-----------|-----------------|------|
| `timestamp` | Date | date |
| `taskName` | Task | title |
| `category` | Category | select |

### String Change

| App Field | Notion Property | Type |
|-----------|-----------------|------|
| `date` | Date | date |
| `brand` | Brand | title |
| `notes` | Notes | rich_text |
| `daysFromPrevious` | Days Since Last | number |

## Error Handling & Offline

### Flow

```
User action
    │
    ▼
Save to localStorage ──────────────────▶ SUCCESS (always)
    │
    ▼
Online? ───No───▶ Queue for later
    │                    │
   Yes                   └──▶ Retry when online detected
    │
    ▼
POST to Worker
    │
    ├── 200 OK ──────────▶ Done (silent)
    ├── 401/403 ─────────▶ Config error toast, don't retry
    ├── 500 ─────────────▶ Add to retry queue
    └── Network error ───▶ Add to retry queue
```

### Retry Queue

| Trigger | Action |
|---------|--------|
| `navigator.onLine` fires | Flush queue |
| App opens | Check and flush queue |

### User Feedback

| Scenario | UI |
|----------|-----|
| Sync success | Nothing (silent) |
| Offline, queued | Subtle cloud icon with indicator |
| Sync failed, queued | Brief toast: "Synced locally, will retry" |
| Config error | Toast: "Notion sync error - check settings" |

### Queue Storage

- localStorage key: `notionSyncQueue`
- Auto-cleared after successful sync
- Max 100 items (prevents runaway storage)

## Implementation Steps

### One-Time Setup (~30 minutes)

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Create Cloudflare account (free) at cloudflare.com |
| 2 | 5 min | Create Notion integration at notion.so/my-integrations |
| 3 | 5 min | Create Humidity Log and Maintenance Log databases in Notion |
| 4 | 5 min | Connect integration to all 4 databases, copy database IDs |
| 5 | 10 min | Create and deploy Cloudflare Worker with config |
| 6 | — | Update PWA with sync module (code changes) |

### Development Tasks

1. **Create Cloudflare Worker** (`worker.js`)
   - Origin validation
   - Sync key validation
   - Database routing
   - Notion API integration
   - Error responses

2. **Create PWA sync module** (`js/sync.js`)
   - `syncToNotion()` function
   - Offline queue management
   - Online/offline detection
   - Error handling & toasts

3. **Integrate with existing modules**
   - `humidity.js` - add sync call
   - `tasks.js` - add sync call
   - `sessions.js` - add sync call
   - `stringHistory.js` - add sync call

4. **Add subtle offline indicator**
   - Cloud icon in header when items queued
   - CSS for indicator states

5. **Testing**
   - Test each sync type
   - Test offline queuing
   - Test queue flush on reconnect
   - Test error scenarios

## Security Considerations

- Notion token stored only in Cloudflare (encrypted)
- Sync key prevents unauthorized requests
- Origin header validation blocks other sites
- Notion integration scoped to specific databases only
- No sensitive data exposed in browser code

## Future Enhancements (v2)

- Pull Song Library from Notion for practice selection
- Sync indicator showing last successful sync time
- Manual "Sync Now" button in settings
- Conflict resolution if entries edited in both places
