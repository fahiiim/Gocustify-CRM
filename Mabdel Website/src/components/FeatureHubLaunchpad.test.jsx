import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeatureHubLaunchpad from './FeatureHubLaunchpad';

describe('FeatureHubLaunchpad Component', () => {
  it('renders all platform features and category filter pills', () => {
    render(
      <BrowserRouter>
        <FeatureHubLaunchpad />
      </BrowserRouter>
    );

    expect(screen.getByText('Feature Hub & Quick Launchpad')).toBeDefined();
    expect(screen.getByText('Master AI Receptionist')).toBeDefined();
    expect(screen.getByText('Unified Omnichannel Inbox')).toBeDefined();
    expect(screen.getByText('Smart Calendar & Booking')).toBeDefined();
    expect(screen.getByText('Billing & Invoices')).toBeDefined();
  });

  it('filters features by category tab', () => {
    render(
      <BrowserRouter>
        <FeatureHubLaunchpad />
      </BrowserRouter>
    );

    const aiTab = screen.getByRole('button', { name: /AI & Voice/i });
    fireEvent.click(aiTab);

    expect(screen.getByText('Master AI Receptionist')).toBeDefined();
    expect(screen.queryByText('Billing & Invoices')).toBeNull();
  });

  it('filters features by search input', () => {
    render(
      <BrowserRouter>
        <FeatureHubLaunchpad />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search features/i);
    fireEvent.change(searchInput, { target: { value: 'receptionist' } });

    expect(screen.getByText('Master AI Receptionist')).toBeDefined();
    expect(screen.queryByText('Smart Calendar & Booking')).toBeNull();
  });
});
