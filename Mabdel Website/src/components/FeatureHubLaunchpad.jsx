import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  PhoneCall,
  Mic,
  Calendar,
  Contact,
  Megaphone,
  FileText,
  ReceiptText,
  MessageCircle,
  Users2,
  Plug,
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

const ICON_MAP = {
  Bot,
  MessageSquare,
  PhoneCall,
  Mic,
  Calendar,
  Contact,
  Megaphone,
  FileText,
  ReceiptText,
  MessageCircle,
  Users2,
  Plug,
};

export const PLATFORM_FEATURES = [
  {
    id: 'ai-receptionist',
    title: 'Master AI Receptionist',
    category: 'ai_voice',
    categoryLabel: 'AI & Voice',
    description: 'Master 24/7 phone receptionist with industry templates (Dentist, Legal, HVAC), custom scripts, routing & live test simulator.',
    icon: 'Bot',
    badge: 'Core AI',
    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
    path: '/ai-receptionist',
    actionText: 'Configure AI',
    accentBorder: 'hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
    iconColor: 'text-purple-400 bg-purple-950/60 border-purple-500/20',
  },
  {
    id: 'unified-inbox',
    title: 'Unified Omnichannel Inbox',
    category: 'messaging',
    categoryLabel: 'Messaging',
    description: 'Unified stream for SMS, WhatsApp Cloud, Meta Messenger, Instagram comments and web chats with direct outbound composer.',
    icon: 'MessageSquare',
    badge: 'SMS + Social',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    path: '/conversations',
    actionText: 'Open Inbox',
    accentBorder: 'hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    iconColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/20',
  },
  {
    id: 'ai-calls',
    title: 'AI Calling & Audio Logs',
    category: 'ai_voice',
    categoryLabel: 'AI & Voice',
    description: 'Inbound and outbound call history, audio recording waveforms, automated transcripts, and reverse caller name resolution.',
    icon: 'PhoneCall',
    badge: 'Telnyx / Twilio',
    badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/30',
    path: '/calls',
    actionText: 'View Calls',
    accentBorder: 'hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    iconColor: 'text-blue-400 bg-blue-950/60 border-blue-500/20',
  },
  {
    id: 'voice-agent',
    title: 'Spoken Voice Assistant',
    category: 'ai_voice',
    categoryLabel: 'AI & Voice',
    description: 'Real-time two-way spoken conversation with low-latency speech-to-speech AI and customizable ElevenLabs/OpenAI voices.',
    icon: 'Mic',
    badge: 'Ultra-Fast',
    badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
    path: '/voice-conversation',
    actionText: 'Talk to AI',
    accentBorder: 'hover:border-indigo-500/50 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
    iconColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/20',
  },
  {
    id: 'smart-calendar',
    title: 'Smart Calendar & Booking',
    category: 'crm_ops',
    categoryLabel: 'CRM & Ops',
    description: 'Two-way Google and Outlook calendar synchronization, appointment slot deduplication, and timezone conflict prevention.',
    icon: 'Calendar',
    badge: '2-Way Sync',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    path: '/calendar',
    actionText: 'Open Calendar',
    accentBorder: 'hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    iconColor: 'text-amber-400 bg-amber-950/60 border-amber-500/20',
  },
  {
    id: 'contacts-crm',
    title: 'CRM Contacts Directory',
    category: 'crm_ops',
    categoryLabel: 'CRM & Ops',
    description: 'Centralized customer directory with custom fields, reverse caller lookups, automated birthday greetings, and timeline history.',
    icon: 'Contact',
    badge: 'Directory',
    badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
    path: '/contacts',
    actionText: 'View Contacts',
    accentBorder: 'hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    iconColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/20',
  },
  {
    id: 'bulk-campaigns',
    title: 'Bulk Messaging Campaigns',
    category: 'messaging',
    categoryLabel: 'Messaging',
    description: 'High-volume SMS & WhatsApp broadcast campaigns with TCPA quiet-hours protection (8 AM – 9 PM local time) and batch queues.',
    icon: 'Megaphone',
    badge: 'TCPA Guard',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
    path: '/bulk-messaging',
    actionText: 'Launch Campaign',
    accentBorder: 'hover:border-rose-500/50 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    iconColor: 'text-rose-400 bg-rose-950/60 border-rose-500/20',
  },
  {
    id: 'documents-esign',
    title: 'Documents & e-Sign',
    category: 'billing_docs',
    categoryLabel: 'Billing & Docs',
    description: 'Legal agreement templates, lease agreements, digital signature workflows, and knowledge base document uploads.',
    icon: 'FileText',
    badge: 'e-Sign Ready',
    badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-500/30',
    path: '/documents',
    actionText: 'View Documents',
    accentBorder: 'hover:border-teal-500/50 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
    iconColor: 'text-teal-400 bg-teal-950/60 border-teal-500/20',
  },
  {
    id: 'billing-invoices',
    title: 'Billing & Invoices',
    category: 'billing_docs',
    categoryLabel: 'Billing & Docs',
    description: 'Stripe subscription plans, mid-cycle prorated tier upgrades, downloadable PDF receipts, and customer billing portal.',
    icon: 'ReceiptText',
    badge: 'Stripe Billing',
    badgeColor: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/30',
    path: '/invoices',
    actionText: 'Manage Billing',
    accentBorder: 'hover:border-yellow-500/50 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    iconColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-500/20',
  },
  {
    id: 'social-post-ai',
    title: 'AI Social Media Posts',
    category: 'messaging',
    categoryLabel: 'Messaging',
    description: 'Generate, preview and schedule marketing posts across Facebook, Instagram, LinkedIn, and X with AI image suggestions.',
    icon: 'MessageCircle',
    badge: 'AI Creator',
    badgeColor: 'bg-violet-950/80 text-violet-300 border-violet-500/30',
    path: '/create-post',
    actionText: 'Create Post',
    accentBorder: 'hover:border-violet-500/50 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    iconColor: 'text-violet-400 bg-violet-950/60 border-violet-500/20',
  },
  {
    id: 'groups-audiences',
    title: 'Audience Groups & Tags',
    category: 'crm_ops',
    categoryLabel: 'CRM & Ops',
    description: 'Segment contacts into custom audience groups and tags for targeted marketing, notifications, and AI lead routing.',
    icon: 'Users2',
    badge: 'Segmentation',
    badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-500/30',
    path: '/groups',
    actionText: 'Manage Groups',
    accentBorder: 'hover:border-sky-500/50 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
    iconColor: 'text-sky-400 bg-sky-950/60 border-sky-500/20',
  },
  {
    id: 'integrations-hub',
    title: 'Integrations & Webhooks',
    category: 'billing_docs',
    categoryLabel: 'Billing & Docs',
    description: 'Connect WhatsApp Cloud API, Meta Pages, Google Business Reviews, Zoom, Stripe, and configure per-channel auto-replies.',
    icon: 'Plug',
    badge: 'Connected',
    badgeColor: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/30',
    path: '/integrations',
    actionText: 'Configure',
    accentBorder: 'hover:border-fuchsia-500/50 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]',
    iconColor: 'text-fuchsia-400 bg-fuchsia-950/60 border-fuchsia-500/20',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Features' },
  { id: 'ai_voice', label: 'AI & Voice' },
  { id: 'messaging', label: 'Messaging & Campaigns' },
  { id: 'crm_ops', label: 'CRM & Calendar' },
  { id: 'billing_docs', label: 'Billing & Documents' },
];

export default function FeatureHubLaunchpad() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    return PLATFORM_FEATURES.filter((feature) => {
      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="bg-[#0c121e]/90 border border-[#24354f] rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#24354f]/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={17} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Feature Hub & Quick Launchpad
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organized direct access to all AI, voice, messaging, CRM, and business operations.
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features (e.g. AI Receptionist, SMS, Invoices)..."
            className="w-full bg-[#101a2b] border border-[#24354f] focus:border-purple-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
          <SlidersHorizontal size={13} />
          Filter:
        </span>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = cat.id === 'all' 
            ? PLATFORM_FEATURES.length 
            : PLATFORM_FEATURES.filter(f => f.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-[#101a2b] text-slate-400 hover:bg-[#15233a] hover:text-slate-200 border border-[#24354f]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
        {filteredFeatures.map((feat) => {
          const IconComponent = ICON_MAP[feat.icon] || Bot;

          return (
            <div
              key={feat.id}
              onClick={() => navigate(feat.path)}
              className={`group bg-[#10192a] border border-[#203047] rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${feat.accentBorder}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${feat.iconColor}`}>
                    <IconComponent size={20} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${feat.badgeColor}`}>
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors mt-3">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                  {feat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1d2b3f] flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
                <span className="text-[11px] text-purple-400 font-bold tracking-tight">
                  {feat.actionText}
                </span>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <p className="text-sm font-semibold">No features match "{searchQuery}"</p>
          <p className="text-xs text-slate-500">Try searching for "receptionist", "sms", "calendar", "billing", or "voice".</p>
        </div>
      )}
    </div>
  );
}
