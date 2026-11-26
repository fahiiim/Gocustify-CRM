import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Conversations from './Conversations';
import { smartflowApi } from '../api/services';

vi.mock('../api/services', () => ({
  smartflowApi: {
    getConversations: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 'conv-sms-1',
            platform: 'sms',
            contact_name: 'John Doe SMS',
            last_message_preview: 'Hello via SMS',
            unread_count: 1,
            is_customer_conversation: true,
          },
          {
            id: 'conv-team-1',
            platform: 'global',
            contact_name: 'General Team Chat',
            last_message_preview: 'Team meeting today',
            unread_count: 0,
            is_customer_conversation: false,
          },
          {
            id: 'conv-whatsapp-1',
            platform: 'whatsapp',
            contact_name: 'WhatsApp Contact',
            last_message_preview: 'Hello via WhatsApp',
            unread_count: 0,
            is_customer_conversation: true,
          },
        ],
      },
    }),
    getConversationMessages: vi.fn().mockResolvedValue({ data: { data: [] } }),
    markConversationRead: vi.fn().mockResolvedValue({}),
    createConversation: vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 'conv-new-sms',
          title: '+15551234567',
          platform: 'sms',
          type: 'direct',
        },
      },
    }),
    sendMessage: vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 'msg-new-sms',
          conversation_id: 'conv-new-sms',
          content: 'Outbound test SMS',
        },
      },
    }),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id', name: 'Test User' } }),
}));

describe('Conversations Page - SMS Visibility (1.4 / T01)', () => {
  it('renders the SMS filter badge and displays SMS conversations instead of hiding them', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Conversations />
        </LanguageProvider>
      </BrowserRouter>
    );

    // 1. Wait for debounced fetch and conversations to populate
    const contact = await screen.findByText('John Doe SMS', {}, { timeout: 3000 });
    expect(contact).toBeInTheDocument();
    expect(screen.getByText('Hello via SMS')).toBeInTheDocument();

    // 2. Verify SMS filter tab button is rendered with count
    const filterButtons = screen.getAllByRole('button');
    const smsFilterBtn = filterButtons.find(
      (btn) => btn.textContent.includes('SMS') && btn.textContent.includes('(1)')
    );
    expect(smsFilterBtn).toBeDefined();

    // 3. Verify external WhatsApp conversation remains filtered out from internal conversations view
    expect(screen.queryByText('WhatsApp Contact')).not.toBeInTheDocument();
  });
});

describe('Conversations Page - Manual Outbound SMS Composer (3.5 / T05)', () => {
  it('opens the New SMS modal, fills in recipient details and sends an outbound SMS', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <Conversations />
        </LanguageProvider>
      </BrowserRouter>
    );

    // 1. Locate and click "+ New SMS" button
    const newSmsBtn = await screen.findByRole('button', { name: /New SMS/i });
    expect(newSmsBtn).toBeInTheDocument();
    fireEvent.click(newSmsBtn);

    // 2. Verify modal appears
    expect(screen.getByText('New Outbound SMS')).toBeInTheDocument();

    // 3. Fill in Phone Number and Message
    const phoneInput = screen.getByPlaceholderText('+1 (555) 234-5678');
    const messageInput = screen.getByPlaceholderText('Type your outbound SMS message here...');
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');

    fireEvent.change(phoneInput, { target: { value: '+15551234567' } });
    fireEvent.change(nameInput, { target: { value: 'Dr. Jane Smith' } });
    fireEvent.change(messageInput, { target: { value: 'Your appointment is confirmed for tomorrow.' } });

    // 4. Click Send SMS button
    const sendBtn = screen.getByRole('button', { name: /Send SMS/i });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    // 5. Verify API calls
    await waitFor(() => {
      expect(smartflowApi.createConversation).toHaveBeenCalledWith({
        title: 'Dr. Jane Smith',
        platform: 'sms',
        type: 'direct',
      });
      expect(smartflowApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'conv-new-sms',
          content: 'Your appointment is confirmed for tomorrow.',
          platform: 'sms',
        })
      );
    });

    // 6. Verify modal closes after successful send
    await waitFor(() => {
      expect(screen.queryByText('New Outbound SMS')).not.toBeInTheDocument();
    });
  });
});
