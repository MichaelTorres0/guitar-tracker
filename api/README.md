# Guitar Tracker API Routes

Vercel serverless functions for Notion sync integration.

## Environment Variables Required

Set these in Vercel dashboard → Settings → Environment Variables:

- `NOTION_API_KEY` - Integration token (ntn_...)
- `NOTION_SONG_LIBRARY_ID` - Song Library database ID
- `NOTION_PRACTICE_JOURNAL_ID` - Practice Journal database ID
- `NOTION_STRING_CHANGE_LOG_ID` - String Change Log database ID

## Endpoints

### GET /api/health

Health check endpoint - verifies API and Notion connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T12:00:00.000Z",
  "notion": {
    "configured": true,
    "connected": true
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "Error message here",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

If Notion connection fails:
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T12:00:00.000Z",
  "notion": {
    "configured": true,
    "connected": false,
    "error": "API error message"
  }
}
```

## Local Development

```bash
npm run dev
```

Access at: http://localhost:3000
