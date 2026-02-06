// POST /api/humidity - Log humidity reading to Notion
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guitarId, humidity, temperature, location, source, timestamp } = req.body;

    // Validate required fields
    if (!guitarId || humidity === undefined || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['guitarId', 'humidity', 'timestamp']
      });
    }

    // Determine alert level
    let alertLevel = 'Normal';
    if (humidity < 35 || humidity > 60) {
      alertLevel = 'Critical';
    } else if (humidity < 40 || humidity > 55) {
      alertLevel = 'Warning';
    }

    // Get humidity log database ID from env (will be added later)
    const HUMIDITY_LOG_DB_ID = process.env.NOTION_HUMIDITY_LOG_ID;
    
    if (!HUMIDITY_LOG_DB_ID) {
      return res.status(500).json({
        error: 'Humidity Log database not configured',
        message: 'Run setup-notion-databases.js script first'
      });
    }

    // Create page in Notion Humidity Log
    const response = await notion.pages.create({
      parent: { database_id: HUMIDITY_LOG_DB_ID },
      properties: {
        'Reading ID': {
          title: [{ text: { content: `${guitarId}-${Date.now()}` } }]
        },
        'Guitar': {
          select: { name: guitarId === 'gs-mini' ? 'GS Mini' : 'PRS CE24' }
        },
        'Humidity': {
          number: parseFloat(humidity)
        },
        'Temperature': {
          number: temperature ? parseFloat(temperature) : null
        },
        'Location': {
          select: { name: location || 'Case' }
        },
        'Source': {
          select: { name: source || 'Manual' }
        },
        'Timestamp': {
          date: { start: timestamp }
        },
        'Alert Level': {
          select: { name: alertLevel }
        }
      }
    });

    return res.status(201).json({
      success: true,
      pageId: response.id,
      url: response.url,
      alertLevel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error logging humidity reading:', error);
    return res.status(500).json({
      error: 'Failed to log humidity reading',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
