'use client';

import React from 'react';

interface FilterActionBarProps {
  refined?: boolean;
  onCancel: () => void;
  onApply: () => void;
  hasUnsavedChanges: boolean;
  selectedCount: number;
}

const FilterActionBar: React.FC<FilterActionBarProps> = ({
  refined = false,
  onCancel,
  onApply,
  hasUnsavedChanges,
  selectedCount
}) => {
  return (
    <div
      className={`px-5 py-4 ${refined ? 'map2-filter-actions' : ''}`}
      style={{
        borderTop: refined ? '1px solid rgba(191,193,195,0.28)' : '1px solid rgba(255,255,255,0.08)',
        background: refined ? '#27282b' : 'rgba(8,8,20,0.95)',
        backdropFilter: refined ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: refined ? 'none' : 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 14,
            background: refined ? '#414347' : 'rgba(255,255,255,0.06)',
            border: refined ? '1px solid rgba(191,193,195,0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: refined ? '#e2e3e1' : 'rgba(255,255,255,0.7)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Cancel
        </button>

        <button
          onClick={onApply}
          disabled={!hasUnsavedChanges && selectedCount === 0}
          style={{
            flex: 2,
            padding: '12px 0',
            borderRadius: 14,
            background: refined ? (hasUnsavedChanges || selectedCount > 0 ? '#d0f050' : '#414347') : hasUnsavedChanges || selectedCount > 0
              ? 'linear-gradient(135deg, #d4af37 0%, #b8952e 100%)'
              : 'rgba(212,175,55,0.25)',
            border: refined ? '1px solid rgba(208,240,80,0.7)' : '1px solid rgba(212,175,55,0.3)',
            color: refined ? (hasUnsavedChanges || selectedCount > 0 ? '#27282b' : '#bfc1c3') : hasUnsavedChanges || selectedCount > 0 ? '#0a0a14' : 'rgba(212,175,55,0.5)',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>Apply</span>
          {selectedCount > 0 && (
            <span style={{
              padding: '1px 8px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.2)',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {selectedCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default FilterActionBar;
