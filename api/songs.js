// GET /api/songs - Fetch all songs from Notion Song Library
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const SONG_LIBRARY_DB_ID = process.env.NOTION_SONG_LIBRARY_ID;

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query Notion database
    const response = await notion.databases.query({
      database_id: SONG_LIBRARY_DB_ID,
      sorts: [
        {
          property: 'Title',
          direction: 'ascending'
        }
      ]
    });

    // Transform Notion results to our format
    const songs = response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || '',
      artist: page.properties.Artist?.rich_text?.[0]?.plain_text || '',
      tuning: page.properties.Tuning?.select?.name || 'Standard',
      capo: page.properties.Capo?.number || 0,
      difficulty: page.properties.Difficulty?.select?.name || 'Medium',
      notes: page.properties.Notes?.rich_text?.[0]?.plain_text || '',
      lastPlayed: page.properties['Last Played']?.date?.start || null,
      url: page.url
    }));

    return res.status(200).json({
      songs,
      count: songs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching songs:', error);
    return res.status(500).json({
      error: 'Failed to fetch songs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
