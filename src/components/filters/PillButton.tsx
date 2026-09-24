'use client';

import React from 'react';

interface PillButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'area' | 'vibe' | 'genre' | 'date' | 'default';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const PillButton: React.FC<PillButtonProps> = ({
  label,
  isSelected,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false
}) => {
  const baseStyles = 'font-narrow uppercase font-bold tracking-[0.02em] rounded-full border cursor-pointer select-none';

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantStyles = {
    area: {
      unselected: 'bg-white/10 border-white/20 text-white/80 hover:border-[#B9D3C2]/50 hover:bg-[#B9D3C2]/20',
      selected: 'bg-[#B9D3C2]/80 border-2 border-[#B9D3C2] text-white'
    },
    vibe: {
      unselected: 'bg-white/10 border-white/20 text-white/80 hover:border-lime-400/50 hover:bg-lime-500/20',
      selected: 'bg-lime-500/80 border-2 border-lime-400 text-white'
    },
    genre: {
      unselected: 'bg-white/10 border-white/20 text-white/80 hover:border-amber-400/50 hover:bg-amber-500/20',
      selected: 'bg-amber-500/80 border-2 border-amber-400 text-white'
    },
    date: {
      unselected: 'bg-white/10 border-white/20 text-white/80 hover:border-cyan-400/50 hover:bg-cyan-500/20',
      selected: 'bg-cyan-500/80 border-2 border-cyan-400 text-white'
    },
    default: {
      unselected: 'bg-white/10 border-white/20 text-white/80 hover:border-white/30 hover:bg-white/15',
      selected: 'bg-white/20 border-2 border-white/40 text-white'
    }
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed hover:border-white/20 hover:bg-white/10';

  const currentStyles = disabled
    ? disabledStyles
    : isSelected
      ? variantStyles[variant].selected
      : variantStyles[variant].unselected;

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${currentStyles}`}
      disabled={disabled}
      aria-pressed={isSelected}
      role="button"
      tabIndex={0}
    >
      <span className="relative z-10">
        {label}
      </span>

    </button>
  );
};

export default PillButton;