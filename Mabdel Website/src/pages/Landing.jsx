import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  ArrowRight,
  Bot,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Cpu,
  FileSignature,
  FileText,
  Headphones,
  HelpCircle,
  Inbox,
  Loader2,
  Lock,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Mic,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  Play,
  RotateCcw,
  Scale,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import heroImage from '../assets/hero-3d.png';
import logoMark from '../assets/gocustify-mark.png';
import { publicApi } from '../api/services';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Demo video embed URL (YouTube / Vimeo)
const DEMO_VIDEO_EMBED_URL = '';

// Email validation pattern matching backend EmailStr
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StoreBadge({ icon: Icon, eyebrow, label, compact = false, t }) {
  return (
    <button
      type="button"
      onClick={() => window.alert(t('coming_soon_alert', { label }))}
      className={`flex items-center gap-2.5 bg-[#0e1424]/80 hover:bg-[#141c30] border border-white/[0.08] hover:border-purple-500/30 rounded-xl transition-all cursor-pointer text-left shadow-lg shadow-black/20 ${
        compact ? 'px-3.5 py-2' : 'px-4 py-2.5'
      }`}
    >
      <Icon size={compact ? 18 : 22} className="text-white shrink-0" />
      <span className="leading-tight">
        <span className={`block font-medium text-gray-400 uppercase tracking-wide ${compact ? 'text-[8px]' : 'text-[9px]'}`}>{eyebrow}</span>
        <span className={`block font-bold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
      </span>
      <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30 bg-purple-950/40 rounded-full px-2 py-0.5">
        {t('soon_badge')}
      </span>
    </button>
  );
}

function TrialButton({ className = '', navigate, t, text }) {
  return (
    <button
      type="button"
      onClick={() => navigate('/subscription')}
      className={`relative px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-95 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 group cursor-pointer ${className}`}
    >
      <span>{text || t('landing_trial_button')}</span>
      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [videoOpen, setVideoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [activeScenario, setActiveScenario] = useState('dental');
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Footer Contact Form State
  const [footerContactForm, setFooterContactForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    message: '',
  });
  const [footerContactSubmitting, setFooterContactSubmitting] = useState(false);
  const [footerContactSubmitted, setFooterContactSubmitted] = useState(false);
  const [footerContactError, setFooterContactError] = useState('');

  const handleFooterContactSubmit = async (e) => {
    e.preventDefault();
    if (!footerContactForm.firstName || !footerContactForm.lastName || !footerContactForm.phoneNumber || !footerContactForm.email || !footerContactForm.message) {
      setFooterContactError(t('sub_err_demo_fill'));
      return;
    }
    if (!EMAIL_PATTERN.test(footerContactForm.email.trim())) {
      setFooterContactError(t('sub_err_demo_email_invalid'));
      return;
    }
    setFooterContactSubmitting(true);
    setFooterContactError('');
    try {
      await publicApi.submitDemoRequest({
        first_name: footerContactForm.firstName,
        last_name: footerContactForm.lastName,
        phone: footerContactForm.phoneNumber,
        email: footerContactForm.email,
        message: footerContactForm.message,
      });
      setFooterContactSubmitted(true);
      setFooterContactForm({ firstName: '', lastName: '', phoneNumber: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      setFooterContactError(error.response?.data?.message || t('sub_err_demo_failed'));
    } finally {
      setFooterContactSubmitting(false);
    }
  };

  // Real-world interactive demo scenarios
  const interactiveScenarios = {
    dental: {
      id: 'dental',
      tabLabel: 'Dental & Healthcare',
      icon: Stethoscope,
      clinicName: 'Apex Dental & Wellness',
      callerName: 'Sarah Jenkins',
      serviceRequested: 'Emergency Broken Tooth & Exam',
      callDuration: '01:14',
      badge: 'Active Call • HD G.711 Voice',
      dialogue: [
        {
          speaker: 'caller',
          text: 'Hi, I had a crown break while eating and I am in a lot of pain. Can I see Dr. Aris today or tomorrow morning?',
        },
        {
          speaker: 'ai',
          text: 'I am so sorry to hear you are in pain, Sarah! Dr. Aris has an emergency slot tomorrow morning at 9:15 AM or 11:30 AM. Which works best for you?',
        },
        {
          speaker: 'caller',
          text: '9:15 AM would be a lifesaver, please book that!',
        },
        {
          speaker: 'ai',
          text: 'You are all set for 9:15 AM with Dr. Aris. I have sent an SMS with your calendar confirmation and our 1-click digital intake link. See you tomorrow!',
        },
      ],
      executedTool: 'GoogleCalendar.createBooking(slot="Tomorrow 09:15 AM", doctor="Dr. Aris", patient="Sarah Jenkins")',
      toolStatus: '200 OK • Confirmed & Synced',
      secondaryAction: 'SMS Dispatched: Direct Intake Form Link (+1-555-0192)',
    },
    legal: {
      id: 'legal',
      tabLabel: 'Law Practice & Legal',
      icon: Scale,
      clinicName: 'Sterling & Partners LLP',
      callerName: 'Michael Chang',
      serviceRequested: 'Commercial Lease Dispute Intake',
      callDuration: '01:42',
      badge: 'Active Call • Retainer Intake',
      dialogue: [
        {
          speaker: 'caller',
          text: 'Hello, I need urgent legal counsel regarding a commercial lease breach before our 48-hour response deadline.',
        },
        {
          speaker: 'ai',
          text: 'Thank you for calling Sterling & Partners, Michael. Our managing partner specializes in commercial disputes. I can schedule a 30-minute consultation for tomorrow at 3:00 PM.',
        },
        {
          speaker: 'caller',
          text: 'That works. How do we secure the consultation time?',
        },
        {
          speaker: 'ai',
          text: 'The initial consultation is $250. I have reserved 3:00 PM on the calendar and texted a secure Stripe payment link to your mobile number to confirm.',
        },
      ],
      executedTool: 'Stripe.createPaymentLink(amount=250.00, desc="Commercial Lease Consult", client="Michael Chang")',
      toolStatus: '200 OK • Stripe Invoice Dispatched',
      secondaryAction: 'OutlookCalendar.reserveSlot("Tomorrow 03:00 PM", partner="Attorney Vance")',
    },
    trades: {
      id: 'trades',
      tabLabel: 'Home Services & Trades',
      icon: Wrench,
      clinicName: 'Metro 24/7 HVAC & Plumbing',
      callerName: 'David Miller',
      serviceRequested: 'After-Hours Emergency Heating Failure',
      callDuration: '00:58',
      badge: 'Active Call • Urgent Dispatch',
      dialogue: [
        {
          speaker: 'caller',
          text: 'Hey, our heating furnace completely shut off and the house is freezing. Can you get a technician out tonight?',
        },
        {
          speaker: 'ai',
          text: 'I understand this is urgent, David. Our certified on-call technician, Mark, is nearby in your zone and can arrive between 8:30 PM and 9:00 PM.',
        },
        {
          speaker: 'caller',
          text: 'Yes please, send him right away!',
        },
        {
          speaker: 'ai',
          text: 'Mark has been dispatched to your address. I have texted you his live GPS tracking link and service confirmation.',
        },
      ],
      executedTool: 'DispatchEngine.assignTechnician(techId="Tech_Mark_04", priority="EMERGENCY_AFTER_HOURS")',
      toolStatus: '200 OK • Technician Dispatched',
      secondaryAction: 'Twilio.sendLiveTrackingSMS(recipient="+1-555-0184")',
    },
  };

  const activeDemo = interactiveScenarios[activeScenario];

  // Frequently Asked Questions
  const faqs = [
    {
      q: 'How does GoCustify connect to my existing business phone number?',
      a: 'You do not need to change your phone number. You simply enable standard call forwarding with your existing provider (such as Verizon, AT&T, T-Mobile, RingCentral, or Vonage) to forward unanswered, after-hours, or all calls to your dedicated GoCustify AI line. Setup takes less than 60 seconds.',
    },
    {
      q: 'How natural does the AI receptionist sound to callers?',
      a: 'GoCustify runs a direct full-duplex speech-to-speech engine using raw G.711 mu-law audio at 8 kHz. With sub-second latency (under 800ms) and intelligent barge-in interruption handling, the AI sounds conversational, warm, and natural—eliminating the robotic pauses of traditional IVRs.',
    },
    {
      q: 'What happens if a caller has an emergency or wants to speak to a human?',
      a: 'We built deterministic safety guardrails in Python that supervise every call. If a caller says keywords like "emergency", "911", "chest pain", or "transfer to a doctor", the AI immediately executes a live SIP transfer to your on-call team while sending an urgent SMS alert to staff.',
    },
    {
      q: 'Does GoCustify integrate with my existing calendars and scheduling tools?',
      a: 'Yes. GoCustify integrates bidirectionally in real time with Google Calendar, Microsoft Outlook, Apple iCloud, and CRM databases. The AI checks live availability to eliminate double-booking and writes confirmed appointments into your calendar instantly.',
    },
    {
      q: 'Can the AI collect deposits, payments, or signed documents over the phone?',
      a: 'Yes! The AI can autonomously generate secure Stripe payment links or digital e-signature intake documents and dispatch them via SMS to the caller while still on the line, verifying receipt before concluding the call.',
    },
    {
      q: 'Is client and patient information secure and HIPAA-ready?',
      a: 'Security is paramount. All audio streams, WebSockets, and database transactions are protected with end-to-end TLS 1.3 encryption, AES-256 storage, strict role-based access control (RBAC), and SOC-2 / HIPAA architectural standards.',
    },
  ];

  // Stats
  const stats = [
    { value: '< 800ms', label: 'Average Speech Latency', sub: 'Sub-second turnaround' },
    { value: '100%', label: 'Inbound Calls Answered', sub: 'Zero calls to voicemail' },
    { value: '35%', label: 'Average Revenue Lift', sub: 'Captured after-hours bookings' },
    { value: '99.98%', label: 'Telephony SLA Uptime', sub: 'High-availability infrastructure' },
  ];

  // 4-Step Journey
  const journeySteps = [
    {
      num: '01',
      title: 'Forward Your Calls in 60 Seconds',
      description: 'Keep your existing business phone number. Simply forward missed, after-hours, or all inbound calls to your dedicated GoCustify smart line.',
      bullets: [
        'Works with all carriers (Verizon, AT&T, VoIP)',
        'Zero hardware or complex PBX setup needed',
        'Custom local or toll-free numbers available',
      ],
      tag: 'Instant Setup',
      icon: PhoneForwarded,
    },
    {
      num: '02',
      title: 'Full-Duplex Natural Voice AI',
      description: 'Your AI receptionist answers instantly in under 800ms with human warmth. It understands accents, answers clinic questions, and handles interruptions naturally.',
      bullets: [
        'Natural speech-to-speech with full-duplex barge-in',
        'Custom business persona & clinic knowledge base',
        'Multi-language support for diverse patient bases',
      ],
      tag: 'Speech-to-Speech',
      icon: Headphones,
    },
    {
      num: '03',
      title: 'Autonomous Booking & Workflow Execution',
      description: 'The AI doesn’t just take messages—it executes actions. It books appointments into Google or Outlook calendars, verifies insurance, and texts intake links.',
      bullets: [
        'Two-way calendar sync prevents double-booking',
        'Stripe payment links sent automatically over SMS',
        'E-sign medical or service intake documents',
      ],
      tag: 'Autonomous Tools',
      icon: Zap,
    },
    {
      num: '04',
      title: 'Unified CRM & Live Human Escalation',
      description: 'Every call recording, audio transcript, and customer note syncs directly to your dashboard. Critical emergencies trigger instant live transfers to your team.',
      bullets: [
        'Deterministic safety guards for emergency routing',
        'Full call recordings & searchable AI transcripts',
        'Unified inbox across WhatsApp, SMS, and Phone',
      ],
      tag: 'CRM & Safety',
      icon: ShieldCheck,
    },
  ];

  // 6 Bento Features
  const features = [
    {
      title: 'Sub-Second Voice AI',
      description: 'Full-duplex speech-to-speech audio with raw G.711 mu-law streaming. Latency under 800ms creates a truly natural human conversation without awkward pauses.',
      icon: Mic,
      pill: '<800ms Latency',
    },
    {
      title: 'Two-Way Calendar Sync',
      description: 'Real-time bidirectional synchronization with Google Calendar, Microsoft Outlook, and practice management tools to eliminate double-booking.',
      icon: CalendarCheck,
      pill: 'Zero Conflicts',
    },
    {
      title: 'Omnichannel Unified Inbox',
      description: 'Bring phone calls, WhatsApp messages, two-way SMS, and website chat into a single unified conversation stream for your front desk team.',
      icon: MessageSquare,
      pill: 'WhatsApp & SMS',
    },
    {
      title: 'Automated Invoicing & Payments',
      description: 'Collect appointment deposits, consult fees, or invoice payments directly over the phone with automated Stripe SMS payment links.',
      icon: CreditCard,
      pill: 'Stripe Enabled',
    },
    {
      title: '1-Click Mobile E-Signatures',
      description: 'Dispatch medical intake agreements, liability waivers, or service quotes for instant mobile digital signing before the appointment.',
      icon: FileSignature,
      pill: 'Paperless',
    },
    {
      title: 'Deterministic Emergency Safety',
      description: 'Deterministic Python guardrails intercept medical or legal urgency keywords to bypass AI generation and transfer calls directly to human staff.',
      icon: ShieldCheck,
      pill: 'Safety First',
    },
  ];

  // Pricing Plans
  const pricingPlans = [
    {
      key: 'starter',
      name: 'Starter Practice',
      price: annualBilling ? '$239' : '$299',
      billingNote: annualBilling ? 'billed annually ($2,868/yr)' : 'billed monthly',
      subtitle: 'Ideal for solo clinics, private practices, and growing offices.',
      isPopular: false,
      features: [
        'Up to 300 Voice Receptionist Minutes / mo',
        '24/7 After-Hours & Overflow Answering',
        'Two-Way Google & Outlook Calendar Sync',
        'SMS Appointment Confirmation Dispatches',
        'Call Recording & AI Transcriptions',
        'Standard Email & Chat Support',
      ],
    },
    {
      key: 'growth',
      name: 'Growth Professional',
      price: annualBilling ? '$559' : '$699',
      billingNote: annualBilling ? 'billed annually ($6,708/yr)' : 'billed monthly',
      subtitle: 'The complete growth engine for busy multi-provider practices.',
      isPopular: true,
      features: [
        'Up to 1,000 Voice Receptionist Minutes / mo',
        'All Starter Features Included',
        'Omnichannel WhatsApp & SMS Unified Inbox',
        'Automated Stripe Payment Links via SMS',
        'Mobile E-Signatures & Intake Documents',
        'Deterministic Emergency SIP Human Transfer',
        'Priority Phone & Technical Support',
      ],
    },
    {
      key: 'enterprise',
      name: 'Pro Enterprise',
      price: annualBilling ? '$799' : '$999',
      billingNote: annualBilling ? 'billed annually ($9,588/yr)' : 'billed monthly',
      subtitle: 'For high-volume multi-location clinics and enterprise practices.',
      isPopular: false,
      features: [
        'Unlimited Inbound & Outbound Calling',
        'All Growth Features Included',
        'Multi-Location & Multi-Provider Routing',
        'Custom EHR & Practice Management API Sync',
        'Custom Fine-Tuned Voice & Business Knowledge',
        'Dedicated Account Manager & SLA Guarantee',
        'Signed HIPAA BAA & Compliance Auditing',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 font-sans antialiased overflow-x-hidden selection:bg-purple-500 selection:text-white">

      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[80%] bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-blue-500/10 rounded-full blur-[140px] opacity-80" />
        <div className="absolute top-[25%] right-[5%] w-[45%] h-[60%] bg-cyan-600/10 rounded-full blur-[130px] opacity-60" />
      </div>

      {/* Top Header / Sticky Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.07] bg-[#070a13]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="relative">
              <img src={logoMark} alt="GoCustify" className="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/25 border border-white/10" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#070a13] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">GoCustify</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  AI Voice
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Autonomous Telephony & CRM</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <a href="#demo" className="hover:text-purple-400 transition-colors">Live Demo</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-purple-400 transition-colors">Contact</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white border border-white/[0.09] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white border border-white/10 rounded-xl transition-colors cursor-pointer bg-white/[0.03]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden border-b border-white/10 bg-[#070a13]/95 backdrop-blur-2xl px-6 py-6 space-y-6 overflow-hidden"
            >
              <nav className="flex flex-col space-y-4 text-base font-semibold text-gray-200">
                <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">Live Demo</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">How It Works</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">Pricing</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">FAQ</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 py-1 transition-colors">Contact</a>
              </nav>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                  className="w-full py-3 text-center text-sm font-semibold text-gray-200 border border-white/10 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigate('/subscription'); }}
                  className="w-full py-3 text-center text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25"
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-8">
              
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/30 backdrop-blur-md text-purple-300 text-xs font-semibold tracking-wide"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Sub-Second Full-Duplex AI Voice Receptionist</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white"
              >
                Never Miss a Client Again. <br />
                <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  Your 24/7 AI Receptionist & Growth Engine.
                </span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-2xl font-normal leading-relaxed"
              >
                GoCustify answers every inbound phone call in under 800ms with human-grade speech, books appointments directly into your calendar, collects payments, and handles after-hours emergencies—so you never lose revenue to voicemail.
              </motion.p>

              {/* CTA Group */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <TrialButton navigate={navigate} t={t} text="Start 14-Day Free Trial" />
                <a
                  href="#demo"
                  className="px-8 py-4 bg-[#0e1424]/90 hover:bg-[#141d33] border border-white/[0.12] hover:border-purple-500/40 font-bold rounded-xl text-white transition-all text-center w-full sm:w-auto inline-flex items-center justify-center gap-2.5 shadow-lg shadow-black/20"
                >
                  <Volume2 size={18} className="text-purple-400" />
                  <span>Experience Live Voice Demo</span>
                </a>
              </motion.div>

              {/* Trust Micro-Checklist */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-400 font-semibold"
              >
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-400" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-400" /> 60-second forwarding setup</span>
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-400" /> HIPAA & SOC-2 ready</span>
                <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-400" /> Google & Outlook sync</span>
              </motion.div>

              {/* Mobile Store Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto pt-2"
              >
                <StoreBadge icon={Apple} eyebrow={t('app_store_eyebrow')} label={t('app_store_label')} compact t={t} />
                <StoreBadge icon={Play} eyebrow={t('play_store_eyebrow')} label={t('play_store_label')} compact t={t} />
              </motion.div>
            </div>

            {/* Right Hero Visual: Interactive Call Simulator Showcase Card */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              
              {/* Backlight Glow */}
              <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-purple-500/25 via-indigo-500/20 to-cyan-500/20 rounded-full blur-[90px] -z-10 animate-pulse" />

              {/* Card Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-lg bg-[#0c1220]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-950/40 relative overflow-hidden card-shine"
              >
                {/* Simulator Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <PhoneIncoming size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Live Inbound Call</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          CONNECTED
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">Dr. Smith Dental & Wellness • Inbound Line</p>
                    </div>
                  </div>

                  {/* Equalizer Sound Wave */}
                  <div className="flex items-end gap-1 h-7 px-2.5 py-1 bg-purple-950/40 border border-purple-500/20 rounded-lg">
                    <span className="w-1 bg-purple-400 rounded-full animate-eq-1" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-eq-2" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-eq-3" />
                    <span className="w-1 bg-purple-400 rounded-full animate-eq-4" />
                    <span className="w-1 bg-emerald-400 rounded-full animate-eq-5" />
                  </div>
                </div>

                {/* Simulated Conversation Turns */}
                <div className="py-4 space-y-3.5 text-xs">
                  
                  {/* Caller Message */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 mt-0.5 text-[10px] font-bold">
                      Caller
                    </div>
                    <div className="bg-[#141c2e] border border-white/[0.06] rounded-2xl rounded-tl-sm p-3 text-gray-200 leading-relaxed max-w-[85%]">
                      "Hi! I broke a crown earlier today and I'm in pain. Can I book an emergency appointment tomorrow afternoon?"
                    </div>
                  </div>

                  {/* AI Receptionist Message */}
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-purple-200 shrink-0 mt-0.5 text-[10px] font-bold shadow-md shadow-purple-500/30">
                      AI
                    </div>
                    <div className="bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/30 rounded-2xl rounded-tr-sm p-3 text-white leading-relaxed max-w-[85%] text-left">
                      "I'm so sorry you're in pain! Dr. Smith has an emergency slot open tomorrow at <span className="font-bold text-cyan-300">2:30 PM</span> or <span className="font-bold text-cyan-300">4:00 PM</span>. Would 2:30 PM work for you?"
                    </div>
                  </div>

                  {/* Caller Confirmation */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 mt-0.5 text-[10px] font-bold">
                      Caller
                    </div>
                    <div className="bg-[#141c2e] border border-white/[0.06] rounded-2xl rounded-tl-sm p-3 text-gray-200 leading-relaxed max-w-[85%]">
                      "Yes please, 2:30 PM is perfect! Thank you."
                    </div>
                  </div>

                  {/* AI Action */}
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-purple-200 shrink-0 mt-0.5 text-[10px] font-bold shadow-md shadow-purple-500/30">
                      AI
                    </div>
                    <div className="bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/30 rounded-2xl rounded-tr-sm p-3 text-white leading-relaxed max-w-[85%] text-left">
                      "You're booked for 2:30 PM tomorrow. I just texted your confirmation and a quick digital intake link. See you tomorrow!"
                    </div>
                  </div>
                </div>

                {/* Autonomous Tool Execution Badge */}
                <div className="mt-2 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Autonomous Tool Executed</p>
                      <p className="text-[11px] font-medium text-gray-300">GoogleCalendar.createBooking(slot="Tomorrow 2:30 PM")</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    200 OK
                  </span>
                </div>

                {/* Micro-Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.08] text-center">
                  <div className="p-2 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Voice Latency</p>
                    <p className="text-xs font-bold text-cyan-300">&lt; 780 ms</p>
                  </div>
                  <div className="p-2 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Calendar Sync</p>
                    <p className="text-xs font-bold text-emerald-400">Instant</p>
                  </div>
                  <div className="p-2 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Audio Codec</p>
                    <p className="text-xs font-bold text-purple-300">G.711 mu-law</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats KPI Strip */}
      <section className="border-y border-white/[0.08] bg-[#0c1220]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-1 sm:space-y-2 p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {stat.label}
              </p>
              <p className="text-[11px] text-gray-400 font-medium">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Live Voice Experience Section */}
      <section id="demo" className="py-16 sm:py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Headphones size={13} /> Live Interactive Scenarios
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Hear How GoCustify Handles Real Inbound Calls
            </h2>
            <p className="text-base sm:text-lg text-gray-300">
              Select an industry scenario below to see how our autonomous receptionist interacts, understands caller context, and executes complex front-desk workflows.
            </p>
          </div>

          {/* Scenario Tab Selectors */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {Object.values(interactiveScenarios).map((scenario) => {
              const TabIcon = scenario.icon;
              const isActive = activeScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40'
                      : 'bg-[#0e1424] text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <TabIcon size={18} className={isActive ? 'text-white' : 'text-purple-400'} />
                  <span>{scenario.tabLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active Scenario Card */}
          <div className="max-w-4xl mx-auto bg-[#0d1322] border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden card-shine">
            
            {/* Scenario Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30 uppercase tracking-wider mb-2">
                  {activeDemo.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{activeDemo.clinicName}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Caller: <span className="text-white font-semibold">{activeDemo.callerName}</span> • Request: <span className="text-cyan-300 font-semibold">{activeDemo.serviceRequested}</span>
                </p>
              </div>

              {/* Live Audio Visualizer Pill */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl self-start sm:self-auto">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                  <p className="text-xs font-bold text-white">{activeDemo.callDuration}</p>
                </div>
                <div className="flex items-end gap-1 h-6 pl-2">
                  <span className="w-1 bg-purple-400 rounded-full animate-eq-1" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-eq-3" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-eq-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-eq-4" />
                </div>
              </div>
            </div>

            {/* Live Transcript Bubbles */}
            <div className="py-6 space-y-4">
              {activeDemo.dialogue.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${line.speaker === 'ai' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md ${
                      line.speaker === 'ai'
                        ? 'bg-purple-900/60 border border-purple-400/40 text-purple-200'
                        : 'bg-blue-900/50 border border-blue-500/30 text-blue-200'
                    }`}
                  >
                    {line.speaker === 'ai' ? 'AI' : 'User'}
                  </div>
                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      line.speaker === 'ai'
                        ? 'bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/30 text-white text-left'
                        : 'bg-[#141b2b] border border-white/[0.08] text-gray-200 text-left'
                    }`}
                  >
                    {line.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Autonomous Action Confirmation Footer */}
            <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-xs font-bold text-white">Action Executed Automatically:</p>
                </div>
                <code className="block text-[11px] text-cyan-300 font-mono bg-black/40 px-3 py-1 rounded-lg border border-white/[0.06]">
                  {activeDemo.executedTool}
                </code>
                <p className="text-[11px] text-gray-400">
                  Follow-up: <span className="text-gray-200 font-medium">{activeDemo.secondaryAction}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-purple-500/25 shrink-0 cursor-pointer"
              >
                Set Up This Workflow
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* "Why Businesses Switch" - Pain vs Solution Matrix */}
      <section className="py-16 sm:py-24 border-y border-white/[0.08] bg-gradient-to-b from-[#090d18] to-[#0c1220]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why High-Volume Practices Replace Voicemail with GoCustify
            </h2>
            <p className="text-base text-gray-300">
              When clients call, they want answers, appointments, and care—not an answering machine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Old Way */}
            <div className="bg-rose-950/10 border border-rose-500/20 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <X size={14} /> The Traditional Voicemail Trap
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">How Clinics Lose Revenue Daily</h3>
                
                <ul className="space-y-3.5 pt-2 text-xs sm:text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">✕</span>
                    <span><strong>85% of callers hang up on voicemail</strong> and immediately call your local competitor.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">✕</span>
                    <span>Front-desk staff get overwhelmed during lunch breaks, in-person check-ins, and peak morning rushes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">✕</span>
                    <span>After-hours and weekend inquiries sit unreturned until Monday morning, losing high-value urgent patients.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">✕</span>
                    <span>Manual scheduling over the phone leads to human double-booking errors and missed slot fills.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-rose-500/20 text-xs font-semibold text-rose-400">
                Result: An estimated $4,500 – $18,000 lost monthly per practice.
              </div>
            </div>

            {/* The GoCustify Way */}
            <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 card-shine shadow-xl shadow-emerald-950/20">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Check size={14} /> The GoCustify Autonomous Advantage
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">24/7 Zero-Latency Revenue Capture</h3>
                
                <ul className="space-y-3.5 pt-2 text-xs sm:text-sm text-gray-200">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span><strong>100% of calls answered in 1 ring</strong>, 24 hours a day, 365 days a year.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Instant calendar bookings synced directly into Google or Outlook with zero double-booking risk.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Automatic SMS intake links and Stripe deposit collection sent before the caller even hangs up.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Deterministic emergency detection warm-transfers critical calls directly to your on-call team.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-emerald-500/30 text-xs font-semibold text-emerald-400">
                Result: Up to 35% revenue increase and 100% patient capture.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works (Journey Section) */}
      <section id="how-it-works" className="py-16 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 lg:space-y-24">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Zap size={13} /> 4-Step Seamless Flow
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              How GoCustify Works Behind the Scenes
            </h2>
            <p className="text-base sm:text-lg text-gray-300">
              From the moment a customer dials your number, our system orchestrates telephony, real-time voice, and calendar operations with zero human lag.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {journeySteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-[#0d1322] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30 flex flex-col justify-between space-y-6 card-shine group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-purple-500/20">
                        {step.num}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/40 border border-purple-500/30 rounded-full px-2.5 py-0.5">
                        {step.tag}
                      </span>
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                      <StepIcon size={22} />
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {step.description}
                    </p>

                    <ul className="space-y-2 pt-2 text-xs text-gray-300">
                      {step.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={13} className="text-purple-400 mt-0.5 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <TrialButton navigate={navigate} t={t} text="Set Up Your Front Desk in 5 Minutes" />
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 bg-[#090d18] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} /> Everything Included
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Engineered for Real-World Business Demands
            </h2>
            <p className="text-base sm:text-lg text-gray-300">
              Unlike simplistic chatbots, GoCustify delivers a full suite of autonomous telephony, scheduling, omnichannel messaging, and compliance tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feat, i) => {
              const FeatIcon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-[#0d1322] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30 flex flex-col justify-between space-y-6 card-shine group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/25 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                        <FeatIcon size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-full px-2.5 py-0.5">
                        {feat.pill}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
                    <span>Explore Feature</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <CreditCard size={13} /> Transparent Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Invest in Growth. Zero Surprise Fees.
            </h2>
            <p className="text-base sm:text-lg text-gray-300">
              All plans include full 24/7 voice receptionist answering, two-way calendar sync, and a 14-day risk-free trial.
            </p>

            {/* Annual Billing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3 text-sm font-semibold">
              <span className={!annualBilling ? 'text-white' : 'text-gray-400'}>Monthly</span>
              <button
                type="button"
                onClick={() => setAnnualBilling(!annualBilling)}
                className="w-14 h-7 rounded-full bg-purple-950 border border-purple-500/40 p-1 transition-colors relative cursor-pointer"
                aria-label="Toggle Annual Billing"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 transition-transform ${
                    annualBilling ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={annualBilling ? 'text-white' : 'text-gray-400'}>Annual</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Save 20%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-3xl p-6 sm:p-8 border transition-all duration-300 card-shine ${
                  plan.isPopular
                    ? 'bg-[#0f172b] border-purple-500/50 shadow-2xl shadow-purple-950/50 md:-translate-y-2'
                    : 'bg-[#0d1322] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-purple-500/30">
                    Most Popular Choice
                  </span>
                )}

                <div className="space-y-2 pb-6 border-b border-white/[0.08]">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{plan.subtitle}</p>
                  <div className="pt-3">
                    <span className="text-4xl sm:text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-xs sm:text-sm text-gray-400 font-semibold"> / month</span>
                  </div>
                  <p className="text-[11px] text-purple-300 font-medium">{plan.billingNote}</p>
                </div>

                <ul className="space-y-3 mt-6 flex-1 text-xs sm:text-sm text-gray-200">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-purple-950 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="text-purple-400" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className={`mt-8 w-full py-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:opacity-95'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                  }`}
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 font-medium">
            Need custom minute packages or on-premise telephony? Contact us for dedicated enterprise contracts.
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.08] bg-[#090d18]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle size={13} /> Common Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-gray-300">
              Everything you need to know about setting up your AI receptionist and connecting phone systems.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#0d1322] border border-white/[0.08] rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 text-purple-400">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/[0.05] pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Contact Form & Direct Inquiries */}
      <section id="contact" className="py-16 sm:py-24 border-t border-white/[0.08] bg-[#070a13]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="bg-[#0c1220] border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl card-shine">
            <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto">
                <Mail size={22} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Schedule a 1-on-1 Personalized Demo</h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Want to see GoCustify customized for your specific practice or clinic workflow? Send us your details and our team will get in touch within 2 hours.
              </p>
            </div>

            {footerContactSubmitted ? (
              <div className="max-w-md mx-auto text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Demo Request Received!</h3>
                <p className="text-xs sm:text-sm text-gray-300">
                  Thank you! Our solutions engineer will contact you shortly to review your telephony setup and run a live demo call.
                </p>
                <button
                  type="button"
                  onClick={() => setFooterContactSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleFooterContactSubmit} className="max-w-2xl mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      value={footerContactForm.firstName}
                      onChange={(e) => setFooterContactForm({ ...footerContactForm, firstName: e.target.value })}
                      placeholder="e.g. Sarah"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141b2c] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={footerContactForm.lastName}
                      onChange={(e) => setFooterContactForm({ ...footerContactForm, lastName: e.target.value })}
                      placeholder="e.g. Jenkins"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141b2c] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={footerContactForm.phoneNumber}
                      onChange={(e) => setFooterContactForm({ ...footerContactForm, phoneNumber: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141b2c] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={footerContactForm.email}
                      onChange={(e) => setFooterContactForm({ ...footerContactForm, email: e.target.value })}
                      placeholder="e.g. sarah@apexclinic.com"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141b2c] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Practice Type & Requirements *</label>
                  <textarea
                    required
                    rows={4}
                    value={footerContactForm.message}
                    onChange={(e) => setFooterContactForm({ ...footerContactForm, message: e.target.value })}
                    placeholder="Tell us about your practice, current phone volume, and scheduling software..."
                    className="w-full rounded-xl border border-white/[0.1] bg-[#141b2c] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/70 resize-none"
                  />
                </div>

                {footerContactError && (
                  <p className="text-xs text-rose-400 font-semibold">{footerContactError}</p>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={footerContactSubmitting}
                    className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {footerContactSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <span>Schedule My Live Demo</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer Navigation & Legal Links */}
      <footer className="border-t border-white/[0.08] bg-[#05070d] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <img src={logoMark} alt="GoCustify" className="w-9 h-9 rounded-xl" />
              <div>
                <span className="text-lg font-bold text-white">GoCustify LLC</span>
                <p className="text-xs text-gray-400">Autonomous Voice Telephony & Clinic Growth</p>
              </div>
            </div>

            <div className="text-xs text-gray-400 flex flex-col sm:flex-row gap-2 sm:gap-6">
              <span>Direct Support: <a href="mailto:support@gocustify.com" className="text-purple-400 hover:text-purple-300">support@gocustify.com</a></span>
              <span>Headquarters: Austin, Texas, USA</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs font-semibold text-gray-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button type="button" onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
            <button type="button" onClick={() => navigate('/sms-messaging-policy')} className="hover:text-white transition-colors cursor-pointer">SMS Policy</button>
            <button type="button" onClick={() => navigate('/terms-and-conditions')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
            <button type="button" onClick={() => navigate('/acceptable-use-policy')} className="hover:text-white transition-colors cursor-pointer">Acceptable Use</button>
            <button type="button" onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors cursor-pointer">Refund Policy</button>
            <button type="button" onClick={() => navigate('/protocols-for-law-enforcement')} className="hover:text-white transition-colors cursor-pointer">Law Enforcement</button>
            <button type="button" onClick={() => navigate('/account-deletion')} className="hover:text-white transition-colors cursor-pointer">Data Deletion</button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/[0.04] gap-4">
            <p>© {new Date().getFullYear()} GoCustify LLC. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All Systems Operational • Realtime Telephony SLA 99.98%</span>
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
