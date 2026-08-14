'use client';
import Image from 'next/image';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatPrice } from '@/config/cities.config';
import AuthCornerWidget from '@/components/auth/AuthCornerWidget';
import {
  ArrowLeft,
  Share2,
  Calendar,
  MapPin,
  DollarSign,
  Music,
  Sparkles,
  Phone,
  Instagram,
  Navigation,
  Globe,
  Tag,
  Star,
  ChevronRight,
  X,
  Target,
  Copy,
  Link2,
  Check,
  Ticket,
} from 'lucide-react';
import { formatDateLabel, formatTimeClean, isEventHappeningNow } from '@/lib/time-utils';
import { videoThumbUrl } from '@/components/shared/EventMedia';
import EventPageRedesign from '../event/[eventId]/EventPageRedesign';

// ===== Types =====

interface EventRecord {
  venue_id: number;
  venue_name: string;
  venue_name_original: string;
  venue_area: string;
  venue_address: string;
  venue_country: string;
  venue_lat: number;
  venue_lng: number;
  venue_phone: string;
  venue_website: string;
  venue_category: string;
  venue_rating: number;
  venue_rating_count: number;
  venue_highlights: string;
  venue_atmosphere: string;
  venue_final_instagram: string;
  event_id: string;
  event_date: string;
  event_name: string;
  event_time: string;
  artist: string;
  music_genre: string;
  event_vibe: string;
  ticket_price: string;
  special_offers: string;
  website_social: string;
  confidence_score: number;
  analysis_notes: string;
  event_categories: any;
  attributes: any;
  media_url_1: string;
  media_type_1: string;
  media_url_2: string;
  media_type_2: string;
  deals: any;
  instagram_id: string;
  swipe_link_url?: string | null;
}

interface RelatedEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  artist: string;
  ticket_price: string;
  venue_name: string;
  venue_name_original: string;
  venue_area: string;
  venue_id: number;
  venue_rating: number;
  venue_rating_count: number;
  media_url_1: string;
  event_categories: any;
  special_offers: string;
  deals: any;
  music_genre: string;
  event_vibe: string;
  venue_category: string;
}

// ===== Helpers =====

function parseToArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v: any) => (typeof v === 'string' ? v : v?.name || String(v))).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch { /* not JSON */ }
    return value.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseTime(eventTime: string): { start: string; end: string } {
  if (!eventTime) return { start: '', end: '' };
  if (eventTime.includes(' - ')) {
    const [s, e] = eventTime.split(' - ');
    return { start: s?.trim() || '', end: e?.trim() || '' };
  }
  return { start: eventTime.trim(), end: '' };
}

const dealConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ladies_night: { label: 'Ladies Night', bg: 'rgba(236, 72, 153, 0.15)', text: 'rgb(244, 114, 182)', border: 'rgba(236, 72, 153, 0.3)' },
  '2for1': { label: 'Buy 1 Get 1', bg: 'rgba(16, 185, 129, 0.15)', text: 'rgb(52, 211, 153)', border: 'rgba(16, 185, 129, 0.3)' },
  happy_hour: { label: 'Happy Hour', bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(251, 191, 36)', border: 'rgba(251, 191, 36, 0.3)' },
  discount: { label: 'Discount', bg: 'rgba(59, 130, 246, 0.15)', text: 'rgb(96, 165, 250)', border: 'rgba(59, 130, 246, 0.3)' },
  free_entry: { label: 'Free Entry', bg: 'rgba(34, 197, 94, 0.15)', text: 'rgb(74, 222, 128)', border: 'rgba(34, 197, 94, 0.3)' },
  special_offer: { label: 'Special Offer', bg: 'rgba(249, 115, 22, 0.15)', text: 'rgb(251, 146, 60)', border: 'rgba(249, 115, 22, 0.3)' },
};

