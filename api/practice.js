// POST /api/practice - Log practice session to Notion
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PRACTICE_JOURNAL_DB_ID = process.env.NOTION_PRACTICE_JOURNAL_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guitarId, duration, date, notes, songsPlayed } = req.body;

    // Validate required fields
    if (!guitarId || !duration || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['guitarId', 'duration', 'date']
      });
    }

    // Create page in Notion Practice Journal
    const response = await notion.pages.create({
      parent: { database_id: PRACTICE_JOURNAL_DB_ID },
      properties: {
        'Date': {
          date: { start: date }
        },
        'Guitar': {
          select: { name: guitarId === 'gs-mini' ? 'GS Mini' : 'PRS CE24' }
        },
        'Duration (min)': {
          number: parseInt(duration)
        },
        'Notes': {
          rich_text: [{ text: { content: notes || '' } }]
        },
        'Songs Played': {
          rich_text: [{ text: { content: songsPlayed || '' } }]
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
    console.error('Error logging practice session:', error);
    return res.status(500).json({
      error: 'Failed to log practice session',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
