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
  MapPin,
  Globe,
  DollarSign,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { smartflowApi } from '../api/services';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/useAuthStore';

// Standard Voices with preview samples
const VOICE_OPTIONS = [
  { id: 'female_warm', name: 'Allison (Warm & Professional)', gender: 'Female', preview: 'Warm, friendly tone ideal for clinic & office reception' },
  { id: 'female_energetic', name: 'Emma (Friendly & Energetic)', gender: 'Female', preview: 'Upbeat and welcoming voice for service businesses' },
  { id: 'male_casual', name: 'Marcus (Calm & Professional)', gender: 'Male', preview: 'Authoritative, calm tone ideal for legal and corporate' },
  { id: 'male_deep', name: 'David (Deep & Trustworthy)', gender: 'Male', preview: 'Direct, clear tone suitable for contractors and repair' },
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
  const { user } = useAuthStore();

  // Settings & Status
  const [callSettings, setCallSettings] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [businessHours, setBusinessHours] = useState(null);
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

  // ── Modals State ──
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [inboundScriptModalOpen, setInboundScriptModalOpen] = useState(false);
  const [outboundScriptModalOpen, setOutboundScriptModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // ── Form States for Modals ──
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    phone_number: '',
    website: '',
    office_address_text: '',
    start_hour: 8,
    end_hour: 17,
    days_type: 'mon_fri',
  });

  const [inboundScriptText, setInboundScriptText] = useState('');
  const [outboundScriptText, setOutboundScriptText] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');

  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration_minutes: 30,
    provider_role: 'Specialist',
    price: '',
    active: true,
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Front Desk',
    department: 'Intake & Scheduling',
    working_days: [0, 1, 2, 3, 4],
    start_hour: 9,
    end_hour: 17,
    active: true,
  });

  const DAYS_OF_WEEK = [
    { id: 0, label: 'Mon', full: 'Monday' },
    { id: 1, label: 'Tue', full: 'Tuesday' },
    { id: 2, label: 'Wed', full: 'Wednesday' },
    { id: 3, label: 'Thu', full: 'Thursday' },
    { id: 4, label: 'Fri', full: 'Friday' },
    { id: 5, label: 'Sat', full: 'Saturday' },
    { id: 6, label: 'Sun', full: 'Sunday' },
  ];

  const formatStaffSchedule = (staff) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = staff.working_days;
    const hours = staff.working_hours || (staff.start_hour !== undefined ? { start_hour: staff.start_hour, end_hour: staff.end_hour } : null);

    let dayStr = 'All Days';
    if (Array.isArray(days) && days.length > 0) {
      if (days.length === 5 && days.every((d, i) => d === i)) {
        dayStr = 'Mon - Fri';
      } else {
        dayStr = days.map((d) => dayNames[d] || d).join(', ');
      }
    }

    let hourStr = '9:00 AM - 5:00 PM';
    if (hours && hours.start_hour !== undefined && hours.end_hour !== undefined) {
      const s = hours.start_hour;
      const e = hours.end_hour;
      const sStr = s === 0 ? '12:00 AM' : s < 12 ? `${s}:00 AM` : s === 12 ? '12:00 PM' : `${s - 12}:00 PM`;
      const eStr = e === 12 ? '12:00 PM' : e < 12 ? `${e}:00 AM` : e === 24 ? '12:00 AM' : `${e - 12}:00 PM`;
      hourStr = `${sStr} - ${eStr}`;
    }
    return `${dayStr} • ${hourStr}`;
  };

  const [insuranceForm, setInsuranceForm] = useState({
    payer: '',
    plan_name: 'PPO',
    network_status: 'in_network',
    verification_required: true,
    active: true,
  });

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
  const [latestResult, setLatestResult] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sampleQueries, setSampleQueries] = useState([]);

  // ── Computed Business Info ──
  const activeBusinessName =
    businessProfile?.business_name ||
    user?.business_name ||
    user?.company_name ||
    (user?.full_name ? `${user.full_name}'s Office` : 'My Business');

  const activeBusinessPhone =
    businessProfile?.phone_number ||
    businessProfile?.phone ||
    user?.phone_number ||
    '(555) 123-4567';

  const formatHours = (hoursData) => {
    if (!hoursData) return 'Mon - Fri: 8:00 AM - 5:00 PM';
    const sH = hoursData.start_hour !== undefined ? hoursData.start_hour : 8;
    const eH = hoursData.end_hour !== undefined ? hoursData.end_hour : 17;
    const sLabel = `${sH > 12 ? sH - 12 : sH || 12}:00 ${sH >= 12 ? 'PM' : 'AM'}`;
    const eLabel = `${eH > 12 ? eH - 12 : eH || 12}:00 ${eH >= 12 ? 'PM' : 'AM'}`;
    const days = hoursData.days || [0, 1, 2, 3, 4];
    const daysStr = days.length === 7 ? 'Every day'
      : days.length === 6 ? 'Mon - Sat'
      : 'Mon - Fri';
    return `${daysStr}: ${sLabel} - ${eLabel}`;
  };

  const activeBusinessHours = formatHours(businessHours);
  const activeBusinessWebsite = businessProfile?.website || '';
  const activeBusinessAddress = businessProfile?.office_address_text || '';

  // Load initial settings and industry templates
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, profileRes, hoursRes] = await Promise.all([
        smartflowApi.getAICallSettings().catch(() => null),
        smartflowApi.getBusinessProfile?.().catch(() => null),
        smartflowApi.getBusinessHours?.().catch(() => null),
      ]);

      const data = settingsRes?.data?.data || {};
      const profile = profileRes?.data?.data || {};
      const hours = hoursRes?.data?.data || null;

      setCallSettings(data);
      if (profileRes?.data?.data) {
        setBusinessProfile(profile);
      }
      if (hours) {
        setBusinessHours(hours);
      }

      const bName = profile.business_name || user?.business_name || user?.company_name || 'My Business';
      const bType = data?.business_type || 'Dental Clinic';

      // Load saved services & staff if available
      let loadedStaff = null;
      try {
        const provRes = await smartflowApi.getProviders();
        const provs = provRes?.data?.data || provRes?.data || [];
        if (Array.isArray(provs) && provs.length > 0) {
          loadedStaff = provs.map((p) => ({
            id: p.id,
            name: p.name,
            role: p.role_title || 'Specialist',
            department: p.department || '',
            working_days: Array.isArray(p.working_days) ? p.working_days : [0, 1, 2, 3, 4],
            working_hours: p.working_hours || { start_hour: 9, end_hour: 17 },
            active: p.active ?? true,
          }));
        }
      } catch (err) {
        console.warn('Could not load providers from /smartflow/providers:', err);
      }

      if (data?.industry_conditional_data?.services?.length) {
        setServicesList(data.industry_conditional_data.services);
      }
      if (loadedStaff && loadedStaff.length > 0) {
        setStaffList(loadedStaff);
      } else if (data?.industry_conditional_data?.staff?.length) {
        setStaffList(data.industry_conditional_data.staff);
      }

      await applyIndustryTemplate(bType, data, false, bName);
    } catch (err) {
      console.error('Failed to load receptionist settings:', err);
      setErrorMessage('Could not load current settings. Running with defaults.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply Industry Template
  const applyIndustryTemplate = async (industryKey, existingData = null, showConfirm = true, overrideName = null) => {
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

      const bName = overrideName || activeBusinessName;

      if (preset) {
        setTemplateSummary(preset.summary || `Preloaded defaults for ${normKey}`);
        setTemplateAppliedBadge('Template Applied');

        // Set Services (unless user already customized them)
        if (!servicesList.length || showConfirm) {
          setServicesList(preset.services || [
            { id: '1', name: 'General Consultation', duration_minutes: 30, provider_role: 'Specialist', active: true },
          ]);
        }

        // Set Staff
        if (!staffList.length || showConfirm) {
          setStaffList(preset.staff || [
            { id: '1', name: 'Front Desk', role: 'Intake & Scheduling', active: true },
          ]);
        }

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

        // Set Sample Test Queries with dynamic business name
        if (preset.sample_test_queries && preset.sample_test_queries.length > 0) {
          const dynamicQueries = preset.sample_test_queries.map((q) => ({
            ...q,
            reply: (q.reply || '')
              .replace(/BrightSmile Dental Care/g, bName)
              .replace(/Sterling & Vance Legal Counsel/g, bName)
              .replace(/Sterling Law/g, bName)
              .replace(/Metro Community Health/g, bName)
              .replace(/Radiant Health & Wellness Center/g, bName)
              .replace(/Radiant Wellness/g, bName),
          }));
          setSampleQueries(dynamicQueries);

          const first = dynamicQueries[0];
          setLatestResult({
            detected_intent: first.intent,
            recognized_entity: first.entity,
            backend_lookup: first.lookup,
            action_taken: first.action,
            reply: first.reply,
            success: true,
          });

          setConversationHistory([
            { sender: 'user', text: first.query, time: '10:00 AM' },
            {
              sender: 'bot',
              intent: first.intent,
              entity: first.entity,
              statusBadge: 'Verified',
              reply: first.reply,
              time: '10:00 AM',
            },
          ]);
        }

        // Formulate personalized greeting templates substituting dynamic business name
        let customizedInbound = preset.inbound_greeting || `Thank you for calling ${bName}. How can I assist you today?`;
        customizedInbound = customizedInbound
          .replace(/BrightSmile Dental Care/g, bName)
          .replace(/Sterling & Vance Legal Counsel/g, bName)
          .replace(/Metro Community Health/g, bName)
          .replace(/Radiant Health & Wellness Center/g, bName);

        let customizedOutbound = preset.outbound_greeting || `Hi {first_name}, this is ${bName} with a quick reminder about your appointment on {date} at {time}.`;
        customizedOutbound = customizedOutbound
          .replace(/BrightSmile Dental Care/g, bName)
          .replace(/Sterling Law/g, bName)
          .replace(/Metro Health Clinic/g, bName)
          .replace(/Radiant Wellness/g, bName);

        // Update Greetings in Settings
        setCallSettings((prev) => ({
          ...(prev || existingData || {}),
          business_type: normKey,
          assistant_name: prev?.assistant_name || existingData?.assistant_name || 'Sarah',
          voice_id: prev?.voice_id || existingData?.voice_id || 'female_warm',
          greeting_inbound: showConfirm
            ? customizedInbound
            : (existingData?.greeting_inbound || prev?.greeting_inbound || customizedInbound),
          greeting_outbound: showConfirm
            ? customizedOutbound
            : (existingData?.greeting_outbound || prev?.greeting_outbound || customizedOutbound),
        }));
      }
    } catch (err) {
      console.warn('Template fallback error:', err);
    }
  };

  // ── Save Master Settings to Backend ──
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
        industry_conditional_data: {
          ...conditionalData,
          services: servicesList,
          staff: staffList,
        },
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

  // ── Handle Save Business Profile Modal ──
  const handleSaveBusinessProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const days = businessForm.days_type === 'mon_fri' ? [0, 1, 2, 3, 4]
        : businessForm.days_type === 'mon_sat' ? [0, 1, 2, 3, 4, 5]
        : [0, 1, 2, 3, 4, 5, 6];

      const profilePayload = {
        business_name: businessForm.business_name.trim(),
        phone_number: businessForm.phone_number.trim() || null,
        website: businessForm.website.trim() || null,
        office_address_text: businessForm.office_address_text.trim() || null,
      };

      const hoursPayload = {
        start_hour: parseInt(businessForm.start_hour, 10),
        end_hour: parseInt(businessForm.end_hour, 10),
        days,
      };

      await Promise.all([
        smartflowApi.updateBusinessProfile(profilePayload),
        smartflowApi.updateBusinessHours(hoursPayload).catch(() => null),
      ]);

      setBusinessProfile((prev) => ({
        ...(prev || {}),
        ...profilePayload,
      }));

      setBusinessHours((prev) => ({
        ...(prev || {}),
        ...hoursPayload,
      }));

      // Update scripts to replace previous business name if requested
      const newName = businessForm.business_name.trim();
      setCallSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          greeting_inbound: prev.greeting_inbound ? prev.greeting_inbound.replace(activeBusinessName, newName) : prev.greeting_inbound,
          greeting_outbound: prev.greeting_outbound ? prev.greeting_outbound.replace(activeBusinessName, newName) : prev.greeting_outbound,
        };
      });

      setBusinessModalOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Failed to update business profile. Please verify your details.');
    } finally {
      setSaving(false);
    }
  };

  // ── Run Test Query in Simulator ──
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
      const reply = data?.reply || `Thank you for contacting ${activeBusinessName}! I would be glad to help you with that.`;

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

  // Conditional Card checks
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
              className="px-4 py-2 rounded-none border border-purple-500/40 hover:bg-purple-950/40 text-purple-300 font-medium text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Test Receptionist
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-none font-medium text-xs flex items-center gap-2 transition shadow-lg cursor-pointer ${
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

      {/* ── Status Notification Banner ── */}
      {errorMessage && (
        <div className="mx-4 md:mx-6 mt-3 p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center justify-between rounded-none">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main Container ── */}
      <main className="w-full px-4 md:px-6 py-4 space-y-5">
        {/* Banner: Business Profile & Template */}
        <section className="bg-[#161622] border border-[#26263a] rounded-none p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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
                  className="bg-[#1f1f2e] text-white text-xs font-medium py-1.5 pl-3 pr-8 rounded-none border border-[#35354e] focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
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

            <span className="text-xs px-2.5 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium flex items-center gap-1.5">
              <Check className="h-3 w-3 text-purple-400" />
              {templateAppliedBadge}
            </span>

            <span className="text-xs text-slate-400 hidden xl:inline-block">
              {templateSummary}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-xs text-purple-300/80 bg-purple-950/40 border border-purple-900/40 px-3 py-1 rounded-none flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Dynamic sections adapt to business type</span>
            </div>

            <button
              onClick={() => setTemplateModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-none bg-[#20202e] hover:bg-[#28283a] border border-[#373752] text-slate-200 transition cursor-pointer"
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
              className={`px-3 py-1.5 rounded-none text-xs font-medium whitespace-nowrap transition cursor-pointer ${
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
              <div id="business-voice" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Business & Voice Setup</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Live business profile, operating hours, and AI voice persona.</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Business Name:</span>
                      <span className="font-semibold text-white text-right truncate max-w-[200px]" title={activeBusinessName}>
                        {activeBusinessName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Business Phone:</span>
                      <span className="font-medium text-slate-200">{activeBusinessPhone}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">Operating Hours:</span>
                      <span className="font-medium text-slate-200 text-right">{activeBusinessHours}</span>
                    </div>
                    {activeBusinessWebsite && (
                      <div className="flex justify-between py-1.5 border-b border-[#1f1f2e]">
                        <span className="text-slate-400">Website:</span>
                        <span className="font-medium text-purple-300 text-right truncate max-w-[200px]">{activeBusinessWebsite}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-[#1f1f2e]">
                      <span className="text-slate-400">AI Voice:</span>
                      <span className="font-medium text-purple-300 flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        {VOICE_OPTIONS.find((v) => v.id === callSettings?.voice_id)?.name || 'Allison (Warm & Professional)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">AI Name:</span>
                      <span className="font-medium text-slate-200">{callSettings?.assistant_name || 'Sarah'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setBusinessForm({
                        business_name: activeBusinessName,
                        phone_number: activeBusinessPhone,
                        website: activeBusinessWebsite,
                        office_address_text: activeBusinessAddress,
                        start_hour: businessHours?.start_hour ?? 8,
                        end_hour: businessHours?.end_hour ?? 17,
                        days_type: businessHours?.days?.length === 7 ? 'all_week' : businessHours?.days?.length === 6 ? 'mon_sat' : 'mon_fri',
                      });
                      setBusinessModalOpen(true);
                    }}
                    className="py-1.5 px-3 rounded-none border border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/30 text-xs font-medium text-purple-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building className="h-3 w-3 text-purple-400" />
                    Edit Business Info
                  </button>

                  <button
                    onClick={() => setVoiceModalOpen(true)}
                    className="py-1.5 px-3 rounded-none border border-[#303046] hover:bg-[#1e1e2d] text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit Voice & Name
                  </button>
                </div>
              </div>

              {/* Card 2: Inbound Call Script */}
              <div id="scripts" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Inbound Call Script</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">How the AI answers incoming calls.</p>

                  <div className="bg-[#1a1a27] border border-[#2b2b3f] rounded-none p-3 text-xs italic text-slate-300 leading-relaxed relative">
                    "{callSettings?.greeting_inbound || `Thank you for calling ${activeBusinessName}. This is our virtual receptionist. How can I help you today?`}"
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Variables: <code className="text-purple-400">{'{business}'}</code>, <code className="text-purple-400">{'{name}'}</code></span>
                  <button
                    onClick={() => {
                      setInboundScriptText(callSettings?.greeting_inbound || `Thank you for calling ${activeBusinessName}. This is our virtual receptionist. How can I help you today?`);
                      setInboundScriptModalOpen(true);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium px-2 py-1 border border-purple-500/30 hover:bg-purple-950/40 rounded-none transition cursor-pointer"
                  >
                    Edit Script
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Outbound Script + Business Knowledge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 3: Outbound Call Script */}
              <div className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PhoneOutgoing className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Outbound Call Script</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">For follow-ups, reminders, and outreach.</p>

                  <div className="bg-[#1a1a27] border border-[#2b2b3f] rounded-none p-3 text-xs italic text-slate-300 leading-relaxed">
                    "{callSettings?.greeting_outbound || `Hi {first_name}, this is ${activeBusinessName} with a quick reminder about your upcoming appointment on {date} at {time}. Please let us know if you need to reschedule.`}"
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Variables: <code className="text-purple-400">{'{first_name}'}</code>, <code className="text-purple-400">{'{date}'}</code></span>
                  <button
                    onClick={() => {
                      setOutboundScriptText(callSettings?.greeting_outbound || `Hi {first_name}, this is ${activeBusinessName} with a quick reminder about your upcoming appointment on {date} at {time}. Please let us know if you need to reschedule.`);
                      setOutboundScriptModalOpen(true);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium px-2 py-1 border border-purple-500/30 hover:bg-purple-950/40 rounded-none transition cursor-pointer"
                  >
                    Edit Script
                  </button>
                </div>
              </div>

              {/* Card 4: Business Knowledge */}
              <div id="knowledge" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Business Knowledge</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                      <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Key information the AI uses to answer customer questions.</p>

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
                      <span>Common FAQs (new clients/patients, prep, forms)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setKnowledgeText(callSettings?.knowledge_base || '');
                    setKnowledgeModalOpen(true);
                  }}
                  className="mt-4 w-full py-1.5 px-3 rounded-none border border-[#303046] hover:bg-[#1e1e2d] text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="h-3 w-3" />
                  Manage Knowledge Details
                </button>
              </div>
            </div>

            {/* Row 3: Services & Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 5: Services / Appointment Types */}
              <div id="services" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Services / Appointment Types</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />{servicesList.length} Services
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Services, duration, staff, and booking rules.</p>

                <div className="overflow-x-auto max-h-48 scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#232334] pb-1">
                        <th className="pb-1 font-medium">Service</th>
                        <th className="pb-1 font-medium">Duration</th>
                        <th className="pb-1 font-medium">Provider</th>
                        <th className="pb-1 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2c]">
                      {servicesList.map((serv) => (
                        <tr key={serv.id} className="text-slate-200">
                          <td className="py-2 font-medium">{serv.name}</td>
                          <td className="py-2 text-slate-400">{serv.duration_minutes} min</td>
                          <td className="py-2 text-slate-400">{serv.provider_role}</td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingService(serv);
                                  setServiceForm({
                                    name: serv.name,
                                    duration_minutes: serv.duration_minutes,
                                    provider_role: serv.provider_role,
                                    price: serv.price || '',
                                    active: serv.active ?? true,
                                  });
                                  setServiceModalOpen(true);
                                }}
                                className="p-1 hover:text-purple-300 text-slate-400 transition cursor-pointer"
                                title="Edit Service"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setServicesList(servicesList.filter((s) => s.id !== serv.id));
                                }}
                                className="p-1 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => {
                    setEditingService(null);
                    setServiceForm({
                      name: '',
                      duration_minutes: 30,
                      provider_role: 'Specialist',
                      price: '',
                      active: true,
                    });
                    setServiceModalOpen(true);
                  }}
                  className="mt-3 w-full py-1 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-1 border border-purple-500/20 hover:bg-purple-950/30 rounded-none transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Service
                </button>
              </div>

              {/* Card 6: Staff / Teams */}
              <div id="staff" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Staff / Teams</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />{staffList.length} Members
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">People and teams the AI can route to or schedule with.</p>

                <div className="space-y-2 text-xs max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between p-2.5 rounded-none bg-[#191926] border border-[#252538]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-none bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-xs">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.role} {staff.department ? `• ${staff.department}` : ''}</div>
                          <div className="text-[10px] text-purple-300 font-medium mt-0.5 flex items-center gap-1">
                            <Clock size={10} className="text-purple-400" />
                            {formatStaffSchedule(staff)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStaff(staff);
                            const wh = staff.working_hours || {};
                            setStaffForm({
                              name: staff.name,
                              role: staff.role || 'Specialist',
                              department: staff.department || '',
                              working_days: Array.isArray(staff.working_days) ? staff.working_days : [0, 1, 2, 3, 4],
                              start_hour: wh.start_hour ?? staff.start_hour ?? 9,
                              end_hour: wh.end_hour ?? staff.end_hour ?? 17,
                              active: staff.active ?? true,
                            });
                            setStaffModalOpen(true);
                          }}
                          className="p-1.5 hover:text-purple-300 text-slate-400 transition cursor-pointer"
                          title="Edit Member & Schedule"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (staff.id && !staff.id.toString().startsWith('staff_')) {
                              smartflowApi.deleteProvider(staff.id).catch(() => {});
                            }
                            setStaffList(staffList.filter((s) => s.id !== staff.id));
                          }}
                          className="p-1.5 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setStaffForm({
                      name: '',
                      role: 'Specialist',
                      department: 'Intake & Scheduling',
                      working_days: [0, 1, 2, 3, 4],
                      start_hour: 9,
                      end_hour: 17,
                      active: true,
                    });
                    setStaffModalOpen(true);
                  }}
                  className="mt-3 w-full py-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-1 border border-purple-500/20 hover:bg-purple-950/30 rounded-none transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Team Member
                </button>
              </div>
            </div>

            {/* Row 4: CONDITIONAL SECTION (Adapts by Business Type) */}
            {isHealthcare && (
              <div id="insurance" className="bg-[#14141f] border border-[#2e2640] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Insurance (Healthcare Only)</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
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
                        <th className="pb-1 font-medium text-right">Actions</th>
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
                            <span className={`px-2 py-0.5 rounded-none text-[10px] font-medium ${
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setInsurancePlans(insurancePlans.map((p) => p.id === plan.id ? { ...p, active: !p.active } : p));
                                }}
                                className={`px-2 py-0.5 text-[10px] rounded-none font-medium cursor-pointer ${
                                  plan.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {plan.active ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPlan(plan);
                                  setInsuranceForm({
                                    payer: plan.payer,
                                    plan_name: plan.plan_name || 'PPO',
                                    network_status: plan.network_status || 'in_network',
                                    verification_required: plan.verification_required ?? true,
                                    active: plan.active ?? true,
                                  });
                                  setInsuranceModalOpen(true);
                                }}
                                className="p-1 hover:text-purple-300 text-slate-400 transition cursor-pointer"
                                title="Edit Plan"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setInsurancePlans(insurancePlans.filter((p) => p.id !== plan.id));
                                }}
                                className="p-1 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                                title="Delete Plan"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setInsuranceForm({
                      payer: '',
                      plan_name: 'PPO',
                      network_status: 'in_network',
                      verification_required: true,
                      active: true,
                    });
                    setInsuranceModalOpen(true);
                  }}
                  className="mt-3 w-full py-1 text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-center gap-1 border border-purple-500/20 hover:bg-purple-950/30 rounded-none transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Insurance Plan
                </button>
              </div>
            )}

            {isLawFirm && (
              <div id="legal" className="bg-[#14141f] border border-[#2e2640] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Legal Intake & Practice Areas</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Law Firm Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Intake screening parameters, conflict checking rules, and practice areas.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#181827] border border-[#252538] rounded-none space-y-2">
                    <div className="font-medium text-slate-200">Active Practice Areas</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Personal Injury', 'Family Law & Divorce', 'Business Law', 'Estate Planning', 'Criminal Defense'].map((area) => (
                        <span key={area} className="px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 text-[11px]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#181827] border border-[#252538] rounded-none space-y-2">
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
              <div id="dispatch" className="bg-[#14141f] border border-[#2e2640] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Service Area & Dispatch</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Home Services Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Coverage radius, ZIP codes, and technician dispatch rates.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Service Radius</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">25 Miles</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Diagnostic Fee</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">$89 (Waived)</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Emergency Dispatch</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">$149 Fee</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Primary ZIPs</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">10001 - 10016</div>
                  </div>
                </div>
              </div>
            )}

            {isDealership && (
              <div id="dealership" className="bg-[#14141f] border border-[#2e2640] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Dealership & Inventory Rules</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Car Dealership Only
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Driver License Req</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Yes (Before Test Drive)</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Trade-In Appraisal</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Physical Inspection</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Min Age (Test Drive)</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">18+ with Insurance</div>
                  </div>
                </div>
              </div>
            )}

            {isAccounting && (
              <div id="accounting" className="bg-[#14141f] border border-[#2e2640] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Tax Filing & Portal Policies</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Accounting & Tax Only
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Tax Season Cutoff</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">April 15 / Oct 15</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">IRS Notice Review</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Priority Partner Queue</div>
                  </div>
                  <div className="p-3 bg-[#181827] rounded-none border border-[#26263a]">
                    <div className="text-slate-400">Document Upload</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">Instant SMS Portal Link</div>
                  </div>
                </div>
              </div>
            )}

            {/* Row 5: Routing & Call Handling */}
            <div id="routing" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Routing & Call Handling</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-none bg-[#181827] border border-[#262638]">
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
            <div id="permissions" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Permissions (What the AI Can Do)</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                      className={`w-9 h-5 rounded-none transition-colors relative cursor-pointer ${permissions[item.key] ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3.5 h-3.5 rounded-none bg-white transition-transform ${permissions[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 7: Intents & Phrases */}
            <div id="phrases" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">Intents & Phrases</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                      <td className="py-2 font-medium">New Patient / Client</td>
                      <td className="py-2 text-slate-400">"I'm a new patient", "how do I get started?", "first time visit"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Custom Phrases Chips */}
              <div className="pt-3 border-t border-[#232334]">
                <div className="text-xs font-medium text-slate-300 mb-2">Custom Phrases / Additional Recognition Phrases</div>
                <div className="flex flex-wrap items-center gap-2">
                  {customPhrases.map((phrase) => (
                    <span key={phrase} className="px-3 py-1 rounded-none text-xs bg-purple-950/60 text-purple-200 border border-purple-800/80 flex items-center gap-1.5">
                      <span>"{phrase}"</span>
                      <button onClick={() => removePhrase(phrase)} className="hover:text-rose-400 cursor-pointer">
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
                      className="bg-[#1a1a27] text-white text-xs px-2.5 py-1 rounded-none border border-[#34344d] focus:outline-none focus:border-purple-500 w-32"
                    />
                    <button
                      onClick={addPhrase}
                      className="p-1 rounded-none bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 8: 4 Compact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* After-Hours & Emergency */}
              <div id="after-hours" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">After-Hours & Emergency</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                      <span key={kw} className="px-2 py-0.5 rounded-none text-[10px] bg-red-950/60 text-red-300 border border-red-900/60">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure Payments */}
              <div id="payments" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-400" />
                      <h3 className="font-semibold text-sm text-white">Secure Payments</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                        className="rounded-none border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
                      />
                      <span>Discuss invoice or balance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentsConfig.send_payment_link}
                        onChange={(e) => setPaymentsConfig({ ...paymentsConfig, send_payment_link: e.target.checked })}
                        className="rounded-none border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
                      />
                      <span>Send secure payment link (SMS / Email)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentsConfig.confirm_payment_received}
                        onChange={(e) => setPaymentsConfig({ ...paymentsConfig, confirm_payment_received: e.target.checked })}
                        className="rounded-none border-[#34344e] text-purple-600 focus:ring-0 bg-[#1c1c2b]"
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
              <div id="recording" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Disc className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Recording & Transcription</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Call recording and transcription settings.</p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Record calls (with disclosure)</span>
                    <button
                      onClick={() => setRecordingConfig({ ...recordingConfig, record_calls: !recordingConfig.record_calls })}
                      className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${recordingConfig.record_calls ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${recordingConfig.record_calls ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Generate transcripts</span>
                    <button
                      onClick={() => setRecordingConfig({ ...recordingConfig, generate_transcripts: !recordingConfig.generate_transcripts })}
                      className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${recordingConfig.generate_transcripts ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${recordingConfig.generate_transcripts ? 'translate-x-4' : 'translate-x-0.5'}`} />
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
              <div id="consent" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-white">Consent & Outbound Calling</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
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
                      className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${consentConfig.require_consent ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${consentConfig.require_consent ? 'translate-x-4' : 'translate-x-0.5'}`} />
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
            <div id="crm" className="bg-[#14141f] border border-[#242436] rounded-none p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderCheck className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-sm text-white">CRM & Lead Behavior</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Configured
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">How calls create and update customer records.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#202030]">
                  <span className="text-slate-300">Create lead only for new prospects</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, create_new_lead_unknown: !crmLeadConfig.create_new_lead_unknown })}
                    className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${crmLeadConfig.create_new_lead_unknown ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${crmLeadConfig.create_new_lead_unknown ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#202030]">
                  <span className="text-slate-300">Update existing contacts (if identified)</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, update_existing_contacts: !crmLeadConfig.update_existing_contacts })}
                    className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${crmLeadConfig.update_existing_contacts ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${crmLeadConfig.update_existing_contacts ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-300">Tag and source: AI Receptionist</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, tag_source_receptionist: !crmLeadConfig.tag_source_receptionist })}
                    className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${crmLeadConfig.tag_source_receptionist ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${crmLeadConfig.tag_source_receptionist ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-300">Avoid duplicate contacts</span>
                  <button
                    onClick={() => setCrmLeadConfig({ ...crmLeadConfig, avoid_duplicates: !crmLeadConfig.avoid_duplicates })}
                    className={`w-8 h-4 rounded-none transition-colors relative cursor-pointer ${crmLeadConfig.avoid_duplicates ? 'bg-purple-600' : 'bg-slate-700'}`}
                  >
                    <span className={`block w-3 h-3 rounded-none bg-white transition-transform ${crmLeadConfig.avoid_duplicates ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Test Receptionist Panel (4 cols on lg) */}
          <div id="test-panel" className="lg:col-span-4">
            <div className="sticky top-24 bg-[#141421] border border-[#2b2b40] rounded-none p-5 shadow-2xl flex flex-col h-[calc(100vh-130px)]">
              {/* Header */}
              <div className="pb-3 border-b border-[#252538]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-400" />
                    <h3 className="font-bold text-base text-white">Test AI Receptionist</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-none bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                    Live Simulator
                  </span>
                </div>
                <p className="text-xs text-slate-400">Try a real conversation with {activeBusinessName}'s assistant.</p>

                {/* Mode Tabs */}
                <div className="flex items-center gap-2 mt-3 bg-[#1b1b2a] p-1 rounded-none">
                  <button
                    onClick={() => setSimulatorMode('call')}
                    className={`flex-1 py-1.5 rounded-none text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                    className={`flex-1 py-1.5 rounded-none text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                  <div className="bg-[#1b1b2a] border border-[#303046] rounded-none p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#27273a]">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Test Result
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Success
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Detected Intent:</span>
                        <span className="font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-none text-[11px] border border-purple-800/60">
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
                      <div className="mt-1 bg-[#151522] p-2.5 rounded-none border border-[#252538] text-slate-200 text-xs italic leading-relaxed">
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
                        className="w-full p-2.5 rounded-none bg-[#181827] hover:bg-[#202033] border border-[#252538] hover:border-purple-500/40 text-left text-xs transition flex items-center justify-between group cursor-pointer"
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
                        className={`p-2.5 rounded-none text-xs ${
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
                    placeholder={`Ask ${callSettings?.assistant_name || 'Sarah'} anything about ${activeBusinessName}...`}
                    className="flex-1 bg-[#1c1c2b] text-white text-xs px-3 py-2.5 rounded-none border border-[#35354e] focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={testSending || !testQueryInput.trim()}
                    className="p-2.5 rounded-none bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-md shadow-purple-900/30 cursor-pointer"
                  >
                    {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          1. EDIT BUSINESS PROFILE & HOURS MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {businessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Edit Business Profile & Operating Hours</h3>
                </div>
                <button onClick={() => setBusinessModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBusinessProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Business Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessForm.business_name}
                    onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                    placeholder="e.g. Acme Legal Counsel, Sunrise Dental Clinic"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This name is dynamically used by the AI receptionist on every call and greeting.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      value={businessForm.phone_number}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone_number: e.target.value })}
                      placeholder="e.g. (555) 234-5678"
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                    <input
                      type="text"
                      value={businessForm.website}
                      onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                      placeholder="e.g. https://mybusiness.com"
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Physical Address / Office Location</label>
                  <textarea
                    rows={2}
                    value={businessForm.office_address_text}
                    onChange={(e) => setBusinessForm({ ...businessForm, office_address_text: e.target.value })}
                    placeholder="e.g. 742 Evergreen Terrace, Suite 300, Springfield, IL 62704"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Operating Hours Configuration */}
                <div className="p-3.5 bg-[#1b1b2a] border border-[#2b2b3f] space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                    <Clock className="h-4 w-4" />
                    <span>Operating Schedule for AI Call Handling</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Days of Operation</label>
                      <select
                        value={businessForm.days_type}
                        onChange={(e) => setBusinessForm({ ...businessForm, days_type: e.target.value })}
                        className="w-full bg-[#14141f] text-white px-2.5 py-1.5 rounded-none border border-[#35354e] focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="mon_fri">Mon - Fri (Standard)</option>
                        <option value="mon_sat">Mon - Sat (6 Days)</option>
                        <option value="all_week">Every Day (7 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Opens At</label>
                      <select
                        value={businessForm.start_hour}
                        onChange={(e) => setBusinessForm({ ...businessForm, start_hour: Number(e.target.value) })}
                        className="w-full bg-[#14141f] text-white px-2.5 py-1.5 rounded-none border border-[#35354e] focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {[7, 8, 9, 10].map((h) => (
                          <option key={h} value={h}>{h}:00 AM</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Closes At</label>
                      <select
                        value={businessForm.end_hour}
                        onChange={(e) => setBusinessForm({ ...businessForm, end_hour: Number(e.target.value) })}
                        className="w-full bg-[#14141f] text-white px-2.5 py-1.5 rounded-none border border-[#35354e] focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {[16, 17, 18, 19, 20].map((h) => (
                          <option key={h} value={h}>{h - 12}:00 PM</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#252538]">
                  <button
                    type="button"
                    onClick={() => setBusinessModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Business Info
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          2. EDIT INBOUND CALL SCRIPT MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {inboundScriptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-xl w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Edit Inbound Call Script</h3>
                </div>
                <button onClick={() => setInboundScriptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-medium">Greeting Text</label>
                    <span className="text-[11px] text-slate-500">{inboundScriptText.length} characters</span>
                  </div>
                  <textarea
                    rows={4}
                    value={inboundScriptText}
                    onChange={(e) => setInboundScriptText(e.target.value)}
                    placeholder={`Thank you for calling ${activeBusinessName}. This is our virtual receptionist. How can I help you today?`}
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2.5 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                  />
                </div>

                {/* Quick Variable Insert Tags */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Click to insert dynamic variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{business}', label: 'Business Name', val: activeBusinessName },
                      { tag: '{name}', label: 'AI Name', val: callSettings?.assistant_name || 'Sarah' },
                      { tag: '{hours}', label: 'Operating Hours', val: activeBusinessHours },
                      { tag: '{phone}', label: 'Phone', val: activeBusinessPhone },
                    ].map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => setInboundScriptText((prev) => `${prev} ${v.tag}`)}
                        className="px-2 py-0.5 bg-[#202030] hover:bg-purple-950/60 border border-[#35354e] hover:border-purple-500 text-purple-300 rounded-none text-[11px] font-mono cursor-pointer transition"
                      >
                        + {v.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Audition Preview */}
                <div className="p-3 bg-[#181827] border border-[#2b2b3f] space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Caller Audition Preview</span>
                  <p className="text-xs italic text-slate-300 leading-relaxed">
                    "{inboundScriptText
                      .replace(/\{business\}/g, activeBusinessName)
                      .replace(/\{name\}/g, callSettings?.assistant_name || 'Sarah')
                      .replace(/\{hours\}/g, activeBusinessHours)
                      .replace(/\{phone\}/g, activeBusinessPhone)}"
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-[#252538]">
                <button
                  type="button"
                  onClick={() => {
                    setInboundScriptText(`Thank you for calling ${activeBusinessName}. This is our virtual receptionist ${callSettings?.assistant_name || 'Sarah'}. How can I assist you today?`);
                  }}
                  className="text-xs text-slate-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Reset to Default Template
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInboundScriptModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCallSettings((prev) => ({ ...prev, greeting_inbound: inboundScriptText }));
                      setInboundScriptModalOpen(false);
                    }}
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    Save Inbound Script
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          3. EDIT OUTBOUND CALL SCRIPT MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {outboundScriptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-xl w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Edit Outbound Call Script</h3>
                </div>
                <button onClick={() => setOutboundScriptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-medium">Outbound Reminder / Follow-up Script</label>
                    <span className="text-[11px] text-slate-500">{outboundScriptText.length} characters</span>
                  </div>
                  <textarea
                    rows={4}
                    value={outboundScriptText}
                    onChange={(e) => setOutboundScriptText(e.target.value)}
                    placeholder={`Hi {first_name}, this is ${activeBusinessName} with a quick reminder about your appointment on {date} at {time}. Please let us know if you need to reschedule.`}
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2.5 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                  />
                </div>

                {/* Variable chips */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Click to insert dynamic variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{first_name}', label: 'Client First Name' },
                      { tag: '{business}', label: 'Business Name' },
                      { tag: '{date}', label: 'Appointment Date' },
                      { tag: '{time}', label: 'Appointment Time' },
                      { tag: '{service}', label: 'Service Name' },
                    ].map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => setOutboundScriptText((prev) => `${prev} ${v.tag}`)}
                        className="px-2 py-0.5 bg-[#202030] hover:bg-purple-950/60 border border-[#35354e] hover:border-purple-500 text-purple-300 rounded-none text-[11px] font-mono cursor-pointer transition"
                      >
                        + {v.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-3 bg-[#181827] border border-[#2b2b3f] space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Caller Audition Preview</span>
                  <p className="text-xs italic text-slate-300 leading-relaxed">
                    "{outboundScriptText
                      .replace(/\{first_name\}/g, 'Alex')
                      .replace(/\{business\}/g, activeBusinessName)
                      .replace(/\{date\}/g, 'tomorrow')
                      .replace(/\{time\}/g, '2:30 PM')
                      .replace(/\{service\}/g, 'Consultation')}"
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-[#252538]">
                <button
                  type="button"
                  onClick={() => {
                    setOutboundScriptText(`Hi {first_name}, this is ${activeBusinessName} with a quick reminder about your appointment on {date} at {time}. Please let us know if you need to reschedule.`);
                  }}
                  className="text-xs text-slate-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Reset to Default Template
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOutboundScriptModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCallSettings((prev) => ({ ...prev, greeting_outbound: outboundScriptText }));
                      setOutboundScriptModalOpen(false);
                    }}
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    Save Outbound Script
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          4. MANAGE BUSINESS KNOWLEDGE & POLICIES MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {knowledgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Manage Business Knowledge & FAQs</h3>
                </div>
                <button onClick={() => setKnowledgeModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                The AI receptionist answers caller questions strictly from this knowledge base, your services list, and active business hours.
              </p>

              {/* Template Quick Insert Helpers */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-medium">Quick-Add Standard Sections:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n\n[LOCATION & PARKING]\nWe are located at ${activeBusinessAddress || '742 Evergreen Terrace'}. Free parking is available in the rear lot, and street parking is available along the front.`;
                      setKnowledgeText((prev) => prev + snippet);
                    }}
                    className="px-2.5 py-1 bg-[#1d1d2b] hover:bg-purple-950/60 border border-[#33334c] hover:border-purple-500 text-purple-300 rounded-none text-xs cursor-pointer transition"
                  >
                    + Parking & Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n\n[CANCELLATION POLICY]\nWe require at least 24 hours notice for any appointment cancellations or reschedules. Late cancellations with less than 24 hours notice may incur a standard $50 rebooking fee.`;
                      setKnowledgeText((prev) => prev + snippet);
                    }}
                    className="px-2.5 py-1 bg-[#1d1d2b] hover:bg-purple-950/60 border border-[#33334c] hover:border-purple-500 text-purple-300 rounded-none text-xs cursor-pointer transition"
                  >
                    + Cancellation Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n\n[PAYMENT & PRICING]\nWe accept major credit cards (Visa, MasterCard, Amex), debit cards, and secure online SMS checkout links. We also offer flexible in-house payment options.`;
                      setKnowledgeText((prev) => prev + snippet);
                    }}
                    className="px-2.5 py-1 bg-[#1d1d2b] hover:bg-purple-950/60 border border-[#33334c] hover:border-purple-500 text-purple-300 rounded-none text-xs cursor-pointer transition"
                  >
                    + Payment & Pricing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n\n[NEW CLIENT INTAKE]\nNew clients should arrive 10 minutes prior to their scheduled appointment to verify registration, or complete our quick mobile intake link sent by SMS.`;
                      setKnowledgeText((prev) => prev + snippet);
                    }}
                    className="px-2.5 py-1 bg-[#1d1d2b] hover:bg-purple-950/60 border border-[#33334c] hover:border-purple-500 text-purple-300 rounded-none text-xs cursor-pointer transition"
                  >
                    + New Client Intake
                  </button>
                </div>
              </div>

              {/* Large Knowledge Base Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-medium text-xs">Knowledge Base & Custom Rules</label>
                  <span className="text-[11px] text-slate-500">{knowledgeText.length} / 8000 chars</span>
                </div>
                <textarea
                  rows={10}
                  value={knowledgeText}
                  onChange={(e) => setKnowledgeText(e.target.value)}
                  placeholder="Enter business policies, detailed FAQs, directions, pricing notes, or special instructions here..."
                  className="w-full bg-[#1b1b2a] text-white px-3 py-2.5 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500 leading-relaxed font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#252538]">
                <button
                  type="button"
                  onClick={() => setKnowledgeModalOpen(false)}
                  className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCallSettings((prev) => ({ ...prev, knowledge_base: knowledgeText }));
                    setKnowledgeModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                >
                  Save Knowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          5. ADD / EDIT SERVICE MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {serviceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                </div>
                <button onClick={() => setServiceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!serviceForm.name.trim()) return;
                  if (editingService) {
                    setServicesList(servicesList.map((s) => (s.id === editingService.id ? { ...s, ...serviceForm } : s)));
                  } else {
                    setServicesList([
                      ...servicesList,
                      {
                        id: `serv_${Date.now()}`,
                        ...serviceForm,
                      },
                    ]);
                  }
                  setServiceModalOpen(false);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Service Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g. Routine Cleaning, Case Review, AC Diagnostic"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Duration (Minutes)</label>
                    <select
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes (1 hr)</option>
                      <option value={90}>90 Minutes (1.5 hr)</option>
                      <option value={120}>120 Minutes (2 hr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Standard Price ($)</label>
                    <input
                      type="text"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      placeholder="e.g. 129 or Waived"
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Provider / Role</label>
                  <input
                    type="text"
                    value={serviceForm.provider_role}
                    onChange={(e) => setServiceForm({ ...serviceForm, provider_role: e.target.value })}
                    placeholder="e.g. Dentist (Any), Senior Litigator, Lead Tech"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#1b1b2a] border border-[#2b2b40]">
                  <span className="text-slate-300">Active for Online & Voice Booking</span>
                  <input
                    type="checkbox"
                    checked={serviceForm.active}
                    onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                    className="rounded-none text-purple-600 focus:ring-0 bg-[#14141f] border-[#35354e] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#252538]">
                  <button
                    type="button"
                    onClick={() => setServiceModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    {editingService ? 'Save Service' : 'Add Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          6. ADD / EDIT STAFF MEMBER MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {staffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">
                    {editingStaff ? 'Edit Team Member' : 'Add Team Member'}
                  </h3>
                </div>
                <button onClick={() => setStaffModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!staffForm.name.trim()) return;
                  const providerPayload = {
                    name: staffForm.name.trim(),
                    role_title: staffForm.role?.trim() || null,
                    working_days: staffForm.working_days,
                    working_hours: {
                      start_hour: parseInt(staffForm.start_hour, 10),
                      end_hour: parseInt(staffForm.end_hour, 10),
                    },
                  };

                  if (editingStaff) {
                    if (editingStaff.id && !editingStaff.id.toString().startsWith('staff_')) {
                      smartflowApi.updateProvider(editingStaff.id, providerPayload).catch(console.error);
                    }
                    setStaffList(
                      staffList.map((st) =>
                        st.id === editingStaff.id
                          ? {
                              ...st,
                              ...staffForm,
                              working_hours: providerPayload.working_hours,
                            }
                          : st
                      )
                    );
                  } else {
                    const tempId = `staff_${Date.now()}`;
                    smartflowApi
                      .createProvider(providerPayload)
                      .then((res) => {
                        const created = res?.data?.data;
                        if (created?.id) {
                          setStaffList((prev) =>
                            prev.map((item) => (item.id === tempId ? { ...item, id: created.id } : item))
                          );
                        }
                      })
                      .catch(console.error);

                    setStaffList([
                      ...staffList,
                      {
                        id: tempId,
                        ...staffForm,
                        working_hours: providerPayload.working_hours,
                      },
                    ]);
                  }
                  setStaffModalOpen(false);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Staff / Team Member Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="e.g. Dr. Emily Smith, Ahmad (Hygienist), Arthur Vance"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    placeholder="e.g. Dental Hygienist, Lead Dentist, Physician Specialist"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department / Routing Tag</label>
                  <input
                    type="text"
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    placeholder="e.g. Dental Care, Hygiene, Consultations"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Working Days Selector */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Working Days & Available Schedule
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = staffForm.working_days?.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const current = staffForm.working_days || [];
                            const updated = isSelected
                              ? current.filter((d) => d !== day.id)
                              : [...current, day.id].sort((a, b) => a - b);
                            setStaffForm({ ...staffForm, working_days: updated });
                          }}
                          className={`py-1.5 text-center text-[11px] font-semibold transition border rounded-none cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-[#1b1b2a] border-[#303046] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Configure contractor days (e.g. Mon & Wed for hygienists). The AI will verify these days when scheduling.
                  </p>
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Start Hour</label>
                    <select
                      value={staffForm.start_hour ?? 9}
                      onChange={(e) => setStaffForm({ ...staffForm, start_hour: parseInt(e.target.value, 10) })}
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    >
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
                        <option key={hour} value={hour}>
                          {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">End Hour</label>
                    <select
                      value={staffForm.end_hour ?? 17}
                      onChange={(e) => setStaffForm({ ...staffForm, end_hour: parseInt(e.target.value, 10) })}
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    >
                      {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                        <option key={hour} value={hour}>
                          {hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#1b1b2a] border border-[#2b2b40]">
                  <span className="text-slate-300">Active for Call Transfers & Routing</span>
                  <input
                    type="checkbox"
                    checked={staffForm.active}
                    onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                    className="rounded-none text-purple-600 focus:ring-0 bg-[#14141f] border-[#35354e] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#252538]">
                  <button
                    type="button"
                    onClick={() => setStaffModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    {editingStaff ? 'Save Member' : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          7. ADD / EDIT INSURANCE PLAN MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {insuranceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">
                    {editingPlan ? 'Edit Insurance Plan' : 'Add Accepted Insurance Plan'}
                  </h3>
                </div>
                <button onClick={() => setInsuranceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!insuranceForm.payer.trim()) return;
                  if (editingPlan) {
                    setInsurancePlans(insurancePlans.map((p) => (p.id === editingPlan.id ? { ...p, ...insuranceForm } : p)));
                  } else {
                    setInsurancePlans([
                      ...insurancePlans,
                      {
                        id: `ins_${Date.now()}`,
                        ...insuranceForm,
                      },
                    ]);
                  }
                  setInsuranceModalOpen(false);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Insurance Payer / Carrier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={insuranceForm.payer}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, payer: e.target.value })}
                    placeholder="e.g. Delta Dental, Aetna, Blue Cross Blue Shield"
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Plan / Type</label>
                    <input
                      type="text"
                      value={insuranceForm.plan_name}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, plan_name: e.target.value })}
                      placeholder="e.g. PPO, Premier, HMO"
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Network Status</label>
                    <select
                      value={insuranceForm.network_status}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, network_status: e.target.value })}
                      className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="in_network">In-Network</option>
                      <option value="plan_dependent">Plan Dependent</option>
                      <option value="out_of_network">Out-of-Network</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#1b1b2a] border border-[#2b2b40]">
                  <span className="text-slate-300">Requires Eligibility Verification</span>
                  <input
                    type="checkbox"
                    checked={insuranceForm.verification_required}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, verification_required: e.target.checked })}
                    className="rounded-none text-purple-600 focus:ring-0 bg-[#14141f] border-[#35354e] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#252538]">
                  <button
                    type="button"
                    onClick={() => setInsuranceModalOpen(false)}
                    className="px-4 py-2 rounded-none border border-[#35354e] hover:bg-[#202033] text-slate-300 font-medium text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer shadow-lg shadow-purple-900/40"
                  >
                    {editingPlan ? 'Save Plan' : 'Add Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          8. TEMPLATE PICKER MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {templateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">Select Business Industry Template</h3>
                </div>
                <button onClick={() => setTemplateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Choose your industry to automatically load standard intents, service categories, staff roles, and phrasing.
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
                      className={`p-3.5 rounded-none border text-left transition flex flex-col justify-between cursor-pointer ${
                        selectedIndustry === tmpl.key
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-900/20'
                          : 'bg-[#1a1a29] border-[#29293e] hover:border-[#3d3d5c] hover:bg-[#202033]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-none bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
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

      {/* ══════════════════════════════════════════════════════════════════════
          9. VOICE & PERSONA MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {voiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151522] border border-[#2b2b40] rounded-none max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-base text-white">AI Voice & Persona Setup</h3>
                </div>
                <button onClick={() => setVoiceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
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
                    className="w-full bg-[#1b1b2a] text-white px-3 py-2 rounded-none border border-[#303046] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">Select Voice</label>
                  <div className="space-y-2">
                    {VOICE_OPTIONS.map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => setCallSettings({ ...callSettings, voice_id: voice.id })}
                        className={`p-3 rounded-none border cursor-pointer transition flex items-center justify-between ${
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

              <div className="pt-3 flex justify-end gap-2 border-t border-[#252538]">
                <button
                  onClick={() => setVoiceModalOpen(false)}
                  className="px-5 py-2 rounded-none bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer"
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
