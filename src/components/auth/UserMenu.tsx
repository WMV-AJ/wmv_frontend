'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface UserMenuProps {
  variant?: 'desktop' | 'compact';
}

function initialsFor(user: AuthUser): string {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }
  if (user.email) return user.email[0].toUpperCase();
  return '?';
}

export default function UserMenu({ variant = 'desktop' }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!user) return null;

  const avatarUrl = user.picture;
  const initials = initialsFor(user);
  const buttonSize = variant === 'compact' ? 'w-8 h-8 md:w-6 md:h-6' : 'w-9 h-9';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`${buttonSize} rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 overflow-hidden`}
        style={{
          background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 0 10px rgba(124, 58, 237, 0.25)',
        }}
        aria-label="Account menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-[11px] md:text-[10px] font-bold text-white">{initials}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-[60] min-w-[200px]"
          style={{
            background: 'rgba(20, 20, 40, 0.97)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-[11px] uppercase tracking-wider text-gray-500">Signed in as</div>
            <div className="text-sm font-medium text-white truncate">{user.email || 'User'}</div>
          </div>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
