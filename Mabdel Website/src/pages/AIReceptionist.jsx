import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Phone,
  PhoneCall,
  PhoneOutgoing,
  MessageSquare,
  MessageCircle,
  Database,
  Calendar,
  Users2,
  Shield,
  ShieldCheck,
  CreditCard,
  Mic,
  Disc,
  FolderCheck,
  Send,
  X,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  Building,
  Scale,
  Wrench,
  Utensils,
  Car,
  Home,
  Check,
  Lock,
  ArrowRight,
  ExternalLink,
  Volume2,
  VolumeX,
  FileText,
  Loader2,
  Search,
  Filter,
  Stethoscope,
  Activity,
  Heart,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartflowApi } from '../api/services';
import { useLanguage } from '../context/LanguageContext';

// Standard Voices with preview samples
const VOICE_OPTIONS = [
  { id: 'female_warm', name: 'Allison (Warm & Professional)', gender: 'Female', preview: 'Warm, friendly tone ideal for dental & clinic reception' },
  { id: 'female_energetic', name: 'Emma (Friendly & Energetic)', gender: 'Female', preview: 'Upbeat and welcoming voice for service businesses' },
  { id: 'male_casual', name: 'Marcus (Calm & Professional)', gender: 'Male', preview: 'Authoritative, calm tone ideal for legal and corporate' },
  { id: 'male_deep', name: 'David (Deep & Trustworthy)', gender: 'Male', preview: 'Direct, clear tone suitable for contractors and auto repair' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English (US)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ar', name: 'العربية' },
];

export default function AIReceptionist() {
  const { t } = useLanguage();

  // Settings & Status
  const [callSettings, setCallSettings] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Industry Template State
  const [selectedIndustry, setSelectedIndustry] = useState('Dentist (Dental Clinic)');
  const [templateAppliedBadge, setTemplateAppliedBadge] = useState('Template Applied');
  const [templateSummary, setTemplateSummary] = useState('Preloaded: dental intents, services, insurance, and phrasing.');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Active section filter pill
  const [activeTab, setActiveTab] = useState('Overview');

  // Services & Staff lists
  const [servicesList, setServicesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [customPhrases, setCustomPhrases] = useState([]);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Permissions Toggles
  const [permissions, setPermissions] = useState({
    schedule: true,
    reschedule: true,
    cancel: true,
    check_availability: true,
    send_sms: true,
    send_email: true,
    create_update_contacts: true,
    create_lead_new_only: true,
    add_tasks_reminders: true,
    create_service_tickets: true,
    send_payment_link: true,
    transfer_calls_staff: true,
  });

  // Other Configs
  const [paymentsConfig, setPaymentsConfig] = useState({
    accept_by_phone: true,
    send_payment_link: true,
    confirm_payment_received: true,
  });

  const [recordingConfig, setRecordingConfig] = useState({
    record_calls: true,
    generate_transcripts: true,
    retention_days: 365,
    redact_sensitive_data: true,
  });

  const [consentConfig, setConsentConfig] = useState({
    outbound_calls_enabled: true,
    call_types: 'Transactional, Follow-up, Reminder',
    require_consent: true,
    use_consent_script: true,
    honor_dnc: true,
  });

  const [crmLeadConfig, setCrmLeadConfig] = useState({
    create_new_lead_unknown: true,
    update_existing_contacts: true,
    tag_source_receptionist: true,
    avoid_duplicates: true,
  });

  const [afterHoursMode, setAfterHoursMode] = useState('Take a message & notify team');
  const [emergencyMode, setEmergencyMode] = useState('Transfer to office (protected flow)');
  const [emergencyKeywords, setEmergencyKeywords] = useState(['trouble breathing', 'severe bleeding', 'serious trauma']);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Conditional Data per industry
  const [conditionalData, setConditionalData] = useState({});

  // ── Simulator Panel State ──
  const [simulatorMode, setSimulatorMode] = useState('call'); // 'call' | 'chat'
  const [testSessionId, setTestSessionId] = useState(null);
  const [testQueryInput, setTestQueryInput] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [latestResult, setLatestResult] = useState({
    detected_intent: 'Insurance Question',
    recognized_entity: 'Delta Dental',
    backend_lookup: 'Found: Delta Dental - PPO | In-Network',
    action_taken: 'Provide insurance information (No transfer)',
    reply: 'Yes, BrightSmile Dental Care is in-network with Delta Dental PPO. Your specific benefits and coverage may still require verification with Delta Dental.',
    success: true,
  });
  const [conversationHistory, setConversationHistory] = useState([
    {
      sender: 'user',
      text: 'Do you take Delta Dental?',
      time: '2:14 PM',
    },
    {
      sender: 'bot',
      intent: 'Insurance Question',
      entity: 'Delta Dental',
      statusBadge: 'In Network',
      reply: 'Yes, BrightSmile Dental Care is in-network with Delta Dental PPO. Your specific benefits and coverage may still require verification with Delta Dental.',
      time: '2:14 PM',
    },
  ]);

  const [sampleQueries, setSampleQueries] = useState([
    { query: 'Do you take Delta Dental?', intent: 'Insurance Question' },
    { query: "I'd like to schedule a cleaning.", intent: 'Book Appointment' },
    { query: 'Can I reschedule my appointment?', intent: 'Reschedule Appointment' },
    { query: "I'm a new patient, what do I need to do?", intent: 'New Patient Intake' },
    { query: 'Do you offer payment plans?', intent: 'Pricing / Payment' },
  ]);

  // Load initial settings and industry templates
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, profileRes] = await Promise.all([
        smartflowApi.getAICallSettings().catch(() => null),
        smartflowApi.getBusinessProfile?.().catch(() => null),
      ]);

      const data = settingsRes?.data?.data || {};
      setCallSettings(data);
      if (profileRes?.data?.data) {
        setBusinessProfile(profileRes.data.data);
      }

      // Determine initial business type
      const bType = data?.business_type || 'Dental Clinic';
      applyIndustryTemplate(bType, data, false);
    } catch (err) {
      console.error('Failed to load receptionist settings:', err);
      setErrorMessage('Could not load current settings. Running with defaults.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply Industry Template
  const applyIndustryTemplate = async (industryKey, existingData = null, showConfirm = true) => {
    if (showConfirm && !window.confirm(`Switch template to ${industryKey}? This will preload recommended defaults for this industry.`)) {
      return;
    }

    try {
      const res = await smartflowApi.getIndustryTemplate(industryKey).catch(() => null);
      const preset = res?.data?.data || null;

      const normKey = industryKey.includes('Dentist') || industryKey === 'Dental Clinic' ? 'Dentist (Dental Clinic)'
        : industryKey.includes('Law') ? 'Law Firm'
        : industryKey.includes('Home') ? 'Home Services (Plumbing, Electrical, HVAC)'
        : industryKey.includes('Dealer') || industryKey.includes('Car') ? 'Car Dealership'
        : industryKey.includes('Wellness') ? 'Wellness Center'
        : industryKey.includes('Accounting') || industryKey.includes('Bookkeeping') ? 'Accounting / Bookkeeping Firm'
        : industryKey.includes('Real Estate') ? 'Real Estate Agency'
        : industryKey.includes('Vet') ? 'Veterinary Clinic'
        : industryKey.includes('Medical') ? 'Medical Clinic'
        : industryKey.includes('Chiro') ? 'Chiropractor'
        : industryKey;

      setSelectedIndustry(normKey);

      if (preset) {
        setTemplateSummary(preset.summary || `Preloaded defaults for ${normKey}`);
        setTemplateAppliedBadge('Template Applied');

        // Set Services
        setServicesList(preset.services || [
          { id: '1', name: 'General Consultation', duration_minutes: 30, provider_role: 'Specialist', active: true },
        ]);

        // Set Staff
        setStaffList(preset.staff || [
          { id: '1', name: 'Front Desk', role: 'Intake & Scheduling', active: true },
        ]);

        // Set Insurance or Conditional Data
        if (preset.insurance_plans) {
          setInsurancePlans(preset.insurance_plans);
        } else {
          setInsurancePlans([]);
        }

        if (preset.conditional_data) {
          setConditionalData(preset.conditional_data);
        }

        // Set Custom Phrases
        setCustomPhrases(preset.custom_phrases || ['Our office', 'Our team', 'Your appointment']);

        // Set Sample Test Queries
        if (preset.sample_test_queries && preset.sample_test_queries.length > 0) {
          setSampleQueries(preset.sample_test_queries);
          // Update default simulator highlight
          const first = preset.sample_test_queries[0];
          setLatestResult({
            detected_intent: first.intent,
            recognized_entity: first.entity,
            backend_lookup: first.lookup,
            action_taken: first.action,
            reply: first.reply,
            success: true,
          });
        }

        // Update Greetings in Settings
        setCallSettings((prev) => ({
          ...(prev || {}),
          business_type: normKey,
          assistant_name: prev?.assistant_name || 'Sarah',
          voice_id: prev?.voice_id || 'female_warm',
          greeting_inbound: prev?.greeting_inbound || preset.inbound_greeting || 'Thank you for calling. How can I help you today?',
          greeting_outbound: prev?.greeting_outbound || preset.outbound_greeting || 'Hi {first_name}, this is a quick reminder about your upcoming appointment.',
        }));
      }
    } catch (err) {
      console.warn('Template fallback error:', err);
    }
  };

  // Save Settings to Backend
  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      const payload = {
        assistant_name: callSettings?.assistant_name || 'Sarah',
        voice_id: callSettings?.voice_id || 'female_warm',
        business_type: selectedIndustry,
        greeting_inbound: callSettings?.greeting_inbound || '',
        greeting_outbound: callSettings?.greeting_outbound || '',
        closing_message: callSettings?.closing_message || 'Thank you for calling. Have a wonderful day!',
        knowledge_base: callSettings?.knowledge_base || '',
        custom_phrases: customPhrases,
        insurance_plans: insurancePlans,
        emergency_keywords: emergencyKeywords,
        emergency_response_mode: emergencyMode.includes('911') ? 'direct_to_911' : 'take_message',
        payments_config: paymentsConfig,
        recording_config: recordingConfig,
        outbound_consent_config: consentConfig,
        crm_lead_config: crmLeadConfig,
        industry_conditional_data: conditionalData,
      };

      await smartflowApi.updateAICallSettings(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Run Test Query in Simulator
  const runTestSimulation = async (queryText) => {
    const text = (queryText || testQueryInput).trim();
    if (!text) return;

    setTestSending(true);
    const userMsg = {
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversationHistory((prev) => [...prev, userMsg]);
    setTestQueryInput('');

    try {
      // Start session if not existing
      let sId = testSessionId;
      if (!sId) {
        const startRes = await smartflowApi.startAICallTest().catch(() => null);
        sId = startRes?.data?.data?.session_id || 'local_session';
        setTestSessionId(sId);
      }

      const res = await smartflowApi.sendAICallTestMessage(sId, text).catch(() => null);
      const data = res?.data?.data;

      const intent = data?.detected_intent || 'General Inquiry';
      const entity = data?.recognized_entity || 'Service Inquiry';
      const lookup = data?.backend_lookup || 'Found active records';
      const action = data?.action_taken || 'AI handles directly';
      const reply = data?.reply || 'Thank you for reaching out! I would be glad to help you with that.';

      const resultObj = {
        detected_intent: intent,
        recognized_entity: entity,
        backend_lookup: lookup,
        action_taken: action,
        reply: reply,
        success: true,
      };

      setLatestResult(resultObj);

      const botMsg = {
        sender: 'bot',
        intent: intent,
        entity: entity,
        statusBadge: intent === 'Insurance Question' ? 'In Network' : 'Matched',
        reply: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversationHistory((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Simulation fallback active:', err);
    } finally {
      setTestSending(false);
    }
  };

  // Helper to scroll to section
  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Phrases Handlers
  const addPhrase = () => {
    if (newPhraseInput.trim() && !customPhrases.includes(newPhraseInput.trim())) {
      setCustomPhrases([...customPhrases, newPhraseInput.trim()]);
      setNewPhraseInput('');
    }
  };

  const removePhrase = (phrase) => {
    setCustomPhrases(customPhrases.filter((p) => p !== phrase));
  };

  // Emergency Keywords Handlers
  const addEmergencyKeyword = () => {
    if (newKeywordInput.trim() && !emergencyKeywords.includes(newKeywordInput.trim())) {
      setEmergencyKeywords([...emergencyKeywords, newKeywordInput.trim()]);
      setNewKeywordInput('');
    }
  };

  const removeEmergencyKeyword = (kw) => {
    setEmergencyKeywords(emergencyKeywords.filter((k) => k !== kw));
  };

  // Conditional Card check
  const isHealthcare = selectedIndustry.includes('Dentist') || selectedIndustry.includes('Medical') || selectedIndustry.includes('Chiro') || selectedIndustry.includes('Wellness');
  const isLawFirm = selectedIndustry.includes('Law');
  const isHomeServices = selectedIndustry.includes('Home');
  const isDealership = selectedIndustry.includes('Dealer') || selectedIndustry.includes('Car');
  const isAccounting = selectedIndustry.includes('Accounting') || selectedIndustry.includes('Bookkeeping');
  const isRealEstate = selectedIndustry.includes('Real Estate');
  const isVeterinary = selectedIndustry.includes('Veterinary');

  return (
    <div className="min-h-screen bg-[#0e0e14] text-slate-100 pb-20 selection:bg-purple-600 selection:text-white">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-30 bg-[#12121b]/95 backdrop-blur border-b border-[#232334] px-4 md:px-6 py-3.5">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-none bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/30 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Receptionist
                <span className="text-xs px-2 py-0.5 rounded-none bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  v2.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Configure your AI receptionist to answer calls, manage appointments, provide information, and handle business tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollToSection('test-panel')}
              className="px-4 py-2 rounded-none border border-purple-500/40 hover:bg-purple-950/40 text-purple-300 font-medium text-xs flex items-center gap-2 transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Test Receptionist
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-none font-medium text-xs flex items-center gap-2 transition shadow-lg ${
                savedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
              }`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savedSuccess ? 'Changes Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="w-full py-4 space-y-5">
        {/* Banner: Business Profile & Template */}
        <section className="bg-[#161622] border border-[#26263a] rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <Building className="h-4 w-4 text-purple-400" />
              <span>Business Profile & Template</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Business Type (Industry):</span>
              <div className="relative">
                <select
                  value={selectedIndustry}
                  onChange={(e) => applyIndustryTemplate(e.target.value)}
                  className="bg-[#1f1f2e] text-white text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg border border-[#35354e] focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
                >
                  <option value="Dentist (Dental Clinic)">Dentist (Dental Clinic)</option>
                  <option value="Medical Clinic">Medical Clinic</option>
                  <option value="Chiropractor">Chiropractor</option>
                  <option value="Wellness Center">Wellness Center</option>
                  <option value="Law Firm">Law Firm</option>
                  <option value="Home Services (Plumbing, Electrical, HVAC)">Home Services (Plumbing, HVAC)</option>
                  <option value="Car Dealership">Car Dealership</option>
                  <option value="Accounting / Bookkeeping Firm">Accounting & Tax Firm</option>
                  <option value="Real Estate Agency">Real Estate Agency</option>
                  <option value="Veterinary Clinic">Veterinary Clinic</option>
                  <option value="Other">Other / General Business</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium flex items-center gap-1.5">
              <Check className="h-3 w-3 text-purple-400" />
              {templateAppliedBadge}
            </span>

            <span className="text-xs text-slate-400 hidden xl:inline-block">
              {templateSummary}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-xs text-purple-300/80 bg-purple-950/40 border border-purple-900/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Dynamic sections adapt to business type</span>
            </div>

            <button
              onClick={() => setTemplateModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#20202e] hover:bg-[#28283a] border border-[#373752] text-slate-200 transition"
            >
              Change Template
            </button>
          </div>
        </section>

        {/* ── Navigation / Anchor Tabs ── */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#212130]">
          {[
            { id: 'Overview', label: 'Overview' },
            { id: 'business-voice', label: 'Business & Voice' },
            { id: 'scripts', label: 'Scripts' },
            { id: 'knowledge', label: 'Knowledge' },
            { id: 'services', label: 'Services' },
            { id: 'staff', label: 'Staff' },
            ...(isHealthcare ? [{ id: 'insurance', label: 'Healthcare & Insurance' }] : []),
            ...(isLawFirm ? [{ id: 'legal', label: 'Legal Intake' }] : []),
            ...(isHomeServices ? [{ id: 'dispatch', label: 'Service Area' }] : []),
            ...(isDealership ? [{ id: 'dealership', label: 'Dealership & Inventory' }] : []),
            ...(isAccounting ? [{ id: 'accounting', label: 'Tax & Portal' }] : []),
            ...(isRealEstate ? [{ id: 'real-estate', label: 'Property Listings' }] : []),
            ...(isVeterinary ? [{ id: 'veterinary', label: 'Pet Care' }] : []),
            { id: 'routing', label: 'Routing' },
            { id: 'permissions', label: 'Permissions' },
            { id: 'phrases', label: 'Intents & Phrases' },
            { id: 'after-hours', label: 'After-Hours' },
            { id: 'payments', label: 'Payments' },
            { id: 'recording', label: 'Recording' },
            { id: 'consent', label: 'Consent & Outbound' },
            { id: 'crm', label: 'CRM & Leads' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'bg-[#181824] text-slate-400 hover:text-slate-200 hover:bg-[#222232]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── 2-Column Responsive Dashboard Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Middle: 14 Master Cards Grid (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Row 1: Business & Voice + Inbound Script */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Business & Voice Setup */}
              <div id="business-voice" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Business & Voice Setup</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Basic business info and AI voice.</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Business Name:</span>
                      <span className="font-medium text-slate-200">{businessProfile?.company_name || 'BrightSmile Dental Care'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Business Phone:</span>
                      <span className="font-medium text-slate-200">{businessProfile?.phone || '(555) 123-4567'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Business Hours:</span>
                      <span className="font-medium text-slate-200">Mon - Fri: 8:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">AI Voice:</span>
                      <span className="font-medium text-purple-300 flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        {VOICE_OPTIONS.find((v) => v.id === callSettings?.voice_id)?.name || 'Allison (Warm & Professional)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">AI Name:</span>
                      <span className="font-medium text-slate-200">{callSettings?.assistant_name || 'Sarah'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setVoiceModalOpen(true)}
                  className="mt-4 w-full py-1.5 px-3 rounded-lg border border-[#303046] hover:bg-[#1e1e2d] text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit Voice & Name
                </button>
              </div>

              {/* Card 2: Inbound Call Script */}
              <div id="scripts" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Inbound Call Script</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">How the AI answers incoming calls.</p>

                  <div className="bg-[#1a1a27] border border-[#2b2b3f] rounded-xl p-3 text-xs italic text-slate-300 leading-relaxed relative">
                    "{callSettings?.greeting_inbound || 'Thank you for calling BrightSmile Dental Care. This is our virtual receptionist. How can I help you today?'}"
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Variables: <code className="text-purple-400">{'{business}'}</code>, <code className="text-purple-400">{'{name}'}</code></span>
                  <button
                    onClick={() => {
                      const newGreeting = prompt('Edit Inbound Call Script:', callSettings?.greeting_inbound || '');
                      if (newGreeting !== null) {
                        setCallSettings((prev) => ({ ...prev, greeting_inbound: newGreeting }));
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Edit Script
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Outbound Script + Business Knowledge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 3: Outbound Call Script */}
              <div className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PhoneOutgoing className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Outbound Call Script</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">For follow-ups, reminders, and outreach.</p>

                  <div className="bg-[#1a1a27] border border-[#2b2b3f] rounded-xl p-3 text-xs italic text-slate-300 leading-relaxed">
                    "{callSettings?.greeting_outbound || 'Hi {first_name}, this is BrightSmile Dental Care with a quick reminder about your appointment on {date} at {time}. Please let us know if you need to reschedule.'}"
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Variables: <code className="text-purple-400">{'{first_name}'}</code>, <code className="text-purple-400">{'{date}'}</code></span>
                  <button
                    onClick={() => {
                      const newOutbound = prompt('Edit Outbound Call Script:', callSettings?.greeting_outbound || '');
                      if (newOutbound !== null) {
                        setCallSettings((prev) => ({ ...prev, greeting_outbound: newOutbound }));
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Edit Script
                  </button>
                </div>
              </div>

              {/* Card 4: Business Knowledge */}
              <div id="knowledge" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Business Knowledge</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Key information the AI uses to answer questions.</p>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Office location, parking, and directions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Accepted insurance and payment options</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Policies (cancellation, late, no-show)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Common FAQs (new patients, prep, forms)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const extra = prompt('Add Business Knowledge or Policies:', callSettings?.knowledge_base || '');
                    if (extra !== null) {
                      setCallSettings((prev) => ({ ...prev, knowledge_base: extra }));
                    }
                  }}
                  className="mt-4 w-full py-1.5 px-3 rounded-lg border border-[#303046] hover:bg-[#1e1e2d] text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="h-3 w-3" />
                  Manage Knowledge Details
                </button>
              </div>
            </div>

            {/* Row 3: Services & Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 5: Services / Appointment Types */}
              <div id="services" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Services / Appointment Types</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Services, duration, staff, and booking rules.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#232334] pb-1">
                        <th className="pb-1 font-medium">Service</th>
                        <th className="pb-1 font-medium">Duration</th>
                        <th className="pb-1 font-medium">Provider</th>
                        <th className="pb-1 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2c]">
                      {servicesList.map((serv) => (
                        <tr key={serv.id} className="text-slate-200">
                          <td className="py-2 font-medium">{serv.name}</td>
                          <td className="py-2 text-slate-400">{serv.duration_minutes} min</td>
                          <td className="py-2 text-slate-400">{serv.provider_role}</td>
                          <td className="py-2 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => {
                    const name = prompt('New Service Name:');
                    if (name) {
                      setServicesList([
                        ...servicesList,
                        { id: Date.now().toString(), name, duration_minutes: 30, provider_role: 'Staff', active: true },
                      ]);
                    }
                  }}
                  className="mt-3 w-full py-1 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Service
                </button>
              </div>

              {/* Card 6: Staff / Teams */}
              <div id="staff" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Staff / Teams</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">People and teams the AI can route to or schedule with.</p>

                <div className="space-y-2 text-xs">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between p-2 rounded-lg bg-[#191926] border border-[#252538]">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                        Active
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const name = prompt('New Staff Member Name:');
                    if (name) {
                      const role = prompt('Role / Title:', 'Provider');
                      setStaffList([
                        ...staffList,
                        { id: Date.now().toString(), name, role: role || 'Team', active: true },
                      ]);
                    }
                  }}
                  className="mt-3 w-full py-1 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Team Member
                </button>
              </div>
            </div>

            {/* Row 4: CONDITIONAL SECTION (Adapts by Business Type) */}
            {isHealthcare && (
              <div id="insurance" className="bg-[#14141f] border border-[#2e2640] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Insurance (Healthcare Only)</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Dentist / Medical / Chiropractor Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Accepted insurance plans, network status, and verification rules.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#232334] pb-1">
                        <th className="pb-1 font-medium">Insurance / Payer</th>
                        <th className="pb-1 font-medium">Plan / Type</th>
                        <th className="pb-1 font-medium">Network Status</th>
                        <th className="pb-1 font-medium">Verification</th>
                        <th className="pb-1 font-medium text-right">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2c]">
                      {insurancePlans.map((plan) => (
                        <tr key={plan.id} className="text-slate-200">
                          <td className="py-2.5 font-medium flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                            {plan.payer}
                          </td>
                          <td className="py-2.5 text-slate-400">{plan.plan_name || 'PPO'}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              plan.network_status === 'in_network'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {plan.network_status === 'in_network' ? 'In-Network' : 'Plan Dependent'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400">
                            {plan.verification_required ? 'Required' : 'Optional'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => {
                                setInsurancePlans(insurancePlans.map((p) => p.id === plan.id ? { ...p, active: !p.active } : p));
                              }}
                              className={`w-8 h-4 rounded-full transition-colors relative ${plan.active ? 'bg-purple-600' : 'bg-slate-700'}`}
                            >
                              <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${plan.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isLawFirm && (
              <div id="legal" className="bg-[#14141f] border border-[#2e2640] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Legal Intake & Practice Areas</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Law Firm Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Intake screening parameters, conflict checking rules, and practice areas.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#181827] border border-[#252538] rounded-xl space-y-2">
                    <div className="font-medium text-slate-200">Active Practice Areas</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Personal Injury', 'Family Law & Divorce', 'Business Law', 'Estate Planning', 'Criminal Defense'].map((area) => (
                        <span key={area} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#181827] border border-[#252538] rounded-xl space-y-2">
                    <div className="font-medium text-slate-200">Intake Safeguards</div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Conflict Checking Required</span>
                      <span className="text-emerald-400 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>No Legal Advice Warning</span>
                      <span className="text-emerald-400 font-medium">Enforced</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isHomeServices && (
              <div id="dispatch" className="bg-[#14141f] border border-[#2e2640] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Service Area & Dispatch</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Home Services Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Coverage radius, ZIP codes, and technician dispatch rates.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Service Radius</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">25 Miles</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Diagnostic Fee</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">$89 (Waived)</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Emergency Dispatch</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">$149 Fee</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Primary ZIPs</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">10001 - 10016</div>
                  </div>
                </div>
              </div>
            )}

            {isDealership && (
              <div id="dealership" className="bg-[#14141f] border border-[#2e2640] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Dealership & Inventory Rules</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Car Dealership Only
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Driver License Req</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Yes (Before Test Drive)</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Trade-In Appraisal</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Physical Inspection</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Min Age (Test Drive)</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">18+ with Insurance</div>
                  </div>
                </div>
              </div>
            )}

            {isAccounting && (
              <div id="accounting" className="bg-[#14141f] border border-[#2e2640] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Tax Filing & Portal Policies</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Accounting & Tax Only
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Tax Season Cutoff</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">April 15 / Oct 15</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">IRS Notice Review</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Priority Partner Queue</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-xl border border-[#26263a]">
                    <div className="text-slate-400">Document Upload</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Instant SMS Portal Link</div>
                  </div>
                </div>
              </div>
            )}

            {/* Row 5: Routing & Call Handling */}
            <div id="routing" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Routing & Call Handling</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Where to send calls and how to handle them.</p>

              <div className="space-y-2 text-xs">
                {[
                  { intent: 'Appointment Requests', destination: 'Book directly in calendar', icon: Calendar },
                  { intent: 'Billing / Insurance Questions', destination: 'Front Desk Team', icon: Users2 },
                  { intent: 'Urgent / Emergency', destination: 'Transfer to office (protected flow)', icon: AlertCircle },
                  { intent: 'All Other Inquiries', destination: 'AI handles or takes a message', icon: Bot },
                ].map((route, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#181827] border border-[#262638]">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <route.icon className="h-3.5 w-3.5 text-purple-400" />
                      <span>{route.intent}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <ArrowRight size={13} className="text-purple-400" />
                      <span className="text-purple-300 font-medium">{route.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 6: Permissions (What the AI Can Do) */}
            <div id="permissions" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Permissions (What the AI Can Do)</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Control the specific capabilities the AI receptionist can perform.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                {[
                  { key: 'schedule', label: 'Schedule Appointments' },
                  { key: 'reschedule', label: 'Reschedule Appointments' },
                  { key: 'cancel', label: 'Cancel Appointments' },
                  { key: 'check_availability', label: 'Check Availability' },
                  { key: 'send_sms', label: 'Send SMS / Text Messages' },
                  { key: 'send_email', label: 'Send Emails' },
                  { key: 'create_update_contacts', label: 'Create / Update Contacts' },
                  { key: 'create_lead_new_only', label: 'Create Lead (New Prospects Only)' },
                  { key: 'add_tasks_reminders', label: 'Add Tasks / Reminders' },
                  { key: 'create_service_tickets', label: 'Create Service Tickets / Cases' },
                  { key: 'send_payment_link', label: 'Send Secure Payment Link' },
                  { key: 'transfer_calls_staff', label: 'Transfer Calls to Staff' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <button
                      onClick={() => setPermissions({ ...permissions, [item.key]: !permissions[item.key] })}
                      className={`w-9 h-5 rounded-full transition-colors relative ${permissions[item.key] ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${permissions[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 7: Intents & Phrases */}
            <div id="phrases" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Intents & Phrases</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Customize or add new intents and trigger phrases.</p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-[#232334] pb-1">
                      <th className="pb-1 font-medium">Intent (Purpose)</th>
                      <th className="pb-1 font-medium">Example Phrases (Keywords)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e2c]">
                    <tr className="text-slate-200">
                      <td className="py-2 font-medium">Book Appointment</td>
                      <td className="py-2 text-slate-400">"schedule a cleaning", "book an exam", "make an appointment"</td>
                    </tr>
                    <tr className="text-slate-200">
                      <td className="py-2 font-medium">Insurance Question</td>
                      <td className="py-2 text-slate-400">"do you take Delta Dental?", "is Aetna accepted?", "in-network"</td>
                    </tr>
                    <tr className="text-slate-200">
                      <td className="py-2 font-medium">Reschedule</td>
                      <td className="py-2 text-slate-400">"change my appointment", "move it to next week", "different day"</td>
                    </tr>
                    <tr className="text-slate-200">
                      <td className="py-2 font-medium">Cancel Appointment</td>
                      <td className="py-2 text-slate-400">"cancel my appointment", "I can't make it", "can't come"</td>
                    </tr>
                    <tr className="text-slate-200">
                      <td className="py-2 font-medium">New Patient</td>
                      <td className="py-2 text-slate-400">"I'm a new patient", "how do I get started?", "first time visit"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Brand Phrases Chips */}
              <div className="pt-3 border-t border-[#232334]">
                <div className="text-xs font-medium text-slate-300 mb-2">Custom Phrases / Additional Recognition Phrases (Optional)</div>
                <div className="flex flex-wrap items-center gap-2">
                  {customPhrases.map((phrase) => (
                    <span key={phrase} className="px-3 py-1 rounded-full text-xs bg-purple-950/60 text-purple-200 border border-purple-800/80 flex items-center gap-1.5">
                      <span>"{phrase}"</span>
                      <button onClick={() => removePhrase(phrase)} className="hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add phrase..."
                      value={newPhraseInput}
                      onChange={(e) => setNewPhraseInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPhrase()}
                      className="bg-[#1a1a27] text-white text-xs px-2.5 py-1 rounded-lg border border-[#34344d] focus:outline-none focus:border-purple-500 w-32"
                    />
                    <button
                      onClick={addPhrase}
                      className="p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 8: 4 Compact Cards (After-Hours, Payments, Recording, Consent, CRM) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* After-Hours & Emergency */}
              <div id="after-hours" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">After-Hours & Emergency</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Set after-hours behavior and emergency escalation.</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>After-hours: Take a message & notify team</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Emergency: Transfer to on-call / office number</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#232334] text-xs">
                  <span className="text-slate-400 text-[11px]">Emergency Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {emergencyKeywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded text-[10px] bg-red-950/60 text-red-300 border border-red-900/60">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure Payments */}
              <div id="payments" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Secure Payments</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Handle payments safely (no raw card numbers over phone).</p>

                  <div className="space-y-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentsConfig.accept_by_phone}
                        onChange={(e) => setPaymentsConfig({ ...paymentsConfig, accept_by_phone: e.target.checked })}
                        className="rounded border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
                      />
                      <span>Discuss invoice or balance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentsConfig.send_payment_link}
                        onChange={(e) => setPaymentsConfig({ ...paymentsConfig, send_payment_link: e.target.checked })}
                        className="rounded border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
                      />
                      <span>Send secure payment link (SMS / Email)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentsConfig.confirm_payment_received}
                        onChange={(e) => setPaymentsConfig({ ...paymentsConfig, confirm_payment_received: e.target.checked })}
                        className="rounded border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
                      />
                      <span>Confirm payment received (if integrated)</span>
                    </label>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>PCI DSS Compliant Link Generation</span>
                </div>
              </div>

              {/* Recording & Transcription */}
              <div id="recording" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Disc className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Recording & Transcription</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Call recording and transcription settings.</p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Record calls (with disclosure)</span>
                    <button
                      onClick={() => setRecordingConfig({ ...recordingConfig, record_calls: !recordingConfig.record_calls })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${recordingConfig.record_calls ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${recordingConfig.record_calls ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Generate transcripts</span>
                    <button
                      onClick={() => setRecordingConfig({ ...recordingConfig, generate_transcripts: !recordingConfig.generate_transcripts })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${recordingConfig.generate_transcripts ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${recordingConfig.generate_transcripts ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Retention</span>
                    <span className="text-purple-300 font-medium">365 days</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 pt-1">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Redact sensitive data (card, SSN, PHI)</span>
                  </div>
                </div>
              </div>

              {/* Consent & Outbound Calling */}
              <div id="consent" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Consent & Outbound Calling</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Manage consent, outbound calls, and TCPA compliance.</p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Outbound calls</span>
                    <span className="text-emerald-400 font-medium">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Call type</span>
                    <span className="text-slate-400">Transactional, Follow-up, Reminder</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Require consent before outbound</span>
                    <button
                      onClick={() => setConsentConfig({ ...consentConfig, require_consent: !consentConfig.require_consent })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${consentConfig.require_consent ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${consentConfig.require_consent ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 pt-1">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Do-Not-Call / Opt-Out: Honor and suppress</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 9: CRM & Lead Behavior */}
            <div id="crm" className="bg-[#14141f] border border-[#242436] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderCheck className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">CRM & Lead Behavior</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">How calls create and update customer records.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#202030]">
                  <span className="text-slate-300">Create lead only for new prospects</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, create_new_lead_unknown: !crmLeadConfig.create_new_lead_unknown })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${crmLeadConfig.create_new_lead_unknown ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${crmLeadConfig.create_new_lead_unknown ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#202030]">
                  <span className="text-slate-300">Update existing contacts (if identified)</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, update_existing_contacts: !crmLeadConfig.update_existing_contacts })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${crmLeadConfig.update_existing_contacts ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${crmLeadConfig.update_existing_contacts ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-300">Tag and source: AI Receptionist</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, tag_source_receptionist: !crmLeadConfig.tag_source_receptionist })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${crmLeadConfig.tag_source_receptionist ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${crmLeadConfig.tag_source_receptionist ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-300">Avoid duplicate contacts</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, avoid_duplicates: !crmLeadConfig.avoid_duplicates })}
                    className={`w-8 h-4 rounded-full transition-colors relative ${crmLeadConfig.avoid_duplicates ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${crmLeadConfig.avoid_duplicates ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Test Receptionist Panel (4 cols on lg) */}
          <div id="test-panel" className="lg:col-span-4">
            <div className="sticky top-24 bg-[#141421] border border-[#2b2b40] rounded-2xl p-5 shadow-2xl flex flex-col h-[calc(100vh-130px)]">
              {/* Header */}
              <div className="pb-3 border-b border-[#252538]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" />
                    <h3 className="font-bold text-base text-white">Test AI Receptionist</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Live Simulator
                  </span>
                </div>
                <p className="text-xs text-slate-400">Try a real conversation to verify the configuration.</p>

                {/* Mode Tabs */}
                <div className="flex items-center gap-2 mt-3 bg-[#1b1b2a] p-1 rounded-xl">
                  <button
                    onClick={() => setSimulatorMode('call')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      simulatorMode === 'call'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PhoneCall className="h-3 w-3" />
                    Call Simulation
                  </button>
                  <button
                    onClick={() => setSimulatorMode('chat')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      simulatorMode === 'chat'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Text Chat
                  </button>
                </div>
              </div>

              {/* Scrollable Conversation / Diagnostics Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
                {/* Active Test Diagnostics Card */}
                {latestResult && (
                  <div className="bg-[#1b1b2a] border border-[#303046] rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#27273a]">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Test Result
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Success
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Detected Intent:</span>
                        <span className="font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded text-[11px] border border-purple-800/60">
                          {latestResult.detected_intent}
                        </span>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Recognized Entity:</span>
                        <span className="font-medium text-slate-200 text-right">{latestResult.recognized_entity}</span>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Backend Lookup:</span>
                        <span className="font-medium text-emerald-300 text-right">{latestResult.backend_lookup}</span>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Action Taken:</span>
                        <span className="font-medium text-slate-300 text-right">{latestResult.action_taken}</span>
                      </div>
                    </div>

                    {/* AI Response Quote */}
                    <div className="pt-2 border-t border-[#27273a] mt-2">
                      <span className="text-[11px] text-slate-400 font-medium">AI Response (to Caller):</span>
                      <div className="mt-1 bg-[#151522] p-2.5 rounded-lg border border-[#252538] text-slate-200 text-xs italic leading-relaxed">
                        "{latestResult.reply}"
                      </div>
                    </div>
                  </div>
                )}

                {/* More Test Examples Header */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>More Test Examples</span>
                    <span className="text-[10px] text-slate-500">Click to run</span>
                  </div>

                  <div className="space-y-1.5">
                    {sampleQueries.map((sample, i) => (
                      <button
                        key={i}
                        onClick={() => runTestSimulation(sample.query)}
                        disabled={testSending}
                        className="w-full p-2.5 rounded-xl bg-[#181827] hover:bg-[#202033] border border-[#252538] hover:border-purple-500/40 text-left text-xs transition flex items-center justify-between group"
                      >
                        <span className="text-slate-300 group-hover:text-white truncate pr-2">
                          "{sample.query}"
                        </span>
                        <Play className="h-3 w-3 text-purple-400 group-hover:text-purple-300 fill-current shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Turn History */}
                {conversationHistory.length > 2 && (
                  <div className="pt-3 border-t border-[#252538] space-y-2">
                    <span className="text-[11px] font-medium text-slate-400">Session History:</span>
                    {conversationHistory.slice(-4).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.sender === 'user'
                            ? 'bg-[#222236] ml-4 text-slate-200'
                            : 'bg-purple-950/40 mr-4 border border-purple-900/40 text-purple-200'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                          <span>{msg.sender === 'user' ? 'Caller' : 'AI Receptionist'}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.reply || msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Test Message Input */}
              <div className="pt-3 border-t border-[#252538]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runTestSimulation();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={testQueryInput}
                    onChange={(e) => setTestQueryInput(e.target.value)}
                    placeholder="Type a test message (e.g. Do you take Delta Dental?)..."
                    className="flex-1 bg-[#1c1c2b] text-white text-xs px-3 py-2.5 rounded-xl border border-[#35354e] focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={testSending || !testQueryInput.trim()}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-md shadow-purple-900/30"
                  >
                    {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Template Picker Modal ── */}
      <AnimatePresence>
        {templateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Select Business Industry Template</h3>
                </div>
                <button onClick={() => setTemplateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Choose your industry to automatically load standard intents, service categories, staff roles, and phrasing. The master UI layout remains consistent across all types.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'Dentist (Dental Clinic)', name: 'Dentist (Dental Clinic)', icon: Bot, desc: 'Preloads dental cleaning, exam, implant, and insurance verification (Delta, Aetna).' },
                  { key: 'Medical Clinic', name: 'Medical Clinic', icon: Stethoscope, desc: 'Preloads physical exams, prescription requests, triage, and Medicare/UHC insurance.' },
                  { key: 'Chiropractor', name: 'Chiropractor Clinic', icon: Activity, desc: 'Preloads spinal adjustments, new patient exam fees, and auto accident / PI intake.' },
                  { key: 'Wellness Center', name: 'Wellness Center', icon: Sparkles, desc: 'Preloads IV hydration, cryotherapy, infrared sauna, massage, and contraindication screening.' },
                  { key: 'Law Firm', name: 'Law Firm', icon: Scale, desc: 'Preloads personal injury intake, consultations, conflict check, and attorney routing.' },
                  { key: 'Home Services (Plumbing, Electrical, HVAC)', name: 'Home Services', icon: Wrench, desc: 'Preloads emergency dispatch, diagnostic fees, service area radius, and trade techs.' },
                  { key: 'Car Dealership', name: 'Car Dealership', icon: Car, desc: 'Preloads vehicle inventory search, test drive scheduling, trade-in valuations, and service bay.' },
                  { key: 'Accounting / Bookkeeping Firm', name: 'Accounting & Tax Firm', icon: FileText, desc: 'Preloads tax return preparation, bookkeeping, IRS notices, and secure upload link.' },
                  { key: 'Real Estate Agency', name: 'Real Estate Agency', icon: Building, desc: 'Preloads property showings, buyer pre-qualifications, CMA home valuations, and open houses.' },
                  { key: 'Veterinary Clinic', name: 'Veterinary Clinic', icon: Heart, desc: 'Preloads pet wellness exams, vaccinations, Trupanion pet insurance, and emergency triage.' },
                  { key: 'Other', name: 'General Business', icon: Briefcase, desc: 'Universal master template with appointment booking, lead capture, and FAQs.' },
                ].map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.key}
                      onClick={() => {
                        applyIndustryTemplate(tmpl.key, null, false);
                        setTemplateModalOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        selectedIndustry === tmpl.key
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-900/20'
                          : 'bg-[#1a1a29] border-[#29293e] hover:border-[#3d3d5c] hover:bg-[#202033]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                          <Icon size={14} />
                        </div>
                        <span className="font-semibold text-white text-xs">{tmpl.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{tmpl.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Voice & Name Modal ── */}
      <AnimatePresence>
        {voiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">AI Voice & Persona Setup</h3>
                </div>
                <button onClick={() => setVoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">AI Receptionist Name</label>
                  <input
                    type="text"
                    value={callSettings?.assistant_name || ''}
                    onChange={(e) => setCallSettings({ ...callSettings, assistant_name: e.target.value })}
                    placeholder="e.g. Sarah"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-xl border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Select Voice</label>
                  <div className="space-y-2">
                    {VOICE_OPTIONS.map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => setCallSettings({ ...callSettings, voice_id: voice.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          callSettings?.voice_id === voice.id
                            ? 'bg-purple-950/40 border-purple-500'
                            : 'bg-[#1b1b2a] border-[#2b2b40] hover:bg-[#202033]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{voice.name}</div>
                          <div className="text-[11px] text-slate-400">{voice.preview}</div>
                        </div>
                        <Volume2 className="h-4 w-4 text-purple-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setVoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
