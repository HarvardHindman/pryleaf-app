"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div 
      className="inline-flex rounded-lg p-1"
      style={{ backgroundColor: 'var(--clr-surface-a10)' }}
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setThemeMode(value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            themeMode === value ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: themeMode === value ? 'var(--clr-info-a10)' : 'transparent',
            color: themeMode === value ? 'var(--clr-info-a20)' : 'var(--clr-primary-a40)',
          }}
          title={`${label} mode`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}