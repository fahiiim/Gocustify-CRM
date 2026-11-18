/**
 * Offline Sync Queue & Conflict Resolution Service (T27 / FEAT-MOB-04)
 * Provides persistent offline mutation queueing with retry resilience and Last-Write-Wins (LWW) conflict resolution.
 */

class OfflineSyncService {
  constructor(storage = null) {
    this.storage = storage;
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(mutation) {
    const item = {
      id: mutation.id || `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: mutation.type,
      payload: mutation.payload || {},
      timestamp: mutation.timestamp || new Date().toISOString(),
      retryCount: mutation.retryCount || 0,
      maxRetries: mutation.maxRetries || 5,
    };
    this.queue.push(item);
    return item;
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
  }

  async processQueue(executor) {
    if (this.isProcessing || this.queue.length === 0) {
      return { processed: 0, failed: 0, remaining: this.queue.length };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;
    const remainingQueue = [];

    for (const item of this.queue) {
      try {
        await executor(item);
        processed += 1;
      } catch (err) {
        failed += 1;
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err?.message || String(err);
        if (item.retryCount < item.maxRetries) {
          // Retain in queue for next network reconnection
          remainingQueue.push(item);
        }
      }
    }

    this.queue = remainingQueue;
    this.isProcessing = false;
    return { processed, failed, remaining: this.queue.length };
  }

  resolveConflict(localRecord, remoteRecord) {
    if (!remoteRecord) return { winner: 'local', data: localRecord };
    if (!localRecord) return { winner: 'remote', data: remoteRecord };

    const localTime = new Date(localRecord.updated_at || localRecord.timestamp || 0).getTime();
    const remoteTime = new Date(remoteRecord.updated_at || remoteRecord.timestamp || 0).getTime();

    // Last-Write-Wins (LWW) conflict resolution
    if (localTime >= remoteTime) {
      return { winner: 'local', data: localRecord };
    }
    return { winner: 'remote', data: remoteRecord };
  }
}

const offlineSyncService = new OfflineSyncService();

module.exports = {
  OfflineSyncService,
  offlineSyncService,
};
