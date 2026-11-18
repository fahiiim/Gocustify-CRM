import { describe, expect, it, vi } from 'vitest';
import { restartCallIce } from './TelnyxVoiceContext';

describe('WebRTC ICE Restart & Network Reconnection (T29 / FEAT-CALL-05)', () => {
  it('restartCallIce triggers call.restartIce when available on call instance', () => {
    const mockCall = {
      restartIce: vi.fn(),
    };
    const result = restartCallIce(mockCall);
    expect(result).toBe(true);
    expect(mockCall.restartIce).toHaveBeenCalledTimes(1);
  });

  it('restartCallIce triggers peer.instance.restartIce when call lacks direct method', () => {
    const mockRestartIce = vi.fn();
    const mockCall = {
      peer: {
        instance: {
          restartIce: mockRestartIce,
        },
      },
    };
    const result = restartCallIce(mockCall);
    expect(result).toBe(true);
    expect(mockRestartIce).toHaveBeenCalledTimes(1);
  });

  it('restartCallIce triggers peerConnection.restartIce if available on root call', () => {
    const mockRestartIce = vi.fn();
    const mockCall = {
      peerConnection: {
        restartIce: mockRestartIce,
      },
    };
    const result = restartCallIce(mockCall);
    expect(result).toBe(true);
    expect(mockRestartIce).toHaveBeenCalledTimes(1);
  });

  it('restartCallIce returns false and handles null or unsupported call object gracefully', () => {
    expect(restartCallIce(null)).toBe(false);
    expect(restartCallIce(undefined)).toBe(false);
    expect(restartCallIce({})).toBe(false);
    expect(restartCallIce({ peer: {} })).toBe(false);
  });

  it('restartCallIce catches internal error and returns false without throwing', () => {
    const mockCall = {
      restartIce: vi.fn(() => {
        throw new Error('WebRTC internal failure');
      }),
    };
    expect(() => restartCallIce(mockCall)).not.toThrow();
    expect(restartCallIce(mockCall)).toBe(false);
  });
});