function getDealLabel(type: string): string {
  return dealConfig[type]?.label || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getScoreColor(score: number) {
  if (score >= 80) return { bg: 'rgba(34, 197, 94, 0.15)', text: 'rgb(74, 222, 128)', border: 'rgba(34, 197, 94, 0.25)' };
  if (score >= 60) return { bg: 'rgba(251, 191, 36, 0.15)', text: 'rgb(251, 191, 36)', border: 'rgba(251, 191, 36, 0.25)' };
  return { bg: 'rgba(239, 68, 68, 0.15)', text: 'rgb(248, 113, 113)', border: 'rgba(239, 68, 68, 0.25)' };
}

const attrColors: Record<string, { bg: string; text: string }> = {
  venue: { bg: 'rgba(107, 114, 128, 0.15)', text: 'rgb(156, 163, 175)' },
  energy: { bg: 'rgba(249, 115, 22, 0.15)', text: 'rgb(251, 146, 60)' },
  status: { bg: 'rgba(212, 160, 23, 0.15)', text: 'rgb(244, 196, 48)' },
  timing: { bg: 'rgba(59, 130, 246, 0.15)', text: 'rgb(96, 165, 250)' },
};

// ===== Page Component =====

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const city = (params.city as string) || 'dubai';

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [related, setRelated] = useState<RelatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [showFullNotes, setShowFullNotes] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on mount (fixed container doesn't auto-scroll)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [eventId]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/event?id=${encodeURIComponent(eventId)}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Event not found' : 'Failed to load event');
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setRelated(data.related || []);
      } catch {
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    }
    if (eventId) fetchEvent();
  }, [eventId]);

  // Share modal handler
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  // Build share text for the modal
  const getShareText = useCallback(() => {
    if (!event) return '';
    const time = parseTime(event.event_time);
    const lines: string[] = [];
    lines.push(`${formatDateLabel(event.event_date)}${time.start ? ` at ${formatTimeClean(time.start)}` : ''}${time.end ? ` - ${formatTimeClean(time.end)}` : ''}`);
    lines.push(event.event_name);
    lines.push(event.venue_name_original || event.venue_name || '');
    if (event.ticket_price) {
      const priceText = formatPrice(event.ticket_price as any, (event as any).city ?? (params?.city as string));
      lines.push(event.special_offers && !event.special_offers.toLowerCase().includes('no special')
        ? `${priceText} (${event.special_offers})`
        : priceText);
    }
    lines.push(typeof window !== 'undefined' ? window.location.href : '');
    return lines.filter(Boolean).join('\n');
  }, [event]);

  const showToast = useCallback((msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2000);
  }, []);

  // Robust copy with fallback for non-HTTPS
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* fall through */ }
    }
    // Fallback: textarea + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const handleCopyText = useCallback(async () => {
    const ok = await copyToClipboard(getShareText());
    if (ok) {
      setCopiedField('text');
      showToast('Text copied!');
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, [getShareText, showToast, copyToClipboard]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(window.location.href);
    if (ok) {
      setCopiedField('link');
      showToast('Link copied!');
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, [showToast, copyToClipboard]);

  const handleShareTo = useCallback((platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(getShareText());
    const title = encodeURIComponent(event ? `${event.event_name} at ${event.venue_name_original || event.venue_name}` : '');
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'tiktok':
        // TikTok doesn't have a direct share URL, copy link instead
        handleCopyLink();
        showToast('Link copied! Paste in TikTok');
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareModal(false);
  }, [event, getShareText, handleCopyLink, showToast]);

  // Action handlers
  const handleDirections = useCallback(() => {
    if (!event) return;
    if (event.venue_lat && event.venue_lng) {
      const name = encodeURIComponent(event.venue_name_original || event.venue_name || '');
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.venue_lat},${event.venue_lng}&query=${name}`, '_blank');
    } else if (event.venue_address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue_address)}`, '_blank');
    }
  }, [event]);

  const handleCall = useCallback(() => {
    if (event?.venue_phone) window.location.href = `tel:${event.venue_phone}`;
  }, [event]);

  const handleInstagram = useCallback(() => {
    if (!event?.venue_final_instagram) return;
    const ig = event.venue_final_instagram;
    window.open(ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace('@', '')}`, '_blank');
  }, [event]);

  const handleBook = useCallback(() => {
    if (!event?.swipe_link_url) return;
    const url = event.swipe_link_url.startsWith('http')
      ? event.swipe_link_url
      : `https://${event.swipe_link_url}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [event]);

  // ===== Loading / Error State =====
  if (isLoading || !event) {
    if (error) {
      return (
        <main className="min-h-screen w-full" style={{ backgroundColor: '#f5f5f0' }}>
          <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
            <p className="text-gray-800 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 rounded-full text-sm font-medium"
              style={{ background: 'rgba(0,0,0,0.08)', color: '#374151' }}
            >
              Go Back
            </button>
          </div>
        </main>
      );
    }
    // Skeleton loading state
    return (
      <main ref={mainRef} className="fixed inset-0 overflow-y-auto" style={{ backgroundColor: '#f5f5f0' }}>
        <div className="min-h-full w-full pb-8" style={{ maxWidth: 430, margin: '0 auto' }}>
          {/* Hero skeleton */}
          <div className="relative w-full" style={{ height: '280px' }}>
            <div className="w-full h-full skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(245,245,240,1) 100%)', pointerEvents: 'none' }} />
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }} />
            </div>
          </div>

          <div className="px-5 -mt-2">
            <div className="mt-4 space-y-2">
              <div className="h-7 rounded-lg skeleton-pulse" style={{ background: 'rgba(0,0,0,0.1)', width: '80%' }} />
              <div className="h-5 rounded-lg skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '50%' }} />
            </div>

            <div className="mt-5 space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-[18px] h-[18px] rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.08)' }} />
                  <div className="h-4 rounded-lg skeleton-pulse" style={{ background: 'rgba(0,0,0,0.08)', width: `${55 + i * 10}%` }} />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <div className="h-3.5 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '100%' }} />
              <div className="h-3.5 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '90%' }} />
              <div className="h-3.5 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '60%' }} />
            </div>

            <div className="flex gap-2 mt-5">
              {[60, 72, 52, 80].map((w, i) => (
                <div key={i} className="h-7 rounded-full skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: `${w}px` }} />
              ))}
            </div>

            <div className="mt-8">
              <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="h-3 rounded skeleton-pulse mb-4" style={{ background: 'rgba(0,0,0,0.08)', width: '100px' }} />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    <div className="h-3.5 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: `${50 + i * 12}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-11 h-11 rounded-full skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
                ))}
                <div className="flex-1 h-11 rounded-full skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
              <div className="h-4 rounded skeleton-pulse mb-4" style={{ background: 'rgba(0,0,0,0.08)', width: '140px' }} />
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3 px-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
                    <div className="w-[55px] h-[55px] rounded-xl skeleton-pulse" style={{ background: 'rgba(0,0,0,0.08)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '45%' }} />
                      <div className="h-3.5 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.1)', width: '70%' }} />
                      <div className="h-3 rounded skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)', width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ===== Redesigned render (shared with /event/[eventId]) =====
  return <EventPageRedesign event={event} related={related} />;
}
