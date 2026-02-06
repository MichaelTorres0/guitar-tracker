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

### GET /api/songs

Fetch all songs from Notion Song Library database.

**Response:**
```json
{
  "songs": [
    {
      "id": "page-id",
      "title": "Song Title",
      "artist": "Artist Name",
      "tuning": "Standard",
      "capo": 0,
      "difficulty": "Medium",
      "notes": "Practice notes",
      "lastPlayed": "2026-02-06",
      "url": "https://notion.so/..."
    }
  ],
  "count": 1,
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch songs",
  "message": "Error details",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

### POST /api/practice

Log a practice session to Notion Practice Journal.

**Request Body:**
```json
{
  "guitarId": "gs-mini",
  "duration": 30,
  "date": "2026-02-06",
  "notes": "Worked on fingerpicking",
  "songsPlayed": "Blackbird, Wonderwall"
}
```

**Response:**
```json
{
  "success": true,
  "pageId": "notion-page-id",
  "url": "https://notion.so/...",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

### POST /api/strings

Log a string change to Notion String Change Log.

**Request Body:**
```json
{
  "guitarId": "gs-mini",
  "date": "2026-02-06",
  "brand": "D'Addario EJ16",
  "notes": "Frets polished first",
  "daysSinceLast": 56
}
```

**Response:**
```json
{
  "success": true,
  "pageId": "notion-page-id",
  "url": "https://notion.so/...",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

### POST /api/humidity

Log a humidity reading to Notion Humidity Log.

**Request Body:**
```json
{
  "guitarId": "gs-mini",
  "humidity": 47,
  "temperature": 70,
  "location": "Case",
  "source": "Manual",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "pageId": "notion-page-id",
  "url": "https://notion.so/...",
  "alertLevel": "Normal",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

## Local Development

```bash
npm run dev
```

Access at: http://localhost:3000
