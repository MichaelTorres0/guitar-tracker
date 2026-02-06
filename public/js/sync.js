// SyncManager - Handles syncing local data to Notion
import { getSyncQueue, addToSyncQueue, clearSyncQueue, getActiveGuitarId } from './storage.js';

export class SyncManager {
    constructor() {
        this.syncing = false;
        this.queue = [];
    }

    // Add practice session to sync queue
    async logPracticeSession(duration, notes = '', songsPlayed = '') {
        const guitarId = getActiveGuitarId();
        const date = new Date().toISOString().split('T')[0];

        const item = {
            type: 'practice',
            guitarId,
            duration,
            date,
            notes,
            songsPlayed,
            timestamp: new Date().toISOString()
        };

        // Try to sync immediately
        try {
            const response = await fetch('/api/practice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return { success: true, ...result };

        } catch (error) {
            console.error('Failed to sync practice session, adding to queue:', error);
            addToSyncQueue(item);
            return { success: false, queued: true, error: error.message };
        }
    }

    // Log string change to Notion
    async logStringChange(brand, notes = '', daysSinceLast = null) {
        const guitarId = getActiveGuitarId();
        const date = new Date().toISOString().split('T')[0];

        const item = {
            type: 'strings',
            guitarId,
            brand,
            date,
            notes,
            daysSinceLast,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/strings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return { success: true, ...result };

        } catch (error) {
            console.error('Failed to sync string change, adding to queue:', error);
            addToSyncQueue(item);
            return { success: false, queued: true, error: error.message };
        }
    }

    // Log humidity reading to Notion
    async logHumidityReading(humidity, temperature = null, location = 'Case', source = 'Manual') {
        const guitarId = getActiveGuitarId();
        const timestamp = new Date().toISOString();

        const item = {
            type: 'humidity',
            guitarId,
            humidity,
            temperature,
            location,
            source,
            timestamp
        };

        try {
            const response = await fetch('/api/humidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return { success: true, ...result };

        } catch (error) {
            console.error('Failed to sync humidity reading, adding to queue:', error);
            addToSyncQueue(item);
            return { success: false, queued: true, error: error.message };
        }
    }

    // Process sync queue (retry failed syncs)
    async processSyncQueue() {
        if (this.syncing) {
            return { message: 'Sync already in progress' };
        }

        const queue = getSyncQueue();
        if (queue.length === 0) {
            return { message: 'Queue is empty' };
        }

        this.syncing = true;
        const results = [];

        for (const item of queue) {
            try {
                const endpoint = `/api/${item.type}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });

                if (response.ok) {
                    results.push({ ...item, status: 'synced' });
                } else {
                    results.push({ ...item, status: 'failed', error: `HTTP ${response.status}` });
                }
            } catch (error) {
                results.push({ ...item, status: 'failed', error: error.message });
            }
        }

        // Remove successfully synced items from queue
        const failed = results.filter(r => r.status === 'failed');
        if (failed.length === 0) {
            clearSyncQueue();
        } else {
            // Only keep failed items in queue
            // This would require a more sophisticated queue management
            console.log(`${failed.length} items failed to sync, keeping in queue`);
        }

        this.syncing = false;

        return {
            total: queue.length,
            synced: results.filter(r => r.status === 'synced').length,
            failed: failed.length,
            results
        };
    }

    // Get queue status
    getQueueStatus() {
        const queue = getSyncQueue();
        return {
            count: queue.length,
            items: queue,
            syncing: this.syncing
        };
    }
}

// Export singleton instance
export const syncManager = new SyncManager();
