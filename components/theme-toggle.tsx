'use client';

import { useState, useEffect } from 'react';

function getStoredTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
     
    setDark(getStoredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
      aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span className="material-symbols-outlined">
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
