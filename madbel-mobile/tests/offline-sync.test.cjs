const test = require('node:test');
const assert = require('node:assert/strict');
const { OfflineSyncService } = require('../src/services/offline_sync');

test('Offline Sync (T27 / FEAT-MOB-04): Enqueues mutations with metadata and timestamps', () => {
  const service = new OfflineSyncService();
  const mut = service.enqueue({
    type: 'CREATE_CONTACT',
    payload: { name: 'Dr. Jane Smith', phone: '+15551234567' },
  });

  assert.equal(typeof mut.id, 'string');
  assert.equal(mut.type, 'CREATE_CONTACT');
  assert.equal(mut.retryCount, 0);
  assert.equal(service.getQueue().length, 1);
});

test('Offline Sync (T27 / FEAT-MOB-04): Retains failed mutations in queue for retry instead of dropping', async () => {
  const service = new OfflineSyncService();
  service.enqueue({ type: 'SEND_MESSAGE', payload: { text: 'Hello offline' } });

  // Simulate network failure
  const executor = async () => {
    throw new Error('Network request failed');
  };

  const result = await service.processQueue(executor);
  assert.equal(result.processed, 0);
  assert.equal(result.failed, 1);
  assert.equal(result.remaining, 1);

  const queue = service.getQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].retryCount, 1);
  assert.equal(queue[0].lastError, 'Network request failed');
});

test('Offline Sync (T27 / FEAT-MOB-04): Successfully drains queue when executor succeeds', async () => {
  const service = new OfflineSyncService();
  service.enqueue({ type: 'UPDATE_NOTE', payload: { note: 'Client agreed to estimate' } });

  const executed = [];
  const executor = async (item) => {
    executed.push(item);
  };

  const result = await service.processQueue(executor);
  assert.equal(result.processed, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.remaining, 0);
  assert.equal(service.getQueue().length, 0);
  assert.equal(executed.length, 1);
});

test('Offline Sync (T27 / FEAT-MOB-04): Last-Write-Wins (LWW) conflict resolution prefers newer timestamp', () => {
  const service = new OfflineSyncService();

  const localNewer = {
    id: 'contact_1',
    name: 'Jane Local',
    updated_at: '2026-11-18T10:00:00Z',
  };
  const remoteOlder = {
    id: 'contact_1',
    name: 'Jane Remote',
    updated_at: '2026-11-18T09:00:00Z',
  };

  const resLocal = service.resolveConflict(localNewer, remoteOlder);
  assert.equal(resLocal.winner, 'local');
  assert.equal(resLocal.data.name, 'Jane Local');

  const remoteNewer = {
    id: 'contact_1',
    name: 'Jane Remote Latest',
    updated_at: '2026-11-18T11:00:00Z',
  };
  const resRemote = service.resolveConflict(localNewer, remoteNewer);
  assert.equal(resRemote.winner, 'remote');
  assert.equal(resRemote.data.name, 'Jane Remote Latest');
});
