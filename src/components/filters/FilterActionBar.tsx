'use client';

import React from 'react';

interface FilterActionBarProps {
  onCancel: () => void;
  onApply: () => void;
  hasUnsavedChanges: boolean;
  selectedCount: number;
}

const FilterActionBar: React.FC<FilterActionBarProps> = ({
  onCancel,
  onApply,
  hasUnsavedChanges,
  selectedCount
}) => {
  return (
    <div
      className="px-5 py-4"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(8,8,20,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
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
            background: hasUnsavedChanges || selectedCount > 0
              ? 'linear-gradient(135deg, #d4af37 0%, #b8952e 100%)'
              : 'rgba(212,175,55,0.25)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: hasUnsavedChanges || selectedCount > 0 ? '#0a0a14' : 'rgba(212,175,55,0.5)',
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