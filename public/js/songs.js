// Song library management
import { getSongCache, setSongCache, clearSongCache } from './storage.js';

export async function getSongs(forceRefresh = false) {
    // Check cache first unless forcing refresh
    if (!forceRefresh) {
        const cached = getSongCache();
        if (cached) {
            return cached;
        }
    }

    try {
        // Fetch from API
        const response = await fetch('/api/songs');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the results
        if (data.songs) {
            setSongCache(data.songs);
            return data.songs;
        }

        return [];
    } catch (error) {
        console.error('Error fetching songs:', error);

        // Return cached data even if expired, as fallback
        const cached = getSongCache();
        if (cached) {
            console.log('Using stale cache due to fetch error');
            return cached;
        }

        throw error;
    }
}

export function searchSongs(songs, query) {
    if (!query) return songs;

    const lower = query.toLowerCase();
    return songs.filter(song =>
        song.title.toLowerCase().includes(lower) ||
        song.artist.toLowerCase().includes(lower) ||
        song.notes.toLowerCase().includes(lower)
    );
}

export function filterByDifficulty(songs, difficulty) {
    if (!difficulty || difficulty === 'all') return songs;
    return songs.filter(song => song.difficulty === difficulty);
}

export function filterByTuning(songs, tuning) {
    if (!tuning || tuning === 'all') return songs;
    return songs.filter(song => song.tuning === tuning);
}
