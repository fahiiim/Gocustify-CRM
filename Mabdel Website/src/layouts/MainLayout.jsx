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
  Activity,
  AlertTriangle,
  X as CloseIcon,
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
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import CommandPaletteModal from '../components/CommandPaletteModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Organized Navigation Categorization: 5 clear, functional domains
const NAV_SECTIONS = [
  {
    id: 'overview',
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
        badgeClass: 'bg-purple-900/80 text-purple-200 border border-purple-500/30',
      },
      {
        key: 'layout_voice_conv',
        label: 'Spoken Voice Agent',
        icon: Mic,
        path: '/voice-conversation',
      },
      {
        key: 'layout_ai_calling',
        label: 'Calls & Audio Logs',
        icon: PhoneCall,
        path: '/calls',
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
        badge: 'Live',
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
    label: 'Client & Business Ops',
    items: [
      {
        key: 'layout_contacts',
        label: 'Contacts CRM',
        icon: Contact,
        path: '/contacts',
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
      {
        key: 'layout_groups',
        label: 'Audience Groups',
        icon: Users2,
        path: '/groups',
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

const allNavItems = NAV_SECTIONS.flatMap((s) => s.items);

const TEAM_DASHBOARD_ROLES = new Set(['owner', 'manager']);
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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
    const currentToken = localStorage.getItem('access_token');
    const ssoUrl = currentToken
      ? `${TEAM_DASHBOARD_URL}/sso?token=${encodeURIComponent(currentToken)}`
      : `${TEAM_DASHBOARD_URL}/sign-in`;
    window.open(ssoUrl, '_blank', 'noopener,noreferrer');
  };

  const path = location.pathname;
  const isPrimaryPage = ['/dashboard', '/conversations', '/voice-conversation', '/calls', '/contacts', '/documents', '/groups', '/profile'].includes(path);

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
      <div className="flex h-screen bg-[#090D16] text-slate-100 font-sans overflow-hidden">
        <CallOverlayHost />
        <CommandPaletteModal isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

        {/* Mobile backdrop */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={cn(
            "w-64 bg-[#0C121E] border-r border-[#1B273A] flex flex-col shrink-0 select-none",
            "fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:translate-x-0 shadow-2xl",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Brand Logo Header */}
          <div className="p-4 border-b border-[#1B273A] bg-gradient-to-b from-[#111A2C]/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={logoImg}
                  alt="GoCustify logo"
                  className="w-9 h-9 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0C121E]" />
              </div>
              <div className="text-left">
                <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase">
                  GoCustify
                </h1>
                <p className="text-[8px] font-bold text-purple-400/90 tracking-[0.2em] uppercase mt-1">
                  {t('layout_tagline') || 'AI CRM Platform'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Nav Links */}
          <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
            {NAV_SECTIONS.map((section) => {
              const visibleItems = section.items.filter((item) => !item.adminOnly || userIsAdmin);
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.id} className="space-y-1">
                  <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <span>{section.label}</span>
                    {section.tag && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
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
                          "group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 border font-medium text-xs text-left",
                          isActive
                            ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-transparent border-l-2 border-purple-400 text-white font-bold shadow-xs border-r-transparent border-t-transparent border-b-transparent"
                            : "border-transparent text-slate-400 hover:bg-[#152033] hover:text-slate-100"
                        )}
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <item.icon
                                size={16}
                                className={cn(
                                  "transition-all shrink-0",
                                  isActive ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "text-slate-400 group-hover:text-slate-200"
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
          <div className="p-3 border-t border-[#1B273A] bg-[#0A0F1A] space-y-1">
            {showTeamDashboardLink && (
              <button
                type="button"
                onClick={openTeamDashboard}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-xs font-semibold text-slate-400 hover:bg-[#152033] hover:text-white transition-all text-left cursor-pointer"
              >
                <ExternalLink size={15} className="text-purple-400" />
                <span className="capitalize">
                  {(user?.role || user?.primary_role || 'team')} Dashboard
                </span>
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all text-left cursor-pointer"
            >
              <LogOut size={15} />
              <span>{t('layout_logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main View Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Header Bar */}
          <header className="h-16 bg-[#0C121E]/80 backdrop-blur-md border-b border-[#1B273A] flex items-center justify-between px-6 z-10 shrink-0">
            {/* Header Left */}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 bg-[#121A2B] border border-[#213048] hover:border-purple-500/40 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <h2 className="text-sm font-extrabold text-white tracking-wide">{getSubPageTitle()}</h2>
                </div>
              ) : (
                <h2 className="text-base font-extrabold text-white tracking-tight uppercase">
                  {path === '/dashboard' ? t('layout_dashboard_title') : (allNavItems.find(i => i.path === path)?.label || 'GoCustify')}
                </h2>
              )}
            </div>

            {/* Header Center - Quick Feature Finder & Live Badge */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => navigate('/ai-receptionist')}
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-900/30 transition-colors shadow-xs"
                title="AI Receptionist is active"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>AI Receptionist Online</span>
              </div>

              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10192A] hover:bg-[#16233B] border border-[#21324E] hover:border-purple-500/50 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner group"
              >
                <Search size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Quick find feature...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-purple-300 font-mono font-bold">⌘K</kbd>
              </button>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              <NotificationBellButton
                count={unreadCount}
                active={path === '/notifications'}
                onClick={() => navigate('/notifications')}
                size={22}
                strokeWidth={2.5}
                buttonClassName="hover:text-white transition-colors relative cursor-pointer"
                className={cn(path === '/notifications' ? 'text-purple-400' : 'text-slate-300')}
              />

              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Account Profile"
              >
                <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black overflow-hidden shadow-inner group-hover:border-purple-400 transition-colors">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </header>

          {lockNotice ? (
            <div className="flex items-center justify-between gap-4 border-b border-amber-500/20 bg-amber-950/30 px-6 py-3 text-sm text-amber-200 shrink-0">
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

          {/* Page Content Outlet */}
          <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 bg-[#090D16] custom-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </TelnyxVoiceProvider>
  );
}
