import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Bookmark,
  FileText,
  Copy,
  Check,
  Trash2,
  Layers,
  Search,
  PenSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { smartflowApi } from "../api/services";
import { formatCstDateTime } from "../utils/dateUtils";
import { DateTimePickerInput } from "../components/ui/DateTimeInputs";
import { useLanguage } from "../context/LanguageContext";

const PUBLISHABLE_PLATFORM_MAP = {
  facebook_messenger: {
    publishId: "facebook",
    label: "Facebook",
    accent: "#1877F2",
  },
  instagram: { publishId: "instagram", label: "Instagram", accent: "#E1306C" },
  linkedin: { publishId: "linkedin", label: "LinkedIn", accent: "#0A66C2" },
  twitter_x: { publishId: "x", label: "X", accent: "#FFFFFF" },
  threads: { publishId: "threads", label: "Threads", accent: "#e6e6e6" },
  draft: { publishId: "draft", label: "Saved Draft", accent: "#a855f7" },
};

const INPUT =
  "w-full px-4 py-3 bg-[#0A1019] border border-[#243246] text-white rounded-none outline-none focus:border-[#9333ea]/50 transition-colors text-sm placeholder:text-[#4A5568]";
const LABEL =
  "block text-[#A4B0B7] text-xs font-semibold uppercase tracking-wider mb-1.5";

function formatPlatformLabel(platform) {
  if (platform === "draft") return "Saved Draft";
  return (
    Object.values(PUBLISHABLE_PLATFORM_MAP).find(
      (item) => item.publishId === platform,
    )?.label || platform
  );
}

function summarizePostStatus(results = [], isDraft = false) {
  if (
    isDraft ||
    results.some((r) => r.platform === "draft" || r.status === "draft")
  ) {
    return {
      label: "Saved Draft",
      tone: "text-purple-300 bg-purple-950/40 border-purple-800/40",
    };
  }
  if (!results.length)
    return {
      label: "Unknown",
      tone: "text-[#A4B0B7] bg-[#1A2433] border-[#243041]",
    };
  if (results.every((item) => item.status === "published")) {
    return {
      label: "Published",
      tone: "text-emerald-300 bg-emerald-950/30 border-emerald-800/40",
    };
  }
  if (results.every((item) => item.status === "scheduled")) {
    return {
      label: "Scheduled",
      tone: "text-[#9333ea] bg-[#12303F] border-purple-800/40",
    };
  }
  if (results.some((item) => item.status === "published")) {
    return {
      label: "Partially Failed",
      tone: "text-amber-300 bg-amber-950/30 border-amber-800/40",
    };
  }
  if (results.some((item) => item.status === "not_connected")) {
    return {
      label: "Not Connected",
      tone: "text-rose-300 bg-rose-950/30 border-rose-800/40",
    };
  }
  return {
    label: "Failed",
    tone: "text-rose-300 bg-rose-950/30 border-rose-800/40",
  };
}

