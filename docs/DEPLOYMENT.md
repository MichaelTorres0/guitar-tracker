# Guitar Tracker v3 - Deployment Guide

## Prerequisites

- [x] GitHub repository with code pushed to main branch
- [ ] Vercel account (sign up at vercel.com)
- [ ] Notion integration with databases created
- [ ] Custom domain access (guitar.katieanneandmike.com)

## Step 1: Run Notion Database Setup

If you haven't already created the Notion databases:

```bash
# Create .env file with your Notion API key
echo "NOTION_API_KEY=REDACTED_NOTION_KEY" > .env

# Run setup script
node scripts/setup-notion-databases.js

# Copy the output database IDs and add to .env:
# NOTION_HUMIDITY_LOG_ID=...
# NOTION_MAINTENANCE_LOG_ID=...
```

## Step 2: Deploy to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `michaeltorres0/guitar-tracker`
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty - static site)
   - **Output Directory**: public
4. Click "Deploy"

### Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NOTION_API_KEY=REDACTED_NOTION_KEY
NOTION_SONG_LIBRARY_ID=4d5f9175-74fa-429e-aaf7-9ee54e35251a
NOTION_PRACTICE_JOURNAL_ID=d92cecec-3b62-4e37-9796-ba8c8791b1f3
NOTION_STRING_CHANGE_LOG_ID=63310750-12c2-4117-a737-71aabba87c3f
NOTION_HUMIDITY_LOG_ID=(from setup script output)
NOTION_MAINTENANCE_LOG_ID=(from setup script output)
```

**Important**: Set all variables for "Production", "Preview", and "Development" environments.

## Step 4: Verify Deployment

After deployment completes:

1. Visit your Vercel URL (e.g., `guitar-tracker.vercel.app`)
2. Test health check: `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"ok","notion":{"configured":true,"connected":true}}`
3. Test PWA functionality:
   - App loads offline
   - Can add to home screen
   - Service worker registers

## Step 5: Configure Custom Domain

### In Vercel

1. Go to Project → Settings → Domains
2. Add domain: `guitar.katieanneandmike.com`
3. Vercel will provide DNS records to configure

### In Squarespace DNS

Add the DNS records provided by Vercel:

**A Record:**
```
Type: A
Host: guitar
Value: 76.76.21.21 (Vercel's IP - use the IP they provide)
```

**CNAME Record (alternative):**
```
Type: CNAME
Host: guitar
Value: cname.vercel-dns.com (use the CNAME they provide)
```

**Wait for DNS propagation** (up to 48 hours, usually 5-15 minutes)

## Step 6: Update GitHub Pages (Optional)

If you want to keep GitHub Pages active, update the repository settings:

1. Go to repository Settings → Pages
2. Change source to deploy from `public/` directory
3. Or add a redirect in root `index.html` pointing to Vercel

## Verification Checklist

After deployment:

- [ ] Visit `https://guitar.katieanneandmike.com`
- [ ] Health check returns OK: `/api/health`
- [ ] PWA installs on mobile device
- [ ] Offline mode works
- [ ] Can log humidity readings
- [ ] Can complete maintenance tasks
- [ ] Songs tab loads (will be implemented in later tasks)

## Troubleshooting

### Notion API Not Connected

- Verify `NOTION_API_KEY` is set in Vercel environment variables
- Check Notion integration has access to the parent page
- View Vercel function logs for detailed error messages

### 404 on API Routes

- Ensure `vercel.json` is in repository root
- Check API route files are in `api/` directory
- Verify build completed successfully in Vercel dashboard

### Service Worker Issues

- Clear browser cache
- Unregister old service workers in DevTools → Application → Service Workers
- Check console for registration errors

## Rolling Back

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

## Next Steps

After successful deployment:

1. Test all existing v2 features work
2. Begin implementing multi-guitar features (Tasks 7+)
3. Implement Notion sync (Tasks 16-20)
4. Set up monitoring/alerts
