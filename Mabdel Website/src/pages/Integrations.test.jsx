import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Integrations from './Integrations';
import { smartflowApi } from '../api/services';

vi.mock('../api/services', () => ({
  smartflowApi: {
    getIntegrationCatalog: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            platform: 'facebook_messenger',
            platform_label: 'Facebook',
            connected: true,
            is_available: true,
            is_configured: true,
            auto_reply_enabled: false,
            last_webhook_at: '2026-11-17T12:00:00Z',
          },
          {
            platform: 'instagram',
            platform_label: 'Instagram',
            connected: true,
            is_available: true,
            is_configured: true,
            auto_reply_enabled: true,
            last_webhook_at: '2026-11-17T12:00:00Z',
          },
        ],
      },
    }),
    getIntegrationStatus: vi.fn().mockResolvedValue({ data: { data: [] } }),
    getSocialAutoReply: vi.fn().mockResolvedValue({
      data: {
        data: {
          enabled: false,
          platforms: {
            facebook_messenger: false,
            instagram: true,
          },
        },
      },
    }),
    setSocialAutoReply: vi.fn().mockResolvedValue({
      data: {
        data: { enabled: true, platform: 'facebook_messenger' },
      },
    }),
    disconnectIntegration: vi.fn().mockResolvedValue({}),
    getEmailDomain: vi.fn().mockResolvedValue({ data: { data: null } }),
    getTelnyxStatus: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
  adminApi: {
    getTelnyxNumbers: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

function renderIntegrations() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <Integrations />
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe('Integrations Page - Social Auto-Reply Toggles', () => {
  it('renders AI Auto-Reply switches for connected messaging channels', async () => {
    renderIntegrations();

    await waitFor(() => {
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);

    // Facebook starts off
    const fbSwitch = screen.getByRole('switch', { name: /Toggle AI auto-reply for Facebook/i });
    expect(fbSwitch).toBeInTheDocument();
    expect(fbSwitch).toHaveAttribute('aria-checked', 'false');

    // Instagram starts active
    const igSwitch = screen.getByRole('switch', { name: /Toggle AI auto-reply for Instagram/i });
    expect(igSwitch).toBeInTheDocument();
    expect(igSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking auto-reply toggle dispatches setSocialAutoReply API and flips switch state', async () => {
    renderIntegrations();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Toggle AI auto-reply for Facebook/i })).toBeInTheDocument();
    });

    const fbSwitch = screen.getByRole('switch', { name: /Toggle AI auto-reply for Facebook/i });
    fireEvent.click(fbSwitch);

    await waitFor(() => {
      expect(smartflowApi.setSocialAutoReply).toHaveBeenCalledWith({
        enabled: true,
        platform: 'facebook_messenger',
      });
      expect(fbSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });
});
