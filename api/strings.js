// POST /api/strings - Log string change to Notion
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const STRING_CHANGE_LOG_DB_ID = process.env.NOTION_STRING_CHANGE_LOG_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guitarId, date, brand, notes, daysSinceLast } = req.body;

    // Validate required fields
    if (!guitarId || !date || !brand) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['guitarId', 'date', 'brand']
      });
    }

    // Create page in Notion String Change Log
    const response = await notion.pages.create({
      parent: { database_id: STRING_CHANGE_LOG_DB_ID },
      properties: {
        'Date': {
          date: { start: date }
        },
        'Guitar': {
          select: { name: guitarId === 'gs-mini' ? 'GS Mini' : 'PRS CE24' }
        },
        'String Brand': {
          rich_text: [{ text: { content: brand } }]
        },
        'Notes': {
          rich_text: [{ text: { content: notes || '' } }]
        },
        'Days Since Last': {
          number: daysSinceLast || null
        }
      }
    });

    return res.status(201).json({
      success: true,
      pageId: response.id,
      url: response.url,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error logging string change:', error);
    return res.status(500).json({
      error: 'Failed to log string change',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
