import React from 'react';

// Small accessible hamburger toggle component
// Props: isOpen(boolean), onToggle(function), controlsId(string)
export default function HamburgerToggle({ isOpen, onToggle, controlsId }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      className="hamburger-btn"
      onClick={onToggle}
      onKeyDown={handleKey}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={!!isOpen}
      aria-controls={controlsId}
      type="button"
    >
      ☰
    </button>
  );
}
