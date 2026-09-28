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
  const baseStyles = 'font-sans font-medium rounded-full border cursor-pointer select-none';

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantStyles = {
    area: {
      unselected: 'bg-ink/10 border-ink/20 text-ink/80 hover:border-[#B9D3C2]/50 hover:bg-[#B9D3C2]/20',
      selected: 'bg-[#B9D3C2]/80 border-2 border-[#B9D3C2] text-white'
    },
    vibe: {
      unselected: 'bg-ink/10 border-ink/20 text-ink/80 hover:border-lime-400/50 hover:bg-lime-500/20',
      selected: 'bg-lime-500/80 border-2 border-lime-400 text-white'
    },
    genre: {
      unselected: 'bg-ink/10 border-ink/20 text-ink/80 hover:border-amber-400/50 hover:bg-amber-500/20',
      selected: 'bg-amber-500/80 border-2 border-amber-400 text-white'
    },
    date: {
      unselected: 'bg-ink/10 border-ink/20 text-ink/80 hover:border-cyan-400/50 hover:bg-cyan-500/20',
      selected: 'bg-cyan-500/80 border-2 border-cyan-400 text-white'
    },
    default: {
      unselected: 'bg-ink/10 border-ink/20 text-ink/80 hover:border-ink/30 hover:bg-ink/15',
      selected: 'bg-ink/20 border-2 border-ink/40 text-ink'
    }
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed hover:border-ink/20 hover:bg-ink/10';

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