export default function CreatePost() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("composer"); // 'composer' | 'library'
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [integrationError, setIntegrationError] = useState("");
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [unsupportedConnectedPlatforms, setUnsupportedConnectedPlatforms] =
    useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [copiedId, setCopiedId] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");

  const characterCount = useMemo(() => content.trim().length, [content]);
  const hasPublishablePlatforms = availablePlatforms.length > 0;

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const response = await smartflowApi.listSocialPosts({
        page: 1,
        page_size: 50,
      });
      setHistory(response.data?.data?.items || response.data?.data || []);
    } catch (error) {
      setHistory([]);
      setHistoryError(
        error.response?.data?.message || "Failed to load social posts.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPlatforms = async () => {
    try {
      setIntegrationLoading(true);
      setIntegrationError("");
      const response = await smartflowApi.getIntegrationStatus();
      const items = response.data?.data?.items || response.data?.data || [];

      const publishable = [];
      const unsupportedConnected = [];

      for (const item of items) {
        const mapping = PUBLISHABLE_PLATFORM_MAP[item.platform];
        if (item.connected && mapping) {
          publishable.push({
            id: mapping.publishId,
            label: mapping.label,
            accent: mapping.accent,
            sourcePlatform: item.platform,
            accountName:
              item.external_account_name ||
              item.platform_label ||
              mapping.label,
          });
        } else if (item.connected && !mapping) {
          unsupportedConnected.push({
            platform: item.platform,
            label: item.platform_label || item.platform,
          });
        }
      }

      setAvailablePlatforms(publishable);
      setUnsupportedConnectedPlatforms(unsupportedConnected);
      setSelectedPlatforms((current) => {
        const valid = current.filter((id) =>
          publishable.some((item) => item.id === id),
        );
        if (valid.length) return valid;
        return publishable[0] ? [publishable[0].id] : [];
      });
    } catch (error) {
      setAvailablePlatforms([]);
      setUnsupportedConnectedPlatforms([]);
      setSelectedPlatforms([]);
      setIntegrationError(
        error.response?.data?.message ||
          "Failed to load connected social accounts.",
      );
    } finally {
      setIntegrationLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
    loadHistory();
  }, []);

  const togglePlatform = (platformId) => {
    setSelectedPlatforms((current) =>
      current.includes(platformId)
        ? current.filter((item) => item !== platformId)
        : [...current, platformId],
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setFeedback({
        type: "error",
        message:
          t("post_err_enter_prompt") ||
          "Please enter a topic or prompt for AI generation.",
      });
      return;
    }

    setGenerating(true);
    setFeedback({ type: "", message: "" });
    try {
      const response = await smartflowApi.aiChat(prompt.trim(), {
        response_mode: "text",
      });
      const generated =
        response.data?.data?.ai_message?.content ||
        response.data?.ai_message?.content ||
        response.data?.data?.response ||
        response.data?.response ||
        "";

      if (!generated) {
        throw new Error("No content returned from AI.");
      }

      setContent(generated);
      setFeedback({
        type: "success",
        message:
          "Social post generated successfully. You can edit, save as draft, or publish it.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Could not generate post content.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      setFeedback({
        type: "error",
        message:
          "Please write or generate post content before saving as a draft.",
      });
      return;
    }

    setSavingDraft(true);
    setFeedback({ type: "", message: "" });
    try {
      await smartflowApi.createSocialPost({
        content: content.trim(),
        platforms: ["draft"],
        is_draft: true,
      });
      setFeedback({
        type: "success",
        message: "Draft saved successfully to your Saved Posts Library.",
      });
      await loadHistory();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Could not save draft.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async (scheduled = false) => {
    if (!content.trim()) {
      setFeedback({
        type: "error",
        message:
          t("post_err_write_content") || "Please provide content to publish.",
      });
      return;
    }
    if (!hasPublishablePlatforms) {
      setFeedback({
        type: "error",
        message:
          t("post_err_connect_account") ||
          "No connected social accounts found. You can save your post as a draft instead.",
      });
      return;
    }
    if (!selectedPlatforms.length) {
      setFeedback({
        type: "error",
        message:
          t("post_err_select_platform") ||
          "Please select at least one platform.",
      });
      return;
    }
    if (scheduled && !scheduleDate) {
      setFeedback({
        type: "error",
        message: t("post_err_choose_date") || "Please select a date and time.",
      });
      return;
    }

    setPublishing(true);
    setFeedback({ type: "", message: "" });
    try {
      const response = await smartflowApi.createSocialPost({
        content: content.trim(),
        platforms: selectedPlatforms,
        media_url: null,
        scheduled_at: scheduled ? new Date(scheduleDate).toISOString() : null,
        is_draft: false,
      });
      const results = response.data?.data?.results || [];
      const successful = results.filter((item) =>
        ["published", "scheduled"].includes(item.status),
      );
      const failed = results.filter(
        (item) => !["published", "scheduled"].includes(item.status),
      );

      if (successful.length && !failed.length) {
        setFeedback({
          type: "success",
          message: scheduled
            ? `Post scheduled for ${formatCstDateTime(scheduleDate)}.`
            : `Posted to ${successful.map((item) => formatPlatformLabel(item.platform)).join(", ")}.`,
        });
      } else if (successful.length) {
        setFeedback({
          type: "success",
          message: `Partial success. Posted to ${successful.map((item) => formatPlatformLabel(item.platform)).join(", ")}.`,
        });
      } else {
        setFeedback({
          type: "error",
          message:
            failed
              .map(
                (item) =>
                  `${formatPlatformLabel(item.platform)}: ${item.error || item.status}`,
              )
              .join(" | ") || "Publishing failed.",
        });
      }

      await loadHistory();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Could not publish your post.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyContent = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post / draft?"))
      return;
    try {
      await smartflowApi.deleteSocialPost(id);
      setHistory((prev) => prev.filter((p) => p.id !== id));
      setFeedback({ type: "success", message: "Post removed from library." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to delete post.",
      });
    }
  };

  const handleEditDraft = (item) => {
    setContent(item.content || "");
    setActiveTab("composer");
    setFeedback({
      type: "success",
      message: "Draft loaded into composer. Edit or publish anytime.",
    });
  };

  const filteredHistory = useMemo(() => {
    if (!searchFilter.trim()) return history;
    const term = searchFilter.toLowerCase();
    return history.filter(
      (item) =>
        item.content?.toLowerCase().includes(term) ||
        item.platforms?.some((p) => p.toLowerCase().includes(term)),
    );
  }, [history, searchFilter]);

  const draftCount = useMemo(() => {
    return history.filter(
      (item) =>
        item.is_draft ||
        item.platforms?.includes("draft") ||
        item.results?.some((r) => r.status === "draft"),
    ).length;
  }, [history]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#243041]/40 pb-4">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t("post_title") || "Social Media Post AI"}
          </h1>
          <p className="text-[#A4B0B7] text-xs mt-1">
            {t("post_subtitle") ||
              "Generate high-converting social posts, save drafts to your library, or publish directly across channels."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0A1019] p-1 border border-[#243246] rounded-none">
          <button
            onClick={() => setActiveTab("composer")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition rounded-none cursor-pointer ${
              activeTab === "composer"
                ? "bg-purple-600 text-white"
                : "text-[#A4B0B7] hover:text-white"
            }`}
          >
            <PenSquare size={14} />
            Post Composer
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition rounded-none cursor-pointer ${
              activeTab === "library"
                ? "bg-purple-600 text-white"
                : "text-[#A4B0B7] hover:text-white"
            }`}
          >
            <Bookmark size={14} />
            Saved Drafts & Library
            {draftCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-purple-950 text-purple-200 border border-purple-400/40 rounded-none">
                {draftCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {feedback.message ? (
        <div
          className={`rounded-none border px-4 py-3 text-sm flex items-center justify-between ${
            feedback.type === "error"
              ? "border-rose-500/30 bg-rose-950/30 text-rose-300"
              : "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {integrationError ? (
        <div className="rounded-none border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {integrationError}
        </div>
      ) : null}

      {unsupportedConnectedPlatforms.length ? (
        <div className="rounded-none border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          Connected but unavailable for automated direct posting:{" "}
          {unsupportedConnectedPlatforms.map((item) => item.label).join(", ")}.
          Use Saved Drafts to copy and paste manually.
        </div>
      ) : null}

      {/* VIEW 1: COMPOSER & SCHEDULER */}
      {activeTab === "composer" && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="bg-[#131A24] border border-[#243041] rounded-none p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#9333ea]" />
                <h2 className="text-white font-bold">
                  {t("post_hdr_ai") || "AI Post Generator"}
                </h2>
              </div>

              <div>
                <label className={LABEL}>
                  {t("post_lbl_prompt") || "Prompt / Idea"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    t("post_ph_prompt") ||
                    "e.g. Write a friendly reminder for oral hygiene month with tips for flossing and special booking discount..."
                  }
                  className={`${INPUT} min-h-24 resize-none`}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-none bg-[#9333ea] hover:bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {t("post_btn_generate") || "Generate Post Content"}
                </button>
              </div>
            </div>

            <div className="bg-[#131A24] border border-[#243041] rounded-none p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold">
                  {t("post_hdr_content") || "Post Content"}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#A4B0B7]">
                    {characterCount} {t("post_characters") || "characters"}
                  </span>
                  {content.trim() && (
                    <button
                      type="button"
                      onClick={() => handleCopyContent(content, "composer")}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === "composer" ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedId === "composer" ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  t("post_ph_content") ||
                  "Write or refine your post content here..."
                }
                className={`${INPUT} min-h-56 resize-none`}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={LABEL}>
                    {t("post_lbl_platforms") || "Target Social Platforms"}
                  </label>
                  {!hasPublishablePlatforms && (
                    <span className="text-[11px] text-amber-400">
                      No connected social channels. Save as draft to copy
                      manually.
                    </span>
                  )}
                </div>

                {integrationLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[#A4B0B7]">
                    <Loader2 size={16} className="animate-spin" />
                    {t("post_loading_accounts") ||
                      "Checking connected channels..."}
                  </div>
                ) : hasPublishablePlatforms ? (
                  <div className="flex flex-wrap gap-2">
                    {availablePlatforms.map((platform) => {
                      const active = selectedPlatforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => togglePlatform(platform.id)}
                          className={`rounded-none border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? "border-[#9333ea] bg-[#9333ea]/20 text-white"
                              : "border-[#243246] bg-[#0A1019] text-[#A4B0B7]"
                          }`}
                          title={platform.accountName}
                        >
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-none"
                            style={{ backgroundColor: platform.accent }}
                          />
                          {platform.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-none border border-[#243246] bg-[#0A1019] px-3 py-2 text-xs text-[#A4B0B7]">
                    <AlertCircle size={14} className="text-amber-400" />
                    {t("post_no_platforms_short") ||
                      "Direct publishing requires connected social accounts in Integrations."}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#243041] grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Save Draft Button */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !content.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-none border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 px-4 py-2.5 text-xs font-extrabold text-purple-200 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  title="Save post to your drafts library to copy and manage anytime"
                >
                  {savingDraft ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Bookmark size={14} />
                  )}
                  Save as Draft
                </button>

                {/* Publish Now */}
                <button
                  type="button"
                  onClick={() => handlePublish(false)}
                  disabled={
                    publishing || !hasPublishablePlatforms || !content.trim()
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-none bg-[#9333ea] hover:bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {publishing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {t("post_btn_publish_now") || "Publish Now"}
                </button>

                {/* Schedule Picker */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <DateTimePickerInput
                      value={scheduleDate}
                      onChange={setScheduleDate}
                      className="focus:border-[#9333ea]/50 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePublish(true)}
                    disabled={
                      publishing ||
                      !hasPublishablePlatforms ||
                      !scheduleDate ||
                      !content.trim()
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-none border border-[#243246] bg-[#0A1019] hover:bg-[#15202b] px-3 py-2.5 text-xs font-extrabold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <CalendarClock size={14} />
                    {t("post_btn_schedule") || "Schedule"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recent Activity Sidebar */}
          <div className="bg-[#131A24] border border-[#243041] rounded-none p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                Recent Posts & Drafts
              </h2>
              <button
                type="button"
                onClick={loadHistory}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#9333ea] hover:text-purple-300 cursor-pointer"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center gap-2 rounded-none border border-[#243041] bg-[#0A1019] p-4 text-xs text-[#A4B0B7]">
                <Loader2 size={14} className="animate-spin" />
                Loading post history...
              </div>
            ) : historyError ? (
              <div className="rounded-none border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300">
                {historyError}
              </div>
            ) : history.length ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {history.slice(0, 5).map((item) => {
                  const status = summarizePostStatus(
                    item.results,
                    item.is_draft,
                  );
                  return (
                    <div
                      key={item.id}
                      className="rounded-none border border-[#243041] bg-[#0A1019] p-3.5 text-left space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.tone}`}
                        >
                          {status.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleCopyContent(item.content, item.id)
                            }
                            className="p-1 text-slate-400 hover:text-purple-300 cursor-pointer"
                            title="Copy text"
                          >
                            {copiedId === item.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditDraft(item)}
                            className="p-1 text-slate-400 hover:text-purple-300 cursor-pointer"
                            title="Edit in composer"
                          >
                            <PenSquare size={12} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-white line-clamp-3">
                        {item.content}
                      </p>

                      <div className="text-[10px] text-[#A4B0B7] pt-1 border-t border-[#1c2736] flex items-center justify-between">
                        <span>{formatCstDateTime(item.created_at)}</span>
                        {item.results?.map((r, i) => (
                          <span key={i} className="text-purple-400 font-mono">
                            {formatPlatformLabel(r.platform)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-none border border-dashed border-[#243041] bg-[#0A1019] p-6 text-center text-xs text-[#A4B0B7]">
                No posts or saved drafts yet. Generate or compose one above!
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED SAVED DRAFTS & POSTS LIBRARY */}
      {activeTab === "library" && (
        <div className="bg-[#131A24] border border-[#243041] rounded-none p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark size={18} className="text-purple-400" />
                Saved Posts & Drafts Library
              </h2>
              <p className="text-xs text-[#A4B0B7] mt-0.5">
                Manage, copy, edit, and organize all generated and saved social
                drafts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search drafts & posts..."
                  className="bg-[#0A1019] text-xs text-white pl-8 pr-3 py-1.5 border border-[#243246] rounded-none outline-none focus:border-purple-500 w-48 sm:w-64"
                />
              </div>
              <button
                onClick={loadHistory}
                className="px-3 py-1.5 bg-[#0A1019] border border-[#243246] hover:bg-[#141b25] text-xs font-bold text-purple-400 rounded-none transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#A4B0B7] gap-2">
              <Loader2 size={16} className="animate-spin" />
              Loading your saved drafts library...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="border border-dashed border-[#243041] bg-[#0A1019] p-12 text-center rounded-none space-y-3">
              <FileText size={32} className="mx-auto text-purple-400/60" />
              <div className="text-sm font-semibold text-white">
                No drafts or posts found
              </div>
              <p className="text-xs text-[#A4B0B7] max-w-sm mx-auto">
                Generate a social post with AI in the composer and click "Save
                as Draft" to keep it stored here.
              </p>
              <button
                onClick={() => setActiveTab("composer")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-none transition cursor-pointer"
              >
                <PenSquare size={13} />
                Create New Post
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredHistory.map((item) => {
                const status = summarizePostStatus(item.results, item.is_draft);
                return (
                  <div
                    key={item.id}
                    className="border border-[#243041] bg-[#0A1019] p-4.5 rounded-none flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.tone}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-[11px] text-[#A4B0B7] font-mono">
                          {formatCstDateTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed line-clamp-6">
                        {item.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1c2736] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.results || []).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-none bg-[#121c27] border border-[#243246] text-purple-300 font-medium"
                          >
                            {formatPlatformLabel(r.platform)}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleCopyContent(item.content, item.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#141d29] hover:bg-purple-950/60 border border-[#253347] hover:border-purple-500 text-slate-300 hover:text-white rounded-none transition cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleEditDraft(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#141d29] hover:bg-purple-950/60 border border-[#253347] hover:border-purple-500 text-slate-300 hover:text-white rounded-none transition cursor-pointer"
                          >
                            <PenSquare size={12} />
                            <span>Edit</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePost(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
