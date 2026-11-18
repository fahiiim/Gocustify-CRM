import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import client, { refreshAccessToken } from './client';

vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
    },
  };
});

describe('Axios Client Token Refresh Mutex (T16 / FEAT-AUTH-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('refreshAccessToken exchanges refresh_token for new access_token', async () => {
    localStorage.setItem('refresh_token', 'mock_refresh_token_123');

    axios.post.mockResolvedValueOnce({
      data: {
        data: {
          access_token: 'new_access_token_456',
          refresh_token: 'new_refresh_token_789',
        },
      },
    });

    const token = await refreshAccessToken();
    expect(token).toBe('new_access_token_456');
    expect(localStorage.getItem('access_token')).toBe('new_access_token_456');
    expect(localStorage.getItem('refresh_token')).toBe('new_refresh_token_789');
  });

  it('refreshAccessToken throws if no refresh token is stored in localStorage', async () => {
    await expect(refreshAccessToken()).rejects.toThrow('No refresh token available.');
  });
});
