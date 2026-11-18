import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users2,
  Settings,
  LogOut,
  Mic,
  Bot,
  ArrowLeft,
  Contact,
  FileText,
  PhoneCall,
  ExternalLink,
  Calendar,
  MessageCircle,
  Plug,
  Menu,
  Megaphone,
  ReceiptText,
  Shield,
  Search,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import logoImg from '../assets/gocustify-mark.png';
import { TelnyxVoiceProvider, useTelnyxVoice } from '../context/TelnyxVoiceContext';
import IncomingCallOverlay from '../components/Calls/IncomingCallOverlay';
import ActiveCallOverlay from '../components/Calls/ActiveCallOverlay';
import NotificationBellButton from '../components/NotificationBellButton';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { AlertTriangle, X as CloseIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import CommandPaletteModal from '../components/CommandPaletteModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Organized Navigation Categorization: structured by functional domain
const NAV_SECTIONS = [
  {
    id: 'core',
    label: 'Overview',
    items: [
      { key: 'layout_home', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    id: 'ai_voice',
    label: 'AI & Voice Receptionist',
    tag: 'Core AI',
    items: [
      {
        key: 'layout_voice_assistant',
        label: 'AI Receptionist',
        icon: Bot,
        path: '/ai-receptionist',
        badge: 'Master',
        badgeClass: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xs',
      },
      {
        key: 'layout_ai_calling',
        label: 'AI Calls & Audio',
        icon: PhoneCall,
        path: '/calls',
      },
      {
        key: 'layout_voice_conv',
        label: 'Spoken Voice Agent',
        icon: Mic,
        path: '/voice-conversation',
      },
    ],
  },
  {
    id: 'messaging',
    label: 'Omnichannel Inbox',
    items: [
      {
        key: 'layout_messages',
        label: 'Unified Inbox',
        icon: MessageSquare,
        path: '/conversations',
        badge: 'SMS + Social',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30',
      },
      {
        key: 'layout_bulk_messaging',
        label: 'Bulk Campaigns',
        icon: Megaphone,
        path: '/bulk-messaging',
      },
      {
        key: 'layout_create_post',
        label: 'Social Post AI',
        icon: MessageCircle,
        path: '/create-post',
      },
    ],
  },
  {
    id: 'crm_ops',
    label: 'CRM & Client Ops',
    items: [
      {
        key: 'layout_contacts',
        label: 'Contacts CRM',
        icon: Contact,
        path: '/contacts',
      },
      {
        key: 'layout_groups',
        label: 'Groups & Audiences',
        icon: Users2,
        path: '/groups',
      },
      {
        key: 'layout_calendar',
        label: 'Smart Calendar',
        icon: Calendar,
        path: '/calendar',
      },
      {
        key: 'layout_documents',
        label: 'Documents & e-Sign',
        icon: FileText,
        path: '/documents',
      },
      {
        key: 'layout_invoices',
        label: 'Invoices & Billing',
        icon: ReceiptText,
        path: '/invoices',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Platform & Settings',
    items: [
      {
        key: 'layout_integrations',
        label: 'Integrations Hub',
        icon: Plug,
        path: '/integrations',
      },
      {
        key: 'layout_profile',
        label: 'Account Settings',
        icon: Settings,
        path: '/profile',
      },
      {
        key: 'layout_admin',
        label: 'Super Admin',
        icon: Shield,
        path: '/admin',
        adminOnly: true,
      },
    ],
  },
];

// Flat fallback mapping for top header page title resolution
const allNavItems = NAV_SECTIONS.flatMap((s) => s.items);

// Team Management dashboard is a separate app (madbel-dashboard) shared with
// Owner/Manager only - Admin/Super Admin use their own dedicated dashboard login.
const TEAM_DASHBOARD_ROLES = new Set(['owner', 'manager']);
// VITE_DASHBOARD_URL was never actually configured in the production build (only
// documented in .env.example, never set for the live deploy), so this always fell
// through to the localhost dev fallback — the "Owner/Manager Dashboard" button opened
// an unreachable localhost tab for every real visitor. Falls back to the real
// production URL now instead. Strip any trailing slash so `${...}/sso` never doubles up.
const TEAM_DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL || 'https://owner.gocustify.com').replace(/\/+$/, '');

function CallOverlayHost() {
  const {
    incomingCall,
    currentCall,
    currentCallerName,
    currentCallerNumber,
    acceptIncomingCall,
    rejectIncomingCall,
    transferToAi,
    endCurrentCall,
    toggleMute,
    toggleSpeaker,
    isMuted,
    isSpeakerOn,
    durationSeconds,
    transcriptSegments,
    callStatusText,
  } = useTelnyxVoice();

  const latestTranscript = transcriptSegments.length
    ? transcriptSegments
        .slice(-3)
        .map((segment) => `${String(segment?.speaker || 'caller').toUpperCase()}: ${segment?.text || segment?.content || ''}`)
        .join('\n')
    : '';

  return (
    <>
      <IncomingCallOverlay
        callerName={currentCallerName}
        callerNumber={currentCallerNumber}
        isOpen={Boolean(incomingCall && !currentCall)}
        onAccept={acceptIncomingCall}
        onReject={rejectIncomingCall}
        onTransferToAi={transferToAi}
      />
      <ActiveCallOverlay
        callerName={currentCallerName}
        callerNumber={currentCallerNumber}
        isOpen={Boolean(currentCall)}
        onEndCall={endCurrentCall}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        isMuted={isMuted}
        isSpeaker={isSpeakerOn}
        durationSeconds={durationSeconds}
        statusText={callStatusText}
        latestTranscript={latestTranscript}
      />
    </>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // The sidebar is a fixed overlay on mobile (see the <aside> below) - close it
  // whenever the route changes, so a nav tap doesn't leave the drawer open on
  // top of the page it just navigated to.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K shortcut to open command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { t } = useLanguage();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const syncUnreadCount = useNotificationStore((state) => state.syncUnreadCount);
  const lockNotice = useSubscriptionStore((state) => state.lockNotice);
  const clearLockNotice = useSubscriptionStore((state) => state.clearLockNotice);
  const showTeamDashboardLink = TEAM_DASHBOARD_ROLES.has(user?.role || user?.primary_role);
  const userIsAdmin = ['super_admin', 'admin'].includes(user?.role || user?.primary_role);

  const openTeamDashboard = () => {
    // Regression for W03: the store's `token` is only set at login and never
    // updated by client.js's silent refresh (which writes straight to
    // localStorage), so it goes stale the moment the access token is refreshed -
    // SSO would then hand the dashboard an already-expired token. localStorage
    // is the one place both login and refresh actually keep current.
    const currentToken = localStorage.getItem('access_token');
    const ssoUrl = currentToken
      ? `${TEAM_DASHBOARD_URL}/sso?token=${encodeURIComponent(currentToken)}`
      : `${TEAM_DASHBOARD_URL}/sign-in`;
    window.open(ssoUrl, '_blank', 'noopener,noreferrer');
  };

  const path = location.pathname;
  
  // Determine if we are on a primary page or a sub-page
  const isPrimaryPage = ['/dashboard', '/conversations', '/voice-conversation', '/calls', '/contacts', '/documents', '/groups', '/profile'].includes(path);

  // Map sub-page paths to friendly titles
  const getSubPageTitle = () => {
    switch (path) {
      case '/contacts': return t('subpage_contacts_directory');
      case '/calendar': return t('subpage_calendar_events');
      case '/invoices': return t('subpage_billing_invoices');
      case '/documents': return t('subpage_document_templates');
      case '/calls': return t('subpage_ai_call_analytics');
      case '/integrations': return t('subpage_social_integrations');
      case '/notifications': return t('subpage_system_notifications');
      case '/bulk-messaging': return t('subpage_bulk_messaging');
      case '/create-post': return t('subpage_create_social_post');
      case '/admin': return t('subpage_system_administration');
      default: return t('subpage_back_to_home');
    }
  };

  useEffect(() => {
    syncUnreadCount().catch(() => {});
  }, [syncUnreadCount]);

  return (
    <TelnyxVoiceProvider>
    <div className="flex h-screen bg-[#02080B] text-white font-sans overflow-hidden">
      <CallOverlayHost />
      <CommandPaletteModal isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      
      {/* Mobile backdrop - closes the drawer on outside tap */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar - structured with categorized sections */}
      <aside
        className={cn(
          "w-64 bg-[#0c101b] border-r border-[#243041] flex flex-col shrink-0 select-none",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        {/* Brand Logo Header */}
        <div className="p-5 border-b border-[#243041]/40">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="GoCustify logo" 
              className="w-9 h-9 rounded-full object-contain drop-shadow-[0_0_15px_rgba(17,199,229,0.2)]" 
            />
            <div className="text-left">
              <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase">
                GoCustify
              </h1>
              <p className="text-[7.5px] font-bold text-[#9333ea]/80 tracking-[0.2em] uppercase mt-1">
                {t('layout_tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links - Organised by Domain */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => !item.adminOnly || userIsAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{section.label}</span>
                  {section.tag && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 font-bold border border-purple-500/30">
                      {section.tag}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => cn(
                        "group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 border border-transparent font-semibold text-xs text-left",
                        isActive 
                          ? "bg-[#17324A] text-white border-[#3B82F6]/30 shadow-[inset_1px_1px_2px_rgba(59,130,246,0.1)]" 
                          : "text-[#A4B0B7] hover:bg-slate-900/50 hover:text-white"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <item.icon 
                              size={16} 
                              className={cn(
                                "transition-colors shrink-0", 
                                isActive ? "text-[#60A5FA]" : "text-[#A4B0B7] group-hover:text-slate-200"
                              )} 
                            />
                            <span className="truncate">{t(item.key) !== item.key ? t(item.key) : item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={cn(
                              "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                              item.badgeClass || "bg-purple-900/60 text-purple-300 border border-purple-500/20"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#243041]/40 space-y-3">
          {/* Team Dashboard, Support and Logout */}
          <div className="space-y-1">
            {showTeamDashboardLink && (
              <button
                type="button"
                onClick={openTeamDashboard}
                className="flex items-center gap-3.5 px-4 py-2.5 w-full rounded-xl text-xs font-bold text-[#A4B0B7] hover:bg-slate-900/40 hover:text-white transition-all text-left cursor-pointer"
              >
                <ExternalLink size={16} />
                <span className="capitalize">
                  {(user?.role || user?.primary_role || 'team')} Dashboard
                </span>
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3.5 px-4 py-2.5 w-full rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all text-left"
            >
              <LogOut size={16} />
              <span>{t('layout_logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0c101b]/80 backdrop-blur-md border-b border-[#243041]/40 flex items-center justify-between px-8 z-10 shrink-0">
          
          {/* Header Left Section */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-2 text-slate-300 hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
            {!isPrimaryPage ? (
              /* If on a sub-page, show Back button */
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="p-2 bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <ArrowLeft size={15} />
                </button>
                <h2 className="text-sm font-extrabold text-white tracking-wide">{getSubPageTitle()}</h2>
              </div>
            ) : (
              /* If on a primary page, show simple title */
              <h2 className="text-base font-extrabold text-white tracking-tight uppercase">
                {path === '/dashboard' ? t('layout_dashboard_title') : (allNavItems.find(i => i.path === path)?.label || 'GoCustify')}
              </h2>
            )}
          </div>

          {/* Header Center - Quick Feature Search trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#111927] hover:bg-[#162338] border border-[#24354f] hover:border-purple-500/50 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner"
          >
            <Search size={14} className="text-purple-400" />
            <span className="font-medium">Quick find feature...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-slate-400 font-mono font-bold">⌘K</kbd>
          </button>

          {/* Header Right Section */}
          <div className="flex items-center gap-6">

            <LanguageSwitcher />

            {/* Notification Bell */}
            <NotificationBellButton
              count={unreadCount}
              active={path === '/notifications'}
              onClick={() => navigate('/notifications')}
              size={24}
              strokeWidth={2.75}
              buttonClassName="hover:text-white transition-colors relative cursor-pointer"
              className={cn(path === '/notifications' ? 'text-[#9333ea]' : 'text-slate-200')}
            />

            {/* Profile Avatar */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#243041] flex items-center justify-center text-[#9333ea] font-black overflow-hidden shadow-inner group-hover:border-[#9333ea]/50 transition-colors">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {lockNotice ? (
          <div className="flex items-center justify-between gap-4 border-b border-amber-500/20 bg-amber-950/30 px-6 py-3 text-sm text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-amber-400" />
              <span>
                {lockNotice.message ||
                  (lockNotice.code === 'PLAN_UPGRADE_REQUIRED'
                    ? 'This feature needs a higher plan.'
                    : 'Your subscription has expired.')}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile?tab=support')}
                className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-100 transition-colors hover:bg-amber-500/20"
              >
                {lockNotice.code === 'PLAN_UPGRADE_REQUIRED' ? 'Upgrade' : 'Renew'}
              </button>
              <button
                type="button"
                onClick={clearLockNotice}
                className="cursor-pointer text-amber-400/70 hover:text-amber-200"
                aria-label="Dismiss"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Scrollable outlet view */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#02080B] no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
    </TelnyxVoiceProvider>
  );
}

