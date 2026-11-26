import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommandPaletteModal from './CommandPaletteModal';

describe('CommandPaletteModal Component', () => {
  it('renders search input when open and displays features', () => {
    render(
      <BrowserRouter>
        <CommandPaletteModal isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Type a feature name or keyword/i)).toBeDefined();
    expect(screen.getByText('Master AI Receptionist')).toBeDefined();
    expect(screen.getByText('Unified Omnichannel Inbox')).toBeDefined();
  });

  it('filters results by search query in modal', () => {
    render(
      <BrowserRouter>
        <CommandPaletteModal isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Type a feature name or keyword/i);
    fireEvent.change(input, { target: { value: 'receptionist' } });

    expect(screen.getByText('Master AI Receptionist')).toBeDefined();
    expect(screen.queryByText('Billing & Invoices')).toBeNull();
  });

  it('calls onClose when ESC is pressed', () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <CommandPaletteModal isOpen={true} onClose={handleClose} />
      </BrowserRouter>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
