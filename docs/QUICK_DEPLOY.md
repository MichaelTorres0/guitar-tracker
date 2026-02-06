# Quick Deployment Reference

## Pre-Deployment Checklist

Run this command to verify readiness:
```bash
npm run pre-deploy
```

All checks should pass before deploying.

## Deploy in 3 Steps

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Deploy to Vercel

**Option A: Dashboard (Recommended for first deployment)**
1. Visit https://vercel.com/new
2. Import repository: `michaeltorres0/guitar-tracker`
3. Configure:
   - Framework: Other
   - Root: ./
   - Build Command: (leave empty)
   - Output Directory: public
4. Click Deploy

**Option B: CLI**
```bash
vercel --prod
```

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NOTION_API_KEY=REDACTED_NOTION_KEY
NOTION_SONG_LIBRARY_ID=4d5f9175-74fa-429e-aaf7-9ee54e35251a
NOTION_PRACTICE_JOURNAL_ID=d92cecec-3b62-4e37-9796-ba8c8791b1f3
NOTION_STRING_CHANGE_LOG_ID=63310750-12c2-4117-a737-71aabba87c3f
NOTION_HUMIDITY_LOG_ID=(from setup script output)
NOTION_MAINTENANCE_LOG_ID=(from setup script output)
```

Set for: Production, Preview, and Development

## Custom Domain Setup

1. Vercel Dashboard → Project → Settings → Domains
2. Add: `guitar.katieanneandmike.com`
3. Copy DNS records from Vercel
4. Add to Squarespace DNS:
   - Type: A or CNAME
   - Host: guitar
   - Value: (from Vercel)

## Verify Deployment

- [ ] Visit `https://guitar.katieanneandmike.com`
- [ ] Test API: `/api/health`
- [ ] App loads and works offline
- [ ] Can log data and complete tasks

## Need Help?

See full guide: `docs/DEPLOYMENT.md`
