// Health check endpoint - verifies API and Notion connectivity
// GET /api/health

import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      notion: {
        configured: false,
        connected: false
      }
    };

    // Check if Notion API key is configured
    if (process.env.NOTION_API_KEY) {
      health.notion.configured = true;

      // Test Notion connection
      try {
        const notion = new Client({ auth: process.env.NOTION_API_KEY });

        // Try to list users (minimal API call to verify connectivity)
        await notion.users.list({ page_size: 1 });

        health.notion.connected = true;
      } catch (notionError) {
        health.notion.error = notionError.message;
      }
    }

    return res.status(200).json(health);

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
