'use client';

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
} from 'lucide-react';
import { formatDateLabel, formatTimeClean, isEventHappeningNow } from '@/lib/time-utils';

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
  status: { bg: 'rgba(147, 51, 234, 0.15)', text: 'rgb(167, 139, 250)' },
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
        <div className="min-h-full w-full pb-8">
          {/* Hero skeleton */}
          <div className="relative w-full" style={{ height: '280px' }}>
            <div className="w-full h-full skeleton-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(245,245,240,1) 100%)' }} />
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

  // ===== Parse data =====
  const time = parseTime(event.event_time);
  const isLive = isEventHappeningNow(time.start, time.end, event.event_date);
  const venueName = event.venue_name_original || event.venue_name || 'Venue';
  const heroImage = event.media_url_1 || event.media_url_2;
  const genres = event.music_genre ? event.music_genre.split(',').map((g: string) => g.trim()).filter(Boolean) : [];
  const vibes = event.event_vibe ? event.event_vibe.split('|').map((v: string) => v.trim()).filter(Boolean) : [];
  const categories = parseToArray(event.venue_category);
  const highlights = (() => {
    if (!event.venue_highlights) return [];
    try {
      const parsed = JSON.parse(event.venue_highlights);
      if (Array.isArray(parsed)) return parsed.map((obj: any) => typeof obj === 'string' ? obj : Object.keys(obj)[0]).filter(Boolean);
    } catch { /* not JSON */ }
    return [event.venue_highlights];
  })();
  const atmosphere = (() => {
    if (!event.venue_atmosphere) return [];
    try {
      const parsed = JSON.parse(event.venue_atmosphere);
      if (Array.isArray(parsed)) return parsed.map((obj: any) => typeof obj === 'string' ? obj : Object.keys(obj)[0]).filter(Boolean);
    } catch { /* not JSON */ }
    return [event.venue_atmosphere];
  })();
  const eventCats = (() => {
    if (!event.event_categories) return [];
    try {
      const parsed = typeof event.event_categories === 'string' ? JSON.parse(event.event_categories) : event.event_categories;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const deals = (() => {
    if (!event.deals) return [];
    try {
      const parsed = typeof event.deals === 'string' ? JSON.parse(event.deals) : event.deals;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const attributes = (() => {
    if (!event.attributes) return { venue: [], energy: [], status: [], timing: [] };
    try {
      const parsed = typeof event.attributes === 'string' ? JSON.parse(event.attributes) : event.attributes;
      return {
        venue: Array.isArray(parsed?.venue) ? parsed.venue : [],
        energy: Array.isArray(parsed?.energy) ? parsed.energy : [],
        status: Array.isArray(parsed?.status) ? parsed.status : [],
        timing: Array.isArray(parsed?.timing) ? parsed.timing : [],
      };
    } catch { return { venue: [], energy: [], status: [], timing: [] }; }
  })();
  const allAttrTags: { label: string; type: string }[] = [];
  attributes.venue.forEach((t: string) => allAttrTags.push({ label: t, type: 'venue' }));
  attributes.energy.forEach((t: string) => allAttrTags.push({ label: t, type: 'energy' }));
  attributes.status.forEach((t: string) => allAttrTags.push({ label: t, type: 'status' }));
  attributes.timing.forEach((t: string) => allAttrTags.push({ label: t, type: 'timing' }));

  const hasSecondImage = !!event.media_url_2 && event.media_url_2 !== event.media_url_1;

  const iconColor = 'rgba(100,100,110,0.5)';

  return (
    <main ref={mainRef} className="fixed inset-0 overflow-y-auto" style={{ backgroundColor: '#f5f5f0' }}>
      <div className="min-h-full w-full pb-8">
      {/* ===== HERO IMAGE SECTION ===== */}
      <div className="relative w-full" style={{ height: heroImage ? '280px' : '120px' }}>
        {heroImage ? (
          (event.media_type_1?.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm)$/i.test(heroImage)) ? (
            <video
              src={heroImage}
              className="w-full h-full object-cover cursor-pointer"
              autoPlay
              muted
              loop
              playsInline
              onClick={() => setLightboxMedia({ url: heroImage, isVideo: true })}
              onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
            />
          ) : (
            <img
              src={heroImage}
              alt={event.event_name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxMedia({ url: heroImage, isVideo: false })}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #e5e5e0 0%, #f5f5f0 100%)' }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(245,245,240,1) 100%)' }} />

        {/* Back + Auth + Share buttons */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <AuthCornerWidget />
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full z-10" style={{ background: 'rgba(239,68,68,0.9)' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold">LIVE{time.end ? ` · until ${formatTimeClean(time.end)}` : ''}</span>
          </div>
        )}
      </div>

      {/* ===== CONTENT ===== */}
      <div className="px-5 -mt-2">
        {/* Event Name */}
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mt-4">
          {event.event_name}
        </h1>

        {/* Info Rows */}
        <div className="mt-5 space-y-3.5">
          {/* Date + Time */}
          <div className="flex items-center gap-3">
            <Calendar className="w-[18px] h-[18px] flex-shrink-0" style={{ color: iconColor }} />
            <span className="text-[15px] text-gray-600">
              {formatDateLabel(event.event_date)}{time.start ? ` at ${formatTimeClean(time.start)}` : ''}
              {time.end ? ` – ${formatTimeClean(time.end)}` : ''}
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-3">
            <MapPin className="w-[18px] h-[18px] flex-shrink-0" style={{ color: iconColor }} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] text-gray-600">
                {venueName}{event.venue_area ? `, ${event.venue_area}` : ''}
              </span>
              {event.venue_rating > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
                  <Star className="w-3 h-3 text-yellow-500" fill="#EAB308" />
                  <span className="text-[12px] font-bold text-yellow-500">{event.venue_rating.toFixed(1)}</span>
                  {event.venue_rating_count > 0 && (
                    <span className="text-[11px] text-gray-500">({event.venue_rating_count.toLocaleString()})</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          {event.ticket_price && (
            <div className="flex items-center gap-3">
              <DollarSign className="w-[18px] h-[18px] flex-shrink-0" style={{ color: iconColor }} />
              <span className="text-[15px] text-gray-600">
                <span className="text-emerald-600 font-semibold">{formatPrice(event.ticket_price as any, (event as any).city ?? (params?.city as string))}</span>
                {event.special_offers && !event.special_offers.toLowerCase().includes('no special') && (
                  <span className="text-amber-600 ml-2">· {event.special_offers}</span>
                )}
              </span>
            </div>
          )}

          {/* Event Website/Social */}
          {event.website_social && (
            <div className="flex items-center gap-3">
              <Globe className="w-[18px] h-[18px] flex-shrink-0" style={{ color: iconColor }} />
              <a
                href={event.website_social.startsWith('http') ? event.website_social : `https://${event.website_social}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] text-blue-600 truncate"
              >
                {event.website_social.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </div>
          )}

          {/* Artist */}
          {event.artist && (
            <div className="flex items-start gap-3">
              <Music className="w-[18px] h-[18px] flex-shrink-0 mt-1" style={{ color: 'rgb(167, 139, 250)' }} />
              <div className="flex flex-wrap gap-1.5">
                {event.artist.split(/[|,]/).map((artist, idx) => (
                  <span
                    key={idx}
                    className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: 'rgba(147, 51, 234, 0.15)',
                      color: 'rgb(167, 139, 250)',
                      border: '1px solid rgba(147, 51, 234, 0.25)',
                    }}
                  >
                    {artist.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description / Analysis Notes */}
        {event.analysis_notes && (
          <div className="mt-6">
            <p className={`text-[14px] text-gray-600 leading-relaxed ${!showFullNotes ? 'line-clamp-3' : ''}`}>
              {event.analysis_notes}
            </p>
            {event.analysis_notes.length > 150 && (
              <button
                onClick={() => setShowFullNotes(!showFullNotes)}
                className="text-blue-600 text-[13px] font-medium mt-1"
              >
                {showFullNotes ? 'View less' : 'View more'}
              </button>
            )}
          </div>
        )}

        {/* Genre + Vibe Pills (outlined) */}
        {(genres.length > 0 || vibes.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-5">
            {genres.map((g, i) => (
              <span key={`g-${i}`} className="px-3 py-1 rounded-full text-[13px] text-gray-600 border border-gray-300">
                {g}
              </span>
            ))}
            {vibes.map((v, i) => (
              <span key={`v-${i}`} className="px-3 py-1 rounded-full text-[13px] text-gray-600 border border-gray-300">
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Event Categories */}
        {eventCats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {eventCats.map((cat: any, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full text-[13px] text-gray-500 border border-gray-300">
                {cat.primary}{cat.secondary ? ` · ${cat.secondary}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Attribute Tags */}
        {allAttrTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {allAttrTags.map((tag, i) => {
              const colors = attrColors[tag.type] || attrColors.venue;
              return (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        )}

        {/* AI Confidence Score */}
        {event.confidence_score != null && event.confidence_score > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" style={{ color: iconColor }} />
              <span className="text-[13px] text-gray-500 font-medium">AI Confidence</span>
              <span
                className="text-[13px] font-bold ml-auto"
                style={{ color: getScoreColor(event.confidence_score).text }}
              >
                {event.confidence_score}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(event.confidence_score, 100)}%`,
                  background: getScoreColor(event.confidence_score).text,
                }}
              />
            </div>
          </div>
        )}

        {/* Side-by-side Images */}
        {hasSecondImage && (
          <div className="mt-6 flex gap-2">
            <div className="flex-1 rounded-xl overflow-hidden cursor-pointer" style={{ height: '160px' }} onClick={() => setLightboxMedia({ url: event.media_url_1, isVideo: event.media_type_1?.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm)$/i.test(event.media_url_1) })}>
              {event.media_type_1?.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm)$/i.test(event.media_url_1) ? (
                <video
                  src={event.media_url_1}
                  className="w-full h-full object-cover"
                  autoPlay muted loop playsInline
                />
              ) : (
                <img
                  src={event.media_url_1}
                  alt={`${event.event_name} 1`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 rounded-xl overflow-hidden cursor-pointer" style={{ height: '160px' }} onClick={() => setLightboxMedia({ url: event.media_url_2, isVideo: event.media_type_2?.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm)$/i.test(event.media_url_2) })}>
              {event.media_type_2?.toUpperCase() === 'VIDEO' || /\.(mp4|mov|webm)$/i.test(event.media_url_2) ? (
                <video
                  src={event.media_url_2}
                  className="w-full h-full object-cover"
                  autoPlay muted loop playsInline
                />
              ) : (
                <img
                  src={event.media_url_2}
                  alt={`${event.event_name} 2`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* ===== Venue Details Section ===== */}
        {(categories.length > 0 || highlights.length > 0 || atmosphere.length > 0 || event.venue_address || event.venue_phone || event.venue_website) && (
          <div className="mt-8">
            <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <h3 className="text-[13px] text-gray-500 uppercase tracking-wider font-semibold mb-4">Venue Details</h3>
            <div className="space-y-3">
              {categories.length > 0 && (
                <div className="flex items-center gap-3">
                  <Tag className="w-[16px] h-[16px] flex-shrink-0" style={{ color: iconColor }} />
                  <span className="text-[14px] text-gray-600">{categories.join(', ')}</span>
                </div>
              )}
              {event.venue_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-[16px] h-[16px] flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
                  <span className="text-[14px] text-gray-600">{event.venue_address}</span>
                </div>
              )}
              {highlights.length > 0 && (
                <div className="flex items-center gap-3">
                  <Star className="w-[16px] h-[16px] flex-shrink-0" style={{ color: iconColor }} />
                  <span className="text-[14px] text-gray-600">{highlights.join(', ')}</span>
                </div>
              )}
              {atmosphere.length > 0 && (
                <div className="flex items-center gap-3">
                  <Sparkles className="w-[16px] h-[16px] flex-shrink-0" style={{ color: iconColor }} />
                  <span className="text-[14px] text-gray-600">{atmosphere.join(', ')}</span>
                </div>
              )}
              {event.venue_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-[16px] h-[16px] flex-shrink-0" style={{ color: iconColor }} />
                  <span className="text-[14px] text-gray-600">{event.venue_phone}</span>
                </div>
              )}
              {event.venue_website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-[16px] h-[16px] flex-shrink-0" style={{ color: iconColor }} />
                  <a
                    href={event.venue_website.startsWith('http') ? event.venue_website : `https://${event.venue_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-blue-600 truncate"
                  >
                    {event.venue_website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
              {/* Rating */}
              {event.venue_rating > 0 && (
                <div className="flex items-center gap-3">
                  <Star className="w-[16px] h-[16px] flex-shrink-0 text-yellow-500" fill="#EAB308" />
                  <span className="text-[14px] text-gray-600">
                    {event.venue_rating.toFixed(1)}
                    {event.venue_rating_count > 0 && ` (${event.venue_rating_count.toLocaleString()} reviews)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Deals & Offers Section ===== */}
        {deals.length === 0 && event.special_offers && !event.special_offers.toLowerCase().includes('no special') && (
          <div className="mt-8">
            <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <h3 className="text-[13px] text-gray-500 uppercase tracking-wider font-semibold mb-4">Offers</h3>
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <p className="text-[14px] text-gray-600">{event.special_offers}</p>
            </div>
          </div>
        )}
        {deals.length > 0 && (
          <div className="mt-8">
            <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <h3 className="text-[13px] text-gray-500 uppercase tracking-wider font-semibold mb-4">Deals & Offers</h3>
            <div className="space-y-3">
              {deals.map((deal: any, i: number) => {
                const config = dealConfig[deal.type] || { label: getDealLabel(deal.type), bg: 'rgba(255,255,255,0.1)', text: 'rgb(200,200,200)', border: 'rgba(255,255,255,0.2)' };
                return (
                  <div key={i} className="rounded-xl px-4 py-3" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase"
                        style={{ background: config.bg, color: config.text, border: `1px solid ${config.border}` }}
                      >
                        {config.label}
                      </span>
                      {deal.timing && <span className="text-[12px] text-gray-500">{deal.timing}</span>}
                    </div>
                    {deal.description && (
                      <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">{deal.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== View Original Post ===== */}
        {event.instagram_id && (
          <div className="mt-8">
            <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <a
              href={`https://www.instagram.com/p/${event.instagram_id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-colors"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <Instagram className="w-5 h-5 flex-shrink-0" style={{ color: '#E1306C' }} />
              <div className="flex-1 min-w-0">
                <span className="text-[14px] text-gray-900 font-medium">View Original Post</span>
                <p className="text-[12px] text-gray-500 truncate">instagram.com/p/{event.instagram_id}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* ===== Action Buttons ===== */}
        <div className="mt-8">
          <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <div className="flex items-center gap-3">
            {event.venue_final_instagram && (
              <button
                onClick={handleInstagram}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <Instagram className="w-[18px] h-[18px]" style={{ color: '#E1306C' }} />
              </button>
            )}
            {event.venue_phone && (
              <button
                onClick={handleCall}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <Phone className="w-[18px] h-[18px] text-green-400" />
              </button>
            )}
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <Share2 className="w-[18px] h-[18px] text-gray-700" />
            </button>
            <button
              onClick={handleDirections}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-semibold"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#374151' }}
            >
              <Navigation className="w-4 h-4 text-green-400" />
              Get Directions
            </button>
          </div>
        </div>

        {/* ===== You May Also Like ===== */}
        {related.length > 0 && (
          <div className="mt-8">
            <div className="h-px w-full mb-5" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <h3 className="text-[15px] text-gray-900 font-bold mb-4">You May Also Like</h3>
            <div className="space-y-2">
              {related.map((r) => {
                const rTime = parseTime(r.event_time);
                return (
                  <div
                    key={r.event_id}
                    className="flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(0,0,0,0.03)' }}
                    onClick={() => router.push(`/${city}/${r.event_id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="w-[55px] h-[55px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {r.media_url_1 && !/\.(mp4|mov|webm)$/i.test(r.media_url_1) ? (
                        <img src={r.media_url_1} alt={r.event_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : r.media_url_1 ? (
                        <video src={r.media_url_1} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-500">
                        {formatDateLabel(r.event_date)}{rTime.start ? ` · ${formatTimeClean(rTime.start)}` : ''}
                      </p>
                      <p className="text-[14px] text-gray-900 font-semibold truncate">{r.event_name}</p>
                      <p className="text-[12px] text-gray-500 truncate">{r.venue_name_original || r.venue_name}</p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ===== MEDIA LIGHTBOX ===== */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightboxMedia(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            onClick={(e) => { e.stopPropagation(); setLightboxMedia(null); }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.isVideo ? (
              <video
                src={lightboxMedia.url}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={lightboxMedia.url}
                alt={event.event_name}
                className="max-w-full max-h-[90vh] object-contain"
                style={{ touchAction: 'pinch-zoom' }}
              />
            )}
          </div>
        </div>
      )}

      {/* ===== SHARE MODAL ===== */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[9998] flex items-end justify-center"
          onClick={() => setShowShareModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

          {/* Modal */}
          <div
            className="relative w-full max-w-md mx-auto rounded-t-2xl px-5 pt-5 pb-8 animate-slide-up"
            style={{ background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-gray-900">Share event</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#f3f4f6' }}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Event Summary */}
            <div className="rounded-xl px-4 py-3 mb-5 space-y-1.5" style={{ background: '#f9fafb' }}>
              <div className="flex items-center gap-2">
                <span className="text-[14px]">📅</span>
                <span className="text-[13px] text-gray-700">
                  {formatDateLabel(event.event_date)}{time.start ? ` at ${formatTimeClean(time.start)}` : ''}{time.end ? ` - ${formatTimeClean(time.end)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px]">🎵</span>
                <span className="text-[13px] text-gray-900 font-semibold">{event.event_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px]">📍</span>
                <span className="text-[13px] text-gray-700">{venueName}</span>
              </div>
              {event.ticket_price && (
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">🎟</span>
                  <span className="text-[13px] text-gray-700">
                    {formatPrice(event.ticket_price as any, (event as any).city ?? (params?.city as string))}
                    {event.special_offers && !event.special_offers.toLowerCase().includes('no special') && (
                      <span> ({event.special_offers})</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[14px]">🔗</span>
                <span className="text-[12px] text-blue-600 truncate">{typeof window !== 'undefined' ? window.location.href : ''}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Share on</span>
              <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            </div>

            {/* Share Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Copy Text */}
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={copiedField === 'text'
                  ? { background: '#dcfce7', color: '#166534' }
                  : { background: '#f3f4f6', color: '#374151' }
                }
              >
                {copiedField === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'text' ? 'Copied!' : 'Copy Text'}
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={copiedField === 'link'
                  ? { background: '#dcfce7', color: '#166534' }
                  : { background: '#f3f4f6', color: '#374151' }
                }
              >
                {copiedField === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                {copiedField === 'link' ? 'Copied!' : 'Copy Link'}
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleShareTo('whatsapp')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                style={{ background: '#dcfce7', color: '#166534' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleShareTo('telegram')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                style={{ background: '#dbeafe', color: '#1e40af' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Telegram
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShareTo('facebook')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>

              {/* TikTok */}
              <button
                onClick={() => handleShareTo('tiktok')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                style={{ background: '#f3f4f6', color: '#111827' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                TikTok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== COPY TOAST ===== */}
      {copyToast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] px-5 py-2.5 rounded-full text-[13px] font-medium text-white shadow-lg"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
          {copyToast}
        </div>
      )}
    </main>
  );
}
