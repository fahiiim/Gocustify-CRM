import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
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
  ArrowRight,
} from 'lucide-react';
import { PLATFORM_FEATURES } from './FeatureHubLaunchpad';

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

export default function CommandPaletteModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredFeatures = useMemo(() => {
    if (!query.trim()) return PLATFORM_FEATURES;
    const q = query.toLowerCase();
    return PLATFORM_FEATURES.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.badge.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q)
    );
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredFeatures.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredFeatures.length || 1)) % (filteredFeatures.length || 1));
      } else if (e.key === 'Enter' && filteredFeatures[selectedIndex]) {
        e.preventDefault();
        navigate(filteredFeatures[selectedIndex].path);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredFeatures, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0e1626] border border-[#24354f] rounded-2xl shadow-2xl overflow-hidden z-10 text-white animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#24354f] bg-[#0c121e]">
          <Search size={18} className="text-purple-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a feature name or keyword (e.g. receptionist, calendar, sms, invoices)..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-900 border border-slate-700/60 rounded text-slate-400">
              ESC to close
            </kbd>
          )}
        </div>

        {/* Feature List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredFeatures.map((feat, idx) => {
            const IconComponent = ICON_MAP[feat.icon] || Bot;
            const isSelected = idx === selectedIndex;

            return (
              <div
                key={feat.id}
                onClick={() => {
                  navigate(feat.path);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group px-3.5 py-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18263e] border border-purple-500/40 text-white'
                    : 'hover:bg-[#131d2f] border border-transparent text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${feat.iconColor}`}
                  >
                    <IconComponent size={18} />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {feat.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase tracking-wider ${feat.badgeColor}`}
                      >
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[420px]">
                      {feat.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">
                    {feat.categoryLabel}
                  </span>
                  <ArrowRight
                    size={14}
                    className={`transition-transform ${
                      isSelected ? 'text-purple-400 translate-x-1' : 'text-slate-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {filteredFeatures.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="text-sm font-semibold">No features found for "{query}"</p>
              <p className="text-xs text-slate-500">Try searching for "receptionist", "sms", "billing", or "calls".</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#0a0f19] border-t border-[#1d2b3f] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">↑</kbd>{' '}
              <kbd className="font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">↵</kbd>{' '}
              Select
            </span>
          </div>
          <span className="text-purple-400 font-bold">{filteredFeatures.length} features available</span>
        </div>
      </div>
    </div>
  );
}
