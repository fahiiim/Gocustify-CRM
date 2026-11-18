import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';

const mockT = (key) => key;

describe('MessageBubble Rich Components (T14 / 6.4 / FEAT-INBOX-02)', () => {
  it('renders audio player for voice notes / audio messages', () => {
    const message = {
      id: 'msg-audio-1',
      direction: 'inbound',
      audio_url: 'https://api.gocustify.com/media/audio.mp3',
      content: 'Please listen to this voice message.',
      timestamp: '2026-11-18T08:00:00Z',
    };

    const { container } = render(
      <MessageBubble message={message} onReply={vi.fn()} onForward={vi.fn()} t={mockT} />
    );

    const audioEl = container.querySelector('audio');
    expect(audioEl).toBeInTheDocument();
    expect(audioEl).toHaveAttribute('src', expect.stringContaining('audio.mp3'));
    expect(screen.getByText('Please listen to this voice message.')).toBeInTheDocument();
  });

  it('renders AI summary box with intent pill and requirement tag', () => {
    const message = {
      id: 'msg-ai-1',
      direction: 'inbound',
      content: 'Can I schedule a root canal next Tuesday?',
      ai_summary: {
        intent: 'Appointment Request',
        summary: 'Customer requests root canal on Tuesday.',
      },
      sender_requirement: 'Needs Doctor confirmation',
      timestamp: '2026-11-18T08:05:00Z',
    };

    render(<MessageBubble message={message} onReply={vi.fn()} onForward={vi.fn()} t={mockT} />);

    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText('Appointment Request')).toBeInTheDocument();
    expect(screen.getByText('Customer requests root canal on Tuesday.')).toBeInTheDocument();
    expect(screen.getByText('Requirement: Needs Doctor confirmation')).toBeInTheDocument();
  });
});
